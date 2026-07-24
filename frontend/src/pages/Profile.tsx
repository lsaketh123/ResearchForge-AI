import React from 'react';
import { User as UserIcon, Calendar, Mail, Key } from 'lucide-react';

const Profile: React.FC = () => {
  const userEmail = localStorage.getItem('user_email') || 'researcher@hub.ai';

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          User Profile
        </h2>
        <p className="text-slate-400 text-sm">
          Manage your account credentials and workspace roles
        </p>
      </div>

      <div className="max-w-2xl p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-900 flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
            {userEmail[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {userEmail.split('@')[0]}
            </h3>
            <p className="text-slate-400 text-xs mt-1">Research Fellow & Analyst</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
          {/* Email Row */}
          <div className="flex items-center gap-3 text-xs text-slate-650 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-400 w-24 shrink-0">Email</span>
            <span className="font-medium truncate">{userEmail}</span>
          </div>

          {/* Role Row */}
          <div className="flex items-center gap-3 text-xs text-slate-650 dark:text-slate-300">
            <ShieldIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-400 w-24 shrink-0">Workspace Role</span>
            <span className="px-2.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 font-bold uppercase text-[9px]">
              Researcher (Admin)
            </span>
          </div>

          {/* Creation Date Row */}
          <div className="flex items-center gap-3 text-xs text-slate-650 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-400 w-24 shrink-0">Joined Date</span>
            <span className="font-medium">July 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon wrapper inside Profile since Lucide doesn't have ShieldIcon name directly
const ShieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default Profile;
