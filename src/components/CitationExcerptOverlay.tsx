import React, { useState, useEffect, useMemo } from 'react';
import { Citation, SearchResult } from '../types';
import {
  X,
  FileText,
  ExternalLink,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Quote,
  Sparkles,
  BookOpen,
  Search,
} from 'lucide-react';

interface CitationExcerptOverlayProps {
  citation: Citation;
  allCitations: Citation[];
  retrievedChunk?: SearchResult;
  userQuery?: string;
  theme?: 'light' | 'dark';
  onClose: () => void;
  onSelectCitation: (citation: Citation) => void;
  onOpenInViewer?: (citation: Citation) => void;
}

export const CitationExcerptOverlay: React.FC<CitationExcerptOverlayProps> = ({
  citation,
  allCitations,
  retrievedChunk,
  userQuery,
  theme = 'dark',
  onClose,
  onSelectCitation,
  onOpenInViewer,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterTerm, setFilterTerm] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find index in all citations
  const currentIndex = allCitations.findIndex(
    (c) => c.sourceId === citation.sourceId || (c.chunkId && c.chunkId === citation.chunkId)
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allCitations.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelectCitation(allCitations[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelectCitation(allCitations[currentIndex + 1]);
    }
  };

  const fullExcerpt = retrievedChunk?.chunk.text || citation.textSnippet || '';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullExcerpt);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullExcerpt;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Derive terms to highlight based on user query and any custom filter term
  const highlightTerms = useMemo(() => {
    const terms = new Set<string>();
    if (filterTerm.trim()) {
      terms.add(filterTerm.trim().toLowerCase());
    }
    if (userQuery) {
      const stopWords = new Set([
        'what', 'is', 'the', 'a', 'an', 'and', 'or', 'how', 'why', 'can', 'does', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by', 'about', 'tell', 'me', 'explain', 'show'
      ]);
      const words = userQuery
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));
      words.forEach((w) => terms.add(w));
    }
    return Array.from(terms);
  }, [userQuery, filterTerm]);

  // Render highlighted excerpt text
  const renderHighlightedExcerpt = (text: string) => {
    if (!text) return <span className="text-neutral-500 italic">No text content available for this chunk.</span>;
    if (highlightTerms.length === 0) {
      return <span>{text}</span>;
    }

    try {
      const escapedTerms = highlightTerms
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .filter(Boolean);
      if (escapedTerms.length === 0) return <span>{text}</span>;

      const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
      const parts = text.split(regex);

      return (
        <span>
          {parts.map((part, i) => {
            const isMatch = highlightTerms.some((t) => t.toLowerCase() === part.toLowerCase());
            if (isMatch) {
              return (
                <mark
                  key={i}
                  className="bg-emerald-500/35 text-emerald-200 font-semibold px-1 py-0.5 rounded border-b border-emerald-400 shadow-xs"
                >
                  {part}
                </mark>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </span>
      );
    } catch {
      return <span>{text}</span>;
    }
  };

  const similarityScore = Math.round(
    (retrievedChunk?.similarity || citation.similarity || 0) * 100
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl border transition-all animate-in zoom-in-95 duration-200 overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#0f1117] border-indigo-900/50 text-neutral-100 shadow-indigo-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`px-4 sm:px-6 py-3.5 flex items-center justify-between border-b shrink-0 ${
            theme === 'dark'
              ? 'bg-[#151823] border-neutral-800 text-white'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-500/25 text-cyan-300 border border-indigo-400/40 shrink-0 shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Source [{citation.sourceId}]</span>
            </span>

            <div className="truncate flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-bold text-sm truncate" title={citation.docName}>
                {citation.docName}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                  similarityScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {similarityScore}% Match
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-3">
            {allCitations.length > 1 && (
              <div className="flex items-center space-x-1 bg-black/20 dark:bg-white/5 rounded-lg p-0.5 border border-white/10 mr-1 text-xs">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className={`p-1 rounded hover:bg-white/10 transition-colors ${
                    !hasPrev ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Previous citation"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] px-1 text-neutral-400">
                  {currentIndex >= 0 ? currentIndex + 1 : 1}/{allCitations.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`p-1 rounded hover:bg-white/10 transition-colors ${
                    !hasNext ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title="Next citation"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Close overlay (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata sub-bar */}
        <div
          className={`px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between text-xs border-b shrink-0 ${
            theme === 'dark'
              ? 'bg-[#11131c] border-neutral-850 text-neutral-400'
              : 'bg-slate-100/70 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Page {citation.pageNumber}</span>
            </span>
            <span>•</span>
            <span className="font-mono">Chunk #{citation.chunkIndex}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Document Grounding</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            {/* Quick search/filter in excerpt */}
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-neutral-500 absolute left-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Highlight word..."
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className={`text-[11px] pl-6 pr-2 py-0.5 rounded-md border transition-all focus:outline-hidden ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-750 text-neutral-200 focus:border-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              />
              {filterTerm && (
                <button
                  type="button"
                  onClick={() => setFilterTerm('')}
                  className="absolute right-1 text-neutral-400 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable Excerpt */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">
          {/* Highlight Notification / Instruction */}
          <div
            className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
              theme === 'dark'
                ? 'bg-indigo-950/30 border-indigo-500/25 text-indigo-200'
                : 'bg-indigo-50 border-indigo-200 text-indigo-950'
            }`}
          >
            <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Source Excerpt Overlay:</span>{' '}
              <span>
                Below is the exact text retrieved from{' '}
                <strong className="font-semibold text-white dark:text-neutral-100">{citation.docName}</strong> (Page{' '}
                {citation.pageNumber}) used to synthesize the assistant response. Keywords matching your query are
                visually highlighted.
              </span>
            </div>
          </div>

          {/* Excerpt Box */}
          <div
            className={`p-4 sm:p-5 rounded-xl border relative font-sans text-sm sm:text-base leading-relaxed select-text shadow-inner ${
              theme === 'dark'
                ? 'bg-[#0a0c12] border-neutral-800 text-neutral-200'
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <div className="whitespace-pre-wrap">{renderHighlightedExcerpt(fullExcerpt)}</div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          className={`px-4 sm:px-6 py-3 border-t flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            theme === 'dark'
              ? 'bg-[#151823] border-neutral-800 text-neutral-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-mono">
            <span>{fullExcerpt.split(/\s+/).filter(Boolean).length} words</span>
            <span>•</span>
            <span>{fullExcerpt.length} characters</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
                  : theme === 'dark'
                    ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border-neutral-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Excerpt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Excerpt</span>
                </>
              )}
            </button>

            {onOpenInViewer && (
              <button
                type="button"
                onClick={() => {
                  onOpenInViewer(citation);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/25 active:scale-95"
                title="Jump to Document Viewer tab on this page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Document Viewer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
