import React, { useState } from 'react';
import { Citation } from '../types';
import { ExternalLink, FileText, ShieldCheck, ChevronRight } from 'lucide-react';

interface CitationCardProps {
  citation: Citation;
  onSelectCitation: (citation: Citation) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export const CitationCard: React.FC<CitationCardProps> = ({
  citation,
  onSelectCitation,
  isSelected = false,
  isHighlighted = false,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <span className="relative inline-block mx-0.5">
      <button
        type="button"
        onClick={() => onSelectCitation(citation)}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 my-0.5 ${
          isSelected
            ? 'bg-emerald-500/30 text-emerald-200 border-2 border-emerald-400 ring-2 ring-emerald-400/40 scale-105 shadow-md shadow-emerald-500/20'
            : isHighlighted
              ? 'bg-indigo-500/35 hover:bg-indigo-500/50 text-cyan-200 border border-cyan-400/60 ring-1 ring-cyan-400/40'
              : 'bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 dark:text-indigo-200 border border-indigo-400/40'
        }`}
        title={`Click to view source text excerpt for [Source ${citation.sourceId}]`}
      >
        <span>[{citation.sourceId}]</span>
        <span
          className={`text-[9px] font-bold px-1 rounded ${
            isSelected
              ? 'bg-emerald-950 text-emerald-300'
              : 'bg-indigo-950/60 text-cyan-300'
          }`}
        >
          {Math.round(citation.similarity * 100)}%
        </span>
      </button>

      {/* Hover Preview Card */}
      {showPreview && !isSelected && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 pointer-events-none text-slate-800 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 block">
          <span className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-[11px]">
            <span className="flex items-center space-x-1.5 font-semibold text-slate-900 truncate max-w-[180px]">
              <FileText className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="truncate">{citation.docName}</span>
            </span>
            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
              {Math.round(citation.similarity * 100)}% Match
            </span>
          </span>

          <span className="mt-2 text-[11px] text-slate-600 line-clamp-4 leading-relaxed font-sans bg-slate-50 p-2 rounded border border-slate-200 italic block">
            "{citation.textSnippet}"
          </span>

          <span className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Page {citation.pageNumber} • Chunk #{citation.chunkIndex}</span>
            <span className="text-sky-700 flex items-center gap-0.5 font-sans font-semibold">
              Click to view source <ChevronRight className="w-3 h-3" />
            </span>
          </span>
        </span>
      )}
    </span>
  );
};
