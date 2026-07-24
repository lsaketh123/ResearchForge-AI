import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  Search, 
  Wand2, 
  UploadCloud, 
  FileText, 
  Settings, 
  User, 
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const userEmail = localStorage.getItem('user_email') || 'researcher@hub.ai';

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Search Papers', path: '/search', icon: Search },
    { name: 'AI Tools', path: '/ai-tools', icon: Wand2 },
    { name: 'Upload PDF', path: '/upload-pdf', icon: UploadCloud },
    { name: 'Doc Space', path: '/docspace', icon: FileText },
  ];

  const bottomItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  return (
    <aside 
      className={`flex flex-col h-screen border-r bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header Logo */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white shrink-0 shadow-md shadow-brand-500/20">
            <Wand2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent truncate">
              ResearchHub AI
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Menu Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Menu Items */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-5 h-5 shrink-0 text-amber-500" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 shrink-0 text-slate-500" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* User Session Metadata */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center shrink-0">
            {userEmail[0].toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
              {userEmail.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
              {userEmail}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
