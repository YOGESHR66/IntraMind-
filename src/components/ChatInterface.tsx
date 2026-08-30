import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, ShieldCheck, ChevronDown, ChevronUp, Clock, Layers, Upload,
  Copy, Check, Lightbulb, BookmarkCheck, FileText, Plus, HardDrive, Loader2, CheckCircle2,
  AlertCircle, X, FileCheck, RotateCcw, MessageSquare, StopCircle
} from 'lucide-react';
import { ChatMessage, Citation, RAGSettings, PDFDocument, UploadProgressState } from '../types';
import { CitationCard } from './CitationCard';
import { UploadProgressIndicator } from './UploadProgressIndicator';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onSelectCitation: (citation: Citation) => void;
  settings: RAGSettings;
  documents: PDFDocument[];
  theme?: 'light' | 'dark';
  onOpenLibrary?: () => void;
  onUploadFile?: (file: File) => void;
  onResetChat?: () => void;
  isUploading?: boolean;
  uploadingFileName?: string | null;
  uploadSuccessNotice?: { docName: string; chunkCount: number; fileSize: number; fileType: string } | null;
  uploadError?: string | null;
  onDismissUploadNotice?: () => void;
  onRetryUpload?: () => void;
  lastUploadedDocId?: string | null;
  uploadProgress?: UploadProgressState | null;
  onAbortUpload?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onSelectCitation,
  settings,
  documents,
  theme = 'dark',
  onOpenLibrary,
  onUploadFile,
  onResetChat,
  isUploading = false,
  uploadingFileName,
  uploadSuccessNotice,
  uploadError,
  onDismissUploadNotice,
  onRetryUpload,
  lastUploadedDocId,
  uploadProgress,
  onAbortUpload,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadFile) {
      onUploadFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onUploadFile) {
      onUploadFile(e.dataTransfer.files[0]);
    }
  };

  const toggleSourceAccordion = (msgId: string) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleCopyMessage = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // State for streaming step text during loading
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setLoadingStep(0);
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const LOADING_STEPS = [
    "Searching vector embeddings & cosine similarities...",
    "Reranking top matching document passages...",
    "Synthesizing response & formatting verified citations...",
  ];

  const GENERAL_SUGGESTIONS = [
    "Summarize key insights across all my uploaded documents",
    "What are the main metrics, statistics, or dates mentioned?",
    "Extract an executive summary with critical action items",
    "Identify major risk factors or technical requirements",
  ];

  // Format badge rendering helper
  const renderMiniBadge = (docName: string) => {
    const ext = docName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') return <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-1 rounded">PDF</span>;
    if (['docx', 'doc'].includes(ext)) return <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">DOCX</span>;
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1 rounded">IMG</span>;
    if (['json'].includes(ext)) return <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 rounded">JSON</span>;
    return <span className="bg-slate-200 text-slate-800 text-[9px] font-bold px-1 rounded">TXT</span>;
  };

  // Highlight Key Metrics and Sentences in AI Answers
  const renderHighlightedContent = (msg: ChatMessage, overrideText?: string) => {
    const rawText = overrideText !== undefined ? overrideText : msg.content;
    if (!rawText) return null;

    // Strip inline bracket citations like [1], [2], etc.
    const text = rawText.replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ');

    const highlightKeyMetrics = (lineText: string) => {
      const boldParts = lineText.split(/(\*\*[^*]+\*\*)/g);

      return (
        <span>
          {boldParts.map((bPart, bIdx) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              const cleanBold = bPart.slice(2, -2);
              return (
                <strong
                  key={`b-${bIdx}`}
                  className="font-extrabold text-white bg-indigo-500/15 px-1 py-0.5 rounded border border-indigo-400/30 text-indigo-100"
                >
                  {cleanBold}
                </strong>
              );
            }

            return bPart;
          })}
        </span>
      );
    };

    const lines = text.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1" />;

          if (trimmed.startsWith('#')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <h4 key={lIdx} className="font-extrabold text-xs text-indigo-300 uppercase tracking-wider pt-2 pb-1 flex items-center gap-2 border-b border-indigo-500/30">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>{headerText}</span>
              </h4>
            );
          }

          if (trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed)) {
            const bulletPrefix = trimmed.match(/^(\d+\.|[•\-])/)?.[0] || '•';
            const cleanContent = trimmed.replace(/^[•\-\d+\.]\s*/, '');
            return (
              <div
                key={lIdx}
                className="flex items-start space-x-2.5 pl-1 py-0.5"
              >
                <span className="font-bold text-cyan-400 shrink-0 text-sm">{bulletPrefix}</span>
                <span className="flex-1 text-slate-200">{highlightKeyMetrics(cleanContent)}</span>
              </div>
            );
          }

          return (
            <div key={lIdx} className="py-0.5 text-slate-200">
              {highlightKeyMetrics(line)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`rounded-2xl flex flex-col h-full overflow-hidden shadow-xl border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Active Documents Bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between gap-2 shrink-0 border-b ${
        theme === 'dark'
          ? 'bg-slate-950 border-slate-800 text-white'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/50 text-white'
      }`}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.json,.txt,.md,.csv,.js,.py,.ts"
          className="hidden"
        />

        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-x-auto py-0.5">
          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 shrink-0">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Context:</span>
          </span>

          {uploadProgress && uploadProgress.stage !== 'idle' ? (
            <div className="shrink-0 min-w-[260px] max-w-sm">
              <UploadProgressIndicator
                progress={uploadProgress}
                onAbort={onAbortUpload || (() => {})}
                theme="dark"
                variant="compact"
              />
            </div>
          ) : isUploading ? (
            <div className="bg-indigo-500/20 border border-indigo-400/40 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-indigo-200 flex items-center space-x-1.5 shrink-0 shadow-xs animate-pulse">
              <Loader2 className="w-3 h-3 text-indigo-300 animate-spin" />
              <span className="truncate max-w-[150px]">Uploading {uploadingFileName}...</span>
            </div>
          ) : null}

          {documents.length === 0 && !isUploading && (!uploadProgress || uploadProgress.stage === 'idle') ? (
            <span className="text-[11px] text-slate-400 italic shrink-0">No files uploaded yet</span>
          ) : (
            documents.map(d => {
              const isJustUploaded = d.id === lastUploadedDocId;
              return (
                <div
                  key={d.id}
                  className={`border px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 shrink-0 shadow-xs transition-all hover:scale-105 ${
                    isJustUploaded
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 ring-2 ring-emerald-400/30'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                >
                  {renderMiniBadge(d.name)}
                  <span className="truncate max-w-[120px]">{d.name}</span>
                  {isJustUploaded && (
                    <span className="bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">
                      NEW ✓
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setInputQuery('');
              onResetChat?.();
              fileInputRef.current?.click();
            }}
            disabled={isUploading}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30 active:scale-95 hover:scale-105"
            title="Start a new chat and select a document to upload"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat & Upload</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white border border-white/20 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105"
            title="Add another file to active context"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-sky-300" />
            )}
            <span>{isUploading ? 'Uploading...' : 'Add File'}</span>
          </button>

          {onOpenLibrary && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 text-slate-200 text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span>Library ({documents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Notification Banner */}
      {uploadSuccessNotice && (
        <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-200/90 text-emerald-950 p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="font-extrabold text-slate-900">Successfully Uploaded & Indexed:</span>
              <span className="font-bold text-emerald-800 ml-1.5 font-mono truncate">{uploadSuccessNotice.docName}</span>
              <span className="text-[11px] text-slate-500 font-normal ml-2">
                ({uploadSuccessNotice.chunkCount} vector chunks created)
              </span>
            </div>
          </div>
          {onDismissUploadNotice && (
            <button
              onClick={onDismissUploadNotice}
              className="p-1 hover:bg-emerald-100/80 rounded-md text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0 ml-2"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {uploadError && (
        <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold text-rose-950">Upload Notice: {uploadError}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {onRetryUpload && (
              <button
                type="button"
                onClick={onRetryUpload}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Upload</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Upload className="w-3 h-3 text-sky-400" />
              <span>Select File</span>
            </button>
            {onDismissUploadNotice && (
              <button
                type="button"
                onClick={onDismissUploadNotice}
                className="p-1 hover:bg-rose-100 rounded-md text-rose-700 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active Conversation Control Header */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100/90 border-b border-slate-200 text-xs shrink-0">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold">
            <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
            <span>Active Conversation ({messages.length} message{messages.length === 1 ? '' : 's'})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setInputQuery('');
                onResetChat?.();
                fileInputRef.current?.click();
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              title="Start a new chat and upload a new document"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat & Upload</span>
            </button>
            {onResetChat && (
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  onResetChat();
                }}
                className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Clear current messages"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Chat</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 my-auto">
            <div className="p-4 bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 text-white rounded-2xl shadow-xl shadow-indigo-500/20 animate-float-subtle ring-4 ring-indigo-500/10">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight font-general ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>IntraMind Workspace</h3>
              <p className={`text-xs max-w-md mt-1 leading-relaxed font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Single unified RAG workspace. Ask questions across your PDF, Word, PNG/JPG, JSON, and TXT files with highlighted key insights and verified citations.
              </p>
            </div>

            {/* Upload Progress Indicator OR Upload Drag & Drop Area placed BELOW IntraMind Workspace */}
            <div className="w-full max-w-xl sm:max-w-2xl">
              {uploadProgress && uploadProgress.stage !== 'idle' ? (
                <UploadProgressIndicator
                  progress={uploadProgress}
                  onAbort={onAbortUpload || (() => {})}
                  theme={theme}
                  variant="card"
                />
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all group overflow-hidden shadow-xl hover:scale-[1.01] ${
                    theme === 'dark'
                      ? isUploading
                        ? 'border-indigo-400 bg-slate-900 shadow-indigo-500/30 animate-pulse'
                        : 'border-indigo-500/40 hover:border-indigo-400 bg-gradient-to-b from-slate-900/90 via-slate-900 to-indigo-950/80 hover:bg-slate-900 text-white shadow-indigo-950/40'
                      : isUploading
                        ? 'border-indigo-500 bg-indigo-50 shadow-indigo-500/20 animate-pulse'
                        : 'border-indigo-300 hover:border-indigo-500 bg-gradient-to-b from-indigo-50/80 via-white to-purple-50/80 hover:bg-indigo-50/90 text-slate-900 shadow-indigo-500/10'
                  }`}
                >
                  {/* Pleasant Ambient SVG Wave Animation Overlay */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                    <svg
                      className={`absolute -bottom-2 left-0 w-[150%] h-24 ${theme === 'dark' ? 'opacity-25' : 'opacity-35'} animate-wave-1`}
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chatWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#chatWave1)"
                        d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,218.7C672,224,768,192,864,181.3C960,171,1056,181,1152,192C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                      />
                    </svg>
                    <svg
                      className={`absolute -bottom-1 left-0 w-[150%] h-20 ${theme === 'dark' ? 'opacity-20' : 'opacity-25'} animate-wave-2`}
                      viewBox="0 0 1440 320"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="chatWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#chatWave2)"
                        d="M0,96L60,117.3C120,139,240,181,360,192C480,203,600,181,720,165.3C840,149,960,139,1080,149.3C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10 flex flex-col items-center justify-center space-y-2.5">
                    <div className={`p-3 rounded-2xl border transition-all shadow-md group-hover:scale-105 ${
                      theme === 'dark'
                        ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300 group-hover:bg-indigo-900/80 group-hover:border-indigo-400'
                        : 'bg-indigo-100/90 border-indigo-200 text-indigo-600 group-hover:bg-indigo-200/90'
                    }`}>
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {isUploading
                          ? `Uploading & Indexing ${uploadingFileName || 'file'}...`
                          : 'Upload Files for RAG Search'}
                      </p>
                      {isUploading ? (
                        <p className={`text-xs font-medium mt-1 ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                          Parsing document, generating vector embeddings & indexing into RAG store...
                        </p>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                            theme === 'dark' ? 'bg-rose-500/20 text-rose-300 border-rose-400/30' : 'bg-rose-100 text-rose-700 border-rose-200'
                          }`}>PDF</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                            theme === 'dark' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>DOCX</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                            theme === 'dark' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' : 'bg-purple-100 text-purple-700 border-purple-200'
                          }`}>PNG / JPG</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                            theme === 'dark' ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>JSON</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-transform hover:scale-105 shadow-2xs ${
                            theme === 'dark' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>TXT / Code</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isLatest = index === messages.length - 1;

            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex flex-col items-end space-y-1.5">
                  <div className="flex items-center space-x-2 px-1 text-[11px] text-slate-500 font-medium">
                    <span className="font-bold text-slate-700">You</span>
                    <User className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <div className="p-4 rounded-2xl max-w-[95%] text-xs shadow-md bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-900/50 rounded-tr-none whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <StreamingAssistantMessage
                key={msg.id}
                msg={msg}
                isLatest={isLatest}
                onSelectCitation={onSelectCitation}
                handleCopyMessage={handleCopyMessage}
                copiedMsgId={copiedMsgId}
                toggleSourceAccordion={toggleSourceAccordion}
                isSourceExpanded={!!expandedSources[msg.id]}
                renderHighlightedContent={renderHighlightedContent}
              />
            );
          })
        )}

        {/* Enhanced Loading Typing Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center space-x-2 px-1 text-[11px] text-slate-500 font-medium">
              <div className="w-5 h-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md flex items-center justify-center text-white shadow-xs animate-pulse">
                <Bot className="w-3 h-3" />
              </div>
              <span className="text-slate-900 font-bold">IntraMind AI</span>
              <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Processing Query
              </span>
            </div>

            <div className="p-4 rounded-2xl max-w-[95%] text-xs shadow-md bg-indigo-950/90 border border-indigo-500/30 text-white rounded-tl-none space-y-2.5">
              <div className="flex items-center space-x-3 text-xs text-indigo-100">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                </div>
                <span className="font-semibold text-indigo-100 animate-pulse">
                  {LOADING_STEPS[loadingStep]}
                </span>
              </div>

              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full animate-pulse transition-all duration-500 w-3/4" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with "Send" button & Crisp High-Contrast Query Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-indigo-100">
        {/* Docked Upload Progress Indicator when active in chat view */}
        {uploadProgress && uploadProgress.stage !== 'idle' && messages.length > 0 && (
          <div className="mb-3">
            <UploadProgressIndicator
              progress={uploadProgress}
              onAbort={onAbortUpload || (() => {})}
              theme="light"
              variant="compact"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-2.5">
          {/* Quick Query Suggestion Chips */}
          {documents.length > 0 && !inputQuery && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 mr-1">Suggested:</span>
              {GENERAL_SUGGESTIONS.slice(0, 3).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputQuery(sug)}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-900 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer shadow-2xs hover:shadow-xs hover:-translate-y-0.5 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[240px]">{sug}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative flex items-center bg-white border-2 border-slate-400 hover:border-slate-500 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/15 rounded-2xl transition-all shadow-sm">
            <div className="pl-3.5 pr-2 py-3 flex items-center justify-center shrink-0 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={documents.length > 0 ? "Ask anything about your documents..." : "Upload files above to ask questions..."}
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 px-1 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 antialiased"
            />

            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors mr-1 cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="m-1.5 px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-40 flex items-center space-x-1.5 cursor-pointer shrink-0 active:scale-95 hover:scale-105"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
            <span className="truncate">
              Scope:{' '}
              <strong className="text-slate-800 font-semibold">
                {settings.selectedDocIds.length === 0
                  ? 'All Documents'
                  : `${settings.selectedDocIds.length} Selected`}
              </strong>
            </span>
            <span>Top-K: <strong className="text-indigo-700 font-bold">{settings.topK} Chunks</strong></span>
          </div>
        </form>
      </div>
    </div>
  );
};

interface StreamingAssistantMessageProps {
  msg: ChatMessage;
  isLatest: boolean;
  onSelectCitation: (citation: Citation) => void;
  handleCopyMessage: (text: string, msgId: string) => void;
  copiedMsgId: string | null;
  toggleSourceAccordion: (msgId: string) => void;
  isSourceExpanded: boolean;
  renderHighlightedContent: (msg: ChatMessage, overrideText?: string) => React.ReactNode;
}

const StreamingAssistantMessage: React.FC<StreamingAssistantMessageProps> = ({
  msg,
  isLatest,
  onSelectCitation,
  handleCopyMessage,
  copiedMsgId,
  toggleSourceAccordion,
  isSourceExpanded,
  renderHighlightedContent,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(
    isLatest ? Math.min(25, msg.content.length) : msg.content.length
  );
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(
    !isLatest || msg.content.length <= 25
  );

  useEffect(() => {
    if (!isLatest || isTypingComplete) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        const step = Math.max(3, Math.floor((msg.content.length - prev) / 6));
        const next = prev + step;
        if (next >= msg.content.length) {
          setIsTypingComplete(true);
          clearInterval(interval);
          return msg.content.length;
        }
        return next;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isLatest, isTypingComplete, msg.content.length]);

  const displayedContent = isTypingComplete ? msg.content : msg.content.slice(0, visibleCount);

  return (
    <div className="flex flex-col items-start space-y-1.5 w-full">
      {/* Sender Badge & Actions */}
      <div className="flex items-center justify-between w-full max-w-[95%] px-1 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-slate-900 rounded-md flex items-center justify-center text-sky-400 shadow-2xs">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-slate-900 font-bold">IntraMind AI</span>
          {msg.reasoningTimeMs && (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              {msg.reasoningTimeMs}ms
            </span>
          )}
          {!isTypingComplete && (
            <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 animate-pulse">
              Streaming...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isTypingComplete && (
            <button
              type="button"
              onClick={() => {
                setIsTypingComplete(true);
                setVisibleCount(msg.content.length);
              }}
              className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
            >
              Skip
            </button>
          )}

          <button
            onClick={() => handleCopyMessage(msg.content, msg.id)}
            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-semibold hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors"
          >
            {copiedMsgId === msg.id ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern High-Contrast AI Response Card */}
      <div className="p-5 sm:p-6 rounded-2xl max-w-[95%] text-xs sm:text-sm shadow-xl transition-all bg-[#141029]/95 border border-indigo-500/30 text-slate-100 rounded-tl-xs w-full leading-relaxed backdrop-blur-md">
        <div>
          {renderHighlightedContent(msg, displayedContent)}
          {!isTypingComplete && (
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle rounded-xs" />
          )}
        </div>
      </div>

      {/* Retrieved Vector Chunks Accordion */}
      {msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
        <div className="w-full max-w-[95%] mt-1">
          <button
            onClick={() => toggleSourceAccordion(msg.id)}
            className="flex items-center justify-between text-[11px] font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 px-3.5 py-2 rounded-xl border border-indigo-500/30 transition-all cursor-pointer w-full shadow-2xs"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verified Sources ({msg.retrievedChunks.length} Context Chunks Analyzed)</span>
            </span>
            {isSourceExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-indigo-300" />
            )}
          </button>

          {isSourceExpanded && (
            <div className="mt-2 space-y-2 p-3 bg-[#110e23] rounded-xl border border-indigo-500/25 text-xs text-slate-200 animate-in fade-in">
              {msg.retrievedChunks.map((ret, idx) => (
                <div key={idx} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300 mb-1">
                    <span className="font-bold text-white">[Source {idx + 1}] {ret.chunk.docName} (Page {ret.chunk.pageNumber})</span>
                    <span className="text-cyan-300 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/40">
                      {ret.scorePercentage}% Vector Match
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-3 italic leading-relaxed">
                    "{ret.chunk.text}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
