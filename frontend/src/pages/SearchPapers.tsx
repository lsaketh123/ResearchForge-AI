import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Database, 
  Calendar, 
  ExternalLink, 
  CheckSquare, 
  Square,
  ArrowRight,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Workspace } from '../utils/types';

interface SearchResult {
  title: string;
  authors: string;
  abstract: string;
  published_date: string | null;
  url: string | null;
  source: string;
}

const SearchPapers: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [papers, setPapers] = useState<SearchResult[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workspace selection for import
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    // Fetch workspaces for dropdown selection
    const fetchWorkspaces = async () => {
      try {
        const response = await api.get('/api/workspaces/');
        setWorkspaces(response.data);
        if (response.data.length > 0) {
          setSelectedWorkspaceId(response.data[0].id.toString());
        }
      } catch (err) {
        // Ignore
      }
    };
    fetchWorkspaces();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setPapers([]);
    setSelectedIndices([]);
    setImportSuccess(false);

    try {
      const response = await api.get(`/api/papers/search?query=${encodeURIComponent(query)}&source=${source}`);
      setPapers(response.data.papers);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search academic databases.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectPaper = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === papers.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(papers.map((_, i) => i));
    }
  };

  const handleImport = async () => {
    if (selectedIndices.length === 0 || !selectedWorkspaceId) return;

    setImporting(true);
    setError(null);
    setImportSuccess(false);

    try {
      const workspaceIdNum = parseInt(selectedWorkspaceId, 10);
      
      // Concurrently import all selected papers
      const importPromises = selectedIndices.map((idx) => {
        const paper = papers[idx];
        return api.post('/api/papers/import', {
          workspace_id: workspaceIdNum,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          published_date: paper.published_date,
          url: paper.url,
          source: paper.source
        });
      });

      await Promise.all(importPromises);
      setImportSuccess(true);
      setSelectedIndices([]);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to import papers to workspace.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Search Research Papers
        </h2>
        <p className="text-slate-400 text-sm">
          Query academic repositories including arXiv and PubMed concurrently
        </p>
      </div>

      {/* Search Controls Form */}
      <form onSubmit={handleSearch} className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-1 space-y-2 w-full">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Keywords or Topics
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. transformer and CNN architectures"
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-brand-500 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-2 w-full md:w-48 shrink-0">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-brand-500 text-sm text-slate-750 dark:text-slate-100"
          >
            <option value="all">All Sources</option>
            <option value="arxiv">arXiv API</option>
            <option value="pubmed">PubMed API</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-32 py-2.5 px-4 rounded-xl font-bold bg-brand-600 hover:bg-brand-505 text-white shadow-md shadow-brand-500/10 transition-all flex items-center justify-center gap-2 text-sm shrink-0"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : papers.length > 0 ? (
        <div className="space-y-4 pb-24">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border dark:bg-slate-900 dark:border-slate-800">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {selectedIndices.length === papers.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-brand-600" />
                  Deselect All ({papers.length})
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Select All ({papers.length})
                </>
              )}
            </button>
            <span className="text-xs font-semibold text-slate-450">
              Found {papers.length} publications
            </span>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {papers.map((paper, idx) => {
              const isChecked = selectedIndices.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleSelectPaper(idx)}
                  className={`p-6 rounded-3xl bg-white border hover:border-brand-500/60 shadow-sm transition-all cursor-pointer flex gap-4 dark:bg-slate-900 ${
                    isChecked ? 'border-brand-500/80 bg-brand-50/10 dark:bg-brand-950/10' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div className="pt-1 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-350 dark:text-slate-700" />
                    )}
                  </div>

                  {/* Metadata fields */}
                  <div className="flex-1 space-y-3">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                      {paper.title}
                    </h4>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {paper.authors}
                    </p>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {paper.abstract}
                    </p>

                    {/* Footer Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-400 font-medium border-t border-slate-50 dark:border-slate-800/60 pt-3">
                      {paper.published_date && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Published {paper.published_date}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1.5 uppercase">
                        <Database className="w-3.5 h-3.5" />
                        {paper.source}
                      </span>

                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} // Prevent card selection
                          className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 hover:underline font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Paper
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300">
              No results to display
            </h4>
            <p className="text-slate-400 text-sm mt-1">
              Enter keywords above to begin searching academic databases
            </p>
          </div>
        )
      )}

      {/* Floating Action Import Bar */}
      {selectedIndices.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-6 duration-200">
          <span className="text-xs font-semibold text-slate-300">
            {selectedIndices.length} papers selected for import
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {workspaces.length === 0 ? (
              <span className="text-xs text-rose-300">No workspaces available</span>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white text-xs focus:outline-none focus:border-brand-500 w-full sm:w-44"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || workspaces.length === 0}
              className="px-4 py-2 rounded-lg font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs shrink-0 flex items-center gap-1.5 transition-colors"
            >
              {importing ? 'Importing...' : 'Import'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Import Success Notification */}
      {importSuccess && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-emerald-450 text-sm shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckSquare className="w-5 h-5 shrink-0" />
          <span>Selected papers successfully imported into the workspace!</span>
        </div>
      )}
    </div>
  );
};

export default SearchPapers;
