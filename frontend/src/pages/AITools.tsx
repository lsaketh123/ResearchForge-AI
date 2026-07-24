import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  FileText, 
  Wand2, 
  Download, 
  BookOpen, 
  CheckSquare, 
  Square,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Paper, Workspace } from '../utils/types';

const AITools: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperIds, setSelectedPaperIds] = useState<number[]>([]);
  
  // Loading & Result States
  const [loading, setLoading] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [action, setAction] = useState<'summary' | 'insights' | 'review'>('summary');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllPapers = async () => {
      setGlobalLoading(true);
      setError(null);
      try {
        const wsRes = await api.get('/api/workspaces/');
        const wsList: Workspace[] = wsRes.data;
        setWorkspaces(wsList);

        const allPapers: Paper[] = [];
        for (const ws of wsList) {
          try {
            const papersRes = await api.get(`/api/papers/?workspace_id=${ws.id}`);
            allPapers.push(...papersRes.data);
          } catch (e) {
            // Ignore
          }
        }
        setPapers(allPapers);
      } catch (err: any) {
        setError('Failed to load papers list.');
      } finally {
        setGlobalLoading(false);
      }
    };
    fetchAllPapers();
  }, []);

  const toggleSelectPaper = (id: number) => {
    if (selectedPaperIds.includes(id)) {
      setSelectedPaperIds(selectedPaperIds.filter((pid) => pid !== id));
    } else {
      setSelectedPaperIds([...selectedPaperIds, id]);
    }
  };

  const handleRunAnalysis = async (selectedAction: 'summary' | 'insights' | 'review') => {
    if (selectedPaperIds.length === 0) {
      alert('Please select at least one paper for analysis.');
      return;
    }
    
    setAction(selectedAction);
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await api.post('/api/ai/analyze', {
        paper_ids: selectedPaperIds,
        action: selectedAction
      });
      setResult(response.data.result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete AI synthesis.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ResearchHub_AI_${action}_analysis.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          AI Tools
        </h2>
        <p className="text-slate-400 text-sm">
          Run deep semantic syntheses, summaries, and literature reviews across multiple papers
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {globalLoading ? (
        <div className="h-48 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: Paper selection */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200">
                Select Papers for Analysis
              </h3>
              <p className="text-slate-400 text-xs">
                {selectedPaperIds.length} of {papers.length} selected
              </p>
            </div>

            {papers.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">No papers found in your workspaces.</p>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {papers.map((paper) => {
                  const isChecked = selectedPaperIds.includes(paper.id);
                  return (
                    <div
                      key={paper.id}
                      onClick={() => toggleSelectPaper(paper.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked 
                          ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/10' 
                          : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-350 dark:text-slate-750" />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-slate-750 dark:text-slate-200 text-xs leading-snug truncate">
                          {paper.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {paper.authors}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Analysis triggers & output */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tools list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tool 1 */}
              <button
                onClick={() => handleRunAnalysis('summary')}
                disabled={loading || selectedPaperIds.length === 0}
                className="p-5 rounded-2xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-3 hover:border-brand-500 group transition-all disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">AI Summaries</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Structured document summaries</span>
                </div>
              </button>

              {/* Tool 2 */}
              <button
                onClick={() => handleRunAnalysis('insights')}
                disabled={loading || selectedPaperIds.length === 0}
                className="p-5 rounded-2xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-3 hover:border-brand-500 group transition-all disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">Key Insights</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Trend and gap extractions</span>
                </div>
              </button>

              {/* Tool 3 */}
              <button
                onClick={() => handleRunAnalysis('review')}
                disabled={loading || selectedPaperIds.length === 0}
                className="p-5 rounded-2xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center gap-3 hover:border-brand-500 group transition-all disabled:opacity-50"
              >
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">Literature Review</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Cohesive academic review</span>
                </div>
              </button>
            </div>

            {/* Analysis Loading Panel */}
            {loading && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl space-y-4 shadow-sm animate-pulse">
                <Sparkles className="w-8 h-8 text-brand-500 mx-auto animate-spin" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350">Generating AI Synthesis...</h4>
                <p className="text-slate-400 text-xs">Accessing embeddings and prompting Groq Llama 3.3...</p>
              </div>
            )}

            {/* Analysis Result Display */}
            {result && !loading && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-750 dark:text-slate-205 uppercase">
                    AI Report Result ({action})
                  </span>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download (.md)
                  </button>
                </div>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            )}
            
            {/* No actions taken yet banner */}
            {!result && !loading && (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800">
                <Wand2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">
                  No analysis report generated
                </h4>
                <p className="text-slate-400 text-sm mt-1">
                  Select papers on the left and choose an AI tool above to begin
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITools;
