import React, { useState, useRef } from 'react';
import {
  FileText, Trash2, CheckSquare, Square, Upload, Sparkles, AlertCircle,
  HardDrive, Layers, FileCode, Copy, Check, X, Search, FileImage, FileSpreadsheet,
  FileType, Filter, Loader2, CheckCircle2
} from 'lucide-react';
import { PDFDocument, UploadProgressState } from '../types';
import { fetchApi } from '../lib/api';
import { UploadProgressIndicator } from './UploadProgressIndicator';

interface DocumentLibraryProps {
  documents: PDFDocument[];
  selectedDocIds: string[];
  theme?: 'light' | 'dark';
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
  uploadProgress?: UploadProgressState | null;
  onAbortUpload?: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  selectedDocIds,
  theme = 'dark',
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
  uploadProgress,
  onAbortUpload,
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
    <div className={`rounded-2xl p-3.5 sm:p-5 flex flex-col h-full min-h-0 space-y-3 shadow-xs overflow-hidden border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header section */}
      <div className={`flex items-center justify-between pb-2.5 border-b shrink-0 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
        <div>
          <h2 className={`text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Layers className="w-4 h-4 text-indigo-400" />
            Document Library ({documents.length})
          </h2>
          <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Active RAG Scope: {selectedDocIds.length === 0 ? 'All Documents' : `${selectedDocIds.length} Selected`}
          </p>
        </div>

        {documents.length > 0 && (
          <button
            onClick={allSelected ? onDeselectAllDocs : onSelectAllDocs}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700'
                : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
          >
            {allSelected ? 'Clear Scope' : 'Select All'}
          </button>
        )}
      </div>

      {uploadSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200/90 text-emerald-950 p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs shrink-0">
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
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center space-x-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span className="truncate">
            {typeof uploadError === 'string' && !uploadError.includes('[object Object]')
              ? uploadError
              : typeof uploadError === 'object' && uploadError !== null
                ? (uploadError as any).message || (uploadError as any).error || JSON.stringify(uploadError)
                : 'Document upload encountered an issue. Please retry.'}
          </span>
        </div>
      )}

      {/* Streaming Upload Indicator with explicit Abort button */}
      {uploadProgress && uploadProgress.stage !== 'idle' && (
        <UploadProgressIndicator
          progress={uploadProgress}
          onAbort={onAbortUpload || (() => {})}
          theme={theme}
          variant="card"
          className="mb-3 shrink-0"
        />
      )}

      {/* Full-Screen Upload Dropzone when empty, or compact dropzone when documents exist */}
      {documents.length === 0 ? (
        !uploadProgress || uploadProgress.stage === 'idle' ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex-1 border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 group overflow-hidden shadow-xl ${
              theme === 'dark'
                ? 'border-indigo-500/40 hover:border-indigo-400 bg-gradient-to-b from-slate-900/95 via-slate-900 to-indigo-950/80 hover:bg-slate-900 text-white shadow-indigo-950/50'
                : 'border-indigo-300 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/80 via-white to-purple-50/80 hover:bg-indigo-50/90 text-slate-900 shadow-indigo-500/10'
            }`}
          >
            {/* Pleasant Ambient SVG Wave Animation Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
              <svg
                className={`absolute -bottom-2 left-0 w-[150%] h-32 ${theme === 'dark' ? 'opacity-25' : 'opacity-35'} animate-wave-1`}
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="docWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#docWave1)"
                  d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,181.3C960,171,1056,181,1152,192C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                />
              </svg>
              <svg
                className={`absolute -bottom-1 left-0 w-[150%] h-24 ${theme === 'dark' ? 'opacity-20' : 'opacity-25'} animate-wave-2`}
                viewBox="0 0 1440 320"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="docWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#docWave2)"
                  d="M0,96L60,117.3C120,139,240,181,360,192C480,203,600,181,720,165.3C840,149,960,139,1080,149.3C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                />
              </svg>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.json,.txt,.md,.csv,.js,.py,.ts"
              className="hidden"
            />

            <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
              <div className={`p-4 rounded-2xl border transition-all shadow-md group-hover:scale-105 ${
                theme === 'dark'
                  ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 group-hover:bg-indigo-900/80 group-hover:border-indigo-400'
                  : 'bg-indigo-100/90 border-indigo-200 text-indigo-600 group-hover:bg-indigo-200/90'
              }`}>
                <Upload className="w-9 h-9" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className={`text-base sm:text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Drag & Drop your files here to Upload
                </h3>
                <p className={`text-xs leading-relaxed font-medium ${theme === 'dark' ? 'text-indigo-200/90' : 'text-slate-600'}`}>
                  Upload PDF reports, Word (.docx), PNG/JPG images, JSON data, or TXT/Code files to index into your RAG vector database.
                </p>
              </div>

              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer pointer-events-none"
              >
                <Upload className="w-4 h-4" />
                <span>Select File from Computer</span>
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap max-w-lg">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                  theme === 'dark' ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' : 'bg-rose-100 text-rose-700 border-rose-200'
                }`}>PDF</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                  theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}>Word (.docx)</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                  theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}>PNG / JPG</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                  theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>JSON</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                  theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>TXT / Code</span>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <>
          {/* Compact Upload Drag & Drop Area */}
          {(!uploadProgress || uploadProgress.stage === 'idle') && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all group shrink-0 overflow-hidden shadow-sm ${
                theme === 'dark'
                  ? 'border-indigo-500/40 hover:border-indigo-400 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/70 text-white shadow-xs'
                  : 'border-indigo-300 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/70 via-white to-purple-50/70 text-slate-900 shadow-xs'
              }`}
            >
              {/* Ambient Wave Layer for Compact Box */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl">
                <svg
                  className={`absolute -bottom-1 left-0 w-[150%] h-14 ${theme === 'dark' ? 'opacity-20' : 'opacity-25'} animate-wave-1`}
                  viewBox="0 0 1440 320"
                  preserveAspectRatio="none"
                >
                  <path
                    fill={theme === 'dark' ? '#6366f1' : '#8b5cf6'}
                    d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,181.3C960,171,1056,181,1152,192C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                  />
                </svg>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.json,.txt,.md,.csv,.js,.py,.ts"
                className="hidden"
              />
              <div className="relative z-10 flex items-center justify-center space-x-2.5">
                <div className={`p-1.5 rounded-lg border shrink-0 ${
                  theme === 'dark'
                    ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300'
                    : 'bg-indigo-100/90 border-indigo-200 text-indigo-600'
                }`}>
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Upload additional files (PDF, DOCX, PNG, JSON, TXT)
                  </p>
                  <p className={`text-[10px] ${theme === 'dark' ? 'text-indigo-200/80' : 'text-slate-500'}`}>
                    Drag & drop or click to browse files with real-time vector indexing
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter bar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter files by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 border-2 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500 antialiased shadow-2xs ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-700 text-white placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none cursor-pointer font-medium ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word (.docx)</option>
              <option value="image">Images</option>
              <option value="json">JSON</option>
              <option value="txt">Text & Code</option>
            </select>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0">
            {filteredDocs.length === 0 ? (
              <div className={`p-6 text-center text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
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
                    ? theme === 'dark'
                      ? 'bg-indigo-950/60 border-indigo-700 text-slate-100 shadow-2xs'
                      : 'bg-sky-50/40 border-sky-300 text-slate-900 shadow-2xs'
                    : theme === 'dark'
                      ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Checkbox & Name */}
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleDocSelection(doc.id)}
                      className="mt-1 text-indigo-500 hover:text-indigo-400 cursor-pointer shrink-0"
                      title={isSelected ? 'Remove from query scope' : 'Include in query scope'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <Square className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                      )}
                    </button>

                    {/* Format Badge */}
                    {renderTypeBadge(doc)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className={`font-semibold text-xs truncate max-w-[190px] ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
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
        </>
      )}
    </div>
  );
};
