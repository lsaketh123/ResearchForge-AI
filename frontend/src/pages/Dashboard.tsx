import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FolderPlus, 
  Trash2, 
  Layers, 
  FileCode, 
  Search, 
  Calendar,
  X,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import api from '../utils/api';
import { Workspace } from '../utils/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [papersCount, setPapersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch workspaces
      const wsResponse = await api.get('/api/workspaces/');
      const wsList: Workspace[] = wsResponse.data;
      setWorkspaces(wsList);

      // 2. Fetch paper counts
      let totalPapers = 0;
      for (const ws of wsList) {
        try {
          const papersRes = await api.get(`/api/papers/?workspace_id=${ws.id}`);
          totalPapers += papersRes.data.length;
        } catch (e) {
          // Ignore individual workspace query failures
        }
      }
      setPapersCount(totalPapers);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setModalLoading(true);
    setModalError(null);

    try {
      await api.post('/api/workspaces/', { name, description });
      setName('');
      setDescription('');
      setShowModal(false);
      fetchDashboardData();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create workspace.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Avoid triggering card click redirection
    if (!window.confirm('Are you sure you want to delete this workspace? All papers and chat histories will be removed.')) {
      return;
    }

    try {
      await api.delete(`/api/workspaces/${id}`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete workspace.');
    }
  };

  return (
    <div className="flex-1 p-6 space-y-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
            Dashboard
          </h2>
          <p className="text-slate-400 text-sm">
            Manage your research workspaces and projects
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center gap-2 text-sm shadow-lg shadow-brand-500/10 transition-all shrink-0"
        >
          <FolderPlus className="w-5 h-5" />
          Create New Workspace
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Workspaces */}
        <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Workspaces
            </span>
            <span className="text-3xl font-black text-slate-850 dark:text-slate-100">
              {loading ? '...' : workspaces.length}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Papers Imported */}
        <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Papers Imported
            </span>
            <span className="text-3xl font-black text-slate-850 dark:text-slate-100">
              {loading ? '...' : papersCount}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <FileCode className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Actions */}
        <div 
          onClick={() => navigate('/search')}
          className="p-6 rounded-3xl bg-white border border-dashed border-slate-300 dark:bg-slate-900 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-500 group transition-all"
        >
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Actions
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 group-hover:underline flex items-center gap-1.5">
              <Search className="w-4 h-4" />
              Search Papers
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 dark:group-hover:bg-brand-950/40 dark:group-hover:text-brand-400 transition-colors">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Workspaces
          </h3>
          {workspaces.length === 0 ? (
            <div className="text-center py-12 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-slate-400 text-sm mb-4">No workspaces found. Get started by creating your first workspace!</p>
              <button 
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-505 text-white"
              >
                Create Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => navigate(`/workspace/${ws.id}`)}
                  className="group relative p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-44 shadow-sm"
                >
                  {/* Workspace Meta */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-extrabold text-slate-850 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate pr-8">
                        {ws.name}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                        className="absolute top-6 right-6 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 text-xs line-clamp-2">
                      {ws.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between border-t pt-4 border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Created {new Date(ws.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                      Workspace
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-2xl relative space-y-6 text-slate-800 dark:text-slate-100">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold">
                Create New Workspace
              </h3>
              <p className="text-slate-400 text-xs">
                Organize papers and contextual chats inside a container
              </p>
            </div>

            {modalError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Deep Learning Research"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description of this project container"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 focus:outline-none focus:border-brand-500 text-sm h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-505 text-white flex items-center justify-center text-sm shadow-md disabled:opacity-50"
              >
                {modalLoading ? 'Creating...' : 'Create Workspace'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
