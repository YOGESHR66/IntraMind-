import React, { useState, useRef } from 'react';
import {
  FileText, Trash2, CheckSquare, Square, Upload, Sparkles, AlertCircle,
  HardDrive, Layers, FileCode, Copy, Check, X, Search, FileImage, FileSpreadsheet,
  FileType, Filter, Loader2, CheckCircle2
} from 'lucide-react';
import { PDFDocument } from '../types';
import { fetchApi } from '../lib/api';

interface DocumentLibraryProps {
  documents: PDFDocument[];
  selectedDocIds: string[];
  onToggleDocSelection: (docId: string) => void;
  onSelectAllDocs: () => void;
  onDeselectAllDocs: () => void;
  onDeleteDoc: (docId: string) => void;
  onUploadFile: (file: File) => void;
  onViewDocInReader: (doc: PDFDocument) => void;
  isUploading: boolean;
  uploadingFileName?: string | null;
  uploadSuccessNotice?: { docName: string; chunkCount: number; fileSize: number; fileType: string } | null;
  uploadError: string | null;
  onDismissUploadNotice?: () => void;
  lastUploadedDocId?: string | null;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  selectedDocIds,
  onToggleDocSelection,
  onSelectAllDocs,
  onDeselectAllDocs,
  onDeleteDoc,
  onUploadFile,
  onViewDocInReader,
  isUploading,
  uploadingFileName,
  uploadSuccessNotice,
  uploadError,
  onDismissUploadNotice,
  lastUploadedDocId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);

  const handleSummarize = async (docId: string) => {
    if (summaries[docId]) {
      setExpandedSummaryId(expandedSummaryId === docId ? null : docId);
      return;
    }

    setLoadingSummaryId(docId);
    try {
      const res = await fetchApi(`/api/documents/${docId}/summary`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        setSummaries(prev => ({ ...prev, [docId]: data.summary }));
        setExpandedSummaryId(docId);
      } else {
        alert("Summary unavailable: " + (data.error || "Document not found in current workspace. Please re-upload the document."));
      }
    } catch (err) {
      console.error("Summary error:", err);
      alert("Failed to summarize document.");
    } finally {
      setLoadingSummaryId(null);
    }
  };

  const handleCopySummary = (text: string, docId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSummaryId(docId);
    setTimeout(() => setCopiedSummaryId(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const detectTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return 'pdf';
    if (['docx', 'doc'].includes(ext)) return 'docx';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
    if (['json', 'jsonl'].includes(ext)) return 'json';
    if (['txt', 'md', 'csv'].includes(ext)) return 'txt';
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'sql'].includes(ext)) return 'code';
    return 'other';
  };

  const renderTypeBadge = (doc: PDFDocument) => {
    const type = doc.fileType || detectTypeFromName(doc.name);
    switch (type) {
      case 'pdf':
        return <div className="w-8 h-8 bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0">PDF</div>;
      case 'docx':
        return <div className="w-8 h-8 bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0">DOCX</div>;
      case 'image':
        return <div className="w-8 h-8 bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0 flex-col"><FileImage className="w-3.5 h-3.5" /><span className="text-[8px] font-bold">IMG</span></div>;
      case 'json':
        return <div className="w-8 h-8 bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0">JSON</div>;
      case 'code':
        return <div className="w-8 h-8 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0"><FileCode className="w-4 h-4" /></div>;
      default:
        return <div className="w-8 h-8 bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center rounded-lg text-[10px] font-bold shrink-0"><FileText className="w-4 h-4" /></div>;
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const type = doc.fileType || detectTypeFromName(doc.name);
    const matchesType = filterType === 'all' || type === filterType;
    return matchesSearch && matchesType;
  });

  const allSelected = selectedDocIds.length === 0 || selectedDocIds.length === documents.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full space-y-3.5 shadow-xs">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-800" />
            Document Library ({documents.length})
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Active RAG Scope: {selectedDocIds.length === 0 ? 'All Documents' : `${selectedDocIds.length} Selected`}
          </p>
        </div>

        {documents.length > 0 && (
          <button
            onClick={allSelected ? onDeselectAllDocs : onSelectAllDocs}
            className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            {allSelected ? 'Clear Scope' : 'Select All'}
          </button>
        )}
      </div>

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all group ${
          isUploading
            ? 'border-sky-400 bg-sky-50 shadow-xs animate-pulse'
            : 'border-sky-200 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.json,.txt,.md,.csv,.js,.py,.ts"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-1.5">
          <div className="p-2 bg-white group-hover:bg-sky-100 text-sky-600 rounded-xl border border-sky-200 transition-all shadow-2xs">
            {isUploading ? (
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {isUploading
                ? `Uploading & Indexing ${uploadingFileName || 'file'}...`
                : 'Upload Files for RAG Search'}
            </p>
            {isUploading ? (
              <p className="text-[11px] text-sky-700 font-medium mt-0.5">
                Parsing document, generating vector embeddings & indexing into RAG store...
              </p>
            ) : (
              <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 bg-rose-100/70 text-rose-800 rounded text-[9px] font-bold">PDF</span>
                <span className="px-1.5 py-0.5 bg-blue-100/70 text-blue-800 rounded text-[9px] font-bold">DOCX</span>
                <span className="px-1.5 py-0.5 bg-purple-100/70 text-purple-800 rounded text-[9px] font-bold">PNG / JPG</span>
                <span className="px-1.5 py-0.5 bg-amber-100/70 text-amber-800 rounded text-[9px] font-bold">JSON</span>
                <span className="px-1.5 py-0.5 bg-slate-200/80 text-slate-800 rounded text-[9px] font-bold">TXT / Code</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200/90 text-emerald-950 p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-slate-900">Uploaded & Indexed:</span>
              <span className="font-bold text-emerald-800 ml-1.5 font-mono truncate">{uploadSuccessNotice.docName}</span>
              <span className="text-[11px] text-slate-500 font-normal ml-2">
                ({uploadSuccessNotice.chunkCount} vector chunks created)
              </span>
            </div>
          </div>
          {onDismissUploadNotice && (
            <button
              onClick={onDismissUploadNotice}
              className="p-1 hover:bg-emerald-100 rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-2"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Search & Filter bar if documents exist */}
      {documents.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter files by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 antialiased shadow-2xs"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none cursor-pointer font-medium"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF</option>
            <option value="docx">Word (.docx)</option>
            <option value="image">Images</option>
            <option value="json">JSON</option>
            <option value="txt">Text & Code</option>
          </select>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="p-3 bg-white rounded-2xl shadow-2xs border border-slate-200">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">No Documents in Vector Store</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Upload your PDF reports, Word docs, PNG images, JSON data, or TXT files above to begin instant AI-powered vector querying.
              </p>
            </div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No documents matching "{searchTerm}" or selected format filter.
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSelected = selectedDocIds.length === 0 || selectedDocIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                className={`p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-sky-50/40 border-sky-300 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Checkbox & Name */}
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleDocSelection(doc.id)}
                      className="mt-1 text-sky-600 hover:text-sky-700 cursor-pointer shrink-0"
                      title={isSelected ? 'Remove from query scope' : 'Include in query scope'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-sky-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    {/* Format Badge */}
                    {renderTypeBadge(doc)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-800 truncate max-w-[190px]">
                          {doc.name}
                        </span>
                        {doc.id === lastUploadedDocId && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-300 shadow-2xs">
                            JUST UPLOADED ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 flex-wrap gap-y-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-400" />
                          {formatBytes(doc.fileSize)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileCode className="w-3 h-3 text-slate-400" />
                          {doc.pageCount} {doc.pageCount === 1 ? 'Page' : 'Pages'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-sky-700 font-medium">
                          <Layers className="w-3 h-3 text-sky-600" />
                          {doc.chunkCount} Chunks
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => handleSummarize(doc.id)}
                      disabled={loadingSummaryId === doc.id}
                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-semibold rounded-md border border-sky-200 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Generate 3-bullet-point AI summary with Gemini"
                    >
                      {loadingSummaryId === doc.id ? (
                        <>
                          <Sparkles className="w-3 h-3 text-sky-600 animate-spin" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-sky-600" />
                          <span>Summarize Document</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onViewDocInReader(doc)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      Read
                    </button>

                    <button
                      onClick={() => onDeleteDoc(doc.id)}
                      title="Delete document & vectors"
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Summary Box */}
                {summaries[doc.id] && expandedSummaryId === doc.id && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-800 relative animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                        <span>3-Bullet AI Summary</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopySummary(summaries[doc.id], doc.id)}
                          className="px-2 py-0.5 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-200/60 transition-colors flex items-center gap-1 text-[10px] cursor-pointer font-medium"
                        >
                          {copiedSummaryId === doc.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedSummaryId(null)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap pt-1">
                      {summaries[doc.id]}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
