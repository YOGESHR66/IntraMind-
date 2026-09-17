import React, { useState } from 'react';
import { Layers, Search, Database, FileText, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { DocumentChunk, SearchResult, RAGSettings } from '../types';
import { fetchApi } from '../lib/api';

interface VectorInspectorProps {
  chunks: DocumentChunk[];
  settings: RAGSettings;
  theme?: 'light' | 'dark';
}

export const VectorInspector: React.FC<VectorInspectorProps> = ({ chunks, settings, theme = 'dark' }) => {
  const [testQuery, setTestQuery] = useState<string>('');
  const [testResults, setTestResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const isDark = theme === 'dark';

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetchApi('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          settings: { ...settings, topK: 6 },
        }),
      });
      const data = await res.json();
      setTestResults(data.results || []);
    } catch (e) {
      console.error('Test search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`rounded-2xl p-4 flex flex-col h-full space-y-4 shadow-xl border-2 transition-colors duration-200 ${
      isDark ? 'bg-neutral-950 border-neutral-800 text-neutral-100 shadow-2xl' : 'bg-[#edf7f0] border-emerald-300/90 text-slate-800 shadow-md'
    }`}>
      {/* Header */}
      <div className={`pb-3 border-b-2 ${isDark ? 'border-neutral-800' : 'border-emerald-300'}`}>
        <div className="flex items-center space-x-2">
          <Layers className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-emerald-700'}`} />
          <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Vector Embeddings Inspector</h2>
        </div>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
          Real-time inspect vector index, token allocations, and cosine similarity rankings.
        </p>
      </div>

      {/* Vector Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className={`border-2 p-2.5 rounded-xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80 shadow-2xs'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Indexed Chunks
          </span>
          <span className={`text-lg font-bold font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {chunks.length}
          </span>
        </div>

        <div className={`border-2 p-2.5 rounded-xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80 shadow-2xs'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Embedding Model
          </span>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono mt-1 block">
            text-embedding-004
          </span>
        </div>

        <div className={`border-2 p-2.5 rounded-xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80 shadow-2xs'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Vector Dimension
          </span>
          <span className={`text-sm font-bold font-mono mt-1 block ${isDark ? 'text-neutral-200' : 'text-slate-700'}`}>
            768 float32
          </span>
        </div>

        <div className={`border-2 p-2.5 rounded-xl ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80 shadow-2xs'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Search Metric
          </span>
          <span className={`text-xs font-semibold font-mono mt-1 block ${isDark ? 'text-indigo-400' : 'text-emerald-800'}`}>
            Cosine Similarity
          </span>
        </div>
      </div>

      {/* Interactive Similarity Tester */}
      <div className={`border-2 p-3 rounded-xl space-y-2.5 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white/90 border-emerald-300/80 shadow-2xs'}`}>
        <label className={`text-xs font-bold block ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
          Test Cosine Distance Similarity Match
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
            placeholder="Type a test query to measure vector similarity..."
            className={`flex-1 border-2 rounded-lg px-3.5 py-2 text-sm font-medium focus:outline-none antialiased ${
              isDark
                ? 'bg-neutral-950 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-indigo-500'
                : 'bg-white focus:bg-white border-emerald-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-600'
            }`}
          />
          <button
            onClick={handleTestSearch}
            disabled={isSearching || !testQuery.trim()}
            className={`px-3.5 py-1.5 font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center space-x-1 cursor-pointer shadow-xs border ${
              isDark
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* Results or Chunk List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {testResults ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                Top {testResults.length} Vector Match Results
              </span>
              <button
                onClick={() => setTestResults(null)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Reset Test
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className={`p-4 text-center text-xs border-2 border-dashed rounded-xl ${
                isDark ? 'text-neutral-400 border-neutral-800' : 'text-slate-500 border-emerald-300'
              }`}>
                No chunks matched query threshold.
              </div>
            ) : (
              testResults.map((r, i) => (
                <div key={i} className={`p-3 border-2 rounded-xl space-y-1.5 mb-2 ${
                  isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-emerald-300 shadow-2xs'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold truncate max-w-[200px] ${isDark ? 'text-neutral-200' : 'text-slate-800'}`}>
                      {r.chunk.docName} (p. {r.chunk.pageNumber})
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                      {r.scorePercentage}% Similarity
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-3 p-2 rounded border italic ${
                    isDark ? 'text-neutral-300 bg-neutral-950 border-neutral-800' : 'text-slate-700 bg-slate-50 border-emerald-300/80'
                  }`}>
                    "{r.chunk.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <span className={`text-xs font-bold mb-2 block ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
              All Vector Index Chunks ({chunks.length})
            </span>
            {chunks.map((c) => (
              <div key={c.id} className={`p-2.5 border-2 rounded-lg text-xs mb-2 ${
                isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-emerald-300 shadow-2xs'
              }`}>
                <div className={`flex items-center justify-between text-[11px] mb-1 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                  <span className={`font-mono font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{c.id}</span>
                  <span>{c.docName} • p. {c.pageNumber}</span>
                </div>
                <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-neutral-300' : 'text-slate-700'}`}>
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
