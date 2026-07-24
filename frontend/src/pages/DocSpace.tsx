import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  FileText, 
  Save, 
  Download, 
  Heading1, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  FolderOpen,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Workspace, Document } from '../utils/types';

const DocSpace: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // States
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Editor Fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Loading & Alert States
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
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

  const fetchDocuments = async (wsId: string) => {
    if (!wsId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/documents/?workspace_id=${wsId}`);
      setDocuments(response.data);
      if (response.data.length > 0) {
        openDocument(response.data[0]);
      } else {
        setSelectedDoc(null);
        setTitle('');
        setContent('');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchDocuments(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId]);

  const openDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setError(null);
    setSaveSuccess(false);
  };

  const handleCreateNewDocument = async () => {
    if (!selectedWorkspaceId) return;
    
    setError(null);
    setSaveSuccess(false);
    
    const newDocTitle = 'Untitled Note';
    const initialContent = '# Untitled Note\nStart writing research insights here...';

    try {
      const response = await api.post('/api/documents/', {
        title: newDocTitle,
        content: initialContent,
        workspace_id: parseInt(selectedWorkspaceId, 10)
      });
      
      const createdDoc: Document = response.data;
      setDocuments((prev) => [createdDoc, ...prev]);
      openDocument(createdDoc);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create new document.');
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc) return;
    setSaveLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await api.put(`/api/documents/${selectedDoc.id}`, {
        title,
        content
      });
      
      // Update list
      const updatedDoc: Document = response.data;
      setDocuments((prev) => 
        prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
      );
      setSelectedDoc(updatedDoc);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save document.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    try {
      await api.delete(`/api/documents/${docId}`);
      // Remove from list
      const remainingDocs = documents.filter((d) => d.id !== docId);
      setDocuments(remainingDocs);
      if (remainingDocs.length > 0) {
        openDocument(remainingDocs[0]);
      } else {
        setSelectedDoc(null);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_') || 'document'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to insert formatting characters into the textarea at current cursor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const replacement = prefix + selection + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reset cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selection.length);
    }, 50);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Selector Panel */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Doc Space
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Write notes, compile drafts, and organize research findings
          </p>
        </div>

        {/* Workspace Dropdown */}
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-750 dark:text-slate-100 text-xs focus:outline-none"
          >
            {workspaces.length === 0 ? (
              <option value="">No workspaces available</option>
            ) : (
              workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Layout split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Notes list */}
        <div className="w-64 border-r border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 flex flex-col shrink-0">
          {/* Create Button */}
          <div className="p-4 shrink-0">
            <button
              onClick={handleCreateNewDocument}
              disabled={!selectedWorkspaceId}
              className="w-full py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-505 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-brand-500/10 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            ) : documents.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12">No notes created yet.</p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => openDocument(doc)}
                    className={`p-3 rounded-xl cursor-pointer group flex items-start gap-2.5 transition-all relative ${
                      isSelected 
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-350'
                    }`}
                  >
                    <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1 overflow-hidden pr-6">
                      <p className="text-xs font-semibold truncate leading-tight">{doc.title}</p>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Quick delete icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="absolute right-3 top-3.5 p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-rose-950/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Editor Canvas */}
        {selectedDoc ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {/* Header actions toolbar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document Title"
                className="font-extrabold text-slate-800 dark:text-slate-100 text-sm focus:outline-none bg-transparent w-full"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDocument}
                  disabled={saveLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saveLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>

            {/* Markdown Toolbar */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
              <button 
                onClick={() => insertFormatting('# ', '\n')} 
                title="Heading"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => insertFormatting('**', '**')} 
                title="Bold"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button 
                onClick={() => insertFormatting('*', '*')} 
                title="Italic"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button 
                onClick={() => insertFormatting('<u>', '</u>')} 
                title="Underline"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1.5" />
              <button 
                onClick={() => insertFormatting('- ', '\n')} 
                title="Bulleted List"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => insertFormatting('1. ', '\n')} 
                title="Numbered List"
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
            </div>

            {/* Note text canvas */}
            <div className="flex-1 p-6 relative">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing in markdown..."
                className="w-full h-full resize-none text-slate-850 dark:text-slate-100 focus:outline-none bg-transparent text-sm leading-relaxed"
              />

              {/* Save Success Alert Overlay */}
              {saveSuccess && (
                <div className="absolute top-4 right-4 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-450 text-xs shadow-md animate-in fade-in zoom-in-95 duration-150">
                  Document saved successfully!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-center p-8">
            <FileText className="w-12 h-12 text-slate-250 dark:text-slate-750 mb-4 animate-pulse" />
            <h4 className="font-bold text-slate-700 dark:text-slate-350">
              No active document
            </h4>
            <p className="text-slate-400 text-xs max-w-sm mt-1">
              Select an existing note on the left or create a new document in this workspace to begin writing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocSpace;
