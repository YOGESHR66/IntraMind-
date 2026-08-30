import React from 'react';
import {
  Loader2,
  XCircle,
  CheckCircle2,
  FileText,
  Cpu,
  Layers,
  Sparkles,
  Database,
  StopCircle,
} from 'lucide-react';
import { UploadProgressState } from '../types';

interface UploadProgressIndicatorProps {
  progress: UploadProgressState | null;
  onAbort: () => void;
  theme?: 'light' | 'dark';
  variant?: 'card' | 'compact';
  className?: string;
}

export const UploadProgressIndicator: React.FC<UploadProgressIndicatorProps> = ({
  progress,
  onAbort,
  theme = 'dark',
  variant = 'card',
  className = '',
}) => {
  if (!progress || progress.stage === 'idle') return null;

  const { stage, percent, fileName, currentChunk, totalChunks, detail, isAborting } = progress;

  // Safe percentage parsing
  const rawPercent = typeof percent === 'number' && !isNaN(percent)
    ? percent
    : typeof (progress as any).progress === 'number' && !isNaN((progress as any).progress)
      ? (progress as any).progress
      : 10;
  const safePercent = Math.max(0, Math.min(100, Math.round(rawPercent)));

  const defaultDetailForStage = (st: string) => {
    switch (st) {
      case 'uploading':
        return `Transmitting ${fileName || 'document'} to RAG Engine...`;
      case 'parsing':
      case 'ocr':
        return `Parsing layout structure & running text extraction...`;
      case 'chunking':
        return `Creating semantic vector chunks with token overlap...`;
      case 'embedding':
        return `Generating neural vector embeddings...`;
      case 'finalizing':
        return `Storing in vector database and creating search indices...`;
      case 'complete':
        return `Document successfully indexed and ready for semantic search!`;
      case 'aborted':
        return `Operation was aborted.`;
      case 'error':
        return (progress as any).error || 'An error occurred during indexing.';
      default:
        return 'Processing document in vector store...';
    }
  };

  const displayDetail = isAborting
    ? 'Cancelling indexing and releasing worker thread...'
    : detail || defaultDetailForStage(stage);

  const stagesList = [
    { key: 'uploading', label: 'Upload', icon: FileText },
    { key: 'parsing', label: 'Parse & OCR', icon: Cpu },
    { key: 'chunking', label: 'Chunk', icon: Layers },
    { key: 'embedding', label: 'Vectorize', icon: Sparkles },
    { key: 'finalizing', label: 'Index', icon: Database },
  ];

  const getStageIndex = (currentStage: string) => {
    switch (currentStage) {
      case 'uploading':
        return 0;
      case 'parsing':
      case 'ocr':
        return 1;
      case 'chunking':
        return 2;
      case 'embedding':
        return 3;
      case 'finalizing':
      case 'complete':
        return 4;
      default:
        return 0;
    }
  };

  const activeStageIdx = getStageIndex(stage);

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all text-xs ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-indigo-500/40 text-slate-100'
            : 'bg-indigo-50/90 border-indigo-200 text-slate-800'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isAborting ? (
            <StopCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
          ) : stage === 'complete' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
              <span className="truncate max-w-[140px] sm:max-w-[220px]">
                {isAborting ? 'Aborting upload...' : fileName || 'Document'}
              </span>
              <span className="font-mono text-indigo-400 shrink-0 ml-2 font-bold">
                {safePercent}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-1.5 rounded-full bg-slate-700/40 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isAborting
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400'
                }`}
                style={{ width: `${Math.max(4, safePercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Abort Button */}
        {!isAborting && stage !== 'complete' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAbort();
            }}
            className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 active:scale-95 shadow-2xs"
            title="Abort long-running upload & indexing"
          >
            <XCircle className="w-3 h-3" />
            <span>Abort</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all shadow-lg overflow-hidden relative ${
        theme === 'dark'
          ? 'bg-slate-900/95 border-indigo-500/40 text-slate-100'
          : 'bg-gradient-to-b from-white via-indigo-50/40 to-white border-indigo-200 text-slate-900'
      } ${className}`}
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3.5 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-xl border shrink-0 ${
              isAborting
                ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                : 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300'
            }`}
          >
            {isAborting ? (
              <StopCircle className="w-5 h-5 animate-pulse text-rose-400" />
            ) : stage === 'complete' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm truncate flex items-center gap-2">
              <span>{isAborting ? 'Aborting Upload...' : fileName || 'Document'}</span>
              {totalChunks !== undefined && totalChunks > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                  {currentChunk !== undefined ? `${currentChunk}/${totalChunks} chunks` : `${totalChunks} chunks`}
                </span>
              )}
            </h4>
            <p
              className={`text-xs mt-0.5 truncate font-medium ${
                theme === 'dark' ? 'text-indigo-200/80' : 'text-slate-500'
              }`}
            >
              {displayDetail}
            </p>
          </div>
        </div>

        {/* Abort Button */}
        {!isAborting && stage !== 'complete' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAbort();
            }}
            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 shadow-sm hover:shadow-rose-500/20"
            title="Abort this document upload and indexing process immediately"
          >
            <StopCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Abort Upload</span>
          </button>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5 mb-4 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[11px] uppercase tracking-wider text-indigo-300/90 font-semibold">
            {isAborting
              ? 'Operation Cancelled'
              : stage === 'complete'
              ? 'Processing Complete'
              : 'Streaming Indexing Progress'}
          </span>
          <span
            className={`font-mono text-xs font-extrabold ${
              isAborting ? 'text-rose-400' : 'text-indigo-400'
            }`}
          >
            {safePercent}%
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 border border-slate-700/60 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out relative ${
              isAborting
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 shadow-sm shadow-indigo-500/50'
            }`}
            style={{ width: `${Math.max(4, safePercent)}%` }}
          >
            {/* Animated Shimmer Highlight */}
            {!isAborting && stage !== 'complete' && (
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
        </div>
      </div>

      {/* 5-Step Visual Pipeline Tracker */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 border-t border-slate-800/60 relative z-10">
        {stagesList.map((st, idx) => {
          const isDone = activeStageIdx > idx || stage === 'complete';
          const isCurrent = activeStageIdx === idx && stage !== 'complete' && !isAborting;
          const Icon = st.icon;

          return (
            <div
              key={st.key}
              className={`flex flex-col items-center text-center p-1.5 sm:p-2 rounded-xl transition-all ${
                isCurrent
                  ? 'bg-indigo-500/20 border border-indigo-400/50 text-indigo-200 ring-2 ring-indigo-500/20'
                  : isDone
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-slate-800/30 border border-slate-700/30 text-slate-500'
              }`}
            >
              <div className="mb-1">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5 opacity-60" />
                )}
              </div>
              <span className="text-[10px] font-bold truncate max-w-full">
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
