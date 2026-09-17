import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Copy, Check, Search, Hash, ShieldCheck } from 'lucide-react';
import { PDFDocument, DocumentChunk, Citation } from '../types';

interface DocumentViewerProps {
  documents: PDFDocument[];
  activeDoc: PDFDocument | null;
  onSelectDoc: (doc: PDFDocument) => void;
  highlightedCitation: Citation | null;
  chunks: DocumentChunk[];
  isLoadingChunks: boolean;
  theme?: 'light' | 'dark';
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  activeDoc,
  onSelectDoc,
  highlightedCitation,
  chunks,
  isLoadingChunks,
  theme = 'dark',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Synchronize current page when a citation is selected
  useEffect(() => {
    if (highlightedCitation) {
      const doc = documents.find(d => d.id === highlightedCitation.docId);
      if (doc) {
        onSelectDoc(doc);
        setCurrentPage(highlightedCitation.pageNumber);
      }
    }
  }, [highlightedCitation]);

  const totalPages = activeDoc ? activeDoc.pageCount : 1;

  // Filter chunks for active page
  const pageChunks = chunks.filter(c => c.pageNumber === currentPage);

  const handleCopyChunk = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl p-4 flex flex-col h-full space-y-3 shadow-xl border-2 transition-colors duration-200 ${
      isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100 shadow-2xl' : 'bg-[#edf7f0] border-emerald-300/90 text-slate-800 shadow-md'
    }`}>
      {/* Top Controls Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 ${
        isDark ? 'border-neutral-800' : 'border-emerald-300'
      }`}>
        <div className="flex items-center space-x-2 min-w-0">
          <FileText className={`w-4 h-4 shrink-0 ${isDark ? 'text-indigo-400' : 'text-emerald-700'}`} />
          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Active Document:</span>
          {documents.length > 0 ? (
            <select
              value={activeDoc?.id || ''}
              onChange={(e) => {
                const doc = documents.find(d => d.id === e.target.value);
                if (doc) {
                  onSelectDoc(doc);
                  setCurrentPage(1);
                }
              }}
              className={`text-xs font-semibold border-2 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 max-w-[220px] truncate cursor-pointer transition-colors ${
                isDark
                  ? 'bg-neutral-900 text-neutral-100 border-neutral-800'
                  : 'bg-white text-slate-800 border-emerald-300'
              }`}
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>No document loaded</span>
          )}
        </div>

        {/* Page Switcher */}
        {activeDoc && (
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`p-1 rounded-lg border-2 disabled:opacity-40 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  : 'bg-white border-emerald-300 text-slate-700 hover:bg-emerald-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className={`font-semibold font-mono ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`p-1 rounded-lg border-2 disabled:opacity-40 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                  : 'bg-white border-emerald-300 text-slate-700 hover:bg-emerald-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Highlighted Citation Banner */}
      {highlightedCitation && (
        <div className={`rounded-lg p-2.5 text-xs flex items-center justify-between gap-2 shadow-xs border-2 ${
          isDark
            ? 'bg-indigo-950/70 border-indigo-500/60 text-indigo-200'
            : 'bg-emerald-50 border-emerald-500 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${isDark ? 'text-indigo-400' : 'text-emerald-700'}`} />
            <span className="truncate">
              <strong>Verified Citation Source [{highlightedCitation.sourceId}]:</strong> Page {highlightedCitation.pageNumber}, Match: {Math.round(highlightedCitation.similarity * 100)}%
            </span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
            isDark
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {highlightedCitation.docName}
          </span>
        </div>
      )}

      {/* Filter / Search within page */}
      <div className="relative">
        <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search within active page chunks..."
          className={`w-full rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none transition-all border-2 ${
            isDark
              ? 'bg-neutral-900 border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:border-indigo-500'
              : 'bg-white focus:bg-white border-emerald-300 text-slate-800 placeholder-slate-400 focus:border-emerald-600'
          }`}
        />
      </div>

      {/* Chunks List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoadingChunks ? (
          <div className={`p-8 text-center text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Loading document chunks...</div>
        ) : pageChunks.length === 0 ? (
          <div className={`p-8 text-center text-xs border-2 border-dashed rounded-xl ${
            isDark ? 'text-neutral-400 border-neutral-800' : 'text-slate-500 border-slate-300'
          }`}>
            No text chunks found on Page {currentPage}.
          </div>
        ) : (
          pageChunks
            .filter(c => !searchFilter || c.text.toLowerCase().includes(searchFilter.toLowerCase()))
            .map((chunk) => {
              const isCited = highlightedCitation && highlightedCitation.chunkId === chunk.id;

              return (
                <div
                  key={chunk.id}
                  className={`p-3.5 rounded-xl border-2 transition-all ${
                    isCited
                      ? isDark
                        ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                        : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300/50 shadow-xs'
                      : isDark
                        ? 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900'
                        : 'bg-white/90 border-emerald-300/80 hover:bg-white hover:border-emerald-400 shadow-2xs'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-2 border-b text-[11px] ${
                    isDark ? 'border-neutral-800' : 'border-slate-300/50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono font-semibold flex items-center gap-1 ${
                        isDark ? 'text-indigo-400' : 'text-emerald-700'
                      }`}>
                        <Hash className="w-3 h-3" />
                        Chunk {chunk.chunkIndex}
                      </span>
                      <span className={isDark ? 'text-neutral-600' : 'text-slate-300'}>•</span>
                      <span className={isDark ? 'text-neutral-400' : 'text-slate-600'}>Page {chunk.pageNumber}</span>
                      {chunk.tokenCount && (
                        <span className={`font-mono ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>({chunk.tokenCount} tokens)</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyChunk(chunk.text, chunk.id)}
                      className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 text-[10px] cursor-pointer ${
                        isDark
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-[#edf1f5]'
                      }`}
                    >
                      {copiedId === chunk.id ? (
                        <>
                          <Check className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className={`text-xs leading-relaxed mt-2 whitespace-pre-wrap font-sans ${
                    isDark ? 'text-neutral-300' : 'text-slate-700'
                  }`}>
                    {chunk.text}
                  </p>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
