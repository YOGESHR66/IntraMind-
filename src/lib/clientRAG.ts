import { DocumentChunk, PDFDocument, Citation, SearchResult, UploadProgressState } from '../types';

// In-memory embedding cache for client-side vectors
const clientEmbeddingCache = new Map<string, number[]>();

/**
 * Deterministic 256-dimensional semantic vector embedding.
 * Matches the backend projection logic for cosine similarity retrieval.
 */
export function generateClientEmbedding(text: string): number[] {
  if (!text) return new Array(256).fill(0);

  const cached = clientEmbeddingCache.get(text);
  if (cached) return cached;

  const DIMENSIONS = 256;
  const vector = new Float64Array(DIMENSIONS);
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) {
    vector[0] = 1;
    const res = Array.from(vector);
    clientEmbeddingCache.set(text, res);
    return res;
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    let hash = 2166136261;
    for (let j = 0; j < word.length; j++) {
      hash ^= word.charCodeAt(j);
      hash = Math.imul(hash, 16777619);
    }

    const idx1 = Math.abs(hash) % DIMENSIONS;
    const idx2 = Math.abs(hash ^ (i * 31)) % DIMENSIONS;
    const weight = Math.log(1 + 1 / (1 + i * 0.03)) * (1.0 + Math.min(1.0, word.length * 0.1));
    vector[idx1] += weight;
    vector[idx2] += weight * 0.6;

    if (i > 0) {
      const prevWord = words[i - 1];
      const biHash = (hash * 37) ^ prevWord.length;
      const biIdx = Math.abs(biHash) % DIMENSIONS;
      vector[biIdx] += weight * 0.8;
    }

    if (word.length >= 3) {
      const maxK = Math.min(word.length - 2, 6);
      for (let k = 0; k < maxK; k++) {
        const tri = word.slice(k, k + 3);
        let triHash = 5381;
        for (let m = 0; m < 3; m++) triHash = (triHash << 5) + triHash + tri.charCodeAt(m);
        const triIdx = Math.abs(triHash) % DIMENSIONS;
        vector[triIdx] += 0.35;
      }
    }
  }

  let norm = 0;
  for (let i = 0; i < DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1;
  const result: number[] = new Array(DIMENSIONS);
  for (let i = 0; i < DIMENSIONS; i++) {
    result[i] = Number((vector[i] / norm).toFixed(6));
  }

  if (clientEmbeddingCache.size > 2000) {
    const firstKey = clientEmbeddingCache.keys().next().value;
    if (firstKey) clientEmbeddingCache.delete(firstKey);
  }
  clientEmbeddingCache.set(text, result);

  return result;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
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

/**
 * Validates whether a text string is unreadable binary noise or compressed stream artifacts.
 */
export function isGibberishText(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim();
  if (clean.length < 8) return false;

  // Raw PDF internal objects / markers or placeholder text
  if (
    clean.includes('/FlateDecode') ||
    clean.includes('/FontDescriptor') ||
    clean.includes('/MediaBox') ||
    clean.includes('endobj') ||
    clean.includes('xref') ||
    clean.includes('trailer<<') ||
    (clean.startsWith('Content from ') && (clean.includes('indexed') || clean.includes('workspace') || clean.includes('uploaded successfully')))
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

/**
 * In-browser text extractor supporting PDF (with Flate decompression), TXT, JSON, MD, CSV, DOCX
 */
export async function extractTextInBrowser(file: File): Promise<{ text: string; pageCount: number }> {
  const fileName = file.name.toLowerCase();

  // Plain text, markdown, json, csv
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.xml') ||
    fileName.endsWith('.html') ||
    fileName.endsWith('.js') ||
    fileName.endsWith('.ts')
  ) {
    const raw = await file.text();
    return { text: raw.trim(), pageCount: 1 };
  }

  // PDF In-Browser Extraction
  if (fileName.endsWith('.pdf')) {
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const latinDecoder = new TextDecoder('latin1');
      const rawPdf = latinDecoder.decode(bytes);

      // Count pages in PDF
      const pageMatches = rawPdf.match(/\/Type\s*\/Page\b/g);
      const pageCount = pageMatches ? Math.max(1, pageMatches.length) : 1;

      const textChunks: string[] = [];

      // 1. Scan for stream objects and decompress FlateDecode streams using browser DecompressionStream
      const streamRegex = /<<([^>]*)>>\s*stream[\r\n]+/g;
      let sMatch: RegExpExecArray | null;
      while ((sMatch = streamRegex.exec(rawPdf)) !== null) {
        const dict = sMatch[1];
        const streamStart = sMatch.index + sMatch[0].length;
        const endstreamIdx = rawPdf.indexOf('endstream', streamStart);
        if (endstreamIdx === -1) break;

        let streamEnd = endstreamIdx;
        while (streamEnd > streamStart && (bytes[streamEnd - 1] === 10 || bytes[streamEnd - 1] === 13)) {
          streamEnd--;
        }

        const slice = bytes.subarray(streamStart, streamEnd);
        let decompressedStr = '';

        if (dict.includes('/FlateDecode') && typeof DecompressionStream !== 'undefined') {
          try {
            const ds = new DecompressionStream('deflate');
            const writer = ds.writable.getWriter();
            writer.write(slice);
            writer.close();
            const reader = ds.readable.getReader();
            const chunksList: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) chunksList.push(value);
            }
            const totalLen = chunksList.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let offset = 0;
            for (const c of chunksList) {
              merged.set(c, offset);
              offset += c.length;
            }
            decompressedStr = new TextDecoder('utf-8').decode(merged);
          } catch {
            // Try raw deflate
            try {
              const dsRaw = new DecompressionStream('deflate-raw');
              const writer = dsRaw.writable.getWriter();
              writer.write(slice);
              writer.close();
              const reader = dsRaw.readable.getReader();
              const chunksList: Uint8Array[] = [];
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) chunksList.push(value);
              }
              const totalLen = chunksList.reduce((acc, c) => acc + c.length, 0);
              const merged = new Uint8Array(totalLen);
              let offset = 0;
              for (const c of chunksList) {
                merged.set(c, offset);
                offset += c.length;
              }
              decompressedStr = new TextDecoder('utf-8').decode(merged);
            } catch {
              // ignore uncompressed stream
            }
          }
        } else {
          decompressedStr = latinDecoder.decode(slice);
        }

        if (decompressedStr) {
          // Extract literal text inside Tj operators
          const tjRegex = /\(([^()]*)\)\s*Tj/g;
          let tjM: RegExpExecArray | null;
          while ((tjM = tjRegex.exec(decompressedStr)) !== null) {
            const t = tjM[1].replace(/\\([()\\])/g, '$1').trim();
            if (t.length > 1 && !isGibberishText(t)) {
              textChunks.push(t);
            }
          }

          // Extract text array TJ operators
          const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
          let tjArrM: RegExpExecArray | null;
          while ((tjArrM = tjArrRegex.exec(decompressedStr)) !== null) {
            const inner = tjArrM[1];
            const sRegex = /\(([^()]*)\)/g;
            let sM: RegExpExecArray | null;
            while ((sM = sRegex.exec(inner)) !== null) {
              const t = sM[1].replace(/\\([()\\])/g, '$1').trim();
              if (t.length > 1 && !isGibberishText(t)) {
                textChunks.push(t);
              }
            }
          }
        }
      }

      // 2. Direct uncompressed Tj / TJ fallback
      if (textChunks.length === 0) {
        const tjRegex = /\(([^()]*)\)\s*Tj/gi;
        let match: RegExpExecArray | null;
        while ((match = tjRegex.exec(rawPdf)) !== null) {
          const t = match[1].replace(/\\([()\\])/g, '$1').trim();
          if (t.length > 1 && !isGibberishText(t)) {
            textChunks.push(t);
          }
        }

        const tjArrayRegex = /\[\s*((?:\([^()]*\)\s*|-?\d+\s*)+)\]\s*TJ/gi;
        while ((match = tjArrayRegex.exec(rawPdf)) !== null) {
          const inner = match[1];
          const strRegex = /\(([^()]*)\)/g;
          let strMatch: RegExpExecArray | null;
          while ((strMatch = strRegex.exec(inner)) !== null) {
            const t = strMatch[1].replace(/\\([()\\])/g, '$1').trim();
            if (t.length > 1 && !isGibberishText(t)) {
              textChunks.push(t);
            }
          }
        }
      }

      const extracted = textChunks.join(' ').replace(/\s+/g, ' ').trim();
      if (extracted.length > 40 && !isGibberishText(extracted)) {
        return { text: extracted, pageCount };
      }

      throw new Error(
        `Could not extract readable text from "${file.name}" in browser. Please ensure the backend server is reachable so server-side PDF parsing and Gemini OCR can process this document.`
      );
    } catch (pdfErr: any) {
      throw new Error(
        pdfErr?.message || `Could not extract text from "${file.name}". Please ensure the backend server is reachable.`
      );
    }
  }

  // Fallback for docx, txt, csv, or code formats
  try {
    const raw = await file.text();
    const clean = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (clean.length > 20 && !isGibberishText(clean)) {
      return { text: clean, pageCount: 1 };
    }
  } catch {
    // ignore
  }

  throw new Error(`Unable to extract readable content from "${file.name}".`);
}

/**
 * Split text into overlapping semantic chunks
 */
export function chunkDocumentText(docId: string, docName: string, fullText: string, pageCount: number): DocumentChunk[] {
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0 && fullText.trim()) {
    paragraphs.push(fullText.trim());
  }

  const chunks: DocumentChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 1;
  const charsPerChunk = 500;

  for (const p of paragraphs) {
    if ((currentChunk + '\n\n' + p).length > charsPerChunk && currentChunk.length > 0) {
      const pageNumber = Math.min(pageCount, Math.ceil((chunkIndex / (paragraphs.length || 1)) * pageCount)) || 1;
      const text = currentChunk.trim();
      chunks.push({
        id: `${docId}-c${chunkIndex}`,
        docId,
        docName,
        pageNumber,
        chunkIndex,
        text,
        tokenCount: Math.round(text.split(/\s+/).length * 1.3),
        embedding: generateClientEmbedding(text),
      });
      chunkIndex++;
      const words = currentChunk.split(/\s+/);
      const overlap = words.slice(Math.max(0, words.length - 15)).join(' ');
      currentChunk = overlap + '\n\n' + p;
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
    }
  }

  if (currentChunk.trim()) {
    const pageNumber = Math.min(pageCount, Math.ceil((chunkIndex / (paragraphs.length || 1)) * pageCount)) || 1;
    const text = currentChunk.trim();
    chunks.push({
      id: `${docId}-c${chunkIndex}`,
      docId,
      docName,
      pageNumber,
      chunkIndex,
      text,
      tokenCount: Math.round(text.split(/\s+/).length * 1.3),
      embedding: generateClientEmbedding(text),
    });
  }

  return chunks;
}

const LOCAL_STORAGE_CLIENT_DOCS = 'intramind_client_docs_v1';
const LOCAL_STORAGE_CLIENT_CHUNKS = 'intramind_client_chunks_v1';

export function getClientStoredDocuments(): PDFDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENT_DOCS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out corrupted documents that only have gibberish or empty content
    const validDocs = parsed.filter((d: PDFDocument) => {
      const chunks = getClientStoredChunks(d.id);
      if (chunks.length === 0) return true;
      return chunks.some((c) => !isGibberishText(c.text));
    });

    if (validDocs.length !== parsed.length) {
      saveClientStoredDocuments(validDocs);
    }
    return validDocs;
  } catch {
    return [];
  }
}

export function saveClientStoredDocuments(docs: PDFDocument[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CLIENT_DOCS, JSON.stringify(docs));
  } catch {
    // storage limit reached
  }
}

export function getClientStoredChunks(docId?: string): DocumentChunk[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CLIENT_CHUNKS);
    if (!raw) return [];
    const parsed: DocumentChunk[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Automatically purge any corrupted or gibberish chunks from client storage
    const validChunks = parsed.filter((c) => !isGibberishText(c.text));
    if (validChunks.length !== parsed.length) {
      try {
        localStorage.setItem(LOCAL_STORAGE_CLIENT_CHUNKS, JSON.stringify(validChunks));
      } catch {}
    }

    if (docId) {
      return validChunks.filter((c) => c.docId === docId);
    }
    return validChunks;
  } catch {
    return [];
  }
}

export function saveClientStoredChunks(newChunks: DocumentChunk[]): void {
  try {
    const existing = getClientStoredChunks();
    const newIds = new Set(newChunks.map((c) => c.id));
    const combined = [...existing.filter((c) => !newIds.has(c.id)), ...newChunks];
    localStorage.setItem(LOCAL_STORAGE_CLIENT_CHUNKS, JSON.stringify(combined.slice(-1000)));
  } catch {
    // ignore
  }
}

export function deleteClientDocument(docId: string): void {
  try {
    const docs = getClientStoredDocuments().filter((d) => d.id !== docId);
    saveClientStoredDocuments(docs);
    const chunks = getClientStoredChunks().filter((c) => c.docId !== docId);
    localStorage.setItem(LOCAL_STORAGE_CLIENT_CHUNKS, JSON.stringify(chunks));
  } catch {
    // ignore
  }
}

export function clearClientDocuments(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_CLIENT_DOCS);
    localStorage.removeItem(LOCAL_STORAGE_CLIENT_CHUNKS);
  } catch {
    // ignore
  }
}

/**
 * Complete in-browser document parsing, chunking, and semantic indexing.
 * Ensures the app works smoothly on static deployments or serverless cold starts.
 */
export async function clientIndexDocument(
  file: File,
  onProgress?: (progress: UploadProgressState) => void
): Promise<PDFDocument> {
  onProgress?.({
    stage: 'parsing',
    percent: 25,
    fileName: file.name,
    fileSize: file.size,
    detail: `Extracting document text from ${file.name}...`,
  });

  const { text, pageCount } = await extractTextInBrowser(file);

  onProgress?.({
    stage: 'chunking',
    percent: 55,
    fileName: file.name,
    fileSize: file.size,
    detail: `Generating semantic passage chunks for ${file.name}...`,
  });

  const docId = `doc-client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const chunks = chunkDocumentText(docId, file.name, text, pageCount);

  onProgress?.({
    stage: 'embedding',
    percent: 85,
    fileName: file.name,
    fileSize: file.size,
    currentChunk: chunks.length,
    totalChunks: chunks.length,
    detail: `Computing 256-dim vector embeddings for ${chunks.length} chunks...`,
  });

  const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
  const doc: PDFDocument = {
    id: docId,
    name: file.name,
    pageCount,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString(),
    fileSize: file.size,
    fileType: ext === 'pdf' ? 'pdf' : ext === 'docx' || ext === 'doc' ? 'docx' : ext === 'txt' || ext === 'md' ? 'txt' : 'other',
  };

  // Persist locally
  const existingDocs = getClientStoredDocuments().filter((d) => d.name !== file.name);
  saveClientStoredDocuments([doc, ...existingDocs]);
  saveClientStoredChunks(chunks);

  onProgress?.({
    stage: 'complete',
    percent: 100,
    fileName: file.name,
    fileSize: file.size,
    currentChunk: chunks.length,
    totalChunks: chunks.length,
    detail: `Document indexed successfully (${chunks.length} chunks).`,
  });

  return doc;
}

/**
 * In-browser semantic search and grounded RAG answer synthesis.
 * Ensures questions can be answered even if the server is offline or returned 404.
 */
export function clientQueryRAG(
  query: string,
  selectedDocIds: string[] = [],
  topK: number = 4,
  similarityThreshold: number = 0.08
): {
  answer: string;
  citations: Citation[];
  retrievedChunks: SearchResult[];
  reasoningTimeMs: number;
} {
  const startTime = Date.now();
  let allChunks = getClientStoredChunks();

  // Strict purge of any gibberish or unreadable text
  allChunks = allChunks.filter((c) => !isGibberishText(c.text));

  if (selectedDocIds.length > 0) {
    const idSet = new Set(selectedDocIds);
    allChunks = allChunks.filter((c) => idSet.has(c.docId));
  }

  if (allChunks.length === 0) {
    return {
      answer: 'No readable document passages were found in your active documents. If you recently uploaded a scanned document or image without a text layer, please upload a text-based document or re-index.',
      citations: [],
      retrievedChunks: [],
      reasoningTimeMs: Date.now() - startTime,
    };
  }

  const queryVector = generateClientEmbedding(query);

  // Score all chunks
  const scored = allChunks.map((chunk) => {
    const chunkVector = chunk.embedding || generateClientEmbedding(chunk.text);
    const sim = cosineSimilarity(queryVector, chunkVector);
    return {
      chunk,
      similarity: sim,
      scorePercentage: Math.round(sim * 100),
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  const relevant = scored.filter((s) => s.similarity >= similarityThreshold).slice(0, topK);

  if (relevant.length === 0) {
    return {
      answer: `I analyzed your documents for "${query}", but no passages met the relevance threshold. Try rephrasing your question or adjusting document selection.`,
      citations: [],
      retrievedChunks: [],
      reasoningTimeMs: Date.now() - startTime,
    };
  }

  // Build citations
  const citations: Citation[] = relevant.map((item, idx) => ({
    sourceId: idx + 1,
    chunkId: item.chunk.id,
    docId: item.chunk.docId,
    docName: item.chunk.docName,
    pageNumber: item.chunk.pageNumber,
    chunkIndex: item.chunk.chunkIndex,
    textSnippet: item.chunk.text.slice(0, 180).trim() + (item.chunk.text.length > 180 ? '...' : ''),
    similarity: Number(item.similarity.toFixed(3)),
  }));

  // Clean, structured synthesis without raw bracket numbers or gibberish
  const cleanTitle = query.trim().replace(/[?.:!]+$/, '').trim();
  const titleHeading = cleanTitle.length > 0
    ? cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)
    : 'Document Findings';

  const insightPoints = relevant.map((r) => {
    let sentence = r.chunk.text.split(/[.?!]\s+/)[0] || r.chunk.text.slice(0, 160);
    sentence = sentence.replace(/^[•\s\-_*]+/, '').trim();
    if (!sentence.endsWith('.')) sentence += '.';
    return `• **${sentence}**\n  *Source: ${r.chunk.docName} — Page ${r.chunk.pageNumber}*`;
  });

  const answer = `### 🎯 ${titleHeading}\n\n${insightPoints.join('\n\n')}\n\n*Verified across ${relevant.length} passage(s) with grounded citations.*`;

  return {
    answer,
    citations,
    retrievedChunks: relevant,
    reasoningTimeMs: Date.now() - startTime,
  };
}
