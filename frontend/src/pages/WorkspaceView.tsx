import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Wand2, 
  Trash2, 
  ExternalLink,
  Send,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Workspace, Paper, Conversation } from '../utils/types';

const WorkspaceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [activeTab, setActiveTab] = useState<'papers' | 'chat' | 'review'>('papers');
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<Conversation[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // AI Tools shortcuts inside tab
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [toolAction, setToolAction] = useState<'summary' | 'insights' | 'review'>('summary');

  const fetchWorkspaceDetails = async () => {
    try {
      const wsRes = await api.get(`/api/workspaces/${id}`);
      setWorkspace(wsRes.data);
      
      const papersRes = await api.get(`/api/papers/?workspace_id=${id}`);
      setPapers(papersRes.data);
    } catch (err: any) {
      alert('Failed to load workspace details. Redirecting...');
      navigate('/dashboard');
    }
  };

  const fetchChatHistory = async () => {
    try {
      const chatRes = await api.get(`/api/chat/history/${id}`);
      setChatMessages(chatRes.data);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchWorkspaceDetails();
    fetchChatHistory();
  }, [id]);

  // Scroll to bottom of chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleDeletePaper = async (paperId: number) => {
    if (!window.confirm('Are you sure you want to remove this paper from this workspace?')) {
      return;
    }
    try {
      await api.delete(`/api/papers/${paperId}`);
      fetchWorkspaceDetails();
    } catch (err: any) {
      alert('Failed to delete paper.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userMsg = inputMessage;
    setInputMessage('');
    setChatError(null);
    setChatLoading(true);

    // Optimistically update chat list
    const tempUserMsg: Conversation = {
      id: Date.now(),
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.post('/api/chat/', {
        workspace_id: parseInt(id!, 10),
        message: userMsg
      });
      
      // Update history
      fetchChatHistory();
    } catch (err: any) {
      setChatError('Failed to generate AI response. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunTool = async (action: 'summary' | 'insights' | 'review') => {
    if (papers.length === 0) {
      alert('Import papers to this workspace first to analyze them.');
      return;
    }
    setToolAction(action);
    setToolLoading(true);
    setReviewResult(null);

    try {
      const paperIds = papers.map((p) => p.id);
      const response = await api.post('/api/ai/analyze', {
        paper_ids: paperIds,
        action
      });
      setReviewResult(response.data.result);
    } catch (err: any) {
      alert('Failed to run AI tool analysis.');
    } finally {
      setToolLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!reviewResult) return;
    const blob = new Blob([reviewResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workspace?.name.replace(/\s+/g, '_')}_${toolAction}_report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Details Panel */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col gap-4">
        {/* Back Link */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {workspace?.name || 'Workspace details'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {papers.length} {papers.length === 1 ? 'paper' : 'papers'} imported
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pt-2">
          <button
            onClick={() => setActiveTab('papers')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'papers'
                ? 'border-brand-650 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Papers ({papers.length})
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-brand-650 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'border-brand-650 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            Generate Review
          </button>
        </div>
      </div>

      {/* Tabs Panels */}
      <div className="flex-1 overflow-y-auto">
        {/* PAPERS TAB */}
        {activeTab === 'papers' && (
          <div className="p-6 space-y-4">
            {papers.length === 0 ? (
              <div className="text-center py-20 p-8 rounded-3xl border border-dashed border-slate-350 bg-white dark:bg-slate-900 dark:border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h4 className="font-bold text-slate-700 dark:text-slate-300">No papers imported</h4>
                <p className="text-slate-400 text-sm mt-1 mb-4">Go to the Search page to discover and import publications.</p>
                <button
                  onClick={() => navigate('/search')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-505 text-white"
                >
                  Search Papers
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <div
                    key={paper.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex gap-4 hover:shadow-sm"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                          {paper.title}
                        </h4>
                        <button
                          onClick={() => handleDeletePaper(paper.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-550 dark:text-slate-405 text-xs font-semibold">
                        {paper.authors}
                      </p>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                        {paper.abstract}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium pt-2">
                        {paper.published_date && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {paper.published_date}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                          {paper.source}
                        </span>
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-bold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Paper
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-320px)]">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Sparkles className="w-8 h-8 text-brand-500 mx-auto animate-pulse" />
                  <p className="font-bold text-sm">Ask anything about these papers</p>
                  <p className="text-xs">The AI will read the context vectors and answer with citations.</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-none'
                          : 'bg-white border dark:bg-slate-900 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none prose dark:prose-invert prose-xs'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-white border dark:bg-slate-900 dark:border-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                  </div>
                </div>
              )}
              {chatError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{chatError}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a question about the papers in this workspace..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-brand-500 text-sm text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMessage.trim()}
                className="p-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white shadow-md shadow-brand-500/10 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* GENERATE REVIEW TAB */}
        {activeTab === 'review' && (
          <div className="p-6 space-y-6">
            {/* Tool Selection cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => handleRunTool('summary')}
                className={`p-6 rounded-3xl bg-white border hover:border-brand-500 shadow-sm cursor-pointer transition-all space-y-3 dark:bg-slate-900 ${
                  toolAction === 'summary' && reviewResult ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">AI Summaries</h4>
                <p className="text-slate-400 text-xs">Generate concise, structured summaries of all papers in this workspace.</p>
                <button
                  disabled={toolLoading}
                  className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-950/40 dark:text-brand-400 w-full"
                >
                  Generate Summaries
                </button>
              </div>

              <div 
                onClick={() => handleRunTool('insights')}
                className={`p-6 rounded-3xl bg-white border hover:border-brand-500 shadow-sm cursor-pointer transition-all space-y-3 dark:bg-slate-900 ${
                  toolAction === 'insights' && reviewResult ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Key Insights</h4>
                <p className="text-slate-400 text-xs">Extract methodology updates, trends, and gaps across all publications.</p>
                <button
                  disabled={toolLoading}
                  className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-950/40 dark:text-brand-400 w-full"
                >
                  Extract Insights
                </button>
              </div>

              <div 
                onClick={() => handleRunTool('review')}
                className={`p-6 rounded-3xl bg-white border hover:border-brand-500 shadow-sm cursor-pointer transition-all space-y-3 dark:bg-slate-900 ${
                  toolAction === 'review' && reviewResult ? 'border-brand-500 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Literature Review</h4>
                <p className="text-slate-400 text-xs">Write a synthesized academic literature review connecting the sources.</p>
                <button
                  disabled={toolLoading}
                  className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold dark:bg-brand-950/40 dark:text-brand-400 w-full"
                >
                  Generate Review
                </button>
              </div>
            </div>

            {/* Analysis Loading */}
            {toolLoading && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl space-y-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-brand-500 mx-auto animate-spin" />
                <h4 className="font-bold text-slate-700 dark:text-slate-350">Analyzing and synthesizing publications...</h4>
                <p className="text-slate-400 text-xs">This may take up to a minute depending on document sizes.</p>
              </div>
            )}

            {/* Analysis Result */}
            {reviewResult && !toolLoading && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-bold text-slate-750 dark:text-slate-205 uppercase">
                    AI Report Result ({toolAction})
                  </span>
                  <button
                    onClick={handleDownloadResult}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Download Report (.md)
                  </button>
                </div>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{reviewResult}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceView;
