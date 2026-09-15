import { DocumentChunk, SearchResult } from '../types';

/**
 * Format heading title with proper casing and acronym capitalization.
 */
export function formatHeadingTitle(query: string): string {
  const clean = query.trim().replace(/[?.:!]+$/, '').trim();
  if (!clean) return 'Document Overview';
  const acronyms = new Set([
    'agi', 'ai', 'llm', 'rag', 'os', 'api', 'gpu', 'tpu', 'cpu',
    'iot', 'nlp', 'ml', 'sdg', 'pdf', 'swe', 'mmlu', 'gaia', 'arc'
  ]);
  const words = clean.split(/\s+/).map((w, idx) => {
    const lower = w.toLowerCase();
    if (acronyms.has(lower)) return lower.toUpperCase();
    if (idx === 0) return w.charAt(0).toUpperCase() + w.slice(1);
    return w;
  });
  return words.join(' ');
}

/**
 * Strips all bracket numbers, parenthetical source locations, page references,
 * document headers, and robotic boilerplate from the synthesized answer text.
 */
export function cleanAnswerText(rawAnswer: string): string {
  if (!rawAnswer) return '';

  let text = rawAnswer.trim();

  // Strip robotic boilerplate introductions while preserving paragraph separation
  const boilerplateRegex = /(?:^|\n\n?)\s*(?:based on (?:the )?(?:provided|uploaded|given|active)?\s*(?:documents?|context|files?|sources?|passages?)|according to (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|from (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as per (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as stated in (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|in (?:the )?(?:provided|uploaded|given)\s*(?:documents?|context|files?|sources?)|here are the core verified facts retrieved[^\n:]*[:.]?)[,\s:]*/gi;
  text = text.replace(boilerplateRegex, match => (match.startsWith('\n') ? '\n\n' : ''));

  // Strip parenthetical sources and page number references:
  // e.g. "(Source: AGI_10_Page_Report.pdf — Page 1)", "(source : agi_10 page report_page 1)", "(Page 1 of 10)", "(Page 2)"
  text = text.replace(/\s*\(\s*(?:source\s*:|ref\s*:)[^)]*\)/gi, '');
  text = text.replace(/\s*\(\s*Page\s*\d+(?:\s*(?:of|—|-)\s*\d+)?\s*\)/gi, '');
  text = text.replace(/\s*—\s*Page\s*\d+\b/gi, '');
  text = text.replace(/\s*\*\(Source:[^)]*\)\*/gi, '');
  text = text.replace(/\s*\*Source:[^*]*\*/gi, '');
  text = text.replace(/\s*\*Verified across \d+ passage\(s\)[^*]*\*/gi, '');

  // Strip bracket citations like [1], [4], [1, 4], [1, 2, 3]
  text = text.replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '');

  // Fix punctuation spacing resulting from removals
  text = text.replace(/\s+([.,;:!?])/g, '$1');

  // Strip raw document banners / headers that might have leaked into sentences
  text = text.replace(/(?:^|\n)Document ID:\s*[A-Z0-9_-]+[^\n]*/gi, '');
  text = text.replace(/(?:^|\n)Classification:\s*[A-Z0-9_\s-]+[^\n]*/gi, '');
  text = text.replace(/(?:^|\n)\(Page\s*\d+\s*of\s*\d+\)[^\n]*/gi, '');

  // Normalize bullet points (ensuring bold ** is never corrupted)
  text = text.replace(/^[•🔹\-]\s+[•🔹\-]\s+/gm, '• ');
  text = text.replace(/^[*]\s+[*]\s+/gm, '• ');
  text = text.replace(/^[🔹\-]\s+/gm, '• ');
  text = text.replace(/^[*]\s+/gm, '• ');
  text = text.replace(/([.!?])\s+[•🔹]\s+/g, '$1\n\n• ');
  text = text.replace(/([^\n])\n• /g, '$1\n\n• ');

  // Clean excessive blank lines
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * Filters out document header lines, metadata banners, page number stamps,
 * and delimiter noise from raw chunk text.
 */
export function sanitizeChunkText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText
    .replace(/(?:^|\n)\s*Artificial General Intelligence \(AGI\) - [^\n]*/gi, '')
    .replace(/&?\s*(?:Comprehensive\s+)?(?:Research\s+&?\s+)?Strategic\s+Assessment\s+Report/gi, '')
    .replace(/Document ID:\s*[A-Z0-9_-]+/gi, '')
    .replace(/Classification:\s*[A-Z0-9_\s-]+/gi, '')
    .replace(/\(Page\s*\d+\s*(?:of|—|-)\s*\d+\)/gi, '')
    .replace(/\(Page\s*\d+\)/gi, '')
    .replace(/(?:^|\n)\s*Section\s*\d+:[^\n]*(?:\n|$)/gi, '\n')
    .replace(/^[|—–-]{2,}/gm, '')
    .replace(/\s*\|\s*/g, ' ');

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return false;
      if (/^document id\s*:/i.test(line)) return false;
      if (/^classification\s*:/i.test(line)) return false;
      if (/^\(page\s*\d+\s*of\s*\d+\)$/i.test(line)) return false;
      if (/page\s*\d+\s*of\s*\d+/i.test(line) && line.length < 80) return false;
      if (/^[-=_*]{3,}$/.test(line)) return false;
      if (/^\|\s*[-:]+\s*\|/.test(line)) return false;
      return true;
    })
    .join('\n');
}

/**
 * Clean up header titles or section names before a definition statement.
 */
function cleanHeadersBeforeSentence(s: string): string {
  return s
    .replace(/(?:^|\n|\|)\s*(?:\d+[.)]|\:)?\s*(?:Foundational\s+)?(?:Definition|Taxonomy|Overview|Background|Architecture|Specification)\s*(?:&|and)?\s*(?:Definition|Taxonomy|Overview)?/gi, '')
    .replace(/^[:|\s—–-]+/, '')
    .trim();
}

/**
 * Extract clean definition paragraph with bolded term.
 */
function extractLeadingDefinition(text: string): string {
  let res = cleanHeadersBeforeSentence(text);
  const defIndex = res.search(/\b(?:refers to|is defined as|is an? autonomous|is a synthetic|denotes|represents)\b/i);
  if (defIndex > 0) {
    const before = res.slice(0, defIndex);
    const matchSubject = before.match(/([A-Z][A-Za-z0-9\s()—–-]{2,60})$/);
    if (matchSubject) {
      const subject = matchSubject[1].trim();
      const rest = res.slice(defIndex).trim();
      return `**${subject}** ${rest}`;
    }
  }
  return res;
}

/**
 * Intelligent semantic synthesis engine.
 * Generates rich, direct, human-quality answers and summaries from retrieved document chunks,
 * ensuring ZERO page numbers or "(Source: ...)" locations in the answer text.
 */
export function synthesizeDocumentAnswer(params: {
  query: string;
  relevantChunks: SearchResult[];
  allDocChunks?: DocumentChunk[];
  isPrecise?: boolean;
  docNames?: string[];
}): string {
  const { query, relevantChunks, allDocChunks = [], isPrecise = false } = params;

  if (relevantChunks.length === 0) {
    return `No direct passages matched "${query}" in your active document. Try rephrasing your search terms or lowering the similarity threshold in settings.`;
  }

  const queryLower = query.toLowerCase().trim();
  const headingTitle = formatHeadingTitle(query);

  // Determine query intent
  const isSummaryQuery = /\b(summarize|summary|overview|about|tldr|takeaways|synopsis|review)\b/i.test(queryLower);
  const isDefinitionQuery = /\b(what is|what are|define|definition|explain|meaning of|who is)\b/i.test(queryLower);
  const isComparisonQuery = /\b(difference|compare|versus|vs|comparison)\b/i.test(queryLower);

  // Candidate chunks pool: relevant chunks plus other chunks from the same document if available
  const candidateChunks = (allDocChunks && allDocChunks.length > 0)
    ? allDocChunks
    : relevantChunks.map(r => r.chunk);

  // Collect clean texts from relevant chunks
  const cleanedChunks = relevantChunks.map(r => ({
    ...r,
    cleanText: sanitizeChunkText(r.chunk.text),
  }));

  // Helper to extract clean paragraphs
  const extractParagraphs = (text: string): string[] => {
    return text
      .split(/\n\s*\n/)
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length >= 35 && !p.startsWith('#') && !p.startsWith('|'));
  };

  // Helper to extract bullet / numbered items even if formatted inline or with numbers
  const extractListItems = (text: string): { title: string; body: string }[] => {
    const items: { title: string; body: string }[] = [];
    const parts = text.split(/(?=\b\d+[.)]\s+[A-Za-z])|(?:\n\s*[-•*]\s+)/);

    for (const part of parts) {
      const match = part.trim().match(/^(?:(?:\d+[.)])|[-•*])?\s*([A-Za-z0-9\s&/-]{2,45}):\s+([\s\S]+)$/);
      if (match) {
        const title = match[1].replace(/^[•\-*\d.)\s]+/, '').trim();
        const body = match[2].replace(/\s+/g, ' ').trim();
        if (title.length > 2 && body.length > 8 && !/^(page|document id|classification|section)/i.test(title)) {
          items.push({ title, body });
        }
      }
    }
    return items;
  };

  // ---------------------------------------------------------------------------
  // 1. Precise Output Mode (2-3 crisp, high-density bullet points)
  // ---------------------------------------------------------------------------
  if (isPrecise) {
    const bullets: string[] = [];

    // If definition query, lead with definition statement
    if (isDefinitionQuery || isComparisonQuery) {
      for (const c of cleanedChunks) {
        const paras = extractParagraphs(c.cleanText);
        for (const p of paras) {
          if (/\b(refers to|is defined as|is an? autonomous|is a synthetic|denotes|represents|is a deterministic)\b/i.test(p)) {
            const defText = extractLeadingDefinition(p);
            const firstSentence = defText.split(/(?<=[.!?])\s+/)[0] || defText;
            bullets.push(`• ${firstSentence.trim()}`);
            break;
          }
        }
        if (bullets.length > 0) break;
      }
    }

    // Check for structured list items
    for (const c of cleanedChunks) {
      const listItems = extractListItems(c.cleanText);
      for (const item of listItems) {
        bullets.push(`• **${item.title}**: ${item.body}`);
        if (bullets.length >= 3) break;
      }
      if (bullets.length >= 3) break;
    }

    // If fewer than 3, extract core sentences from paragraphs
    if (bullets.length < 2) {
      for (const c of cleanedChunks) {
        const paras = extractParagraphs(c.cleanText);
        for (const p of paras) {
          const sentences = p.split(/(?<=[.!?])\s+/).filter(s => s.length >= 30);
          for (const s of sentences) {
            let sent = s.trim();
            if (!/[.!?]$/.test(sent)) sent += '.';
            if (!bullets.some(b => b.includes(sent.slice(0, 30)))) {
              bullets.push(`• ${sent}`);
              if (bullets.length >= 3) break;
            }
          }
          if (bullets.length >= 3) break;
        }
        if (bullets.length >= 3) break;
      }
    }

    const bulletOutput = bullets.slice(0, 3).join('\n\n');
    return cleanAnswerText(`### 🎯 ${headingTitle}\n\n${bulletOutput}`);
  }

  // ---------------------------------------------------------------------------
  // 2. Summary Query Intent ("Summarize the PDF", "Overview", etc.)
  // ---------------------------------------------------------------------------
  if (isSummaryQuery) {
    const docName = relevantChunks[0]?.chunk.docName || 'Document';
    const cleanDocName = docName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    const keyPoints: string[] = [];
    const seenPoints = new Set<string>();

    for (const chunk of candidateChunks.slice(0, 10)) {
      const clean = sanitizeChunkText(chunk.text);
      const paras = extractParagraphs(clean);
      const listItems = extractListItems(clean);

      // Add significant list items
      for (const item of listItems.slice(0, 2)) {
        const key = item.title.toLowerCase();
        if (!seenPoints.has(key)) {
          seenPoints.add(key);
          keyPoints.push(`• **${item.title}**: ${item.body}`);
        }
        if (keyPoints.length >= 6) break;
      }

      // Add core paragraph sentences if still need highlights
      if (keyPoints.length < 4 && paras.length > 0) {
        const firstSent = paras[0].split(/(?<=[.!?])\s+/)[0]?.trim();
        if (firstSent && firstSent.length > 40 && !seenPoints.has(firstSent.slice(0, 30).toLowerCase())) {
          seenPoints.add(firstSent.slice(0, 30).toLowerCase());
          keyPoints.push(`• ${firstSent}`);
        }
      }
      if (keyPoints.length >= 6) break;
    }

    // Lead overview paragraph
    const firstChunkText = sanitizeChunkText(candidateChunks[0]?.text || relevantChunks[0]?.chunk.text || '');
    const initialParas = extractParagraphs(firstChunkText);
    const overviewPara = initialParas[0]
      ? extractLeadingDefinition(initialParas[0])
      : `This document outlines comprehensive frameworks, technical specifications, and key findings for **${cleanDocName}**.`;

    let summaryText = `### 📋 Executive Summary: ${cleanDocName}\n\n${overviewPara}\n\n#### Key Findings & Core Highlights\n\n${keyPoints.slice(0, 5).join('\n\n')}`;

    // Add conclusion or metrics if available in later chunks
    if (candidateChunks.length > 2) {
      const lastChunk = candidateChunks[candidateChunks.length - 1];
      const lastParas = extractParagraphs(sanitizeChunkText(lastChunk.text));
      if (lastParas.length > 0) {
        summaryText += `\n\n#### Strategic Outlook & Conclusions\n\n${lastParas[lastParas.length - 1]}`;
      }
    }

    return cleanAnswerText(summaryText);
  }

  // ---------------------------------------------------------------------------
  // 3. Definition / "What is" Query Intent (e.g. "What is AGI", "What is Quantum OS")
  // ---------------------------------------------------------------------------
  if (isDefinitionQuery || isComparisonQuery) {
    let definitionParagraph = '';
    const structuredAttributes: { title: string; body: string }[] = [];
    const architecturalDetails: { title: string; body: string }[] = [];

    // Search for explicit definition sentence across cleaned chunks AND candidate chunks
    const allSearchChunks = [
      ...cleanedChunks.map(c => c.cleanText),
      ...candidateChunks.slice(0, 6).map(c => sanitizeChunkText(c.text))
    ];

    for (const chunkText of allSearchChunks) {
      const paras = extractParagraphs(chunkText);
      for (const p of paras) {
        if (
          /\b(refers to|is defined as|is an? autonomous|is a synthetic|denotes|represents|is a deterministic)\b/i.test(p) &&
          !definitionParagraph
        ) {
          definitionParagraph = extractLeadingDefinition(p);
          break;
        }
      }

      // Collect structured attributes or list items
      const items = extractListItems(chunkText);
      for (const item of items) {
        if (/attribute|cognitive|capability|generalization|learning|humility|goal/i.test(item.title + ' ' + item.body)) {
          if (!structuredAttributes.some(a => a.title === item.title)) {
            structuredAttributes.push(item);
          }
        } else {
          if (!architecturalDetails.some(a => a.title === item.title)) {
            architecturalDetails.push(item);
          }
        }
      }
    }

    // If no explicit definition paragraph was matched, use top paragraph from highest-ranked chunk
    if (!definitionParagraph) {
      const topParas = extractParagraphs(cleanedChunks[0].cleanText);
      definitionParagraph = topParas[0]
        ? extractLeadingDefinition(topParas[0])
        : cleanedChunks[0].cleanText.slice(0, 300);
    }

    // Format synthesized answer
    let response = `### 🤖 ${headingTitle}\n\n${definitionParagraph}`;

    if (structuredAttributes.length > 0) {
      response += `\n\n#### Core Cognitive Attributes & Capabilities\n\n` +
        structuredAttributes.slice(0, 4).map(a => `• **${a.title}**: ${a.body}`).join('\n\n');
    }

    if (architecturalDetails.length > 0) {
      const sectionName = architecturalDetails.some(a => /system|search|compute|hardware|expert|moe|model/i.test(a.title))
        ? 'Architectural Foundations & Deliberation'
        : 'Key Technical Specifications & Mechanisms';
      response += `\n\n#### ${sectionName}\n\n` +
        architecturalDetails.slice(0, 4).map(a => `• **${a.title}**: ${a.body}`).join('\n\n');
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 4. General / Specific Factual Q&A Intent
  // ---------------------------------------------------------------------------
  const topChunk = cleanedChunks[0];
  const paras = extractParagraphs(topChunk.cleanText);
  const listItems = extractListItems(topChunk.cleanText);

  let mainBody = '';

  if (paras.length > 0) {
    mainBody = paras[0];
    if (paras.length > 1 && paras[1].length > 40) {
      mainBody += `\n\n${paras[1]}`;
    }
  } else {
    mainBody = topChunk.cleanText.slice(0, 400);
  }

  let finalResponse = `### 📌 ${headingTitle}\n\n${mainBody}`;

  if (listItems.length > 0) {
    finalResponse += `\n\n#### Key Details & Metrics\n\n` +
      listItems.slice(0, 4).map(item => `• **${item.title}**: ${item.body}`).join('\n\n');
  } else if (cleanedChunks.length > 1) {
    const secondaryParas = extractParagraphs(cleanedChunks[1].cleanText);
    if (secondaryParas.length > 0 && secondaryParas[0] !== paras[0]) {
      finalResponse += `\n\n#### Additional Findings\n\n${secondaryParas[0]}`;
    }
  }

  return cleanAnswerText(finalResponse);
}
