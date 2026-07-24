import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  UploadCloud, 
  FileText, 
  Wand2, 
  FolderOpen, 
  Download, 
  CheckCircle, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Workspace, Paper } from '../utils/types';

const UploadPDF: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Upload & Results States
  const [uploading, setUploading] = useState(false);
  const [uploadedPaper, setUploadedPaper] = useState<Paper | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadedPaper(null);
      setSummaryResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedWorkspaceId) return;

    setUploading(true);
    setError(null);
    setUploadedPaper(null);
    setSummaryResult(null);

    const formData = new FormData();
    formData.append('workspace_id', selectedWorkspaceId);
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/api/papers/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadedPaper(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload and parse PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!uploadedPaper) return;
    setSummaryLoading(true);
    setSummaryResult(null);
    setError(null);

    try {
      const response = await api.post('/api/ai/analyze', {
        paper_ids: [uploadedPaper.id],
        action: 'summary'
      });
      setSummaryResult(response.data.result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate AI summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDownloadText = () => {
    if (!uploadedPaper?.extracted_text) return;
    const blob = new Blob([uploadedPaper.extracted_text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedFile?.name.replace('.pdf', '')}_extracted_text.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Upload Research Paper
        </h2>
        <p className="text-slate-400 text-sm">
          Upload a PDF to extract text content, index vectors, and run AI summaries
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Upload Zone */}
        <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-6">
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Target Workspace Selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Target Workspace
              </label>
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-slate-400" />
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-850 dark:text-slate-100 text-sm focus:outline-none"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drop Zone Box */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                PDF File
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-3xl p-8 text-center bg-slate-50 dark:bg-slate-950/40 relative cursor-pointer group transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 group-hover:text-brand-500 transition-colors" />
                <p className="text-slate-600 dark:text-slate-350 text-sm font-semibold">
                  {selectedFile ? selectedFile.name : 'Select or drop PDF file here'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Only PDF files up to 20MB are supported
                </p>
              </div>
            </div>

            {/* Upload Action Button */}
            <button
              type="submit"
              disabled={uploading || !selectedFile || workspaces.length === 0}
              className="w-full py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-505 disabled:opacity-50 text-white shadow-md text-sm flex items-center justify-center gap-2"
            >
              {uploading ? 'Uploading & Parsing PDF...' : 'Upload & Parse PDF'}
            </button>
          </form>

          {/* Upload Status Card */}
          {uploadedPaper && (
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1 overflow-hidden">
                <p className="font-bold truncate">{uploadedPaper.title}</p>
                <p className="text-xs text-emerald-500/80">PDF successfully processed and vectorized</p>
              </div>
            </div>
          )}

          {/* Action Row */}
          {uploadedPaper && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Wand2 className="w-4 h-4 text-brand-500" />
                Generate AI Summary
              </button>
              <button
                onClick={handleDownloadText}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-550" />
                Download Text
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Output display */}
        <div className="space-y-6">
          {/* Extracted Text Preview */}
          {uploadedPaper && (
            <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Extracted Text Preview
              </h3>
              <div className="h-44 overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
                {uploadedPaper.extracted_text || 'No text extracted.'}
              </div>
            </div>
          )}

          {/* AI Summary Display */}
          {summaryLoading && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl space-y-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-brand-500 mx-auto animate-spin" />
              <h4 className="font-bold text-slate-700 dark:text-slate-350">Generating AI Summary...</h4>
              <p className="text-slate-400 text-xs">Prompting Llama 3.3 for analytical bullet points...</p>
            </div>
          )}

          {summaryResult && !summaryLoading && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 flex items-center gap-1.5 border-b pb-3 border-slate-100 dark:border-slate-800">
                <Wand2 className="w-4 h-4 text-brand-500" />
                AI Summary
              </h3>
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{summaryResult}</ReactMarkdown>
              </div>
            </div>
          )}

          {!uploadedPaper && !uploading && (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl dark:bg-slate-900 dark:border-slate-800">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                Awaiting Upload
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                Upload a research paper PDF on the left to extract text and generate summaries
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPDF;
