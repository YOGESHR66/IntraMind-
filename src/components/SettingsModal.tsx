import React from 'react';
import { X, Settings, Sparkles, Database, Moon, Check, Target } from 'lucide-react';
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
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-5 animate-in fade-in zoom-in-95 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">RAG Parameters & Workspace Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Indicator (Black Theme Enforced) */}
        <div className="space-y-2 bg-neutral-900 border border-neutral-800 p-3.5 rounded-xl">
          <label className="font-bold text-xs text-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Workspace Theme</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Check className="w-3 h-3" /> Pure Black
            </span>
          </label>
          <p className="text-[11px] text-neutral-400">
            IntraMind AI operates exclusively in deep black mode for focused document analysis and optimal contrast.
          </p>
        </div>

        {/* Model Info */}
        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Generation Model
            </span>
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-1.5 py-0.5 rounded text-[10px]">gemini-2.5-flash</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
            <span className="font-semibold text-neutral-300 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Vector Embeddings
            </span>
            <span className="font-mono text-indigo-300 font-bold bg-indigo-950/80 border border-indigo-800/80 px-1.5 py-0.5 rounded text-[10px]">text-embedding-004</span>
          </div>
        </div>

        {/* Form controls */}
        <div className="space-y-4 text-xs text-neutral-200">
          {/* Top-K */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className="text-neutral-300">Top-K Retrieved Chunks</label>
              <span className="font-mono text-indigo-400 font-bold">{settings.topK} Chunks</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.topK}
              onChange={(e) => onUpdateSettings({ topK: parseInt(e.target.value, 10) })}
              className="w-full accent-indigo-500 cursor-pointer bg-neutral-800"
            />
            <p className="text-[11px] text-neutral-500">
              Number of most relevant vector chunks retrieved for context generation.
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className="text-neutral-300">Similarity Cutoff Threshold</label>
              <span className="font-mono text-indigo-400 font-bold">
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
              className="w-full accent-indigo-500 cursor-pointer bg-neutral-800"
            />
            <p className="text-[11px] text-neutral-500">
              Minimum cosine similarity match required to include chunk in context.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className="text-neutral-300">Model Temperature</label>
              <span className="font-mono text-indigo-400 font-bold">{settings.temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer bg-neutral-800"
            />
            <p className="text-[11px] text-neutral-500">
              Lower values (0.0 - 0.2) ensure strict factual adherence to document text.
            </p>
          </div>

          {/* Precise Output (2-3 Bullet Points) Mode */}
          <div className="pt-3 border-t border-neutral-800/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-neutral-200">Precise Output Mode</span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateSettings({ preciseOutput: !settings.preciseOutput })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  settings.preciseOutput ? 'bg-cyan-500' : 'bg-neutral-800'
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
            <p className="text-[11px] text-neutral-400">
              Generates concise 2 to 3 line bullet point answers directly summarizing core facts without long paragraphs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex justify-end">
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
