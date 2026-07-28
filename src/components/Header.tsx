import React from 'react';
import { Database, Upload, Settings, RefreshCw, FileText, Sparkles, Layers, FileCode, MessageSquare, Plus } from 'lucide-react';
import { PDFDocument } from '../types';

interface HeaderProps {
  documents: PDFDocument[];
  totalChunks: number;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenVectorInspector: () => void;
  onResetChat: () => void;
  onPortalHome?: () => void;
  activeTab: 'chat' | 'library' | 'viewer' | 'vector';
  setActiveTab: (tab: 'chat' | 'library' | 'viewer' | 'vector') => void;
}

export const Header: React.FC<HeaderProps> = ({
  documents,
  totalChunks,
  onOpenUpload,
  onOpenSettings,
  onOpenVectorInspector,
  onResetChat,
  onPortalHome,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-[#141028]/95 text-slate-100 px-4 sm:px-8 py-3 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl shadow-lg shadow-black/30 w-full">
      <div className="w-full px-1 sm:px-2 flex items-center justify-between gap-4">
        {/* Sleek Brand Header */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Database className="w-4 h-4 text-sky-300" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight font-general">IntraMind</h1>
            <span className="text-[11px] bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
              <span>RAG Engine</span>
            </span>
          </div>
        </div>

        {/* Modern Pill Navigation Tabs */}
        <nav className="flex items-center p-1 bg-white/5 border border-white/10 rounded-2xl text-xs font-semibold backdrop-blur-md">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                : 'text-slate-300 hover:text-white hover:bg-white/5'
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
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vector Store</span>
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onResetChat}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-900/30 active:scale-95 hover:scale-105"
            title="Start a clean new chat session"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/30 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 hover:scale-105"
            title="Upload a new document"
          >
            <Upload className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={onResetChat}
            title="Clear Chat History"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold px-2 border border-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="RAG Settings"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onPortalHome && (
            <button
              onClick={onPortalHome}
              title="Return to Home Portal"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-indigo-200 hover:text-white rounded-xl font-medium transition-colors cursor-pointer ml-1"
            >
              Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
