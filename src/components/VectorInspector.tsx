import React, { useState } from 'react';
import { Layers, Search, Sparkles, Database, FileText, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
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
    <div className={`rounded-xl p-4 flex flex-col h-full space-y-4 shadow-xs border ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className={`pb-3 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Vector Embeddings Inspector</h2>
        </div>
        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Real-time inspect vector index, token allocations, and cosine similarity rankings.
        </p>
      </div>

      {/* Vector Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className={`border p-2.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Indexed Chunks
          </span>
          <span className={`text-lg font-bold font-mono mt-0.5 block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {chunks.length}
          </span>
        </div>

        <div className={`border p-2.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Embedding Model
          </span>
          <span className="text-xs font-semibold text-emerald-500 font-mono mt-1 block">
            text-embedding-004
          </span>
        </div>

        <div className={`border p-2.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Vector Dimension
          </span>
          <span className={`text-sm font-bold font-mono mt-1 block ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
            768 float32
          </span>
        </div>

        <div className={`border p-2.5 rounded-xl ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-[10px] font-semibold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Search Metric
          </span>
          <span className="text-xs font-semibold text-indigo-400 font-mono mt-1 block">
            Cosine Similarity
          </span>
        </div>
      </div>

      {/* Interactive Similarity Tester */}
      <div className="bg-slate-50/70 border border-slate-200 p-3 rounded-xl space-y-2.5">
        <label className="text-xs font-bold text-slate-800 block">
          Test Cosine Distance Similarity Match
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
            placeholder="Type a test query to measure vector similarity..."
            className="flex-1 bg-white border-2 border-slate-300 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 antialiased shadow-2xs"
          />
          <button
            onClick={handleTestSearch}
            disabled={isSearching || !testQuery.trim()}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center space-x-1 cursor-pointer shadow-2xs"
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
              <span className="text-xs font-bold text-slate-800">
                Top {testResults.length} Vector Match Results
              </span>
              <button
                onClick={() => setTestResults(null)}
                className="text-[11px] text-sky-700 font-semibold hover:underline cursor-pointer"
              >
                Reset Test
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No chunks matched query threshold.
              </div>
            ) : (
              testResults.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {r.chunk.docName} (p. {r.chunk.pageNumber})
                    </span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      {r.scorePercentage}% Similarity
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 line-clamp-3 bg-white p-2 rounded border border-slate-200 italic">
                    "{r.chunk.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold text-slate-700 mb-2 block">
              All Vector Index Chunks ({chunks.length})
            </span>
            {chunks.map((c) => (
              <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span className="font-mono text-sky-700 font-medium">{c.id}</span>
                  <span>{c.docName} • p. {c.pageNumber}</span>
                </div>
                <p className="text-slate-700 text-[11px] line-clamp-2">
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
