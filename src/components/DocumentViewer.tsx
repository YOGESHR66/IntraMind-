import React, { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Copy, Check, Search, Hash, Sparkles, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="rounded-xl p-4 flex flex-col h-full space-y-3 shadow-2xl border bg-neutral-950 border-neutral-850 text-neutral-100">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-850">
        <div className="flex items-center space-x-2 min-w-0">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-white">Active Document:</span>
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
              className="text-xs font-semibold border rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 max-w-[220px] truncate cursor-pointer bg-neutral-900 text-neutral-100 border-neutral-800"
            >
              {documents.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-neutral-400">No document loaded</span>
          )}
        </div>

        {/* Page Switcher */}
        {activeDoc && (
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-neutral-200 font-mono">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Highlighted Citation Banner */}
      {highlightedCitation && (
        <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-lg p-2.5 text-xs text-indigo-200 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center space-x-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">
              <strong>Verified Citation Source [{highlightedCitation.sourceId}]:</strong> Page {highlightedCitation.pageNumber}, Match: {Math.round(highlightedCitation.similarity * 100)}%
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
            {highlightedCitation.docName}
          </span>
        </div>
      )}

      {/* Filter / Search within page */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search within active page chunks..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:bg-neutral-850 transition-all"
        />
      </div>

      {/* Chunks List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoadingChunks ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading document chunks...</div>
        ) : pageChunks.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-xl">
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
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCited
                      ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                      : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px]">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-indigo-400 font-semibold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        Chunk {chunk.chunkIndex}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-neutral-400">Page {chunk.pageNumber}</span>
                      {chunk.tokenCount && (
                        <span className="text-neutral-500 font-mono">({chunk.tokenCount} tokens)</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyChunk(chunk.text, chunk.id)}
                      className="text-neutral-400 hover:text-white px-2 py-0.5 rounded hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
                    >
                      {copiedId === chunk.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mt-2 whitespace-pre-wrap font-sans">
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
