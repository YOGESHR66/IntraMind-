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
    <div className="rounded-xl p-4 flex flex-col h-full space-y-4 shadow-2xl border bg-neutral-950 border-neutral-850 text-neutral-100">
      {/* Header */}
      <div className="pb-3 border-b border-neutral-850">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white">Vector Embeddings Inspector</h2>
        </div>
        <p className="text-xs mt-0.5 text-neutral-400">
          Real-time inspect vector index, token allocations, and cosine similarity rankings.
        </p>
      </div>

      {/* Vector Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="border p-2.5 rounded-xl bg-neutral-900 border-neutral-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-neutral-400">
            Indexed Chunks
          </span>
          <span className="text-lg font-bold font-mono mt-0.5 block text-white">
            {chunks.length}
          </span>
        </div>

        <div className="border p-2.5 rounded-xl bg-neutral-900 border-neutral-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-neutral-400">
            Embedding Model
          </span>
          <span className="text-xs font-semibold text-emerald-400 font-mono mt-1 block">
            text-embedding-004
          </span>
        </div>

        <div className="border p-2.5 rounded-xl bg-neutral-900 border-neutral-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-neutral-400">
            Vector Dimension
          </span>
          <span className="text-sm font-bold font-mono mt-1 block text-neutral-200">
            768 float32
          </span>
        </div>

        <div className="border p-2.5 rounded-xl bg-neutral-900 border-neutral-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider block text-neutral-400">
            Search Metric
          </span>
          <span className="text-xs font-semibold text-indigo-400 font-mono mt-1 block">
            Cosine Similarity
          </span>
        </div>
      </div>

      {/* Interactive Similarity Tester */}
      <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl space-y-2.5">
        <label className="text-xs font-bold text-neutral-200 block">
          Test Cosine Distance Similarity Match
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
            placeholder="Type a test query to measure vector similarity..."
            className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-3.5 py-2 text-sm font-medium text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 antialiased"
          />
          <button
            onClick={handleTestSearch}
            disabled={isSearching || !testQuery.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-all disabled:opacity-50 flex items-center space-x-1 cursor-pointer shadow-md shadow-indigo-600/20"
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
              <span className="text-xs font-bold text-neutral-200">
                Top {testResults.length} Vector Match Results
              </span>
              <button
                onClick={() => setTestResults(null)}
                className="text-[11px] text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                Reset Test
              </button>
            </div>

            {testResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400 border border-dashed border-neutral-800 rounded-xl">
                No chunks matched query threshold.
              </div>
            ) : (
              testResults.map((r, i) => (
                <div key={i} className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1.5 mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200 truncate max-w-[200px]">
                      {r.chunk.docName} (p. {r.chunk.pageNumber})
                    </span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded text-[11px]">
                      {r.scorePercentage}% Similarity
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 line-clamp-3 bg-neutral-950 p-2 rounded border border-neutral-800 italic">
                    "{r.chunk.text}"
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold text-neutral-300 mb-2 block">
              All Vector Index Chunks ({chunks.length})
            </span>
            {chunks.map((c) => (
              <div key={c.id} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs mb-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                  <span className="font-mono text-indigo-400 font-medium">{c.id}</span>
                  <span>{c.docName} • p. {c.pageNumber}</span>
                </div>
                <p className="text-neutral-300 text-[11px] line-clamp-2">
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
