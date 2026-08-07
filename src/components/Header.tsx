import React from 'react';
import { Database, Upload, Settings, RefreshCw, FileText, Sparkles, Layers, FileCode, MessageSquare, Plus, Sun, Moon } from 'lucide-react';
import { PDFDocument } from '../types';

interface HeaderProps {
  documents: PDFDocument[];
  totalChunks: number;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
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
  theme,
  setTheme,
  onOpenUpload,
  onOpenSettings,
  onOpenVectorInspector,
  onResetChat,
  onPortalHome,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className={`px-4 sm:px-8 py-3 sticky top-0 z-30 backdrop-blur-xl transition-colors duration-200 w-full ${
      theme === 'dark'
        ? 'bg-[#141028]/95 border-b border-white/10 text-slate-100 shadow-lg shadow-black/30'
        : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-xs'
    }`}>
      <div className="w-full px-1 sm:px-2 flex items-center justify-between gap-4">
        {/* Sleek Brand Header */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Database className="w-4 h-4 text-sky-300" />
          </div>
          <div className="flex items-center space-x-2">
            <h1 className={`font-extrabold text-sm sm:text-base tracking-tight font-general ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>IntraMind</h1>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
              theme === 'dark'
                ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}>
              <Sparkles className="w-3 h-3 text-purple-500 animate-pulse" />
              <span>RAG Engine</span>
            </span>
          </div>
        </div>

        {/* Modern Pill Navigation Tabs */}
        <nav className={`flex items-center p-1 rounded-2xl text-xs font-semibold backdrop-blur-md border ${
          theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-[1.02]'
                : theme === 'dark'
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                : theme === 'dark'
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                : theme === 'dark'
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
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
                : theme === 'dark'
                  ? 'text-slate-300 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vector Store</span>
          </button>
        </nav>

        {/* Action Controls & Theme Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Switcher Section */}
          <div className={`flex items-center p-0.5 rounded-2xl text-xs font-semibold backdrop-blur-md border ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setTheme('dark')}
              className={`px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Dark Mode</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 cursor-pointer ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 font-bold'
                  : theme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-white/5'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Light Mode</span>
            </button>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/25 active:scale-95 hover:scale-[1.02]"
            title="Upload a new document"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            onClick={onOpenSettings}
            title="RAG Settings & Model Config"
            className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
              theme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-white/10 border-white/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
            }`}
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
