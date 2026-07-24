import React from 'react';
import { Bell, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  title: string;
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const userEmail = localStorage.getItem('user_email') || 'researcher@hub.ai';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-200 shrink-0">
      {/* Title */}
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
        {title}
      </h1>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-600 border-2 border-white dark:border-slate-900" />
        </button>

        {/* User Account Info */}
        <div className="flex items-center gap-3 border-l pl-4 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
              {userEmail.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Researcher Account
            </span>
          </div>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-100 dark:border-brand-900 shadow-sm shrink-0">
            <UserIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
