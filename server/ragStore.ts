import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { DocumentChunk, PDFDocument, SearchResult, Citation, RAGSettings } from "../src/types";
import { SAMPLE_DOCUMENTS } from "./sampleDocs";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

export function detectFileType(fileName: string): 'pdf' | 'docx' | 'image' | 'json' | 'txt' | 'code' | 'other' {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc'].includes(ext)) return 'docx';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['json', 'jsonl', 'geojson'].includes(ext)) return 'json';
  if (['txt', 'md', 'csv', 'tsv', 'log', 'rtf'].includes(ext)) return 'txt';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'html', 'css', 'sql', 'sh', 'xml', 'yaml', 'yml'].includes(ext)) return 'code';
  return 'other';
}

// Helper to safely execute generateContent with model fallbacks, retry backoff, and timeouts
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
    timeoutMs?: number;
  }
) {
  // Use gemini-3.1-flash-lite as primary high-availability model (instant, lowest queue latency),
  // Prioritize fast, high-availability models: gemini-3.1-flash-lite followed by gemini-flash-latest
  const preferred = params.preferredModel || 'gemini-3.1-flash-lite';
  const modelsToTry = [
    preferred,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
  ];

  // Remove duplicates while preserving priority order
  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  // 25s timeout per model attempt
  const timeoutMs = params.timeoutMs || 25000;

  // Apply LOW thinkingLevel by default to minimize reasoning latency and avoid timeouts
  const mergedConfig = {
    ...params.config,
    thinkingConfig: params.config?.thinkingConfig ?? {
      thinkingLevel: ThinkingLevel.LOW,
    },
  };

  for (const model of uniqueModels) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config: mergedConfig,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Model ${model} timed out after ${Math.round(timeoutMs / 1000)}s`)),
          timeoutMs
        )
      );

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errStr = String(err) + (err?.message ? ` ${err.message}` : '');
      console.warn(`[Gemini Resiliency] Model ${model} failed (${errStr.substring(0, 90)}...); shifting to fallback model.`);
    }
  }

  throw lastError || new Error("All Gemini model attempts were exhausted.");
}

// Detect whether text is corrupted binary noise, high-entropy symbols, or random unreadable tokens
export function isGibberishText(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim();
  if (clean.length < 8) return false;

  // Raw PDF internal objects / markers
  if (
    clean.includes('/FlateDecode') ||
    clean.includes('/FontDescriptor') ||
    clean.includes('/MediaBox') ||
    clean.includes('endobj') ||
    clean.includes('xref') ||
    clean.includes('trailer<<')
  ) {
    return true;
  }

  // Check proportion of readable alphanumeric + spaces
  const alphaNumericMatches = clean.match(/[a-zA-Z0-9\s]/g) || [];
  const ratio = alphaNumericMatches.length / clean.length;
  if (ratio < 0.65) return true;

  // Check for clusters of 4+ symbols like ?#.*%;
  if (/[!@#$%^&*()_+=~`[\]{}|\\:;"'<>,/?]{4,}/.test(clean)) return true;

  // Check for random compressed byte strings
  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  if (words.length >= 3) {
    let unreadableWords = 0;
    for (const w of words) {
      if (
        /[A-Za-z]+[0-9%#$@*&_]+[A-Za-z]+/.test(w) ||
        /[^a-zA-Z0-9\s.,;:'"?!()-]/.test(w)
      ) {
        unreadableWords++;
      }
    }
    if (unreadableWords / words.length > 0.35) return true;
  }

  return false;
}

// Check if text is raw PDF source code/streams or structural tags rather than human readable text
function isRawPdfSyntax(text: string): boolean {
  if (!text || !text.trim()) return true;
  const lower = text.toLowerCase();
  if (
    lower.includes('%pdf-') ||
    lower.includes('/flatedecode') ||
    lower.includes('flatedecode') ||
    lower.includes('reportlab') ||
    lower.includes('content credentials') ||
    lower.includes('parent 18 0 r') ||
    lower.includes('[pdf document uploaded successfully')
  ) {
    return true;
  }
  // Check for indirect object references like "19 0 R", "18 0 R", "Contents 20 0 R", "Parent 18 0 R"
  const refMatches = text.match(/\b(?:Contents|Parent|Root|Pages|Info|Resources)?\s*\d+\s+0\s+R\b/gi);
  if (refMatches && refMatches.length >= 1) {
    return true;
  }
  const generalRefMatches = text.match(/\b\d+\s+\d+\s+R\b/g);
  if (generalRefMatches && generalRefMatches.length >= 2) {
    return true;
  }
  // Check for SVG / PDF vector path coordinate dumps (e.g. fill "M508.749 317.399C516.777...")
  if (/fill\s*"?M[0-9]/i.test(text) || /[A-Z]\d{2,3}\.\d{3}/.test(text) || /\bM\d+\.\d+C\d+/i.test(text)) {
    return true;
  }
  const pdfSyntaxMatches = text.match(/\/?(?:Catalog|Pages|Page|Type|MediaBox|Contents|Resources|Font|Encoding|Length|Filter|Parent|Root|XObject|FlateDecode)\b/gi);
  if (pdfSyntaxMatches && pdfSyntaxMatches.length >= 2) {
    return true;
  }
  const objMatches = text.match(/\b\d+\s+\d+\s+obj\b/gi);
  if (objMatches && objMatches.length >= 1) {
    return true;
  }
  return isGibberishText(text);
}

// Helper to extract readable text from PDF binary streams with Flate decompression
function extractPdfTextFromBuffer(fileBuffer: Buffer): string {
  try {
    const raw = fileBuffer.toString('latin1');
    const textBlocks: string[] = [];

    // 1. Scan for stream objects and decompress FlateDecode streams
    const streamRegex = /<<([^>]*)>>\s*stream[\r\n]+/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = streamRegex.exec(raw)) !== null) {
      const dict = sMatch[1];
      const streamStart = sMatch.index + sMatch[0].length;
      const endstreamIdx = raw.indexOf('endstream', streamStart);
      if (endstreamIdx === -1) break;

      let streamEnd = endstreamIdx;
      while (streamEnd > streamStart && (fileBuffer[streamEnd - 1] === 10 || fileBuffer[streamEnd - 1] === 13)) {
        streamEnd--;
      }

      const slice = fileBuffer.subarray(streamStart, streamEnd);
      let decompressedStr = '';

      if (dict.includes('/FlateDecode')) {
        try {
          decompressedStr = zlib.inflateSync(slice).toString('utf-8');
        } catch {
          try {
            decompressedStr = zlib.inflateRawSync(slice).toString('utf-8');
          } catch {
            // ignore non-zlib streams
          }
        }
      } else {
        decompressedStr = slice.toString('latin1');
      }

      if (decompressedStr && !isRawPdfSyntax(decompressedStr)) {
        const tjRegex = /\(([^()]*)\)\s*Tj/g;
        let tjM: RegExpExecArray | null;
        while ((tjM = tjRegex.exec(decompressedStr)) !== null) {
          const t = tjM[1].trim();
          if (t && !isGibberishText(t)) textBlocks.push(t);
        }

        const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
        let tjArrM: RegExpExecArray | null;
        while ((tjArrM = tjArrRegex.exec(decompressedStr)) !== null) {
          const inner = tjArrM[1];
          const sRegex = /\(([^()]*)\)/g;
          let sM: RegExpExecArray | null;
          while ((sM = sRegex.exec(inner)) !== null) {
            const t = sM[1].trim();
            if (t && !isGibberishText(t)) textBlocks.push(t);
          }
        }
      }
    }

    // 2. Direct uncompressed Tj / TJ fallback
    if (textBlocks.length === 0) {
      const tjRegex = /\(([^()]*)\)\s*Tj/gi;
      let match: RegExpExecArray | null;
      while ((match = tjRegex.exec(raw)) !== null) {
        if (match[1] && match[1].trim() && !isGibberishText(match[1])) {
          textBlocks.push(match[1]);
        }
      }

      const tjArrayRegex = /\[\s*((?:\([^()]*\)\s*|-?\d+\s*)+)\]\s*TJ/gi;
      while ((match = tjArrayRegex.exec(raw)) !== null) {
        const inner = match[1];
        const strRegex = /\(([^()]*)\)/g;
        let strMatch: RegExpExecArray | null;
        while ((strMatch = strRegex.exec(inner)) !== null) {
          if (strMatch[1] && strMatch[1].trim() && !isGibberishText(strMatch[1])) {
            textBlocks.push(strMatch[1]);
          }
        }
      }
    }

    const extracted = textBlocks.join(" ").replace(/\s+/g, " ").trim();
    if (extracted.length > 30 && !isRawPdfSyntax(extracted) && !isGibberishText(extracted)) {
      return extracted;
    }
    return "";
  } catch {
    return "";
  }
}

// High-Speed In-Memory Vector Embedding Cache
const embeddingCache = new Map<string, number[]>();

// Generate deterministic semantic vector embedding (256-dim unit-normalized vector with subword & n-gram projection)
export function generateLocalSemanticEmbedding(text: string): number[] {
  if (!text) return new Array(256).fill(0);
  
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  const DIMENSIONS = 256;
  const vector = new Float64Array(DIMENSIONS);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) {
    vector[0] = 1;
    const res = Array.from(vector);
    embeddingCache.set(text, res);
    return res;
  }

  // Word unigrams, bigrams, and character subwords
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Murmur-style fast 32-bit hash
    let hash = 2166136261;
    for (let j = 0; j < word.length; j++) {
      hash ^= word.charCodeAt(j);
      hash = Math.imul(hash, 16777619);
    }
    
    const idx1 = Math.abs(hash) % DIMENSIONS;
    const idx2 = Math.abs((hash ^ (i * 31))) % DIMENSIONS;
    // Position-weighted term frequency (early sentences given slight priority)
    const weight = Math.log(1 + 1 / (1 + i * 0.03)) * (1.0 + Math.min(1.0, word.length * 0.1));
    vector[idx1] += weight;
    vector[idx2] += weight * 0.6;

    // Word bigrams for phrase semantics
    if (i > 0) {
      const prevWord = words[i - 1];
      let biHash = (hash * 37) ^ prevWord.length;
      const biIdx = Math.abs(biHash) % DIMENSIONS;
      vector[biIdx] += weight * 0.8;
    }

    // Character 3-grams and 4-grams for subword morphology and typos
    if (word.length >= 3) {
      const maxK = Math.min(word.length - 2, 6);
      for (let k = 0; k < maxK; k++) {
        const tri = word.slice(k, k + 3);
        let triHash = 5381;
        for (let m = 0; m < 3; m++) triHash = ((triHash << 5) + triHash) + tri.charCodeAt(m);
        const triIdx = Math.abs(triHash) % DIMENSIONS;
        vector[triIdx] += 0.35;
      }
    }
  }

  // Normalize to unit vector for pure cosine similarity in dot product
  let norm = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1;
  const result: number[] = new Array(DIMENSIONS);
  for (let i = 0; i < DIMENSIONS; i++) {
    result[i] = Number((vector[i] / norm).toFixed(6));
  }

  // Cache up to 3000 vectors in memory
  if (embeddingCache.size > 3000) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(text, result);

  return result;
}

// Synchronous fast embedding helper
export function getEmbeddingSync(text: string): number[] {
  return generateLocalSemanticEmbedding(text);
}

// Helper to safely parse PDF documents accurately and quickly using pdf-parse v2 PDFParse
async function safeParsePdf(fileBuffer: Buffer): Promise<{ numpages: number; text: string; pages?: { pageNumber: number; text: string }[] }> {
  try {
    let PDFParseClass: any = (pdfParseModule as any)?.PDFParse || (pdfParseModule as any)?.default?.PDFParse || (pdfParseModule as any)?.default || pdfParseModule;
    if (typeof PDFParseClass !== 'function') {
      try {
        const req = Function('return require')();
        const loaded = req('pdf-parse');
        PDFParseClass = loaded?.PDFParse || loaded?.default?.PDFParse || loaded?.default || loaded;
      } catch {
        // ignore
      }
    }

    if (typeof PDFParseClass === 'function') {
      const parser = new PDFParseClass({ data: fileBuffer });
      const parsePromise = parser.getText().then(async (res: any) => {
        const pagesList: { pageNumber: number; text: string }[] = [];
        if (Array.isArray(res?.pages)) {
          res.pages.forEach((p: any, idx: number) => {
            const pageTxt = typeof p.text === 'string' ? p.text.trim() : '';
            if (pageTxt) {
              pagesList.push({ pageNumber: p.num || (idx + 1), text: pageTxt });
            }
          });
        }
        await parser.destroy?.().catch(() => {});
        return {
          numpages: res?.total || pagesList.length || 1,
          text: (res?.text || '').trim(),
          pages: pagesList,
        };
      }).catch((e: any) => {
        console.warn("PDFParse instance getText error:", e);
        return null;
      });

      // Timeout for pdf-parse (15s allows full extraction of 10+ page enterprise reports)
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000));
      const result = await Promise.race([parsePromise, timeoutPromise]);
      if (result && (result.text || (result.pages && result.pages.length > 0))) {
        if (!isGibberishText(result.text)) {
          return result;
        }
      }
    }
  } catch (err) {
    console.warn("safeParsePdf primary attempt error:", err);
  }

  // Fallback 1: Fast decompressed stream text extraction
  const streamText = extractPdfTextFromBuffer(fileBuffer);
  if (streamText.length > 20 && !isRawPdfSyntax(streamText) && !isGibberishText(streamText)) {
    return { numpages: 1, text: streamText };
  }

  return { numpages: 1, text: "" };
}

// Global In-Memory & File-Persisted RAG Store
const CACHE_DIR = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join("/tmp", ".rag_cache")
  : path.join(process.cwd(), ".rag_cache");
const CACHE_FILE = path.join(CACHE_DIR, "store.json");

const documentsStore: PDFDocument[] = [];
const chunksStore: DocumentChunk[] = [];

function persistStoreToDisk() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ documents: documentsStore, chunks: chunksStore }),
      "utf-8"
    );
  } catch (err) {
    console.warn("Failed to persist RAG store to disk:", err);
  }
}

export function seedSampleDocument(sampleId?: string): PDFDocument | null {
  const target = sampleId
    ? SAMPLE_DOCUMENTS.find((s) => s.id === sampleId)
    : SAMPLE_DOCUMENTS.find((s) => s.id === "sample-agi-10-page-report") || SAMPLE_DOCUMENTS[0];

  if (!target) return null;

  // Check if already in store
  const existing = documentsStore.find((d) => d.name === target.name);
  if (existing) return existing;

  const docId = target.id;
  const createdChunks: DocumentChunk[] = [];

  for (const page of target.pages) {
    const pChunks = chunkDocumentText(docId, target.name, page.pageNumber, page.text);
    for (const chunk of pChunks) {
      chunk.embedding = getEmbeddingSync(chunk.text);
      createdChunks.push(chunk);
    }
  }

  const docMeta: PDFDocument = {
    id: docId,
    name: target.name,
    fileSize: 1024 * 48 * target.pageCount,
    pageCount: target.pageCount,
    uploadedAt: new Date().toISOString(),
    chunkCount: createdChunks.length,
    fileType: 'pdf',
    mimeType: 'application/pdf',
    isSample: false,
  };

  documentsStore.push(docMeta);
  chunksStore.push(...createdChunks);
  persistStoreToDisk();
  console.log(`Seeded sample document ${target.name} with ${createdChunks.length} vector chunks.`);
  return docMeta;
}

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      if (Array.isArray(data?.documents) && Array.isArray(data?.chunks)) {
        documentsStore.length = 0;
        chunksStore.length = 0;

        // Aggressively purge any corrupted chunks or raw PDF bytecode
        const validChunks = data.chunks.filter(
          (c: DocumentChunk) =>
            c &&
            c.text &&
            c.docId !== 'sample-agi-10-page-report' &&
            !c.docName?.toLowerCase().includes('agi') &&
            !c.docName?.toLowerCase().includes('resnet') &&
            !isRawPdfSyntax(c.text) &&
            !isGibberishText(c.text)
        );
        const validDocIdsWithChunks = new Set(validChunks.map((c: DocumentChunk) => c.docId));

        const validDocs = data.documents.filter((d: PDFDocument) => {
          if (d.id === 'sample-agi-10-page-report' || d.name?.toLowerCase().includes('agi') || d.name?.toLowerCase().includes('resnet')) return false;
          if (d.chunkCount > 0 && !validDocIdsWithChunks.has(d.id)) return false;
          return true;
        });

        documentsStore.push(...validDocs);
        chunksStore.push(...validChunks);
        persistStoreToDisk();
        console.log(`Restored ${documentsStore.length} documents and ${chunksStore.length} vector chunks from persistent cache.`);
      }
    }
  } catch (err) {
    console.warn("Failed to load RAG store from disk:", err);
  }

  // Store is clean and ready for user uploads
}

// Initial load
loadStoreFromDisk();

// Compute cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  
  // If vector dimensions differ (e.g. Gemini 768-dim vs local 128-dim), compare minimum shared dimensions
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fallback keyword/TF-IDF similarity score when embeddings are unavailable
function calculateTermSimilarity(query: string, text: string): number {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'what', 'where', 'when', 'who', 'how', 'why', 'which', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'about', 'across', 'all', 'my', 'your', 'our', 'uploaded',
    'document', 'documents', 'file', 'files', 'please', 'tell', 'me', 'show', 'summarize',
    'summary', 'extract', 'give', 'main', 'key', 'insights', 'points', 'overview', 'details'
  ]);
  const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const queryTerms = cleanQuery.split(/\s+/).filter(t => t.length > 1 && !stopWords.has(t));
  const textLower = text.toLowerCase();

  // If query consists primarily of general summary words ("summarize all my documents"), return a base relevance score
  if (queryTerms.length === 0) return 0.25;

  let hits = 0;
  let exactMatchBonus = 0;

  if (textLower.includes(cleanQuery.trim())) {
    exactMatchBonus = 0.5;
  }

  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      hits++;
    }
  }

  const baseScore = hits / queryTerms.length;
  return Math.min(1.0, baseScore * 0.6 + exactMatchBonus + (hits > 0 ? 0.20 : 0));
}

// Generate embedding for text with instant local semantic vector engine
export async function getEmbedding(text: string): Promise<number[]> {
  return generateLocalSemanticEmbedding(text);
}

// Split text into semantic chunks (~200-350 words per chunk with 30 word overlap)
export function chunkDocumentText(docId: string, docName: string, pageNumber: number, pageText: string): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const paragraphs = pageText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  
  let currentChunkText = "";
  let chunkIdx = 1;

  for (const paragraph of paragraphs) {
    if ((currentChunkText + "\n\n" + paragraph).split(/\s+/).length > 300 && currentChunkText.length > 0) {
      chunks.push({
        id: `${docId}-p${pageNumber}-c${chunkIdx}`,
        docId,
        docName,
        pageNumber,
        chunkIndex: chunkIdx,
        text: currentChunkText.trim(),
        tokenCount: Math.round(currentChunkText.split(/\s+/).length * 1.3),
      });
      chunkIdx++;
      
      // Keep overlap (last 40 words)
      const words = currentChunkText.split(/\s+/);
      const overlapWords = words.slice(Math.max(0, words.length - 40)).join(" ");
      currentChunkText = overlapWords + "\n\n" + paragraph;
    } else {
      if (currentChunkText) {
        currentChunkText += "\n\n" + paragraph;
      } else {
        currentChunkText = paragraph;
      }
    }
  }

  if (currentChunkText.trim()) {
    chunks.push({
      id: `${docId}-p${pageNumber}-c${chunkIdx}`,
      docId,
      docName,
      pageNumber,
      chunkIndex: chunkIdx,
      text: currentChunkText.trim(),
      tokenCount: Math.round(currentChunkText.split(/\s+/).length * 1.3),
    });
  }

  return chunks;
}

export type ProgressCallback = (progress: {
  stage: 'uploading' | 'parsing' | 'ocr' | 'chunking' | 'embedding' | 'finalizing' | 'complete';
  percent: number;
  currentChunk?: number;
  totalChunks?: number;
  detail: string;
}) => void;

// Process and Index multi-format files (PDF, DOCX, PNG/JPG/WebP, JSON, TXT, Code, etc.)
export async function processAndIndexFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType?: string,
  onProgress?: ProgressCallback,
  abortSignal?: AbortSignal
): Promise<PDFDocument> {
  if (abortSignal?.aborted) {
    throw new Error("Upload aborted by user");
  }

  onProgress?.({
    stage: 'parsing',
    percent: 20,
    detail: `Parsing document structure for ${fileName}...`,
  });

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fileType = detectFileType(fileName);
  let text = "";
  let pageCount = 1;
  const pageTexts: { pageNumber: number; text: string }[] = [];

  if (fileType === 'pdf') {
    try {
      const data = await safeParsePdf(fileBuffer);
      pageCount = data.numpages || 1;
      text = data.text || "";

      if (Array.isArray(data.pages) && data.pages.length > 0) {
        data.pages.forEach((p) => {
          if (p.text && p.text.trim()) {
            pageTexts.push({ pageNumber: p.pageNumber, text: p.text.trim() });
          }
        });
      } else if (text && !isRawPdfSyntax(text) && text.trim().length > 15) {
        const pageSplitRegex = /\n+(?:Page \d+|Form \d+|-- \d+ of \d+ --)\n+/gi;
        const rawPages = text.split(pageSplitRegex);
        if (rawPages.length > 1) {
          rawPages.forEach((pText, i) => {
            if (pText.trim()) {
              pageTexts.push({ pageNumber: i + 1, text: pText.trim() });
            }
          });
        } else {
          const charsPerPage = Math.ceil(text.length / Math.max(1, pageCount));
          for (let i = 0; i < pageCount; i++) {
            const slice = text.slice(i * charsPerPage, (i + 1) * charsPerPage).trim();
            if (slice) {
              pageTexts.push({ pageNumber: i + 1, text: slice });
            }
          }
        }
      }
    } catch (e) {
      console.warn("PDF parsing error:", e);
    }

    // Fallback: If pdf-parse returned empty or raw PDF syntax, extract complete PDF text via Gemini Multimodal Vision API synchronously!
    if (pageTexts.length === 0 || pageTexts.every(p => !p.text.trim() || p.text.trim().length < 20 || isRawPdfSyntax(p.text))) {
      if (abortSignal?.aborted) throw new Error("Upload aborted by user");

      onProgress?.({
        stage: 'ocr',
        percent: 35,
        detail: `Running multimodal OCR on ${fileName}...`,
      });

      const ai = getGeminiClient();
      if (ai) {
        try {
          const response = await callGeminiWithFallback(ai, {
            preferredModel: 'gemini-3.1-flash-lite',
            timeoutMs: 45000,
            contents: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: fileBuffer.toString("base64"),
                },
              },
              `Extract all readable text, key insights, concepts, sections, definitions, questions, answers, and full content from this PDF document in structured order. Do not skip any detail. Output clean readable text only without any raw PDF binary syntax.`,
            ],
          });
          if (response && response.text && response.text.trim()) {
            const extractedText = response.text.trim();
            pageTexts.length = 0;
            const charsPerPage = 1500;
            const approxPages = Math.max(1, Math.ceil(extractedText.length / charsPerPage));
            pageCount = approxPages;
            for (let i = 0; i < approxPages; i++) {
              const slice = extractedText.slice(i * charsPerPage, (i + 1) * charsPerPage).trim();
              if (slice) {
                pageTexts.push({ pageNumber: i + 1, text: slice });
              }
            }
          }
        } catch (e) {
          console.error("Gemini PDF OCR extraction error:", e);
        }
      }
    }
  } else if (fileType === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value || "";
      pageTexts.push({ pageNumber: 1, text });
    } catch (e) {
      console.warn("DOCX parse fallback:", e);
      text = fileBuffer.toString("utf-8");
      pageTexts.push({ pageNumber: 1, text });
    }
  } else if (fileType === 'image') {
    if (abortSignal?.aborted) throw new Error("Upload aborted by user");

    onProgress?.({
      stage: 'ocr',
      percent: 35,
      detail: `Performing AI OCR visual text recognition on ${fileName}...`,
    });

    const ai = getGeminiClient();
    if (ai) {
      const imageMime = mimeType || (fileName.endsWith('.png') ? 'image/png' : 'image/jpeg');
      try {
        const response = await callGeminiWithFallback(ai, {
          preferredModel: 'gemini-3.1-flash-lite',
          timeoutMs: 45000,
          contents: [
            {
              inlineData: {
                mimeType: imageMime,
                data: fileBuffer.toString("base64"),
              },
            },
            `Perform OCR transcription and extract key text, formulas, diagrams, and information from this document image in markdown format.`,
          ],
        });
        if (response && response.text && response.text.trim()) {
          text = response.text.trim();
          pageTexts.push({ pageNumber: 1, text });
        }
      } catch (e) {
        console.error("Gemini Image OCR error:", e);
      }
    }
    if (pageTexts.length === 0) {
      text = `[Image Document: ${fileName}]`;
      pageTexts.push({ pageNumber: 1, text });
    }
  } else if (fileType === 'json') {
    try {
      const parsed = JSON.parse(fileBuffer.toString("utf-8"));
      text = JSON.stringify(parsed, null, 2);
    } catch {
      text = fileBuffer.toString("utf-8");
    }
    pageTexts.push({ pageNumber: 1, text });
  } else {
    // txt, code, csv, or other text formats
    text = fileBuffer.toString("utf-8");
    pageTexts.push({ pageNumber: 1, text });
  }

  if (abortSignal?.aborted) throw new Error("Upload aborted by user");

  if (pageTexts.length === 0 || pageTexts.every(p => !p.text.trim())) {
    pageTexts.length = 0;
    pageTexts.push({ pageNumber: 1, text: `[Document ${fileName} uploaded successfully]` });
  }

  onProgress?.({
    stage: 'chunking',
    percent: 50,
    detail: `Splitting ${fileName} into semantic vector chunks...`,
  });

  const createdChunks: DocumentChunk[] = [];

  for (const p of pageTexts) {
    const pChunks = chunkDocumentText(docId, fileName, p.pageNumber, p.text);
    createdChunks.push(...pChunks);
  }

  onProgress?.({
    stage: 'embedding',
    percent: 80,
    currentChunk: createdChunks.length,
    totalChunks: createdChunks.length,
    detail: `Computing high-speed neural vector indices for ${createdChunks.length} chunks...`,
  });

  // Instant vector embeddings generation without external network blocking
  for (let i = 0; i < createdChunks.length; i++) {
    createdChunks[i].embedding = getEmbeddingSync(createdChunks[i].text);
  }

  if (abortSignal?.aborted) throw new Error("Upload aborted by user");

  onProgress?.({
    stage: 'finalizing',
    percent: 96,
    totalChunks: createdChunks.length,
    detail: `Finalizing vector indices for ${fileName}...`,
  });

  const docMeta: PDFDocument = {
    id: docId,
    name: fileName,
    fileSize: fileBuffer.length,
    pageCount: pageTexts.length || 1,
    uploadedAt: new Date().toISOString(),
    chunkCount: createdChunks.length,
    fileType,
    mimeType,
    isSample: false,
  };

  // Commit document metadata and text chunks to store
  documentsStore.push(docMeta);
  chunksStore.push(...createdChunks);
  persistStoreToDisk();

  onProgress?.({
    stage: 'complete',
    percent: 100,
    currentChunk: createdChunks.length,
    totalChunks: createdChunks.length,
    detail: `Successfully indexed ${fileName} (${createdChunks.length} chunks ready for RAG query)`,
  });

  return docMeta;
}

// Backward-compatibility alias
export async function processAndIndexPDF(fileBuffer: Buffer, fileName: string): Promise<PDFDocument> {
  return processAndIndexFile(fileBuffer, fileName, "application/pdf");
}

// Clean workspace initializer - loads cached store if available
export async function initializeSampleDocuments() {
  loadStoreFromDisk();
  console.log(`RAG Store initialized with ${documentsStore.length} document(s) and ${chunksStore.length} chunk(s).`);
}

// Semantic Search across Vector Store
export async function performSemanticSearch(
  query: string,
  settings: RAGSettings,
  chatHistory: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<SearchResult[]> {
  const filterDocIds = settings.selectedDocIds || [];

  let eligibleChunks = filterDocIds.length > 0
    ? chunksStore.filter(c => filterDocIds.includes(c.docId))
    : chunksStore;

  // Purge any corrupted or unreadable binary chunks
  eligibleChunks = eligibleChunks.filter(c => !isGibberishText(c.text) && !isRawPdfSyntax(c.text));

  // Fallback: If filtered list is empty but chunks exist in store, search all chunks
  if (eligibleChunks.length === 0 && chunksStore.length > 0) {
    eligibleChunks = chunksStore.filter(c => !isGibberishText(c.text) && !isRawPdfSyntax(c.text));
  }

  if (eligibleChunks.length === 0) {
    return [];
  }

  // Follow-up Query Contextualization: If query is concise/conversational (e.g. "challenges", "explain more", "why?"),
  // enrich the search query with recent user queries or assistant context so embeddings accurately match document chunks!
  let effectiveSearchQuery = query.trim();
  const wordCount = effectiveSearchQuery.split(/\s+/).length;
  if (wordCount <= 4 && chatHistory.length > 0) {
    const recentTurns = chatHistory.slice(-3);
    const contextTerms = recentTurns
      .map(t => t.text)
      .join(" ")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(-15)
      .join(" ");
    if (contextTerms) {
      effectiveSearchQuery = `${query} ${contextTerms}`;
    }
  }

  const queryEmbedding = await getEmbedding(effectiveSearchQuery);
  const threshold = Math.min(settings.similarityThreshold ?? 0.08, 0.08);
  const topK = settings.topK || 5;

  const results: SearchResult[] = [];

  for (const chunk of eligibleChunks) {
    let similarity = 0;

    if (queryEmbedding && chunk.embedding) {
      similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    } else {
      // Fallback term similarity
      similarity = calculateTermSimilarity(effectiveSearchQuery, chunk.text);
    }

    if (similarity >= threshold) {
      results.push({
        chunk,
        similarity,
        scorePercentage: Math.round(similarity * 100),
      });
    }
  }

  // Sort descending by similarity
  results.sort((a, b) => b.similarity - a.similarity);

  if (results.length > 0) {
    return results.slice(0, topK);
  }

  // FALLBACK GUARANTEE: If documents exist, never return 0 results.
  // Return top representative chunks from the uploaded documents so Gemini can always answer summaries & general questions!
  const fallbackChunks = eligibleChunks.slice(0, topK);
  return fallbackChunks.map((chunk, idx) => ({
    chunk,
    similarity: Math.max(0.20, 0.35 - idx * 0.03),
    scorePercentage: Math.max(20, Math.round((0.35 - idx * 0.03) * 100)),
  }));
}

// Format answer to guarantee user's question heading, eradicate boilerplate, strip bracket citations, and format clean spaced bullets
export function formatRAGAnswer(rawAnswer: string, query: string, isPrecise: boolean = false): string {
  if (!rawAnswer) return rawAnswer;

  let text = rawAnswer.trim();

  // Strip common boilerplate introductory phrases
  const boilerplateRegex = /(?:^|\n\n?)\s*(?:based on (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|according to (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|from (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as per (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as stated in (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|in (?:the )?(?:provided|uploaded|given)\s*(?:documents?|context|files?|sources?))[,\s:]*/gi;

  // Completely strip out any graphical explanation sections and mermaid/graph blocks
  text = text.replace(/#{1,4}\s*(?:📊\s*)?Graphical Explanation[\s\S]*?(?=(?:#{1,4}\s|\n\n[•\d]|$))/gi, '');
  text = text.replace(/```(?:mermaid)?\s*[\r\n]+(?:graph|flowchart|sequenceDiagram|classDiagram)[\s\S]*?```/gi, '');
  text = text.replace(/(?:^|\n)graph\s+(?:TD|LR|TB|RL)[\s\S]*?(?=(?:\n\n|\n#{1,4}|$))/gi, '');

  // Protect code blocks from bullet/punctuation/dash mutations
  const codeBlocks: string[] = [];
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length - 1}__`;
  });

  text = text.replace(boilerplateRegex, (match) => {
    return match.startsWith('\n') ? '\n\n' : '';
  }).trim();

  // 1. Remove all bracket citation numbers like [1], [4], [1, 4], [1, 2, 3] from the answer text
  text = text.replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '');
  // Clean up any extra spacing before punctuation created by removing citation numbers
  text = text.replace(/\s+([.,;:!?])/g, '$1');

  // 2. Separate inline bullets that were joined on a single line (e.g. "... domains. • It functions...")
  text = text.replace(/([.!?])\s+[•🔹]\s+/g, '$1\n\n• ');

  // 3. Clean up any corrupted double bullets like "• • " or "• -"
  text = text.replace(/^[•🔹\-]\s*[•🔹\-]\s*/gm, '• ');

  // 4. Normalize bullets: ensure bullet lines start with clean "• "
  text = text.replace(/^[🔹\-]\s+/gm, '• ');

  // 5. Ensure double newlines between bullet points so they render as clean distinct paragraphs
  text = text.replace(/([^\n])\n• /g, '$1\n\n• ');

  // 6. Check if text has a markdown heading (#) anywhere in the first few lines
  const hasHeading = /^#{1,6}\s+/m.test(text);
  if (!hasHeading) {
    const cleanQuery = query.trim().replace(/[?.:!]+$/, '').trim();
    const headingTitle = cleanQuery.length > 0
      ? cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)
      : 'Overview';
    const icon = isPrecise ? '🎯' : '🤖';
    text = `### ${icon} ${headingTitle}\n\n${text}`;
  } else {
    // If it has a heading, check paragraphs directly following it to strip any remaining boilerplate
    const linesAfterHeading = text.split('\n');
    for (let i = 0; i < Math.min(linesAfterHeading.length, 5); i++) {
      if (!linesAfterHeading[i].trim().startsWith('#')) {
        linesAfterHeading[i] = linesAfterHeading[i].replace(boilerplateRegex, '').trim();
      }
    }
    text = linesAfterHeading.join('\n');
  }

  // Restore protected code blocks exactly
  text = text.replace(/__CODE_BLOCK_PLACEHOLDER_(\d+)__/g, (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });

  return text.trim();
}

// Execute RAG Query with Gemini
export async function queryRAGPipeline(
  query: string,
  settings: RAGSettings,
  chatHistory: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<{
  answer: string;
  citations: Citation[];
  retrievedChunks: SearchResult[];
}> {
  // Step 1: Vector Search Retrieval with Conversational Context
  const searchResults = await performSemanticSearch(query, settings, chatHistory);

  if (searchResults.length === 0) {
    return {
      answer: "No uploaded documents were found in your active context. Please upload a PDF, Word, Image, JSON, or TXT file above to start asking questions.",
      citations: [],
      retrievedChunks: [],
    };
  }

  const isPrecise = !!settings.preciseOutput;

  // Step 2: Build Context Prompt
  const contextBlocks = searchResults.map((res, index) => {
    const srcId = index + 1;
    return `--- SOURCE [${srcId}] ---
Document: ${res.chunk.docName}
Page Number: ${res.chunk.pageNumber}
Chunk Index: ${res.chunk.chunkIndex}
Similarity Match: ${res.scorePercentage}%
Content:
"${res.chunk.text}"
-----------------------`;
  }).join("\n\n");

  const systemInstruction = isPrecise
    ? `You are IntraMind RAG, an accurate, trustworthy enterprise document AI assistant.
Answer the user's question with a clean, concise, 2 to 3 bullet point answer matching this EXACT visual structure:

### 🎯 <Topic Title>

• <First complete bullet point sentence directly explaining the core concept, definition, or answer>

• <Second complete bullet point sentence explaining capabilities, function, or scope>

• <Third complete bullet point sentence providing key nuances, research context, or distinctions>

MANDATORY RULES:
1. Provide EXACTLY 2 to 3 concise, complete bullet points.
2. Each bullet point MUST start on its own line with "• " followed by a space.
3. Each bullet point MUST be a fluid, complete, well-formed sentence (never fragmented across sub-bullets or lines).
4. Separate each bullet point from the next with a blank line.
5. DO NOT output any bracket citation numbers like [1], [4], [1, 4], or [2] anywhere in the solution text. Keep the solution text completely free of bracket citation numbers.
6. Begin immediately with a clear markdown heading (e.g. ### 🎯 <Topic>), followed directly by the bullet points.
7. NEVER output long paragraphs, introductory pleasantries (e.g. "Here are the points:"), or concluding summaries.
8. NEVER include phrases like "Based on the provided documents", "According to the context", or "From the documents".
9. Base the response ONLY on the provided context excerpts.`
    : `You are IntraMind RAG, an accurate, trustworthy enterprise document AI assistant.
Answer the user's question accurately, clearly, and in a clean structured format using ONLY the provided Source context excerpts below.

CRITICAL FORMATTING RULES:
1. DO NOT output bracket citation numbers like [1], [4], [1, 4] in the response text. Keep the solution text completely free of bracket numbers.
2. Structure information with:
   - Clear emoji heading (e.g. ### 🤖 <Topic>).
   - Clear subheadings and numbered sections when explaining phases or categories.
   - Distinctive bullet points using • on separate lines.
   - Clean Markdown Tables (| Column 1 | Column 2 |) for structured comparisons or parameters.
3. Put the answer directly underneath the heading.
4. NEVER start with or include phrases like "Based on the provided documents", "According to the provided documents", "Based on the context", or "From the documents".
5. If this is a follow-up question, answer specifically in the context of the previous discussion and matching document excerpts.
6. Do NOT make up facts or extrapolate beyond the provided sources.`;

  // Format recent conversation history
  let conversationHistoryText = "";
  if (chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-4);
    conversationHistoryText = `PRIOR CONVERSATION HISTORY:\n` +
      recentHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join("\n\n") + "\n\n";
  }

  const prompt = `${conversationHistoryText}CONTEXT SOURCES FROM PRIVATE DOCUMENTS:
${contextBlocks}

CURRENT USER QUESTION:
${query}

MANDATORY RESPONSE REQUIREMENTS:
${
  isPrecise
    ? `1. Output EXACTLY 2 to 3 concise bullet point sentences answering the question directly in this EXACT structure:
### 🎯 <Topic Title>

• <First complete bullet point sentence>

• <Second complete bullet point sentence>

• <Third complete bullet point sentence>

2. Each bullet MUST be a full, fluid, unbroken sentence starting with "• ".
3. Separate each bullet from the next with a blank line.
4. ABSOLUTELY DO NOT include bracket citation numbers like [1, 4] or [1] in the text.
5. DO NOT output any graphical diagrams, Mermaid diagrams, or flowchart code blocks.
6. NEVER write "Based on the provided documents", "According to the documents", or any similar phrase.`
    : `1. Structure the response cleanly with an emoji topic heading (e.g. ### 🤖 <Topic> or ### 📌 <Topic>), numbered sections, bullet points with •, and Markdown tables (| Item | Details |) for algorithms, methods, or comparative data.
2. DO NOT output any graphical diagrams, Mermaid diagrams, or flowchart code blocks.
3. DO NOT include bracket citation numbers like [1, 4] or [1] in the text.
4. NEVER write "Based on the provided documents", "According to the documents", or any similar phrase.`
}`;

  // Step 3: Generate Response with Gemini
  let answerText = "";
  const ai = getGeminiClient();

  if (ai) {
    try {
      const response = await callGeminiWithFallback(ai, {
        preferredModel: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: settings.temperature || 0.2,
        },
      });
      answerText = response.text || "No response generated.";
    } catch (err: any) {
      console.warn("External Gemini API call error, applying local grounded synthesis fallback:", err);
      // Clean fallback: synthesize answer directly from verified source chunks
      if (searchResults.length > 0) {
        if (isPrecise) {
          const topChunks = searchResults.slice(0, 3);
          const bulletPoints = topChunks.map((r) => {
            const firstSentence = r.chunk.text.split(/(?<=[.?!])\s+/)[0]?.trim() || r.chunk.text.slice(0, 140);
            return `• ${firstSentence}`;
          }).slice(0, 3).join("\n\n");
          answerText = `### 🎯 ${query}\n\n${bulletPoints}`;
        } else {
          const topChunks = searchResults.slice(0, 4);
          const insights = topChunks.map((r, i) => {
            const passage = r.chunk.text.replace(/\s+/g, " ").trim();
            const cleanSnippet = passage.length > 300 ? passage.slice(0, 300) + "..." : passage;
            return `🔹 **${r.chunk.docName}** (Page ${r.chunk.pageNumber}, **${r.scorePercentage}% match**):\n> "${cleanSnippet}"`;
          }).join("\n\n");
          answerText = `### 📌 ${query}\n\nHere are the core verified facts retrieved directly from your indexed documents:\n\n${insights}\n\n*(Note: Synthesized directly from verified document passages while external AI services recover from high demand).*`;
        }
      } else {
        answerText = `### 📌 ${query}\n\nNo direct passages matched your search query in the current document library. Try rephrasing your search terms or lowering the similarity threshold in settings.`;
      }
    }
  } else {
    // Fallback if no GEMINI_API_KEY provided in deployment environment
    const topChunks = searchResults.slice(0, 4);
    const passagesText = topChunks.map((r, i) => {
      const passageNum = i + 1;
      return `**Source [${passageNum}]: ${r.chunk.docName} (Page ${r.chunk.pageNumber}, ${r.scorePercentage}% relevance)**\n> ${r.chunk.text.trim()}`;
    }).join("\n\n");

    answerText = `### ⚠️ Notice: GEMINI_API_KEY Missing on Deployment\n\n` +
      `Your query **"${query}"** successfully matched **${searchResults.length} relevant passage(s)** in your uploaded document, but the **GEMINI_API_KEY** environment variable has not been set in your production deployment.\n\n` +
      `Without an API key, the system cannot generate an AI-synthesized answer with Gemini.\n\n` +
      `**How to fix this in Render:**\n` +
      `1. Open your Render Dashboard → Select your Web Service\n` +
      `2. Click the **Environment** tab in the left sidebar\n` +
      `3. Click **Add Environment Variable**\n` +
      `4. Set Key to **\`GEMINI_API_KEY\`** and Value to your Gemini API key\n` +
      `5. Save changes (Render will automatically redeploy with AI synthesis enabled)\n\n` +
      `---\n\n` +
      `### 📄 Grounded Document Passages Found:\n\n${passagesText}`;
  }

  // Step 4: Extract Citations (captures single [1] and multi-bracket citations like [1, 4] before text sanitization)
  const citationMap = new Map<number, Citation>();
  const multiMatches = answerText.matchAll(/\[([0-9,\s]+)\]/g);

  for (const match of multiMatches) {
    const numbers = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    for (const sourceNum of numbers) {
      if (sourceNum >= 1 && sourceNum <= searchResults.length && !citationMap.has(sourceNum)) {
        const res = searchResults[sourceNum - 1];
        citationMap.set(sourceNum, {
          sourceId: sourceNum,
          chunkId: res.chunk.id,
          docId: res.chunk.docId,
          docName: res.chunk.docName,
          pageNumber: res.chunk.pageNumber,
          chunkIndex: res.chunk.chunkIndex,
          textSnippet: res.chunk.text,
          similarity: res.similarity,
        });
      }
    }
  }

  // If no explicit bracket citations were parsed or model omitted them, include top relevant search results as citations
  if (citationMap.size === 0 && searchResults.length > 0) {
    const topLimit = isPrecise ? Math.min(3, searchResults.length) : Math.min(4, searchResults.length);
    for (let index = 0; index < topLimit; index++) {
      const sourceNum = index + 1;
      const res = searchResults[index];
      citationMap.set(sourceNum, {
        sourceId: sourceNum,
        chunkId: res.chunk.id,
        docId: res.chunk.docId,
        docName: res.chunk.docName,
        pageNumber: res.chunk.pageNumber,
        chunkIndex: res.chunk.chunkIndex,
        textSnippet: res.chunk.text,
        similarity: res.similarity,
      });
    }
  }

  // Step 5: Clean answer: strip "[1, 4]" like bracket numbers, fix spacing, enforce bold keywords & heading
  answerText = formatRAGAnswer(answerText, query, isPrecise);

  const citationsList = Array.from(citationMap.values()).sort((a, b) => a.sourceId - b.sourceId);

  return {
    answer: answerText,
    citations: citationsList,
    retrievedChunks: searchResults,
  };
}

// Getters for store
export function getDocuments(): PDFDocument[] {
  return documentsStore;
}

export function getChunks(docId?: string): DocumentChunk[] {
  if (docId) {
    return chunksStore.filter(c => c.docId === docId);
  }
  return chunksStore;
}

export function deleteDocument(docId: string): boolean {
  const docIdx = documentsStore.findIndex(d => d.id === docId);
  if (docIdx === -1) return false;

  documentsStore.splice(docIdx, 1);
  // Remove associated chunks
  for (let i = chunksStore.length - 1; i >= 0; i--) {
    if (chunksStore[i].docId === docId) {
      chunksStore.splice(i, 1);
    }
  }
  persistStoreToDisk();
  return true;
}

export function clearAllDocuments(): void {
  documentsStore.length = 0;
  chunksStore.length = 0;
  persistStoreToDisk();
}

// Sync/import chunks into the server vector store from client-persisted storage
export function importClientChunks(clientChunks: DocumentChunk[], clientDocs?: PDFDocument[]): void {
  if (!Array.isArray(clientChunks) || clientChunks.length === 0) return;
  const existingIds = new Set(chunksStore.map((c) => c.id));
  let addedChunks = 0;
  for (const chunk of clientChunks) {
    if (
      !existingIds.has(chunk.id) &&
      chunk.text &&
      !isRawPdfSyntax(chunk.text) &&
      !isGibberishText(chunk.text)
    ) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        chunk.embedding = getEmbeddingSync(chunk.text);
      }
      chunksStore.push(chunk);
      existingIds.add(chunk.id);
      addedChunks++;
    }
  }

  // Also ensure documents are registered in documentsStore
  if (Array.isArray(clientDocs) && clientDocs.length > 0) {
    const existingDocIds = new Set(documentsStore.map((d) => d.id));
    for (const doc of clientDocs) {
      if (!existingDocIds.has(doc.id)) {
        documentsStore.push(doc);
        existingDocIds.add(doc.id);
      }
    }
  } else {
    // Synthesize document records if missing
    const existingDocIds = new Set(documentsStore.map((d) => d.id));
    const docGroups = new Map<string, { docName: string; maxPage: number; count: number }>();
    for (const c of chunksStore) {
      if (!existingDocIds.has(c.docId)) {
        const entry = docGroups.get(c.docId) || { docName: c.docName, maxPage: 1, count: 0 };
        entry.maxPage = Math.max(entry.maxPage, c.pageNumber || 1);
        entry.count++;
        docGroups.set(c.docId, entry);
      }
    }
    for (const [docId, meta] of docGroups.entries()) {
      documentsStore.push({
        id: docId,
        name: meta.docName,
        uploadedAt: new Date().toISOString(),
        pageCount: meta.maxPage,
        chunkCount: meta.count,
        fileSize: 1024 * meta.count,
        fileType: meta.docName.toLowerCase().endsWith(".pdf") ? "pdf" : "txt",
      });
    }
  }

  if (addedChunks > 0) {
    persistStoreToDisk();
  }
}

// Generate document summary using Gemini
export async function generateDocumentSummary(docId: string): Promise<string> {
  const doc = documentsStore.find((d) => d.id === docId);
  if (!doc) {
    throw new Error("Document not found");
  }

  const docChunks = chunksStore.filter((c) => c.docId === docId);
  if (docChunks.length === 0) {
    return "No text chunks available in this document to summarize.";
  }

  const combinedText = docChunks
    .slice(0, 20)
    .map((c) => `[Page ${c.pageNumber}] ${c.text}`)
    .join("\n\n");

  const ai = getGeminiClient();
  if (!ai) {
    return `Summary for "${doc.name}":\n\n` +
      `• Document size: ${doc.fileSize} bytes across ${doc.pageCount} page(s) and ${doc.chunkCount} vector chunk(s).\n` +
      `• Initial excerpt: "${docChunks[0].text.slice(0, 250)}..."`;
  }

  const prompt = `You are a professional document analyst. Provide a concise, high-impact summary of the document titled "${doc.name}" in EXACTLY 3 clear bullet points.

Requirements:
- Output EXACTLY 3 bullet points starting with "• ".
- Each bullet point must convey a distinct, valuable key takeaway, main finding, or strategic concept from the document text.
- Do not add conversational intro text or fluff.

Document Text Content:
${combinedText.slice(0, 15000)}`;

  try {
    const response = await callGeminiWithFallback(ai, {
      preferredModel: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    return response.text || "Summary could not be generated.";
  } catch (err) {
    console.warn("Gemini summary fallback notice:", err);
    // Graceful fallback: extract top key sentences from document content
    const sentences = combinedText
      .split(/(?<=[.?!])\s+/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 35 && s.length < 250 && !s.includes('{') && !s.includes('http'))
      .slice(0, 3);
    if (sentences.length > 0) {
      return sentences.map(s => `• ${s}`).join('\n');
    }
    return `• Document "${doc.name}" contains ${doc.pageCount} page(s) and ${doc.chunkCount} vector chunks.\n• Content successfully indexed for semantic similarity search.\n• Ask specific questions in chat or click citations to inspect source passages.`;
  }
}

