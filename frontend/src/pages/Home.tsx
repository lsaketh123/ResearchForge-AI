import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  MessageSquare, 
  FileText, 
  Wand2, 
  CheckCircle2 
} from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('user_email') || 'researcher@hub.ai';

  const features = [
    {
      title: 'Smart Paper Search',
      desc: 'Find research papers across multiple databases with AI-powered search.',
      icon: Search,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
    },
    {
      title: 'AI Chat Assistant',
      desc: 'Ask questions about your research papers and get intelligent responses.',
      icon: MessageSquare,
      color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/30'
    },
    {
      title: 'DocSpace Editor',
      desc: 'Create and edit documents with rich text formatting like Google Docs.',
      icon: FileText,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
    },
    {
      title: 'Literature Review',
      desc: 'Generate comprehensive literature reviews from selected papers.',
      icon: Wand2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
    }
  ];

  const benefits = [
    'Save 80% time on literature review',
    'Access millions of research papers',
    'AI-powered insights and summaries',
    'Collaborative workspace features',
    'Export to multiple formats',
    'Contextual chatbot answers'
  ];

  return (
    <div className="flex-1 p-6 space-y-12 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Welcome back, {userEmail.split('@')[0]}!
          </h2>
          <p className="text-slate-400 text-sm">
            Ready to explore new research frontiers?
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded-xl font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-2 group text-sm shadow-md shadow-brand-500/10 transition-all shrink-0"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto py-8 space-y-6">
        <h1 className="text-4xl sm:text-5xl font-black leading-tight text-slate-800 dark:text-slate-100">
          Your AI-Powered <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">Research Assistant</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
          Accelerate your research with intelligent paper discovery, AI-powered insights, and collaborative document editing - all in one platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-2 text-sm shadow-lg shadow-brand-500/25 transition-all"
          >
            Start Researching
          </button>
          <button
            onClick={() => navigate('/docspace')}
            className="px-6 py-3 rounded-xl font-bold border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm transition-all"
          >
            Try DocSpace
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-extrabold text-center text-slate-800 dark:text-slate-100">
          Powerful Features for Modern Research
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm flex flex-col items-center text-center space-y-4 hover:shadow-md transition-shadow"
              >
                <div className={`p-4 rounded-2xl ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100">
                  {feat.title}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Why Choose Section */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-xl">
        <div className="max-w-3xl mx-auto space-y-8">
          <h3 className="text-2xl font-extrabold text-center">
            Why Choose ResearchHub AI?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-300 shrink-0" />
                <span className="text-sm font-medium text-brand-50">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
