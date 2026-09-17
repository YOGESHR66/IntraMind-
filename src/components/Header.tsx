import React from 'react';
import { Upload, Settings, RefreshCw, FileText, Layers, FileCode, MessageSquare, Plus, History, ArrowLeft, Sun, Moon } from 'lucide-react';
import { PDFDocument } from '../types';

interface HeaderProps {
  documents: PDFDocument[];
  totalChunks: number;
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenVectorInspector: () => void;
  onResetChat: () => void;
  onExitChat?: () => void;
  hasActiveChat?: boolean;
  onOpenHistory?: () => void;
  sessionCount?: number;
  onPortalHome?: () => void;
  activeTab: 'chat' | 'library' | 'viewer' | 'vector';
  setActiveTab: (tab: 'chat' | 'library' | 'viewer' | 'vector') => void;
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  totalChunks,
  theme = 'dark',
  setTheme,
  onOpenUpload,
  onOpenSettings,
  onOpenVectorInspector,
  onResetChat,
  onExitChat,
  hasActiveChat = false,
  onOpenHistory,
  sessionCount = 0,
  onPortalHome,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className={`px-4 sm:px-8 py-3 sticky top-0 z-30 backdrop-blur-xl border-b-2 w-full transition-colors duration-200 ${
      theme === 'dark'
        ? 'bg-black/95 border-neutral-800 text-white shadow-xl shadow-black/60'
        : 'bg-[#e2f3e7]/95 border-emerald-300/90 text-slate-900 shadow-xs'
    }`}>
      <div className="w-full px-1 sm:px-2 flex items-center justify-between gap-4">
        {/* Sleek Brand Header with Portal Logo */}
        <div
          onClick={onPortalHome}
          className={`flex items-center space-x-2.5 ${onPortalHome ? 'cursor-pointer select-none group' : ''}`}
          title={onPortalHome ? "IntraMind - Return to Portal" : "IntraMind"}
        >
          {/* Portal Brand Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0 border border-emerald-500/30">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
              theme === 'dark' ? 'bg-[#0a0714]' : 'bg-slate-800'
            }`}>
              <span className="font-general font-bold text-xs text-white select-none">
                IM
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className={`font-extrabold text-sm sm:text-base tracking-tight font-general transition-colors ${
              theme === 'dark' ? 'text-white group-hover:text-emerald-200' : 'text-slate-900 group-hover:text-emerald-800'
            }`}>
              IntraMind
            </h1>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border shadow-2xs ${
              theme === 'dark'
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                : 'bg-emerald-100/80 border-emerald-300 text-emerald-900'
            }`}>
              <span>RAG Engine</span>
            </span>
          </div>
        </div>

        {/* Modern Pill Navigation Tabs */}
        <nav className={`flex items-center p-1 rounded-2xl text-xs font-semibold backdrop-blur-md border ${
          theme === 'dark' ? 'bg-neutral-900/90 border-neutral-750 shadow-inner' : 'bg-[#cae9d3] border-emerald-300/80 shadow-inner'
        }`}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
              activeTab === 'chat'
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/40 shadow-md font-bold scale-[1.02]'
                  : 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold scale-[1.02]'
                : theme === 'dark'
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-transparent'
                  : 'text-emerald-950 hover:text-black hover:bg-white/90 border-transparent hover:border-emerald-300/90 shadow-2xs'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
              activeTab === 'library'
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/40 shadow-md font-bold scale-[1.02]'
                  : 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold scale-[1.02]'
                : theme === 'dark'
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-transparent'
                  : 'text-emerald-950 hover:text-black hover:bg-white/90 border-transparent hover:border-emerald-300/90 shadow-2xs'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Library ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
              activeTab === 'viewer'
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/40 shadow-md font-bold scale-[1.02]'
                  : 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold scale-[1.02]'
                : theme === 'dark'
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-transparent'
                  : 'text-emerald-950 hover:text-black hover:bg-white/90 border-transparent hover:border-emerald-300/90 shadow-2xs'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reader</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vector');
              onOpenVectorInspector();
            }}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border ${
              activeTab === 'vector'
                ? theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400/40 shadow-md font-bold scale-[1.02]'
                  : 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-bold scale-[1.02]'
                : theme === 'dark'
                  ? 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-transparent'
                  : 'text-emerald-950 hover:text-black hover:bg-white/90 border-transparent hover:border-emerald-300/90 shadow-2xs'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vector Store</span>
          </button>
        </nav>

        {/* Action Controls Section */}
        <div className="flex items-center space-x-2">
          {hasActiveChat && onExitChat && (
            <button
              onClick={onExitChat}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                theme === 'dark'
                  ? 'bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border-neutral-700 hover:border-neutral-600'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400 shadow-xs'
              }`}
              title="Exit current chat and return to the clean Workspace Area"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 hover:scale-[1.02] border ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-indigo-400/40'
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700'
            }`}
            title="Upload a new document"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              title="Saved Chat Sessions (Local Storage)"
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border shadow-xs font-semibold ${
                theme === 'dark'
                  ? 'bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border-neutral-750 hover:border-neutral-650'
                  : 'bg-white hover:bg-emerald-50/80 text-slate-800 hover:text-slate-950 border-emerald-300 hover:border-emerald-400'
              }`}
            >
              <History className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-emerald-700'}`} />
              <span className="hidden sm:inline text-xs">History</span>
              {sessionCount > 0 && (
                <span className={`text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full leading-none ${
                  theme === 'dark' ? 'bg-indigo-500' : 'bg-emerald-600'
                }`}>
                  {sessionCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle Button (Light/Dark Mode) */}
          {setTheme && (
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Reduce brightness (Switch to Dark Mode)'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Reduce brightness (Switch to Dark Mode)'}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center justify-center gap-1.5 shadow-xs text-xs font-semibold ${
                theme === 'dark'
                  ? 'text-amber-300 hover:text-amber-200 bg-neutral-900 hover:bg-neutral-850 border-neutral-750 hover:border-neutral-650'
                  : 'text-slate-800 hover:text-slate-950 bg-white hover:bg-emerald-50/80 border-emerald-300 hover:border-emerald-400'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline text-[11px]">Dark Mode</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="RAG Settings & Model Config"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer border shadow-xs ${
              theme === 'dark'
                ? 'text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 border-neutral-750 hover:border-neutral-650'
                : 'text-slate-700 hover:text-slate-950 bg-white hover:bg-emerald-50/80 border-emerald-300 hover:border-emerald-400'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {onPortalHome && (
            <button
              onClick={onPortalHome}
              title="Return to Home Portal"
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ml-1 border shadow-xs ${
                theme === 'dark'
                  ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-750 text-emerald-300 hover:text-white hover:border-neutral-650'
                  : 'bg-white hover:bg-emerald-50/80 border-emerald-300 hover:border-emerald-400 text-slate-800 hover:text-slate-950'
              }`}
            >
              Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
