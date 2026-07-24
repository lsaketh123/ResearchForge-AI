import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components & Layouts
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SearchPapers from './pages/SearchPapers';
import WorkspaceView from './pages/WorkspaceView';
import AITools from './pages/AITools';
import UploadPDF from './pages/UploadPDF';
import DocSpace from './pages/DocSpace';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

// Layout Wrapper for authenticated routes
const AuthenticatedLayout: React.FC<{
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}> = ({ isDarkMode, setIsDarkMode }) => {
  const location = useLocation();

  // Get active navbar title based on path
  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Home';
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/search') return 'Search Research Papers';
    if (pathname.startsWith('/workspace/')) return 'Workspace Details';
    if (pathname === '/ai-tools') return 'AI Tools Workspace';
    if (pathname === '/upload-pdf') return 'Upload Publication';
    if (pathname === '/docspace') return 'Doc Space Note Editor';
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/profile') return 'Profile';
    return 'ResearchHub AI';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Navbar */}
        <Navbar title={getPageTitle(location.pathname)} />
        
        {/* Content Outlet */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchPapers />} />
            <Route path="/workspace/:id" element={<WorkspaceView />} />
            <Route path="/ai-tools" element={<AITools />} />
            <Route path="/upload-pdf" element={<UploadPDF />} />
            <Route path="/docspace" element={<DocSpace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Dark mode state hook
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('dark_mode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('dark_mode', 'false');
    }
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes layout */}
          <Route element={<PrivateRoute />}>
            <Route 
              path="/*" 
              element={
                <AuthenticatedLayout 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode} 
                />
              } 
            />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
