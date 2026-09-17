import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send, Bot, User, ShieldCheck, ChevronDown, ChevronUp, Clock, Layers, Upload,
  Copy, Check, Lightbulb, BookmarkCheck, FileText, Plus, HardDrive, Loader2, CheckCircle2,
  AlertCircle, X, FileCheck, RotateCcw, MessageSquare, StopCircle, Mic, MicOff, Brain, ArrowUp,
  FastForward, History, Target, ArrowLeft
} from 'lucide-react';
import { ChatMessage, Citation, SearchResult, RAGSettings, PDFDocument, UploadProgressState, ChatSession } from '../types';
import { CitationCard } from './CitationCard';
import { CitationExcerptOverlay } from './CitationExcerptOverlay';
import { UploadProgressIndicator } from './UploadProgressIndicator';
import { formatTimeAgo } from '../lib/chatStorage';

const getMarkdownComponents = (theme: 'light' | 'dark' = 'dark') => ({
  h1: ({ children }: any) => (
    <h1 className={`text-xl sm:text-2xl font-bold mt-4 mb-2 flex items-center gap-2 ${
      theme === 'dark' ? 'text-white' : 'text-slate-800'
    }`}>
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className={`text-lg sm:text-xl font-bold mt-4 mb-2 flex items-center gap-2 ${
      theme === 'dark' ? 'text-white' : 'text-slate-800'
    }`}>
      {children}
    </h2>
  ),
  h3: ({ children }: any) => {
    const text = String(children || '');
    if (/graphical\s*explanation/i.test(text)) {
      return null;
    }
    return (
      <h3 className={`text-base sm:text-lg font-bold mt-3.5 mb-2 flex items-center gap-2 ${
        theme === 'dark' ? 'text-white' : 'text-slate-800'
      }`}>
        {children}
      </h3>
    );
  },
  h4: ({ children }: any) => (
    <h4 className={`text-sm sm:text-base font-bold mt-3 mb-1 flex items-center gap-2 ${
      theme === 'dark' ? 'text-white' : 'text-slate-800'
    }`}>
      {children}
    </h4>
  ),
  p: ({ children }: any) => (
    <p className={`text-sm sm:text-base leading-relaxed my-2.5 ${
      theme === 'dark' ? 'text-neutral-200' : 'text-slate-700'
    }`}>
      {children}
    </p>
  ),
  strong: ({ children }: any) => (
    <strong className={`font-semibold tracking-wide ${
      theme === 'dark' ? 'text-white' : 'text-slate-800'
    }`}>
      {children}
    </strong>
  ),
  blockquote: ({ children }: any) => (
    <div className={`my-3.5 p-3.5 sm:p-4 rounded-xl border-l-4 text-sm leading-relaxed ${
      theme === 'dark'
        ? 'bg-neutral-900/80 border-emerald-500 text-neutral-200'
        : 'bg-[#edf1f5] border-emerald-600 text-slate-700'
    }`}>
      {children}
    </div>
  ),
  table: ({ children }: any) => (
    <div className={`overflow-x-auto my-3 w-full rounded-lg border ${
      theme === 'dark'
        ? 'border-neutral-800 bg-neutral-950/40'
        : 'border-slate-200/80 bg-[#f7f9fb] shadow-xs'
    }`}>
      <table className={`w-full text-left text-sm border-collapse ${
        theme === 'dark' ? 'text-neutral-200' : 'text-slate-700'
      }`}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className={`border-b font-bold ${
      theme === 'dark'
        ? 'border-neutral-800 text-white bg-neutral-900/60'
        : 'border-slate-200/80 text-slate-700 bg-[#edf1f5]'
    }`}>
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className={`divide-y ${
      theme === 'dark' ? 'divide-neutral-800/80' : 'divide-slate-200/70'
    }`}>
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className={`transition-colors ${
      theme === 'dark' ? 'hover:bg-neutral-900/40' : 'hover:bg-slate-100/60'
    }`}>
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className={`py-2.5 px-4 font-bold text-sm ${
      theme === 'dark' ? 'text-white' : 'text-slate-700'
    }`}>
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className={`py-2.5 px-4 text-sm align-top ${
      theme === 'dark' ? 'text-neutral-300' : 'text-slate-600'
    }`}>
      {children}
    </td>
  ),
  ul: ({ children }: any) => (
    <ul className={`space-y-1.5 my-2 pl-1 text-sm sm:text-base ${
      theme === 'dark' ? 'text-neutral-200' : 'text-slate-700'
    }`}>
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className={`list-decimal list-outside space-y-1.5 my-2 pl-5 text-sm sm:text-base font-medium ${
      theme === 'dark' ? 'text-neutral-200' : 'text-slate-700'
    }`}>
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className={`text-sm sm:text-base leading-relaxed ${
      theme === 'dark' ? 'text-neutral-200' : 'text-slate-700'
    }`}>
      {children}
    </li>
  ),
  code: ({ inline, className, children, ...props }: any) => {
    if (inline) {
      return (
        <code className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${
          theme === 'dark'
            ? 'bg-neutral-800 text-emerald-300'
            : 'bg-[#e9edf2] text-emerald-800 border border-slate-300/60'
        }`} {...props}>
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
      <div className={`overflow-x-auto my-3 rounded-xl border p-3.5 ${
        theme === 'dark'
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-[#1e293b] border-slate-700/60 shadow-xs'
      }`}>
        <code className="text-xs sm:text-sm font-mono text-emerald-300 block" {...props}>
          {children}
        </code>
      </div>
    );
  },
  hr: () => (
    <hr className={`my-4 ${
      theme === 'dark' ? 'border-neutral-800' : 'border-slate-200'
    }`} />
  ),
});

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
  const [highlightCitationsMode, setHighlightCitationsMode] = useState<boolean>(false);

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

  const handleSubmit = (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string' && 'preventDefault' in e) {
      e.preventDefault();
    }
    const queryToSend = typeof e === 'string' ? e : inputQuery;
    if (!queryToSend.trim() || isLoading) return;
    onSendMessage(queryToSend.trim());
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
    <div className={`rounded-2xl flex flex-col h-full overflow-hidden border-2 transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-[#0b0d11] border-neutral-800 text-neutral-100 shadow-2xl ring-1 ring-white/5'
        : 'bg-[#edf7f0] border-emerald-300/90 text-slate-800 shadow-md ring-1 ring-emerald-900/5'
    }`}>
      {/* Top Active Documents Bar */}
      <div className={`px-4 py-2.5 flex items-center justify-between gap-2 shrink-0 border-b-2 transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-[#12151b] border-neutral-800 text-white'
          : 'bg-[#dcf0e2] border-emerald-300 text-slate-800'
      }`}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.json,.txt,.md,.csv,.js,.py,.ts"
          className="hidden"
        />

        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-x-auto py-0.5">
          <span className={`text-[11px] font-bold flex items-center gap-1.5 shrink-0 ${
            theme === 'dark' ? 'text-indigo-300' : 'text-emerald-800'
          }`}>
            <HardDrive className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
            <span>Active Context:</span>
          </span>

          {uploadProgress && uploadProgress.stage !== 'idle' ? (
            <div className="shrink-0 min-w-[260px] max-w-sm">
              <UploadProgressIndicator
                progress={uploadProgress}
                onAbort={onAbortUpload || (() => {})}
                theme={theme}
                variant="compact"
              />
            </div>
          ) : isUploading ? (
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 shrink-0 shadow-xs animate-pulse border ${
              theme === 'dark'
                ? 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}>
              <Loader2 className={`w-3 h-3 animate-spin ${theme === 'dark' ? 'text-indigo-300' : 'text-emerald-700'}`} />
              <span className="truncate max-w-[150px]">Uploading {uploadingFileName}...</span>
            </div>
          ) : null}

          {documents.length === 0 && !isUploading && (!uploadProgress || uploadProgress.stage === 'idle') ? (
            <span className={`text-[11px] italic shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              No files uploaded yet
            </span>
          ) : (
            documents.map(d => {
              const isJustUploaded = d.id === lastUploadedDocId;
              return (
                <div
                  key={d.id}
                  className={`border px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center space-x-1.5 shrink-0 shadow-xs transition-all ${
                    isJustUploaded
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200 ring-2 ring-emerald-400/30'
                      : theme === 'dark'
                        ? 'bg-neutral-850 border-neutral-700 text-white hover:bg-neutral-800'
                        : 'bg-white border-emerald-300 hover:border-emerald-400 text-slate-800 hover:bg-emerald-50/70 shadow-2xs'
                  }`}
                >
                  {renderMiniBadge(d.name)}
                  <span className="truncate max-w-[120px]">{d.name}</span>
                  {isJustUploaded && (
                    <span className="bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-1 rounded">
                      NEW ✓
                    </span>
                  )}
                  {onDeleteDoc && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteDoc(d.id);
                      }}
                      className={`ml-1 p-0.5 rounded-full cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'text-slate-400 hover:text-rose-400 hover:bg-white/10'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'
                      }`}
                      title={`Remove ${d.name}`}
                      aria-label={`Remove ${d.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
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
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-2xs'
              }`}
              title="Exit chat and return to the Workspace Area (conversation saved to History)"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
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
            className={`px-3 py-1.5 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
              theme === 'dark'
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-950/30'
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
            }`}
            title="Start a new chat and select a document to upload"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat & Upload</span>
          </button>

          {onResetChat && (
            <button
              type="button"
              onClick={() => {
                completedMessageIdsRef.current.clear();
                setInputQuery('');
                onResetChat();
              }}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
                theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-2xs'
              }`}
              title="Reset chat conversation"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} />
              <span>Reset Chat</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
                theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-2xs'
              }`}
              title="View and load previous chat sessions from local storage"
            >
              <History className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-300' : 'text-emerald-700'}`} />
              <span>History {sessionsCount > 0 ? `(${sessionsCount})` : ''}</span>
            </button>
          )}

          {/* Highlight Citations Feature Toggle */}
          <button
            type="button"
            onClick={() => setHighlightCitationsMode(!highlightCitationsMode)}
            className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-105 border ${
              highlightCitationsMode
                ? theme === 'dark'
                  ? 'bg-indigo-600/40 text-cyan-200 border-indigo-400/60 shadow-indigo-950/30'
                  : 'bg-white text-emerald-900 border-2 border-emerald-600 shadow-xs'
                : theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-2xs'
            }`}
            title="Toggle Highlight Citations (prominently badges source references and enables excerpt overlay on click)"
          >
            <BookmarkCheck className={`w-3.5 h-3.5 ${highlightCitationsMode ? (theme === 'dark' ? 'text-cyan-300' : 'text-emerald-700') : 'text-slate-400'}`} />
            <span>Highlight Citations</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                highlightCitationsMode
                  ? theme === 'dark'
                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/30'
                    : 'bg-emerald-200 text-emerald-900 border-emerald-400'
                  : theme === 'dark'
                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
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
                ? theme === 'dark'
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-white text-cyan-900 border-2 border-cyan-600 shadow-xs'
                : theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-2xs'
            }`}
            title="Toggle Precise Output: Restricts AI responses to concise 2-3 line bullet points"
          >
            <Target className={`w-3.5 h-3.5 ${isPrecise ? (theme === 'dark' ? 'text-cyan-300 animate-pulse' : 'text-emerald-700') : 'text-slate-400'}`} />
            <span>Precise Output</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                isPrecise
                  ? theme === 'dark'
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400/40'
                    : 'bg-cyan-200 text-cyan-900 border-cyan-400'
                  : theme === 'dark'
                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
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
          /* Centered Prompt & Ingestion Interface */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 max-w-4xl mx-auto my-auto animate-in fade-in duration-300">
            {/* Header: Title */}
            <div className="flex items-center justify-center gap-3.5 mb-2">
              <h2 className={`text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight font-sans transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}>
                IntraMind Workspace
              </h2>
            </div>

            <p className={`text-xs sm:text-sm max-w-xl mb-8 leading-relaxed font-normal transition-colors ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
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

            {/* Large Prompt Input & Drag-and-Drop Capsule */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`w-full max-w-3xl relative rounded-3xl transition-all duration-200 border-2 shadow-lg group ${
                isDragOver
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 scale-[1.01]'
                  : theme === 'dark'
                    ? 'bg-[#181b20] hover:bg-[#1d2127] border-neutral-700 hover:border-neutral-600 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15'
                    : 'bg-white hover:bg-slate-50/70 border-slate-300 hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/15'
              }`}
            >
              {/* Inner Capsule Container */}
              <div className="w-full rounded-[22px] p-4 sm:p-5 flex flex-col text-left">
                {/* Uploaded File Pill(s) inside top of prompt container */}
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-4 animate-in fade-in zoom-in-95 duration-200">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`relative inline-flex items-center gap-3 rounded-2xl py-2 px-3.5 pr-4 transition-all shadow-xs group border-2 ${
                          theme === 'dark'
                            ? 'bg-[#26282e] hover:bg-[#2e3138] border-neutral-700 text-white'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        {/* Outline Document Icon */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-emerald-700'
                        }`}>
                          <svg
                            className={`w-5 h-5 stroke-current fill-none stroke-[1.8] ${
                              theme === 'dark' ? 'text-slate-200' : 'text-emerald-700'
                            }`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        {/* Title & File subtitle */}
                        <div className="flex flex-col min-w-0 pr-1 text-left">
                          <span className={`text-xs sm:text-sm font-semibold truncate max-w-[180px] sm:max-w-[280px] ${
                            theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                            {doc.name}
                          </span>
                          <span className={`text-[11px] font-normal ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            File
                          </span>
                        </div>

                        {/* Top-Right Dismiss Circular 'X' Button */}
                        {onDeleteDoc && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteDoc(doc.id);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#5f6368] hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer z-30 border border-white/20 active:scale-95"
                            title={`Remove ${doc.name}`}
                            aria-label={`Remove ${doc.name}`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
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
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs ${
                        theme === 'dark'
                          ? 'bg-neutral-800 hover:bg-neutral-750 text-slate-200 hover:text-white border-neutral-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                      }`}
                      title="Upload and index file (PDF, DOCX, Images, JSON, TXT)"
                    >
                      {isUploading ? (
                        <Loader2 className={`w-5 h-5 animate-spin ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
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
                      className={`bg-transparent border-0 text-sm sm:text-base focus:outline-none focus:ring-0 font-sans w-full leading-relaxed ${
                        theme === 'dark'
                          ? 'text-slate-100 placeholder:text-slate-400'
                          : 'text-slate-800 placeholder:text-slate-400'
                      }`}
                    />
                  </div>

                  {/* Right Tools: Precise Output Toggle + Blue Up Arrow Send Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTogglePrecise}
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none shadow-2xs ${
                        isPrecise
                          ? theme === 'dark'
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-cyan-50 text-cyan-900 border-2 border-cyan-500 font-bold'
                          : theme === 'dark'
                            ? 'bg-neutral-800 hover:bg-neutral-750 text-slate-300 hover:text-white border-neutral-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                      }`}
                      title="Precise Output: Generate concise 2 to 3 line bullet point answers"
                    >
                      <Target className={`w-3.5 h-3.5 ${isPrecise ? (theme === 'dark' ? 'text-cyan-400 animate-pulse' : 'text-emerald-700') : 'text-slate-500'}`} />
                      <span className="hidden sm:inline">Precise Output</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                          isPrecise
                            ? theme === 'dark' ? 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40' : 'bg-cyan-200 text-cyan-900 border-cyan-400'
                            : theme === 'dark' ? 'bg-neutral-900 text-neutral-400 border-neutral-750' : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isPrecise ? '2-3 Bullets' : 'Off'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={isLoading || (!inputQuery.trim() && documents.length === 0)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-[#1a73e8] hover:bg-[#1557b0] border-indigo-400/40 disabled:bg-neutral-800 disabled:border-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white'
                      }`}
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
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <History className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span>Recent Saved Conversations</span>
                  </div>
                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className={`text-xs font-medium transition-colors cursor-pointer ${
                        theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
                      }`}
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
                      className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer group shadow-xs flex flex-col justify-between ${
                        theme === 'dark'
                          ? 'bg-neutral-900/80 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700'
                          : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <span className={`text-xs font-semibold group-hover:text-indigo-500 transition-colors line-clamp-1 flex-1 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-800'
                        }`}>
                          {sess.title}
                        </span>
                        <span className={`text-[10px] shrink-0 font-medium ml-1 ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {formatTimeAgo(sess.updatedAt || sess.createdAt)}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between mt-2 pt-2 border-t text-[11px] w-full ${
                        theme === 'dark' ? 'border-neutral-800 text-slate-400' : 'border-slate-200 text-slate-500'
                      }`}>
                        <span>{sess.messages.length} message{sess.messages.length === 1 ? '' : 's'}</span>
                        <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
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
                  <div className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-normal max-w-[85%] sm:max-w-[70%] break-words ${
                    theme === 'dark'
                      ? 'bg-[#1a56db] text-white shadow-sm'
                      : 'bg-[#e2e7ec] text-slate-800 border border-slate-300/60 shadow-xs font-medium'
                  }`}>
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
                theme={theme}
              />
            );
          })
        )}

        {/* Enhanced Loading Typing Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-2 py-3 px-1 animate-in fade-in">
            <div className={`flex items-center space-x-2 text-xs ${theme === 'dark' ? 'text-neutral-400' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center animate-pulse ${
                theme === 'dark'
                  ? 'bg-neutral-900 border border-neutral-800 text-blue-400'
                  : 'bg-slate-100 border border-slate-200 text-emerald-700'
              }`}>
                <Bot className="w-3 h-3" />
              </div>
              <span className={`font-semibold ${theme === 'dark' ? 'text-neutral-300' : 'text-slate-800'}`}>IntraMind AI</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                theme === 'dark'
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                  : 'text-emerald-800 bg-emerald-50 border-emerald-200/80'
              }`}>
                Generating response...
              </span>
            </div>
            <div className={`flex items-center space-x-3 text-xs pl-7 ${theme === 'dark' ? 'text-neutral-400' : 'text-slate-500'}`}>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s] ${
                  theme === 'dark' ? 'bg-blue-400' : 'bg-emerald-600'
                }`} />
                <div className={`w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s] ${
                  theme === 'dark' ? 'bg-blue-400' : 'bg-emerald-600'
                }`} />
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  theme === 'dark' ? 'bg-blue-400' : 'bg-emerald-600'
                }`} />
              </div>
              <span className={`font-medium animate-pulse ${theme === 'dark' ? 'text-neutral-300' : 'text-slate-700'}`}>
                {LOADING_STEPS[loadingStep]}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern bottom input bar during active chat */}
      {messages.length > 0 && (
        <div className={`p-3 sm:p-4 border-t-2 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#12151b] border-neutral-800' : 'bg-[#dcf0e2] border-emerald-300'
        }`}>
          {/* Docked Upload Progress Indicator when active in chat view */}
          {uploadProgress && uploadProgress.stage !== 'idle' && (
            <div className="mb-3 max-w-3xl mx-auto">
              <UploadProgressIndicator
                progress={uploadProgress}
                onAbort={onAbortUpload || (() => {})}
                theme={theme}
                variant="compact"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className={`w-full relative rounded-3xl transition-all duration-200 border-2 shadow-md ${
              theme === 'dark'
                ? 'bg-[#181b20] hover:bg-[#1d2127] border-neutral-700 hover:border-neutral-600 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15'
                : 'bg-white hover:bg-emerald-50/40 border-emerald-300 hover:border-emerald-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/15'
            }`}>
              <div className="w-full rounded-[22px] p-3.5 sm:p-4 flex flex-col text-left">
                {/* Uploaded File Pill(s) inside top of prompt container */}
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`relative inline-flex items-center gap-2.5 rounded-2xl py-1.5 px-3 pr-3.5 transition-all shadow-xs group border-2 ${
                          theme === 'dark'
                            ? 'bg-[#26282e] hover:bg-[#2e3138] border-neutral-700 text-white'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        {/* Outline Document Icon */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                          theme === 'dark' ? 'text-slate-200' : 'text-emerald-700'
                        }`}>
                          <svg
                            className={`w-4 h-4 stroke-current fill-none stroke-[1.8] ${
                              theme === 'dark' ? 'text-slate-200' : 'text-emerald-700'
                            }`}
                            viewBox="0 0 24 24"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>

                        {/* Title & File subtitle */}
                        <div className="flex flex-col min-w-0 pr-1 text-left">
                          <span className={`text-xs sm:text-sm font-semibold truncate max-w-[160px] sm:max-w-[240px] ${
                            theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}>
                            {doc.name}
                          </span>
                          <span className={`text-[10px] font-normal ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            File
                          </span>
                        </div>

                        {/* Top-Right Dismiss Circular 'X' Button */}
                        {onDeleteDoc && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteDoc(doc.id);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#5f6368] hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer z-30 border border-white/20 active:scale-95"
                            title={`Remove ${doc.name}`}
                            aria-label={`Remove ${doc.name}`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[2.5]" />
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
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs ${
                        theme === 'dark'
                          ? 'bg-neutral-800 hover:bg-neutral-750 text-slate-200 hover:text-white border-neutral-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                      }`}
                      title="Upload and index file (PDF, DOCX, Images, JSON, TXT)"
                    >
                      {isUploading ? (
                        <Loader2 className={`w-5 h-5 animate-spin ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
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
                      className={`bg-transparent border-0 text-sm sm:text-base focus:outline-none focus:ring-0 font-sans w-full leading-relaxed ${
                        theme === 'dark'
                          ? 'text-slate-100 placeholder:text-slate-400'
                          : 'text-slate-800 placeholder:text-slate-400'
                      }`}
                    />
                  </div>

                  {/* Right Tools: Precise Output Toggle + Blue Up Arrow Send Button */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleTogglePrecise}
                      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border select-none shadow-2xs ${
                        isPrecise
                          ? theme === 'dark'
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-cyan-50 text-cyan-900 border-2 border-cyan-500 font-bold'
                          : theme === 'dark'
                            ? 'bg-neutral-800 hover:bg-neutral-750 text-slate-300 hover:text-white border-neutral-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                      }`}
                      title="Precise Output: Generate concise 2 to 3 line bullet point answers"
                    >
                      <Target className={`w-3.5 h-3.5 ${isPrecise ? (theme === 'dark' ? 'text-cyan-400 animate-pulse' : 'text-emerald-700') : 'text-slate-500'}`} />
                      <span className="hidden sm:inline">Precise Output</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold border ${
                          isPrecise
                            ? theme === 'dark' ? 'bg-cyan-400/30 text-cyan-200 border-cyan-400/40' : 'bg-cyan-200 text-cyan-900 border-cyan-400'
                            : theme === 'dark' ? 'bg-neutral-900 text-neutral-400 border-neutral-750' : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {isPrecise ? '2-3 Bullets' : 'Off'}
                      </span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || (!inputQuery.trim() && documents.length === 0)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-[#1a73e8] hover:bg-[#1557b0] border-indigo-400/40 disabled:bg-neutral-800 disabled:border-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed text-white'
                      }`}
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
  theme?: 'light' | 'dark';
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
  theme = 'dark',
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
      ...getMarkdownComponents(theme),
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
                  ? 'bg-emerald-600 text-white border-2 border-emerald-700 ring-2 ring-emerald-400/40 shadow-xs scale-105'
                  : isHighlightCitationsEnabled
                    ? theme === 'dark'
                      ? 'bg-indigo-500/25 hover:bg-indigo-500/45 text-cyan-300 border border-indigo-400/40 ring-1 ring-indigo-400/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-2xs'
                    : theme === 'dark'
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/25'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
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
            className="text-sky-600 dark:text-sky-400 underline hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            {children}
          </a>
        );
      },
    };
  }, [theme, msg.citations, onTriggerCitationOverlay, selectedCitationSourceId, isHighlightCitationsEnabled]);

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

  const isDark = theme === 'dark';

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
      <div className={`flex items-center justify-between w-full mb-1 text-xs ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
        <div className="flex items-center space-x-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shadow-2xs ${
            isDark ? 'bg-neutral-900 border border-neutral-800 text-blue-400' : 'bg-[#edf1f5] border border-slate-300/60 text-emerald-700'
          }`}>
            <Bot className="w-3 h-3" />
          </div>
          <span className={`font-bold text-xs ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>IntraMind AI</span>

          {!isTypingComplete ? (
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border animate-pulse ${
              isDark
                ? 'text-sky-400 bg-sky-500/10 border-sky-500/25'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200/80'
            }`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isDark ? 'bg-sky-400' : 'bg-emerald-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  isDark ? 'bg-sky-400' : 'bg-emerald-600'
                }`}></span>
              </span>
              Streaming response...
            </span>
          ) : (
            msg.reasoningTimeMs && (
              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3" />
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
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer font-medium active:scale-95 shadow-2xs ${
                isDark
                  ? 'text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/25'
                  : 'text-slate-600 hover:text-slate-800 bg-[#edf1f5] hover:bg-[#e2e7ec] border-slate-300/60'
              }`}
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
                : isDark
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/80 border-transparent hover:border-neutral-700'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-[#edf1f5] border-transparent hover:border-slate-300/60'
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
      <div className={`w-full text-sm sm:text-base leading-relaxed py-1 ${isDark ? 'text-neutral-200' : 'text-slate-700'}`} id={`msg-content-${msg.id}`}>
        <Markdown remarkPlugins={[remarkGfm]} components={customMarkdownComponents}>
          {formattedDisplayedContent}
        </Markdown>
        {!isTypingComplete && (
          <span
            className="inline-block w-2 h-4.5 bg-emerald-600 dark:bg-sky-400 align-middle ml-1 rounded-xs animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.5)] dark:shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            aria-label="typing caret"
          />
        )}
      </div>

      {/* Assistant Message Actions Toolbar - Dedicated Copy and Overlay Citations Buttons */}
      <div className={`flex flex-wrap items-center justify-between gap-2 w-full mt-2.5 pt-2 border-t text-xs ${
        isDark ? 'border-neutral-800 text-neutral-400' : 'border-slate-200/80 text-slate-500'
      }`}>
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
                : isDark
                  ? 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
                  : 'bg-[#edf1f5] hover:bg-[#e2e7ec] text-slate-700 hover:text-slate-800 border-slate-300/60 hover:border-slate-400/60'
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
                <Copy className="w-3.5 h-3.5" />
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
                  : isDark
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-cyan-300 hover:text-cyan-200 border-indigo-500/30 hover:border-indigo-400/50'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-900 border-emerald-200/90 hover:border-emerald-300 shadow-2xs'
              }`}
              title="Visually overlay source text excerpts from retrieved document chunks"
            >
              <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-emerald-700'}`} />
              <span>Overlay Citations ({msg.citations.length})</span>
            </button>
          )}
        </div>

        <div className={`flex items-center gap-2 text-[11px] font-mono ${isDark ? 'text-neutral-500' : 'text-slate-400'}`}>
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
        <div className={`flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t animate-in fade-in duration-300 ${
          isDark ? 'border-neutral-850/80' : 'border-slate-200/80'
        }`}>
          <span className={`text-[11px] font-semibold flex items-center gap-1 mr-1 ${
            isDark ? 'text-neutral-400' : 'text-slate-600'
          }`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-emerald-700'}`} />
            <span>Verified Sources:</span>
          </span>
          {msg.citations.map((c) => (
            <CitationCard
              key={c.chunkId || c.sourceId}
              citation={c}
              onSelectCitation={onTriggerCitationOverlay}
              isSelected={selectedCitationSourceId === c.sourceId}
              isHighlighted={isHighlightCitationsEnabled}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Retrieved Vector Chunks Accordion */}
      {isTypingComplete && msg.retrievedChunks && msg.retrievedChunks.length > 0 && (
        <div className={`w-full mt-3 pt-2 border-t animate-in fade-in duration-300 ${
          isDark ? 'border-neutral-900' : 'border-slate-200/80'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSourceAccordion(msg.id);
            }}
            className={`flex items-center justify-between text-xs font-medium px-3.5 py-2 rounded-xl border transition-all cursor-pointer w-full ${
              isDark
                ? 'text-neutral-400 hover:text-neutral-200 bg-neutral-950 hover:bg-neutral-900 border-neutral-850'
                : 'text-slate-700 hover:text-slate-900 bg-[#edf1f5] hover:bg-[#e2e7ec] border-slate-300/60 shadow-xs'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-emerald-700'}`} />
              <span>Full Source Passages ({msg.retrievedChunks.length} chunks analyzed)</span>
            </span>
            {isSourceExpanded ? (
              <ChevronUp className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
            ) : (
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`} />
            )}
          </button>

          {isSourceExpanded && (
            <div className={`mt-2 space-y-2 p-3 rounded-xl border text-xs animate-in fade-in ${
              isDark
                ? 'bg-neutral-950 border-neutral-850 text-neutral-300'
                : 'bg-[#f1f4f8] border-slate-200/80 text-slate-700 shadow-inner'
            }`}>
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
                        ? isDark
                          ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/40 shadow-lg'
                          : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                        : isDark
                          ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800'
                          : 'bg-[#edf1f5] hover:bg-[#e2e7ec] border-slate-200/80 shadow-xs'
                    }`}
                    title="Click to visually overlay source excerpt"
                  >
                    <div className={`flex items-center justify-between text-[11px] font-mono mb-1 ${
                      isDark ? 'text-neutral-400' : 'text-slate-500'
                    }`}>
                      <span className={`font-bold flex items-center gap-1.5 ${
                        isDark ? 'text-neutral-200' : 'text-slate-800'
                      }`}>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : isDark
                                ? 'bg-neutral-800 text-neutral-300'
                                : 'bg-slate-200 text-slate-800'
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
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isDark
                              ? 'text-blue-400 bg-neutral-950 border-neutral-800'
                              : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        {ret.scorePercentage}% Vector Match
                      </span>
                    </div>
                    <p className={`text-[11px] line-clamp-3 italic leading-relaxed ${
                      isDark ? 'text-neutral-300' : 'text-slate-700'
                    }`}>
                      "{ret.chunk.text}"
                    </p>
                    <div className={`mt-1.5 flex items-center justify-between text-[10px] ${
                      isDark ? 'text-neutral-500' : 'text-slate-400'
                    }`}>
                      <span>Chunk #{ret.chunk.chunkIndex}</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-emerald-700 hover:text-emerald-800'
                      }`}>
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
