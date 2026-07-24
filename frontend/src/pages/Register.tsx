import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import GlobeCanvas from '../components/GlobeCanvas';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);

    try {
      await axios.post('/api/auth/register', { email, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        'Registration failed. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Background Globe */}
      <GlobeCanvas />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 m-4 rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl neon-glow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent mb-2">
            Create Account
          </h2>
          <p className="text-slate-400 text-sm">
            Join ResearchHub AI to manage and analyze publications
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm">
            <span>Account created successfully! Redirecting to Login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
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

          {/* Password */}
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
                placeholder="Minimum 6 characters"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 px-4 rounded-xl font-semibold bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2 group text-sm disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Register'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          <span>Already have an account? </span>
          <Link 
            to="/login" 
            className="font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
