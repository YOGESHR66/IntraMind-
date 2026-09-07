import React from 'react';
import { Upload, Settings, RefreshCw, FileText, Sparkles, Layers, FileCode, MessageSquare, Plus, History, ArrowLeft } from 'lucide-react';
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
    <header className="px-4 sm:px-8 py-3 sticky top-0 z-30 backdrop-blur-xl bg-black/95 border-b border-neutral-850 text-white shadow-xl shadow-black/60 w-full transition-colors duration-200">
      <div className="w-full px-1 sm:px-2 flex items-center justify-between gap-4">
        {/* Sleek Brand Header with Portal Logo */}
        <div
          onClick={onPortalHome}
          className={`flex items-center space-x-2.5 ${onPortalHome ? 'cursor-pointer select-none group' : ''}`}
          title={onPortalHome ? "IntraMind - Return to Portal" : "IntraMind"}
        >
          {/* Portal Brand Logo */}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform shrink-0">
            <div className="w-full h-full bg-[#0a0714] rounded-[10px] flex items-center justify-center">
              <span className="font-general font-bold text-xs bg-gradient-to-r from-indigo-300 via-purple-200 to-amber-200 bg-clip-text text-transparent select-none">
                IM
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight font-general text-white group-hover:text-indigo-200 transition-colors">
              IntraMind
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border bg-indigo-500/15 border-indigo-400/30 text-indigo-300">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>RAG Engine</span>
            </span>
          </div>
        </div>

        {/* Modern Pill Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-2xl text-xs font-semibold backdrop-blur-md border bg-neutral-900/90 border-neutral-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Library ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('viewer')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'viewer'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
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
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'vector'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vector Store</span>
          </button>
        </nav>

        {/* Action Controls Section (Theme Switcher Removed per request) */}
        <div className="flex items-center space-x-2">
          {hasActiveChat && onExitChat && (
            <button
              onClick={onExitChat}
              className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-750 hover:border-neutral-700 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Exit current chat and return to the clean Workspace Area"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/25 active:scale-95 hover:scale-[1.02]"
            title="Upload a new document"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              title="Saved Chat Sessions (Local Storage)"
              className="px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border shadow-xs bg-neutral-900 hover:bg-neutral-850 text-neutral-200 border-neutral-800"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-xs font-semibold">History</span>
              {sessionCount > 0 && (
                <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {sessionCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={onOpenSettings}
            title="RAG Settings & Model Config"
            className="p-1.5 rounded-xl transition-colors cursor-pointer border text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-850 border-neutral-800"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onPortalHome && (
            <button
              onClick={onPortalHome}
              title="Return to Home Portal"
              className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-indigo-300 hover:text-white rounded-xl font-medium transition-colors cursor-pointer ml-1"
            >
              Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
