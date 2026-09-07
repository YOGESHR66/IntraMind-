import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Bot, User, Sparkles, ShieldCheck, ChevronDown, ChevronUp, Clock, Layers, Upload,
  Copy, Check, Lightbulb, BookmarkCheck, FileText, Plus, HardDrive, Loader2, CheckCircle2,
  AlertCircle, X, FileCheck, RotateCcw, MessageSquare, StopCircle, Mic, MicOff, Brain, ArrowUp,
  FastForward, History, Target, ArrowLeft
} from 'lucide-react';
import { ChatMessage, Citation, SearchResult, RAGSettings, PDFDocument, UploadProgressState, ChatSession } from '../types';
import { CitationCard } from './CitationCard';
import { CitationExcerptOverlay } from './CitationExcerptOverlay';
import { UploadProgressIndicator } from './UploadProgressIndicator';
import { formatTimeAgo } from '../lib/chatStorage';

const markdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 mb-2 flex items-center gap-2">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => {
    const text = String(children || '');
    if (/graphical\s*explanation/i.test(text)) {
      return null;
    }
    return (
      <h3 className="text-base sm:text-lg font-bold text-white mt-3.5 mb-2 flex items-center gap-2">
        {children}
      </h3>
    );
  },
  h4: ({ children }: any) => (
    <h4 className="text-sm sm:text-base font-bold text-white mt-3 mb-1 flex items-center gap-2">
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className="text-sm sm:text-base text-neutral-200 leading-relaxed my-3">
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-white tracking-wide">
      {children}
    </strong>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4 w-full rounded-lg border border-neutral-800 bg-neutral-950/40">
      <table className="w-full text-left text-sm text-neutral-200 border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="border-b border-neutral-800 text-white font-bold bg-neutral-900/60">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-neutral-800/80">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-neutral-900/40 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="py-2.5 px-4 font-bold text-white text-sm">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="py-2.5 px-4 text-sm text-neutral-300 align-top">
      {children}
    </td>
  ),
  ul: ({ children }: any) => (
    <ul className="space-y-1.5 my-2 pl-1 text-sm sm:text-base text-neutral-200">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-outside space-y-1.5 my-2 pl-5 text-sm sm:text-base text-neutral-200 font-medium">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm sm:text-base text-neutral-200 leading-relaxed">
      {children}
    </li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className="bg-neutral-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props}>
          {children}
        </code>
      );
    }

    const codeStr = String(children || '').trim();
    if (
      className?.includes('language-mermaid') ||
      codeStr.startsWith('graph TD') ||
      codeStr.startsWith('graph LR') ||
      codeStr.startsWith('graph TB') ||
      codeStr.startsWith('flowchart ') ||
      codeStr.startsWith('sequenceDiagram')
    ) {
      return null;
    }

    return (
      <div className="overflow-x-auto my-3 rounded-lg bg-neutral-900 border border-neutral-800 p-3">
        <code className="text-xs sm:text-sm font-mono text-blue-300 block" {...props}>
          {children}
        </code>
      </div>
    );
  },
  hr: () => <hr className="my-4 border-neutral-800" />,
};

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
  onExitChat?: () => void;
  isUploading?: boolean;
  uploadingFileName?: string | null;
  uploadSuccessNotice?: { docName: string; chunkCount: number; fileSize: number; fileType: string } | null;
  uploadError?: string | null;
  onDismissUploadNotice?: () => void;
  onRetryUpload?: () => void;
  lastUploadedDocId?: string | null;
  uploadProgress?: UploadProgressState | null;
  onAbortUpload?: () => void;
  onDeleteDoc?: (id: string) => void;
  onToggleDocSelection?: (id: string) => void;
  onOpenHistory?: () => void;
  sessionsCount?: number;
  recentSessions?: ChatSession[];
  onSelectSession?: (session: ChatSession) => void;
  preciseOutput?: boolean;
  onTogglePreciseOutput?: () => void;
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
  onExitChat,
  isUploading = false,
  uploadingFileName,
  uploadSuccessNotice,
  uploadError,
  onDismissUploadNotice,
  onRetryUpload,
  lastUploadedDocId,
  uploadProgress,
  onAbortUpload,
  onDeleteDoc,
  onToggleDocSelection,
  onOpenHistory,
  sessionsCount = 0,
  recentSessions = [],
  onSelectSession,
  preciseOutput,
  onTogglePreciseOutput,
}) => {
  const [internalPreciseOutput, setInternalPreciseOutput] = useState(false);
  const isPrecise = preciseOutput !== undefined ? preciseOutput : (settings?.preciseOutput ?? internalPreciseOutput);

  const handleTogglePrecise = () => {
    if (onTogglePreciseOutput) {
      onTogglePreciseOutput();
    } else {
      setInternalPreciseOutput(prev => !prev);
    }
  };

  const [inputQuery, setInputQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [thinkMode, setThinkMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Track message IDs that have already finished typing so they don't re-stream on reload or tab switch
  const completedMessageIdsRef = useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const prevMessagesLengthRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isLoading);
  const hasInitialScrolledRef = useRef(false);

  // Mark all existing messages as completed whenever messages change without active generation
  // (e.g., loading chat history or selecting saved sessions)
  useEffect(() => {
    if (!isLoading && !prevIsLoadingRef.current) {
      messages.forEach((m) => {
        completedMessageIdsRef.current.add(m.id);
      });
    }
    prevIsLoadingRef.current = isLoading;
  }, [messages, isLoading]);

  // Active citation excerpt overlay state for visually overlaying source text excerpts
  const [activeOverlayCitation, setActiveOverlayCitation] = useState<{
    citation: Citation;
    allCitations: Citation[];
    retrievedChunk?: SearchResult;
    userQuery?: string;
  } | null>(null);
  const [highlightCitationsMode, setHighlightCitationsMode] = useState<boolean>(true);

  const handleTriggerCitationOverlay = useCallback(
    (citation: Citation, msg?: ChatMessage) => {
      // Find the associated message if not explicitly provided
      const targetMsg =
        msg ||
        messages
          .slice()
          .reverse()
          .find((m) =>
            m.citations?.some(
              (c) => c.sourceId === citation.sourceId || (c.chunkId && c.chunkId === citation.chunkId)
            )
          );

      const allCitations =
        targetMsg?.citations && targetMsg.citations.length > 0
          ? targetMsg.citations
          : [citation];

      const matchingChunk = targetMsg?.retrievedChunks?.find(
        (r) =>
          r.chunk.id === citation.chunkId ||
          (r.chunk.docId === citation.docId && r.chunk.chunkIndex === citation.chunkIndex)
      );

      // Find user query prior to this message for intelligent keyword highlighting
      let userQuery = '';
      if (targetMsg) {
        const msgIdx = messages.findIndex((m) => m.id === targetMsg.id);
        if (msgIdx > 0 && messages[msgIdx - 1].sender === 'user') {
          userQuery = messages[msgIdx - 1].content;
        }
      }

      setActiveOverlayCitation({
        citation,
        allCitations,
        retrievedChunk: matchingChunk,
        userQuery,
      });
    },
    [messages]
  );

  const handleSelectCitationInOverlay = useCallback(
    (nextCitation: Citation) => {
      if (!activeOverlayCitation) return;
      const matchingChunk = messages
        .flatMap((m) => m.retrievedChunks || [])
        .find(
          (r) =>
            r.chunk.id === nextCitation.chunkId ||
            (r.chunk.docId === nextCitation.docId && r.chunk.chunkIndex === nextCitation.chunkIndex)
        );

      setActiveOverlayCitation({
        ...activeOverlayCitation,
        citation: nextCitation,
        retrievedChunk: matchingChunk || activeOverlayCitation.retrievedChunk,
      });
    },
    [activeOverlayCitation, messages]
  );

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;

    if (!hasInitialScrolledRef.current) {
      hasInitialScrolledRef.current = true;
      scrollToBottom(false);
      return;
    }

    if (messages.length > prevMessagesLengthRef.current || isLoading) {
      scrollToBottom(true);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isLoading, scrollToBottom]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleFeelingLucky = () => {
    if (isLoading) return;
    const randomSuggestion = GENERAL_SUGGESTIONS[Math.floor(Math.random() * GENERAL_SUGGESTIONS.length)];
    if (inputQuery.trim()) {
      onSendMessage(inputQuery.trim());
      setInputQuery('');
    } else {
      setInputQuery(randomSuggestion);
      onSendMessage(randomSuggestion);
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your current browser. You can type your query in the prompt box.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadFile) {
      onUploadFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
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

  const handleCopyMessage = async (text: string, msgId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        console.error('Copy fallback failed:', err);
      }
    }
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

    // Strip all bracket numbers like [1], [4], [1, 4], [1, 2, 3]
    let text = rawText
      .replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '')
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.!?])\s+[•🔹]\s+/g, '$1\n\n• ')
      .replace(/^•\s*•\s*/gm, '• ')
      .replace(/^[🔹\-]\s+/gm, '• ')
      .replace(/([^\n])\n• /g, '$1\n\n• ')
      .replace(/[ \t]{2,}/g, ' ');

    // Eradicate any boilerplate introductory phrases like "Based on the provided documents,"
    const boilerplateRegex = /(?:^|\n\n?)\s*(?:based on (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|according to (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|from (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as per (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as stated in (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|in (?:the )?(?:provided|uploaded|given)\s*(?:documents?|context|files?|sources?))[,\s:]*/gi;
    text = text.replace(boilerplateRegex, (m) => (m.startsWith('\n') ? '\n\n' : '')).trim();

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
                  className="font-extrabold text-emerald-50 bg-emerald-500/20 px-1 py-0.5 rounded border border-emerald-400/40 shadow-xs"
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
      <div className="space-y-2.5 text-xs sm:text-sm text-emerald-50 leading-relaxed font-sans">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1" />;

          if (trimmed.startsWith('#')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            const isTopHeading = lIdx === 0;
            return (
              <div
                key={lIdx}
                className={`flex items-center gap-2 border-b border-emerald-500/30 pb-2 mb-2 ${
                  isTopHeading ? 'pt-0.5' : 'pt-2'
                }`}
              >
                <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-emerald-200 tracking-tight">
                  {headerText}
                </h3>
              </div>
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
                <span className="font-bold text-emerald-400 shrink-0 text-sm">{bulletPrefix}</span>
                <span className="flex-1 text-emerald-100">{highlightKeyMetrics(cleanContent)}</span>
              </div>
            );
          }

          return (
            <div key={lIdx} className="py-0.5 text-emerald-100">
              {highlightKeyMetrics(line)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rounded-2xl flex flex-col h-full overflow-hidden shadow-2xl border bg-black border-neutral-850 text-neutral-100">
      {/* Top Active Documents Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 shrink-0 border-b bg-neutral-950 border-neutral-850 text-white">
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
          {onExitChat && (
            <button
              type="button"
              onClick={() => {
                completedMessageIdsRef.current.clear();
                setInputQuery('');
                onExitChat();
              }}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white border border-neutral-700 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Exit chat and return to the Workspace Area (conversation saved to History)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exit Chat</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setInputQuery('');
              if (onExitChat) {
                onExitChat();
              } else {
                onResetChat?.();
              }
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

          {onResetChat && (
            <button
              type="button"
              onClick={() => {
                completedMessageIdsRef.current.clear();
                setInputQuery('');
                onResetChat();
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105"
              title="Reset chat conversation"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
              <span>Reset Chat</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105"
              title="View and load previous chat sessions from local storage"
            >
              <History className="w-3.5 h-3.5 text-indigo-300" />
              <span>History {sessionsCount > 0 ? `(${sessionsCount})` : ''}</span>
            </button>
          )}

          {/* Highlight Citations Feature Toggle */}
          <button
            type="button"
            onClick={() => setHighlightCitationsMode(!highlightCitationsMode)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
              highlightCitationsMode
                ? 'bg-indigo-600/40 text-cyan-200 border-indigo-400/50 shadow-indigo-950/30'
                : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border-white/20'
            }`}
            title="Toggle Highlight Citations (prominently badges source references and enables excerpt overlay on click)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${highlightCitationsMode ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
            <span>Highlight Citations</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                highlightCitationsMode
                  ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-400/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {highlightCitationsMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Precise Output (2-3 Bullet Points) Button */}
          <button
            type="button"
            onClick={handleTogglePrecise}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
              isPrecise
                ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border-white/20'
            }`}
            title="Toggle Precise Output: Restricts AI responses to concise 2-3 line bullet points"
          >
            <Target className={`w-3.5 h-3.5 ${isPrecise ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
            <span>Precise Output</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                isPrecise
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-400/40'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isPrecise ? '2-3 Bullets' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Upload Notification Banner (Auto-dismisses after 5 seconds) */}
      {uploadSuccessNotice && (
        <div
          className={`mx-4 mt-3 relative overflow-hidden p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-300 border ${
            theme === 'dark'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
              : 'bg-emerald-50 border-emerald-200/90 text-emerald-950 shadow-emerald-100/60'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="truncate flex items-center gap-1.5 flex-wrap">
              <span className={theme === 'dark' ? 'font-extrabold text-white' : 'font-extrabold text-slate-900'}>
                Successfully Uploaded & Indexed:
              </span>
              <span className={`font-bold font-mono truncate ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'}`}>
                {uploadSuccessNotice.docName}
              </span>
              <span className={`text-[11px] font-normal ${theme === 'dark' ? 'text-emerald-200/70' : 'text-slate-500'}`}>
                ({uploadSuccessNotice.chunkCount} vector chunks created)
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md hidden sm:inline ${
                theme === 'dark'
                  ? 'bg-emerald-900/60 text-emerald-300/80 border border-emerald-700/50'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
              title="Will automatically disappear after 5 seconds"
            >
              5s
            </span>
            {onDismissUploadNotice && (
              <button
                onClick={onDismissUploadNotice}
                className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                  theme === 'dark'
                    ? 'hover:bg-emerald-800/40 text-emerald-300 hover:text-white'
                    : 'hover:bg-emerald-100/80 text-slate-600 hover:text-slate-900'
                }`}
                title="Dismiss immediately"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {/* Visual 5-second countdown indicator bar */}
          <div
            className="absolute bottom-0 left-0 h-[2.5px] bg-emerald-500"
            style={{
              animation: 'shrinkWidth 5s linear forwards',
            }}
          />
        </div>
      )}

      {uploadError && (
        <div className="mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold text-rose-950 truncate">
              Upload Notice:{' '}
              {typeof uploadError === 'string' && !uploadError.includes('[object Object]')
                ? uploadError
                : typeof uploadError === 'object' && uploadError !== null
                  ? (uploadError as any).message || (uploadError as any).error || JSON.stringify(uploadError)
                  : 'Document upload encountered an issue. Please retry.'}
            </span>
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


      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          /* Google Gemini-style Centered Prompt & Ingestion Interface (Image 2 style) */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 max-w-4xl mx-auto my-auto animate-in fade-in duration-300">
            {/* Header: Title with 4-pointed Gemini geometric star outline */}
            <div className="flex items-center justify-center gap-3.5 mb-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-white font-sans">
                IntraMind Workspace
              </h2>
              {/* Signature 4-pointed Gemini Sparkle Star Icon (concave curved outline) */}
              <div className="shrink-0 text-slate-300 hover:text-white transition-colors">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300/90 stroke-current fill-none stroke-[1.4] transition-transform hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4771 12 22C12 16.4771 16.4771 12 22 12C16.4771 12 12 7.52285 12 2Z" />
                </svg>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mb-8 leading-relaxed font-normal">
              Single unified RAG workspace. Ask questions across your PDF, Word, PNG/JPG, JSON, and TXT files with highlighted key insights and verified citations.
            </p>

            {/* If upload progress is active, display the full upload progress card */}
            {uploadProgress && uploadProgress.stage !== 'idle' ? (
              <div className="w-full max-w-2xl mb-6">
                <UploadProgressIndicator
                  progress={uploadProgress}
                  onAbort={onAbortUpload || (() => {})}
                  theme={theme}
                  variant="card"
                />
              </div>
            ) : null}

            {/* Large Gemini-style Prompt Input & Drag-and-Drop Capsule */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`w-full max-w-3xl relative rounded-3xl p-[1px] transition-all duration-300 shadow-2xl group ${
                isDragOver
                  ? 'bg-gradient-to-r from-blue-500 via-teal-400 via-amber-400 to-rose-500 ring-4 ring-indigo-500/20 scale-[1.01]'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {/* Inner Capsule Container */}
              <div className="w-full bg-[#1e1f20] hover:bg-[#202124] rounded-[23px] p-4 sm:p-5 flex flex-col text-left transition-colors">
                {/* Uploaded File Pill(s) inside top of prompt container */}
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-4 animate-in fade-in zoom-in-95 duration-200">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative inline-flex items-center gap-3 bg-[#2f3033] hover:bg-[#383a3e] border border-white/5 rounded-2xl py-2 px-3.5 pr-4 transition-all shadow-sm group"
                      >
                        {/* Outline Document Icon matching screenshot */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-200 shrink-0">
                          <svg
                            className="w-5 h-5 text-slate-200 stroke-current fill-none stroke-[1.8]"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        {/* Title & File subtitle */}
                        <div className="flex flex-col min-w-0 pr-1 text-left">
                          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[180px] sm:max-w-[280px]">
                            {doc.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            File
                          </span>
                        </div>

                        {/* Top-Right Dismiss Circular 'X' Button */}
                        {onDeleteDoc && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDoc(doc.id);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#80868b] hover:bg-[#9aa0a6] text-[#1e1f20] hover:text-black flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                            title={`Remove ${doc.name}`}
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Input Row: + | Ask anything | Blue Up Arrow */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Left: Plus (+) Icon + Text Input */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Upload and index file (PDF, DOCX, Images, JSON, TXT)"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      ) : (
                        <Plus className="w-6 h-6 stroke-[1.8]" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Ask anything"
                      disabled={isLoading || isUploading}
                      className="bg-transparent border-0 text-sm sm:text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 font-sans w-full leading-relaxed"
                    />
                  </div>

                  {/* Right Tools: Precise Output Toggle + Blue Up Arrow Send Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTogglePrecise}
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none ${
                        isPrecise
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/10'
                      }`}
                      title="Precise Output: Generate concise 2 to 3 line bullet point answers"
                    >
                      <Target className={`w-3.5 h-3.5 ${isPrecise ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">Precise Output</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isPrecise
                            ? 'bg-cyan-400/30 text-cyan-200 border border-cyan-400/40'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isPrecise ? '2-3 Bullets' : 'Off'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={isLoading || (!inputQuery.trim() && documents.length === 0)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      title="Send"
                    >
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Saved Conversations from Local Storage */}
            {recentSessions && recentSessions.length > 0 && (
              <div className="w-full max-w-3xl mt-6 text-left animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recent Saved Conversations</span>
                  </div>
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
                    >
                      View all ({sessionsCount || recentSessions.length}) →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recentSessions.slice(0, 4).map((sess) => (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => onSelectSession?.(sess)}
                      className="text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 flex-1">
                          {sess.title}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-medium ml-1">
                          {formatTimeAgo(sess.updatedAt || sess.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-slate-400 w-full">
                        <span>{sess.messages.length} message{sess.messages.length === 1 ? '' : 's'}</span>
                        <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                          Resume →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Drag & drop helper / clean empty spacer */}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isLatest = index === messages.length - 1;

            if (msg.sender === 'user') {
              return (
                <div key={msg.id} className="flex justify-end w-full my-3 px-1 animate-in fade-in">
                  <div className="bg-[#1a56db] text-white px-5 py-2.5 rounded-full text-sm sm:text-base font-normal max-w-[85%] sm:max-w-[70%] shadow-sm break-words">
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
                onTriggerCitationOverlay={(citation) => handleTriggerCitationOverlay(citation, msg)}
                selectedCitationSourceId={activeOverlayCitation?.citation.sourceId}
                isHighlightCitationsEnabled={highlightCitationsMode}
                handleCopyMessage={handleCopyMessage}
                copiedMsgId={copiedMsgId}
                toggleSourceAccordion={toggleSourceAccordion}
                isSourceExpanded={!!expandedSources[msg.id]}
                renderHighlightedContent={renderHighlightedContent}
                completedMessageIdsRef={completedMessageIdsRef}
                onStreamStep={scrollToBottom}
              />
            );
          })
        )}

        {/* Enhanced Loading Typing Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-2 py-3 px-1 animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <div className="w-5 h-5 bg-neutral-900 border border-neutral-800 rounded-md flex items-center justify-center text-blue-400 animate-pulse">
                <Bot className="w-3 h-3" />
              </div>
              <span className="font-semibold text-neutral-300">IntraMind AI</span>
              <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Generating response...
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-neutral-400 pl-7">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
              </div>
              <span className="text-neutral-300 font-medium animate-pulse">
                {LOADING_STEPS[loadingStep]}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Gemini-style bottom input bar during active chat (clean, no suggestions, no footer tags) */}
      {messages.length > 0 && (
        <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-850">
          {/* Docked Upload Progress Indicator when active in chat view */}
          {uploadProgress && uploadProgress.stage !== 'idle' && (
            <div className="mb-3 max-w-3xl mx-auto">
              <UploadProgressIndicator
                progress={uploadProgress}
                onAbort={onAbortUpload || (() => {})}
                theme="dark"
                variant="compact"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="w-full relative rounded-3xl p-[1px] bg-white/10 focus-within:bg-white/20 transition-all shadow-xl">
              <div className="w-full bg-[#1e1f20] hover:bg-[#202124] rounded-[23px] p-3.5 sm:p-4 flex flex-col text-left transition-colors">
                {/* Uploaded File Pill(s) inside top of prompt container */}
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="relative inline-flex items-center gap-2.5 bg-[#2f3033] hover:bg-[#383a3e] border border-white/5 rounded-2xl py-1.5 px-3 pr-3.5 transition-all shadow-sm group"
                      >
                        {/* Outline Document Icon matching screenshot */}
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-200 shrink-0">
                          <svg
                            className="w-4 h-4 text-slate-200 stroke-current fill-none stroke-[1.8]"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        {/* Title & File subtitle */}
                        <div className="flex flex-col min-w-0 pr-1 text-left">
                          <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[160px] sm:max-w-[240px]">
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            File
                          </span>
                        </div>

                        {/* Top-Right Dismiss Circular 'X' Button */}
                        {onDeleteDoc && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDoc(doc.id);
                            }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#80868b] hover:bg-[#9aa0a6] text-[#1e1f20] hover:text-black flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
                            title={`Remove ${doc.name}`}
                          >
                            <X className="w-2.5 h-2.5 stroke-[3]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Input Row: + | Ask anything | Blue Up Arrow */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  {/* Left: Plus (+) Icon + Text Input */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      title="Upload and index file (PDF, DOCX, Images, JSON, TXT)"
                    >
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Ask anything"
                      disabled={isLoading || isUploading}
                      className="bg-transparent border-0 text-sm sm:text-base text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-0 font-sans w-full leading-relaxed"
                    />
                  </div>

                  {/* Right Tools: Precise Output Toggle + Blue Up Arrow Send Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTogglePrecise}
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none ${
                        isPrecise
                          ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-white/10'
                      }`}
                      title="Precise Output: Generate concise 2 to 3 line bullet point answers"
                    >
                      <Target className={`w-3.5 h-3.5 ${isPrecise ? 'text-cyan-300 animate-pulse' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">Precise Output</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isPrecise
                            ? 'bg-cyan-400/30 text-cyan-200 border border-cyan-400/40'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {isPrecise ? '2-3 Bullets' : 'Off'}
                      </span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || (!inputQuery.trim() && documents.length === 0)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      title="Send"
                    >
                      <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Visual Overlay for Citation Excerpts */}
      {activeOverlayCitation && (
        <CitationExcerptOverlay
          citation={activeOverlayCitation.citation}
          allCitations={activeOverlayCitation.allCitations}
          retrievedChunk={activeOverlayCitation.retrievedChunk}
          userQuery={activeOverlayCitation.userQuery}
          theme={theme}
          onClose={() => setActiveOverlayCitation(null)}
          onSelectCitation={handleSelectCitationInOverlay}
          onOpenInViewer={onSelectCitation}
        />
      )}
    </div>
  );
};

interface StreamingAssistantMessageProps {
  msg: ChatMessage;
  isLatest: boolean;
  onSelectCitation: (citation: Citation) => void;
  onTriggerCitationOverlay: (citation: Citation) => void;
  selectedCitationSourceId?: number;
  isHighlightCitationsEnabled?: boolean;
  handleCopyMessage: (text: string, msgId: string) => void;
  copiedMsgId: string | null;
  toggleSourceAccordion: (msgId: string) => void;
  isSourceExpanded: boolean;
  renderHighlightedContent: (msg: ChatMessage, overrideText?: string) => React.ReactNode;
  completedMessageIdsRef: React.MutableRefObject<Set<string>>;
  onStreamStep?: () => void;
}

const StreamingAssistantMessage: React.FC<StreamingAssistantMessageProps> = ({
  msg,
  isLatest,
  onSelectCitation,
  onTriggerCitationOverlay,
  selectedCitationSourceId,
  isHighlightCitationsEnabled = true,
  handleCopyMessage,
  copiedMsgId,
  toggleSourceAccordion,
  isSourceExpanded,
  completedMessageIdsRef,
  onStreamStep,
}) => {
  // Pre-clean boilerplate phrase, diagrams, and bracket citations once from the message while protecting legitimate code blocks
  const fullContent = useMemo(() => {
    if (!msg.content) return '';

    let text = msg.content
      // Completely strip any Graphical Explanation sections, mermaid blocks, or graph definitions
      .replace(/#{1,4}\s*(?:📊\s*)?Graphical Explanation[\s\S]*?(?=(?:#{1,4}\s|\n\n[•\d]|$))/gi, '')
      .replace(/```(?:mermaid)?\s*[\r\n]+(?:graph|flowchart|sequenceDiagram|classDiagram)[\s\S]*?```/gi, '')
      .replace(/(?:^|\n)graph\s+(?:TD|LR|TB|RL)[\s\S]*?(?=(?:\n\n|\n#{1,4}|$))/gi, '')
      .trim();

    const codeBlocks: string[] = [];
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_PLACEHOLDER_${codeBlocks.length - 1}__`;
    });

    text = text
      .replace(/(?:^|\n\n?)\s*(?:based on (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|according to (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|from (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as per (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|as stated in (?:the )?(?:provided|uploaded|given)?\s*(?:documents?|context|files?|sources?)|in (?:the )?(?:provided|uploaded|given)\s*(?:documents?|context|files?|sources?))[,\s:]*/gi, (m) => m.startsWith('\n') ? '\n\n' : '')
      .replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '')
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/([.!?])\s+[•🔹]\s+/g, '$1\n\n• ')
      .replace(/^•\s*•\s*/gm, '• ')
      .replace(/^[🔹\-]\s+/gm, '• ')
      .replace(/([^\n])\n• /g, '$1\n\n• ')
      .trim();

    text = text.replace(/__CODE_BLOCK_PLACEHOLDER_(\d+)__/g, (_, idx) => {
      return codeBlocks[parseInt(idx, 10)] || '';
    });

    return text;
  }, [msg.content]);

  const alreadyFinished = !isLatest || completedMessageIdsRef.current.has(msg.id) || !fullContent;

  const [visibleCount, setVisibleCount] = useState<number>(
    alreadyFinished ? fullContent.length : 0
  );
  const [isTypingComplete, setIsTypingComplete] = useState<boolean>(alreadyFinished);
  const lastScrollTimeRef = useRef<number>(0);

  // If this message is marked completed, ensure full content is displayed immediately without replay
  useEffect(() => {
    if (completedMessageIdsRef.current.has(msg.id)) {
      setVisibleCount(fullContent.length);
      setIsTypingComplete(true);
    }
  }, [msg.id, fullContent.length, completedMessageIdsRef]);

  // Incremental streaming typing effect
  useEffect(() => {
    if (alreadyFinished || isTypingComplete) {
      if (!completedMessageIdsRef.current.has(msg.id)) {
        completedMessageIdsRef.current.add(msg.id);
      }
      return;
    }

    // Adaptive natural step size based on answer length:
    // Short responses (~250 chars) take ~1.3s
    // Medium responses (~900 chars) take ~2.2s
    // Long responses (~2000 chars) take ~2.8s
    const stepSize = Math.max(2, Math.min(12, Math.ceil(fullContent.length / 130)));
    const intervalMs = 18;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        const next = prev + stepSize;
        if (next >= fullContent.length) {
          setIsTypingComplete(true);
          completedMessageIdsRef.current.add(msg.id);
          clearInterval(interval);
          onStreamStep?.();
          return fullContent.length;
        }

        // Throttle auto-scroll calls so the chat smoothly follows cursor
        const now = Date.now();
        if (now - lastScrollTimeRef.current > 100) {
          lastScrollTimeRef.current = now;
          onStreamStep?.();
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [alreadyFinished, isTypingComplete, fullContent.length, msg.id, onStreamStep, completedMessageIdsRef]);

  const handleSkipTyping = () => {
    setVisibleCount(fullContent.length);
    setIsTypingComplete(true);
    completedMessageIdsRef.current.add(msg.id);
    onStreamStep?.();
  };

  const displayedContent = isTypingComplete ? fullContent : fullContent.slice(0, visibleCount);

  // Custom markdown components supporting interactive inline citation links
  const customMarkdownComponents = useMemo(() => {
    return {
      ...markdownComponents,
      a: ({ href, children }: any) => {
        if (href && href.startsWith('#cite-')) {
          const sourceNum = parseInt(href.replace('#cite-', ''), 10);
          const matchedCitation = msg.citations?.find((c) => c.sourceId === sourceNum);
          const isSelected = selectedCitationSourceId === sourceNum;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (matchedCitation) {
                  onTriggerCitationOverlay(matchedCitation);
                } else if (msg.citations && msg.citations.length > 0) {
                  onTriggerCitationOverlay(msg.citations[0]);
                }
              }}
              className={`inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer shadow-2xs hover:scale-110 active:scale-95 align-baseline ${
                isSelected
                  ? 'bg-emerald-500/35 text-emerald-200 border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm shadow-emerald-500/30 scale-105'
                  : isHighlightCitationsEnabled
                    ? 'bg-indigo-500/25 hover:bg-indigo-500/45 text-cyan-300 border border-indigo-400/40 ring-1 ring-indigo-400/30'
                    : 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/25'
              }`}
              title={`Click to visually overlay source excerpt for [Source ${sourceNum}]`}
            >
              {children}
            </button>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline hover:text-sky-300 transition-colors"
          >
            {children}
          </a>
        );
      },
    };
  }, [msg.citations, onTriggerCitationOverlay, selectedCitationSourceId, isHighlightCitationsEnabled]);

  const formattedDisplayedContent = useMemo(() => {
    if (isTypingComplete) {
      return fullContent;
    }
    // While typing, if a code block fence is opened but unclosed, close it so markdown doesn't break
    let raw = displayedContent;
    const backtickMatches = raw.match(/```/g);
    if (backtickMatches && backtickMatches.length % 2 !== 0) {
      raw += '\n```';
    }
    return raw;
  }, [isTypingComplete, fullContent, displayedContent]);

  return (
    <div
      className="flex flex-col items-start w-full my-3 px-1 max-w-4xl animate-in fade-in duration-200"
      onClick={() => {
        if (!isTypingComplete) {
          handleSkipTyping();
        }
      }}
    >
      {/* Sender Badge & Actions Bar */}
      <div className="flex items-center justify-between w-full mb-1 text-xs text-neutral-400">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-neutral-900 border border-neutral-800 rounded-md flex items-center justify-center text-blue-400 shadow-2xs">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-neutral-300 font-bold text-xs">IntraMind AI</span>

          {!isTypingComplete ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/25 animate-pulse">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400"></span>
              </span>
              Streaming response...
            </span>
          ) : (
            msg.reasoningTimeMs && (
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-neutral-500" />
                {msg.reasoningTimeMs}ms
              </span>
            )
          )}
        </div>

        <div className="flex items-center space-x-2">
          {!isTypingComplete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSkipTyping();
              }}
              className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/25 transition-all cursor-pointer font-medium active:scale-95 shadow-xs"
              title="Skip typing animation and show full answer immediately"
            >
              <FastForward className="w-3 h-3" />
              <span>Skip</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyMessage(fullContent || displayedContent, msg.id);
            }}
            className={`text-[11px] flex items-center gap-1.5 cursor-pointer font-medium px-2 py-0.5 rounded-md transition-all border ${
              copiedMsgId === msg.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80 border-transparent hover:border-neutral-700'
            }`}
            title="Copy response to clipboard"
          >
            {copiedMsgId === msg.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Direct Content Area on Canvas - Rendered with Markdown */}
      <div className="w-full text-sm sm:text-base text-neutral-200 leading-relaxed py-1" id={`msg-content-${msg.id}`}>
        <Markdown remarkPlugins={[remarkGfm]} components={customMarkdownComponents}>
          {formattedDisplayedContent}
        </Markdown>
        {!isTypingComplete && (
          <span
            className="inline-block w-2 h-4.5 bg-sky-400 align-middle ml-1 rounded-xs animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            aria-label="typing caret"
          />
        )}
      </div>

      {/* Assistant Message Actions Toolbar - Dedicated Copy and Overlay Citations Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full mt-2.5 pt-2 border-t border-neutral-850/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyMessage(fullContent || displayedContent, msg.id);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
              copiedMsgId === msg.id
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-emerald-950/20'
                : 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
            }`}
            title="Copy assistant response to clipboard"
          >
            {copiedMsgId === msg.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 animate-in zoom-in-50" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          {msg.citations && msg.citations.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerCitationOverlay(msg.citations[0]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
                selectedCitationSourceId
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60 ring-1 ring-emerald-400/40'
                  : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-cyan-300 hover:text-cyan-200 border-indigo-500/30 hover:border-indigo-400/50'
              }`}
              title="Visually overlay source text excerpts from retrieved document chunks"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Overlay Citations ({msg.citations.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
          <span>{fullContent.split(/\s+/).filter(Boolean).length} words</span>
          {msg.reasoningTimeMs && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {msg.reasoningTimeMs}ms
              </span>
            </>
          )}
        </div>
      </div>

      {/* Interactive Citation Chips */}
      {isTypingComplete && msg.citations && msg.citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-neutral-850/80 animate-in fade-in duration-300">
          <span className="text-[11px] text-neutral-400 font-semibold flex items-center gap-1 mr-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Verified Sources:</span>
          </span>
          {msg.citations.map((c) => (
            <CitationCard
              key={c.chunkId || c.sourceId}
              citation={c}
              onSelectCitation={onTriggerCitationOverlay}
              isSelected={selectedCitationSourceId === c.sourceId}
              isHighlighted={isHighlightCitationsEnabled}
            />
          ))}
        </div>
      )}

      {/* Retrieved Vector Chunks Accordion */}
      {isTypingComplete && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
        <div className="w-full mt-3 pt-2 border-t border-neutral-900 animate-in fade-in duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSourceAccordion(msg.id);
            }}
            className="flex items-center justify-between text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-900 px-3.5 py-2 rounded-xl border border-neutral-850 transition-all cursor-pointer w-full"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Full Source Passages ({msg.retrievedChunks.length} chunks analyzed)</span>
            </span>
            {isSourceExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {isSourceExpanded && (
            <div className="mt-2 space-y-2 p-3 bg-neutral-950 rounded-xl border border-neutral-850 text-xs text-neutral-300 animate-in fade-in">
              {msg.retrievedChunks.map((ret, idx) => {
                const isSelected = selectedCitationSourceId === idx + 1;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const citationObj: Citation = {
                        sourceId: idx + 1,
                        chunkId: ret.chunk.id,
                        docId: ret.chunk.docId,
                        docName: ret.chunk.docName,
                        pageNumber: ret.chunk.pageNumber,
                        chunkIndex: ret.chunk.chunkIndex,
                        textSnippet: ret.chunk.text,
                        similarity: ret.similarity,
                      };
                      onTriggerCitationOverlay(citationObj);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/40 shadow-lg'
                        : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800'
                    }`}
                    title="Click to visually overlay source excerpt"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                      <span className="font-bold text-neutral-200 flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          Source [{idx + 1}]
                        </span>
                        <span>
                          {ret.chunk.docName} (Page {ret.chunk.pageNumber})
                        </span>
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded border text-[10px] ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'text-blue-400 bg-neutral-950 border-neutral-800'
                        }`}
                      >
                        {ret.scorePercentage}% Vector Match
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300 line-clamp-3 italic leading-relaxed">
                      "{ret.chunk.text}"
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Chunk #{ret.chunk.chunkIndex}</span>
                      <span className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                        Overlay Excerpt →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
