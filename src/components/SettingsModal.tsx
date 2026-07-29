import React from 'react';
import { X, Settings, Sliders, Sparkles, Database, ShieldCheck, Sun, Moon } from 'lucide-react';
import { RAGSettings, PDFDocument } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RAGSettings;
  onUpdateSettings: (newSettings: Partial<RAGSettings>) => void;
  documents: PDFDocument[];
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  documents,
  theme,
  setTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-800" />
            <h3 className="font-bold text-sm text-slate-900">RAG Settings & Workspace Theme</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Selector Section */}
        <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <label className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Workspace Theme Mode</span>
          </label>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-white text-indigo-950 ring-2 ring-indigo-500/20 font-bold shadow-xs'
                  : 'border-slate-200 bg-slate-100/60 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Dark Mode</p>
                <p className="text-[10px] text-slate-500 font-medium">White upload box</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-amber-500 bg-white text-amber-950 ring-2 ring-amber-500/20 font-bold shadow-xs'
                  : 'border-slate-200 bg-slate-100/60 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Light Mode</p>
                <p className="text-[10px] text-slate-500 font-medium">Black upload box</p>
              </div>
            </button>
          </div>
        </div>

        {/* Model Info */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              Generation Model
            </span>
            <span className="font-mono text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">gemini-3.6-flash</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              Vector Embeddings
            </span>
            <span className="font-mono text-sky-800 font-bold bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded text-[10px]">text-embedding-004</span>
          </div>
        </div>

        {/* Form controls */}
        <div className="space-y-4 text-xs text-slate-800">
          {/* Top-K */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label>Top-K Retrieved Chunks</label>
              <span className="font-mono text-sky-700 font-bold">{settings.topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.topK}
              onChange={(e) => onUpdateSettings({ topK: parseInt(e.target.value, 10) })}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Number of most relevant vector chunks retrieved for context generation.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label>Similarity Cutoff Threshold</label>
              <span className="font-mono text-sky-700 font-bold">
                {Math.round(settings.similarityThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={settings.similarityThreshold}
              onChange={(e) => onUpdateSettings({ similarityThreshold: parseFloat(e.target.value) })}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Minimum cosine similarity match required to include chunk in context.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label>Model Temperature</label>
              <span className="font-mono text-sky-700 font-bold">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Lower values (0.0 - 0.2) ensure factual adherence to document text.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
