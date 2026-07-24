import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import GlobeCanvas from '../components/GlobeCanvas';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user_email', email);

      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* 3D Particle Globe Mesh Background */}
      <GlobeCanvas />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl neon-glow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm">
            Sign in to continue to ResearchHub AI
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-semibold bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span>Don't have an account? </span>
          <Link 
            to="/register" 
            className="font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
