import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { semanticSearch } from '../services/api.js';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repositoryId = searchParams.get('repositoryId');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim() || !repositoryId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await semanticSearch(repositoryId, query);
      const results = response.data?.data?.results || response.data?.results || [];
      setResults(results);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!repositoryId) {
    return (
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Semantic Search</h1>
          <p className="text-surface-400">Search repository code using vector embeddings and semantic similarity.</p>
        </div>
        <div className="p-8 rounded-xl bg-surface-900/40 border border-surface-800/60 text-center">
          <div className="p-3 rounded-full bg-warning-500/10 text-warning-400 w-fit mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No repository selected</h2>
          <p className="text-sm text-surface-400 mb-5">Analyze a repository first, then search its code semantically.</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Semantic Search</h1>
        <p className="text-surface-400">Search code semantically — not keyword matching, but meaning-based retrieval powered by vector embeddings.</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 p-5 rounded-xl bg-surface-900/40 border border-surface-800/60">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search code semantically, e.g. 'movie recommendation logic'"
              className="w-full pl-12 pr-4 py-3 bg-surface-900 border border-surface-700/80 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50 transition-all duration-200"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-surface-700 disabled:text-surface-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-error-400 text-sm mb-6">{error}</div>
      )}

      {/* Results */}
      {results && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-surface-500 text-sm">No results found for your query.</p>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-surface-500 font-medium uppercase tracking-wider mb-4">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-800/60 bg-surface-900/40 overflow-hidden hover:border-surface-700/60 transition-all duration-200"
            >
              <div className="px-5 py-3 border-b border-surface-800/60 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <code className="text-sm text-primary-300 font-mono">{item.filePath || item.file_path || item.path || `chunk-${i}`}</code>
                {item.score !== undefined && (
                  <span className="ml-auto text-xs text-surface-500 font-mono">
                    {(item.score * 100).toFixed(1)}% match
                  </span>
                )}
              </div>
              <div className="p-5">
                <pre className="text-xs text-surface-300 font-mono leading-relaxed whitespace-pre-wrap">{item.chunk || item.content || item.text}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
