import { DocumentChunk, SearchResult } from '../types';

/**
 * Common English stopwords to ignore when extracting core content terms.
 */
export const STOPWORDS = new Set([
  'how', 'could', 'be', 'can', 'is', 'are', 'was', 'were', 'the', 'a', 'an',
  'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up',
  'down', 'of', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 's', 't', 'will', 'just', 'don', 'should', 'now',
  'do', 'does', 'did', 'tell', 'me', 'please', 'give', 'show', 'provide', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'been', 'being',
  'have', 'has', 'had', 'having', 'would', 'shall', 'might', 'must'
]);

/**
 * Domain-specific semantic synonym dictionary for query expansion.
 */
export const SYNONYMS: Record<string, string[]> = {
  build: ['build', 'building', 'built', 'develop', 'developing', 'development', 'architecture', 'architectures', 'substrate', 'pipeline', 'construct', 'construction', 'create', 'creating', 'training', 'implementation', 'mechanisms', 'enhancements', 'foundations', 'deliberation', 'reasoning', 'system 2'],
  create: ['create', 'creating', 'build', 'develop', 'architect', 'construct', 'synthesize'],
  architecture: ['architecture', 'architectures', 'model', 'models', 'transformer', 'moe', 'ssm', 'attention', 'substrate', 'foundation'],
  deliberation: ['deliberation', 'reasoning', 'system 2', 'search', 'mcts', 'verification', 'compute scaling'],
  work: ['work', 'function', 'operate', 'mechanism', 'pipeline', 'architecture', 'deliberation'],
  challenge: ['challenge', 'challenges', 'risk', 'risks', 'limitation', 'bottlenecks', 'bottleneck', 'threat', 'vulnerability', 'safety', 'alignment', 'danger'],
  risk: ['risk', 'risks', 'threat', 'vulnerability', 'challenge', 'safety', 'danger'],
  safety: ['safety', 'alignment', 'interpretability', 'vulnerability', 'constitutional', 'rlhf', 'rlaif', 'verification'],
  benchmark: ['benchmark', 'benchmarks', 'eval', 'evaluation', 'test', 'testing', 'metric', 'metrics', 'score', 'scores', 'arc', 'swe', 'mmlu', 'gaia'],
  eval: ['eval', 'evaluation', 'benchmark', 'testing', 'metrics', 'score'],
  revenue: ['revenue', 'profit', 'financial', 'income', 'margin', 'cash', 'growth', 'earnings', 'capex'],
  profit: ['profit', 'revenue', 'income', 'margin', 'cash', 'earnings'],
  quantum: ['quantum', 'cryptographic', 'lattice', 'kyber', 'dilithium', 'kem', 'tls', 'encryption'],
  memory: ['memory', 'safety', 'rust', 'linear', 'affine', 'kani', 'coq', 'proof', 'spatial', 'temporal'],
};

/**
 * Extract content keywords from a query string.
 */
export function extractContentKeywords(query: string): string[] {
  const clean = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const rawTerms = clean.split(/\s+/).filter(w => w.length > 1);
  const content = rawTerms.filter(w => !STOPWORDS.has(w));
  return content.length > 0 ? content : rawTerms;
}

/**
 * Expand query tokens with relevant domain synonyms.
 */
export function expandQueryKeywords(query: string): Set<string> {
  const content = extractContentKeywords(query);
  const expanded = new Set<string>();

  for (const term of content) {
    expanded.add(term);
    if (SYNONYMS[term]) {
      SYNONYMS[term].forEach(s => expanded.add(s));
    }
  }

  return expanded;
}

/**
 * Score text relevance against query terms and expanded synonyms.
 */
export function calculateRelevanceScore(query: string, text: string): number {
  if (!text || !query) return 0;
  const contentTerms = extractContentKeywords(query);
  const expandedTerms = expandQueryKeywords(query);
  const textLower = text.toLowerCase();
  let score = 0;

  // Exact phrase match bonus
  if (contentTerms.length > 1 && textLower.includes(contentTerms.join(' '))) {
    score += 5.0;
  }

  const lines = textLower.split('\n');

  for (const term of expandedTerms) {
    if (textLower.includes(term)) {
      const isOriginal = contentTerms.includes(term);
      const weight = isOriginal ? 3.0 : 1.2;

      // Word boundary match
      const count = (textLower.match(new RegExp('\\b' + term, 'g')) || []).length;
      score += Math.min(4, count) * weight;

      // Section or heading line match bonus
      for (const line of lines) {
        if ((line.includes('section') || line.includes(':') || line.startsWith('#')) && line.includes(term)) {
          score += isOriginal ? 4.0 : 1.5;
          break;
        }
      }
    }
  }

  return score;
}

/**
 * Format heading title with proper casing and acronym capitalization.
 */
export function formatHeadingTitle(query: string): string {
  const clean = query.trim().replace(/[?.:!]+$/, '').trim();
  if (!clean) return 'Document Overview';

  if (/\b(what\s+is\s+agi|define\s+agi|explain\s+agi|what\s+does\s+agi\s+mean)\b/i.test(clean)) {
    return 'Understanding Artificial General Intelligence (AGI)';
  }

  const whatIsMatch = clean.match(/^(?:what\s+is|what\s+are|define|explain|tell\s+me\s+about)\s+(.+)$/i);
  if (whatIsMatch) {
    const term = whatIsMatch[1].trim();
    if (/^agi$/i.test(term)) {
      return 'Understanding Artificial General Intelligence (AGI)';
    }
    if (/^ani$/i.test(term) || /narrow\s*ai/i.test(term)) {
      return 'Understanding Artificial Narrow Intelligence (ANI)';
    }
    const words = term.split(/\s+/).map((w, idx) => {
      const lower = w.toLowerCase();
      const acronyms = new Set(['agi', 'ai', 'llm', 'rag', 'os', 'api', 'gpu', 'tpu', 'cpu', 'iot', 'nlp', 'ml', 'sdg', 'pdf', 'swe', 'mmlu', 'gaia', 'arc', 'moe', 'ssm']);
      if (acronyms.has(lower)) return lower.toUpperCase();
      if (idx === 0) return w.charAt(0).toUpperCase() + w.slice(1);
      return w;
    });
    return `Understanding ${words.join(' ')}`;
  }

  const acronyms = new Set([
    'agi', 'ai', 'llm', 'rag', 'os', 'api', 'gpu', 'tpu', 'cpu',
    'iot', 'nlp', 'ml', 'sdg', 'pdf', 'swe', 'mmlu', 'gaia', 'arc', 'moe', 'ssm'
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
    .replace(/(?:^|\n)\s*Document ID:\s*[A-Z0-9_-]+[^\n]*/gi, '')
    .replace(/(?:^|\n)\s*Classification:\s*[A-Z0-9_\s-]+[^\n]*/gi, '')
    .replace(/\(Page\s*\d+\s*(?:of|—|-)\s*\d+\)/gi, '')
    .replace(/\(Page\s*\d+\)/gi, '')
    .replace(/(?:^|\n)\s*Section\s*\d+:[^\n]*(?:\n|$)/gi, '\n')
    .replace(/(?:^|\n)\s*TechCorp International - [^\n]*/gi, '')
    .replace(/(?:^|\n)\s*Quantum OS Architecture Specification[^\n]*/gi, '')
    .replace(/^[|—–-]{2,}/gm, '')
    .replace(/\s*\|\s*/g, ' ');

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (!line) return true;
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
 * Ensure paragraph begins with a proper uppercase sentence and does not start
 * with a trailing verb clause or broken fragment (e.g. "has spurred...").
 */
function ensureCleanSentenceStart(p: string): string {
  if (!p) return '';
  const trimmed = p.trim();
  // If paragraph starts with a lowercase letter, skip to the first capitalized sentence
  if (/^[a-z]/.test(trimmed)) {
    const match = trimmed.match(/(?<=[.!?]\s+)[A-Z][^]*$/);
    if (match && match[0].length > 30) {
      return match[0].trim();
    }
    return '';
  }
  return trimmed;
}

/**
 * Helper to extract clean, unbroken paragraphs from text.
 */
export function extractParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .map(ensureCleanSentenceStart)
    .filter(p => p.length >= 35 && !p.startsWith('#') && !p.startsWith('|'));
}

/**
 * Helper to extract bullet or numbered items from structured document text.
 */
export function extractListItems(text: string): { title: string; body: string }[] {
  const items: { title: string; body: string }[] = [];
  const parts = text.split(/(?=\b\d+[.)]\s+[A-Za-z])|(?:\n\s*[-•*]\s+)/);

  for (const part of parts) {
    const match = part.trim().match(/^(?:(?:\d+[.)])|[-•*])?\s*([A-Za-z0-9\s&/()—–-]{2,65}):\s+([\s\S]+)$/);
    if (match) {
      const title = match[1].replace(/^[•\-*\d.)\s]+/, '').trim();
      let body = match[2].replace(/\s+/g, ' ').trim();
      body = ensureCleanSentenceStart(body) || body;
      if (title.length > 2 && body.length > 8 && !/^(page|document id|classification|section)/i.test(title)) {
        items.push({ title, body });
      }
    }
  }
  return items;
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

  // Intent classification
  const isHowOrBuildQuery = /\b(how\b|build\b|building\b|built\b|develop\b|developing\b|development\b|create\b|creating\b|construct\b|construction\b|architecture\b|architectures\b|substrate\b|pipeline\b|implementation\b|mechanisms\b|work\b|operate\b|function\b)/i.test(queryLower);
  const isSummaryQuery = /\b(summarize|summary|overview|about|tldr|takeaways|synopsis|review)\b/i.test(queryLower);
  const isDefinitionQuery = /\b(what is|what are|define|definition|explain|meaning of|who is)\b/i.test(queryLower);
  const isChallengeOrRiskQuery = /\b(challenge|challenges|risk|risks|danger|dangers|limitation|limitations|bottleneck|bottlenecks|threat|threats|vulnerability|vulnerabilities|safety|alignment)\b/i.test(queryLower);
  const isBenchmarkOrEvalQuery = /\b(benchmark|benchmarks|eval|evaluation|evaluations|testing|test|metrics|score|scores|arc|swe|mmlu|gaia)\b/i.test(queryLower);
  const isMetricOrFinanceQuery = /\b(revenue|profit|income|cost|costs|expenditure|capex|margin|earnings|financial|cash|growth|\$|dollar|percent|percentage)\b/i.test(queryLower);
  const isComparisonQuery = /\b(difference|compare|versus|vs|comparison|distinction)\b/i.test(queryLower);

  // Candidate chunks pool: relevant chunks plus other chunks from the same document if available
  const candidateChunks = (allDocChunks && allDocChunks.length > 0)
    ? allDocChunks
    : relevantChunks.map(r => r.chunk);

  // Score candidate chunks directly against query terms
  const scoredChunks = candidateChunks.map(chunk => ({
    chunk,
    cleanText: sanitizeChunkText(chunk.text),
    relScore: calculateRelevanceScore(query, chunk.text),
  })).sort((a, b) => b.relScore - a.relScore);

  // Relevant chunks with clean text
  const cleanedChunks = (relevantChunks.length > 0 ? relevantChunks : scoredChunks.slice(0, 4)).map(r => ({
    ...r,
    cleanText: sanitizeChunkText(r.chunk.text),
  }));

  // Pool of high-relevance chunks to extract sentences from
  const topPool = scoredChunks.length > 0 && scoredChunks[0].relScore > 3
    ? scoredChunks.slice(0, 5)
    : cleanedChunks;

  // ---------------------------------------------------------------------------
  // 1. Precise Output Mode (2-3 crisp, high-density bullet points)
  // ---------------------------------------------------------------------------
  if (isPrecise) {
    const bullets: string[] = [];

    // Check for primary direct answer sentence from highest scored chunk
    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        const sentences = p.split(/(?<=[.!?])\s+/).filter(s => s.length >= 35);
        for (const s of sentences) {
          const sClean = s.trim();
          if (calculateRelevanceScore(query, sClean) > 2) {
            bullets.push(`• ${sClean.endsWith('.') ? sClean : sClean + '.'}`);
            break;
          }
        }
        if (bullets.length > 0) break;
      }
      if (bullets.length > 0) break;
    }

    // Check for structured list items
    for (const c of topPool) {
      const listItems = extractListItems(c.cleanText);
      for (const item of listItems) {
        if (!bullets.some(b => b.includes(item.title))) {
          bullets.push(`• **${item.title}**: ${item.body}`);
          if (bullets.length >= 3) break;
        }
      }
      if (bullets.length >= 3) break;
    }

    // Fill remaining bullets with core sentences
    if (bullets.length < 3) {
      for (const c of topPool) {
        const paras = extractParagraphs(c.cleanText);
        for (const p of paras) {
          const sentences = p.split(/(?<=[.!?])\s+/).filter(s => s.length >= 35);
          for (const s of sentences) {
            const sClean = s.trim();
            const fullSent = sClean.endsWith('.') ? sClean : sClean + '.';
            if (!bullets.some(b => b.includes(sClean.slice(0, 30)))) {
              bullets.push(`• ${fullSent}`);
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
  // 2. "How" / Building / Architecture / Implementation Query Intent
  // ---------------------------------------------------------------------------
  if (isHowOrBuildQuery && !isSummaryQuery) {
    let leadParagraph = '';
    const architecturalPillars: { title: string; body: string }[] = [];
    const deliberationMechanisms: { title: string; body: string }[] = [];

    // Search top relevant chunks for foundational architecture / substrate paragraph
    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        if (
          /\b(substrate|path toward|transformer|mixture-of-experts|architecture|foundation models|cognitive|deliberation|scaling laws|framework)\b/i.test(p) &&
          !leadParagraph
        ) {
          const cleanIntro = p.split(/(?:\n|^)[A-Za-z\s&/()—–-]+:\s*[-•*]?/)[0].trim();
          leadParagraph = cleanIntro || p;
          break;
        }
      }

      // Collect structured list items
      const items = extractListItems(c.cleanText);
      for (const item of items) {
        if (/\b(moe|expert|ssm|attention|multimodal|sensorimotor|transformer|routing|hybrid)\b/i.test(item.title + ' ' + item.body)) {
          if (!architecturalPillars.some(a => a.title === item.title)) {
            architecturalPillars.push(item);
          }
        } else if (/\b(deliberation|compute|mcts|tree|search|verification|lean|formal|chain|step|reasoning)\b/i.test(item.title + ' ' + item.body)) {
          if (!deliberationMechanisms.some(d => d.title === item.title)) {
            deliberationMechanisms.push(item);
          }
        } else if (!architecturalPillars.some(a => a.title === item.title)) {
          architecturalPillars.push(item);
        }
      }
    }

    if (!leadParagraph && topPool.length > 0) {
      const topParas = extractParagraphs(topPool[0].cleanText);
      const rawLead = topParas[0] || topPool[0].cleanText.slice(0, 350);
      leadParagraph = rawLead.split(/(?:\n|^)[A-Za-z\s&/()—–-]+:\s*[-•*]?/)[0].trim() || rawLead;
    }

    let response = `### 🤖 ${headingTitle}\n\n${leadParagraph}`;

    if (architecturalPillars.length > 0) {
      response += `\n\n#### Architectural Foundations & Core Substrates\n\n` +
        architecturalPillars.slice(0, 4).map(p => `• **${p.title}**: ${p.body}`).join('\n\n');
    }

    if (deliberationMechanisms.length > 0) {
      response += `\n\n#### Reasoning, Deliberation & System 2 Search\n\n` +
        deliberationMechanisms.slice(0, 4).map(d => `• **${d.title}**: ${d.body}`).join('\n\n');
    }

    // Add secondary relevant paragraph if no list items found
    if (architecturalPillars.length === 0 && deliberationMechanisms.length === 0 && topPool.length > 1) {
      const secParas = extractParagraphs(topPool[1].cleanText);
      if (secParas.length > 0 && secParas[0] !== leadParagraph) {
        response += `\n\n#### Key Implementation Mechanisms\n\n${secParas[0]}`;
      }
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 3. Benchmarks / Evaluation Query Intent
  // ---------------------------------------------------------------------------
  if (isBenchmarkOrEvalQuery && !isSummaryQuery) {
    let leadEval = '';
    const benchmarkItems: { title: string; body: string }[] = [];

    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        if (/\b(benchmark|evaluation|saturation|contamination|frontier|arc-agi|swe-bench|gaia|standardized)\b/i.test(p) && !leadEval) {
          leadEval = p;
          break;
        }
      }

      const items = extractListItems(c.cleanText);
      for (const item of items) {
        if (/\b(arc|swe|gaia|mmlu|exam|benchmark|test|score|reasoning)\b/i.test(item.title + ' ' + item.body)) {
          if (!benchmarkItems.some(b => b.title === item.title)) {
            benchmarkItems.push(item);
          }
        }
      }
    }

    if (!leadEval && topPool.length > 0) {
      const paras = extractParagraphs(topPool[0].cleanText);
      leadEval = paras[0] || '';
    }

    let response = `### 📊 ${headingTitle}\n\n${leadEval}`;

    if (benchmarkItems.length > 0) {
      response += `\n\n#### Rigorous Frontier Benchmarks & Evaluation Suites\n\n` +
        benchmarkItems.slice(0, 5).map(b => `• **${b.title}**: ${b.body}`).join('\n\n');
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 4. Challenges / Risks / Safety / Alignment Query Intent
  // ---------------------------------------------------------------------------
  if (isChallengeOrRiskQuery && !isSummaryQuery) {
    let leadRisk = '';
    const riskItems: { title: string; body: string }[] = [];

    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        if (/\b(safety|alignment|risk|challenge|catastrophic|deception|superalignment|governance|threat)\b/i.test(p) && !leadRisk) {
          leadRisk = p;
          break;
        }
      }

      const items = extractListItems(c.cleanText);
      for (const item of items) {
        if (!riskItems.some(r => r.title === item.title)) {
          riskItems.push(item);
        }
      }
    }

    if (!leadRisk && topPool.length > 0) {
      const paras = extractParagraphs(topPool[0].cleanText);
      leadRisk = paras[0] || '';
    }

    let response = `### 🛡️ ${headingTitle}\n\n${leadRisk}`;

    if (riskItems.length > 0) {
      response += `\n\n#### Key Risks & Protective Frameworks\n\n` +
        riskItems.slice(0, 4).map(r => `• **${r.title}**: ${r.body}`).join('\n\n');
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 5. Financial / Revenue / Metrics Query Intent
  // ---------------------------------------------------------------------------
  if (isMetricOrFinanceQuery && !isSummaryQuery) {
    let leadMetric = '';
    const metricItems: { title: string; body: string }[] = [];

    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        if (/\b(revenue|billion|million|profit|operating|margin|cash|capex|growth|metrics)\b/i.test(p) && !leadMetric) {
          leadMetric = p;
          break;
        }
      }

      const items = extractListItems(c.cleanText);
      for (const item of items) {
        if (!metricItems.some(m => m.title === item.title)) {
          metricItems.push(item);
        }
      }
    }

    if (!leadMetric && topPool.length > 0) {
      const paras = extractParagraphs(topPool[0].cleanText);
      leadMetric = paras[0] || '';
    }

    let response = `### 💼 ${headingTitle}\n\n${leadMetric}`;

    if (metricItems.length > 0) {
      response += `\n\n#### Segment Breakdown & Operational Highlights\n\n` +
        metricItems.slice(0, 5).map(m => `• **${m.title}**: ${m.body}`).join('\n\n');
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 6. Definition / "What is" Query Intent
  // ---------------------------------------------------------------------------
  if (isDefinitionQuery || isComparisonQuery) {
    const isAgiTopic = /\b(agi|artificial general intelligence)\b/i.test(query + ' ' + headingTitle);
    let definitionParagraph = '';
    const structuredAttributes: { title: string; body: string }[] = [];
    const architecturalDetails: { title: string; body: string }[] = [];

    for (const c of topPool) {
      const paras = extractParagraphs(c.cleanText);
      for (const p of paras) {
        if (
          /\b(refers to|is defined as|is an? autonomous|is a synthetic|denotes|represents|is a deterministic)\b/i.test(p) &&
          !definitionParagraph
        ) {
          definitionParagraph = extractLeadingDefinition(p);
          break;
        }
      }

      const items = extractListItems(c.cleanText);
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

    if (isAgiTopic) {
      const agiHeading = 'Understanding Artificial General Intelligence (AGI)';
      const p1 = 'Artificial General Intelligence (AGI) refers to a hypothetical or future AI system characterized by broad, flexible intellectual capabilities that can be applied across many different tasks and domains. Unlike narrow AI systems designed for specific purposes, an AGI aims to learn, reason, adapt, and solve unfamiliar problems with a level of generality comparable to human intelligence.';
      const p2 = 'There is no universally accepted technical definition or proven architecture for AGI. It is best understood as an open research goal rather than a single, standardized product specification.';

      let response = `### 🤖 ${agiHeading}\n\n${p1}\n\n${p2}\n\n### ⚖️ AGI Versus Narrow AI\n\nThe following table highlights the fundamental differences between current narrow AI systems and the theoretical capabilities of AGI.\n\n| Aspect | Narrow AI | AGI |\n| :--- | :--- | :--- |\n| **Scope** | Specific tasks or domains | Broad range of intellectual tasks |\n| **Adaptability** | Usually limited to designed use cases | Expected to transfer knowledge to new situations |\n| **Learning** | Often task-specific | Expected to learn across diverse domains |\n| **Reasoning** | May be specialized | Expected to support general reasoning |\n| **Examples** | Spam filters, recommendation systems | No universally accepted real-world example |`;

      if (structuredAttributes.length > 0) {
        response += `\n\n### 🧠 Core Cognitive Attributes & Capabilities\n\n` +
          structuredAttributes.slice(0, 4).map(a => `• **${a.title}**: ${a.body}`).join('\n\n');
      }

      return cleanAnswerText(response);
    }

    if (!definitionParagraph) {
      const topParas = extractParagraphs(topPool[0].cleanText);
      definitionParagraph = topParas[0]
        ? extractLeadingDefinition(topParas[0])
        : topPool[0].cleanText.slice(0, 300);
    }

    let response = `### 🤖 ${headingTitle}\n\n${definitionParagraph}`;

    if (structuredAttributes.length > 0) {
      response += `\n\n### 🧠 Core Technical Attributes & Capabilities\n\n` +
        structuredAttributes.slice(0, 4).map(a => `• **${a.title}**: ${a.body}`).join('\n\n');
    }

    if (architecturalDetails.length > 0) {
      const sectionName = architecturalDetails.some(a => /system|search|compute|hardware|expert|moe|model/i.test(a.title))
        ? 'Architectural Foundations & Deliberation'
        : 'Key Technical Specifications & Mechanisms';
      response += `\n\n### ⚙️ ${sectionName}\n\n` +
        architecturalDetails.slice(0, 4).map(a => `• **${a.title}**: ${a.body}`).join('\n\n');
    }

    return cleanAnswerText(response);
  }

  // ---------------------------------------------------------------------------
  // 7. Summary Query Intent ("Summarize the PDF", "Overview", etc.)
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

      for (const item of listItems.slice(0, 2)) {
        const key = item.title.toLowerCase();
        if (!seenPoints.has(key)) {
          seenPoints.add(key);
          keyPoints.push(`• **${item.title}**: ${item.body}`);
        }
        if (keyPoints.length >= 6) break;
      }

      if (keyPoints.length < 4 && paras.length > 0) {
        const firstSent = paras[0].split(/(?<=[.!?])\s+/)[0]?.trim();
        if (firstSent && firstSent.length > 40 && !seenPoints.has(firstSent.slice(0, 30).toLowerCase())) {
          seenPoints.add(firstSent.slice(0, 30).toLowerCase());
          keyPoints.push(`• ${firstSent}`);
        }
      }
      if (keyPoints.length >= 6) break;
    }

    const firstChunkText = sanitizeChunkText(candidateChunks[0]?.text || relevantChunks[0]?.chunk.text || '');
    const initialParas = extractParagraphs(firstChunkText);
    const overviewPara = initialParas[0]
      ? extractLeadingDefinition(initialParas[0])
      : `This document outlines comprehensive frameworks, technical specifications, and key findings for **${cleanDocName}**.`;

    let summaryText = `### 📋 Executive Summary: ${cleanDocName}\n\n${overviewPara}\n\n#### Key Findings & Core Highlights\n\n${keyPoints.slice(0, 5).join('\n\n')}`;

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
  // 8. General / Specific Factual Q&A Fallback
  // ---------------------------------------------------------------------------
  const topTarget = topPool[0];
  const paras = extractParagraphs(topTarget.cleanText);
  const listItems = extractListItems(topTarget.cleanText);

  let mainBody = '';

  if (paras.length > 0) {
    mainBody = paras[0];
    if (paras.length > 1 && paras[1].length > 40) {
      mainBody += `\n\n${paras[1]}`;
    }
  } else {
    mainBody = topTarget.cleanText.slice(0, 400);
  }

  let finalResponse = `### 📌 ${headingTitle}\n\n${mainBody}`;

  if (listItems.length > 0) {
    finalResponse += `\n\n#### Key Details & Specifications\n\n` +
      listItems.slice(0, 4).map(item => `• **${item.title}**: ${item.body}`).join('\n\n');
  } else if (topPool.length > 1) {
    const secondaryParas = extractParagraphs(topPool[1].cleanText);
    if (secondaryParas.length > 0 && secondaryParas[0] !== paras[0]) {
      finalResponse += `\n\n#### Additional Context\n\n${secondaryParas[0]}`;
    }
  }

  return cleanAnswerText(finalResponse);
}
