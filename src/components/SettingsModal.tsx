import React from 'react';
import { X, Settings, Cpu, Database, Moon, Sun, Check, Target } from 'lucide-react';
import { RAGSettings, PDFDocument } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RAGSettings;
  onUpdateSettings: (newSettings: Partial<RAGSettings>) => void;
  documents: PDFDocument[];
  theme?: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  theme = 'dark',
  setTheme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className={`border-2 rounded-3xl w-full max-w-md shadow-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-[#edf7f0] border-emerald-300/90 text-slate-800 shadow-2xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b-2 ${
          isDark ? 'border-neutral-800' : 'border-emerald-300'
        }`}>
          <div className="flex items-center space-x-2">
            <Settings className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>RAG Parameters & Workspace Settings</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800 border-neutral-800' : 'text-slate-600 hover:text-slate-900 hover:bg-[#e2f3e7] border-emerald-300'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Theme Toggle */}
        <div className={`space-y-2.5 p-3.5 rounded-xl border-2 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80'
        }`}>
          <div className="flex items-center justify-between">
            <label className={`font-bold text-xs flex items-center gap-1.5 ${
              isDark ? 'text-neutral-200' : 'text-slate-800'
            }`}>
              {isDark ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Workspace Theme</span>
            </label>
            <span className={`text-[11px] font-medium font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTheme?.('dark')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark Theme</span>
              {isDark && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>

            <button
              type="button"
              onClick={() => setTheme?.('light')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer ${
                !isDark
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light Theme</span>
              {!isDark && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
          </div>
          <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Select your preferred visual appearance. Theme preference is automatically saved.
          </p>
        </div>

        {/* Model Info */}
        <div className={`p-3 rounded-xl space-y-1 border-2 ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              <Cpu className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              Generation Model
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px]">gemini-3.1-flash-lite</span>
          </div>
          <div className={`flex items-center justify-between text-xs pt-2 border-t-2 ${
            isDark ? 'border-neutral-800' : 'border-slate-200'
          }`}>
            <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              <Database className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              Vector Embeddings
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-300 font-bold bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[10px]">text-embedding-004</span>
          </div>
        </div>

        {/* Form controls */}
        <div className={`space-y-4 text-xs ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
          {/* Top-K */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Top-K Retrieved Chunks</label>
              <span className={`font-mono font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{settings.topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.topK}
              onChange={(e) => onUpdateSettings({ topK: parseInt(e.target.value, 10) })}
              className={`w-full accent-indigo-600 cursor-pointer ${isDark ? 'bg-neutral-800' : 'bg-slate-300'}`}
            />
            <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Number of most relevant vector chunks retrieved for context generation.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Similarity Cutoff Threshold</label>
              <span className={`font-mono font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
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
              className={`w-full accent-indigo-600 cursor-pointer ${isDark ? 'bg-neutral-800' : 'bg-slate-300'}`}
            />
            <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Minimum cosine similarity match required to include chunk in context.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className={isDark ? 'text-neutral-300' : 'text-slate-700'}>Model Temperature</label>
              <span className={`font-mono font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className={`w-full accent-indigo-600 cursor-pointer ${isDark ? 'bg-neutral-800' : 'bg-slate-300'}`}
            />
            <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-slate-500'}`}>
              Lower values (0.0 - 0.2) ensure strict factual adherence to document text.
            </p>
          </div>

          {/* Precise Output (2-3 Bullet Points) Mode */}
          <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-neutral-800/90' : 'border-slate-300/60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-500" />
                <span className={`font-semibold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>Precise Output Mode</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ preciseOutput: !settings.preciseOutput })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  settings.preciseOutput ? 'bg-cyan-500' : isDark ? 'bg-neutral-800' : 'bg-slate-300'
                }`}
                title="Toggle 2-3 line bullet point answers"
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    settings.preciseOutput ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
              Generates concise 2 to 3 line bullet point answers directly summarizing core facts without long paragraphs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`pt-3 border-t flex justify-end ${isDark ? 'border-neutral-800' : 'border-slate-300/60'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
