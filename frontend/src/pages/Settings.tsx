import React from 'react';
import { Settings as SettingsIcon, Shield, Sliders, Bell } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
          Settings
        </h2>
        <p className="text-slate-400 text-sm">
          Configure application systems and user preferences
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* General Preferences */}
        <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-slate-400" />
            General Preferences
          </h3>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-750 dark:text-slate-200 text-xs block">AI Auto-Summarize</span>
                <span className="text-[10px] text-slate-400">Automatically generate summaries for newly uploaded PDF papers.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-brand-650 focus:ring-brand-500 w-4 h-4 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-750 dark:text-slate-200 text-xs block">Vanguard Vector Search</span>
                <span className="text-[10px] text-slate-400">Perform dense semantic search matches on user queries.</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-brand-650 focus:ring-brand-500 w-4 h-4 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
            </div>
          </div>
        </div>

        {/* Security Preferences */}
        <div className="p-6 rounded-3xl bg-white border dark:bg-slate-900 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-750 dark:text-slate-200 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            Security & Authentication
          </h3>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-750 dark:text-slate-200 text-xs block">Stateless JWT Session</span>
                <span className="text-[10px] text-slate-400">Token validity expires in 60 minutes. Rotation is refreshed automatically.</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 uppercase">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
