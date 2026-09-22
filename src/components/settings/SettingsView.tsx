import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { update } from '../../db/indexedDB';
import { AppSettings } from '../../types';
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Globe,
  Sun,
  Moon,
  Shield,
  HardDrive,
  Hash,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    language,
    theme,
    setLanguage,
    setTheme,
    setActiveTab,
    refreshContext,
    logAudit,
    t,
  } = useApp();

  const [formData, setFormData] = useState<AppSettings>(
    settings || {
      id: 'global',
      appName: 'School & College Management ERP',
      bengaliAppName: 'স্কুল ও কলেজ ম্যানেজমেন্ট ইআরপি',
      defaultLanguage: 'en',
      theme: 'light',
      sessionTimeoutMinutes: 60,
      enableAutoBackup: true,
      autoBackupInterval: 'daily',
      studentIdPrefixSchool: 'SCH',
      studentIdPrefixCollege: 'COL',
      receiptPrefix: 'RCP',
      certificatePrefix: 'CERT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated: AppSettings = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      await update('settings', updated);
      await logAudit(
        'SETTINGS_UPDATE',
        'settings',
        `Updated global system configuration and prefixes`
      );
      await refreshContext();
      setStatusMsg('Settings updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    }
  };

  const handleResetDatabase = () => {
    if (
      window.confirm(
        'CRITICAL WARNING: This will clear the local IndexedDB database and reset the system to the First-Time Setup Wizard. Are you sure?'
      )
    ) {
      indexedDB.deleteDatabase('SchoolCollegeERP_DB');
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>{t.settings}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Global system preferences, localization, and sequential ID prefixes.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Localization & Appearance Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Localization &amp; UI Theme</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Application Title (English)
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Application Title (Bengali)
              </label>
              <input
                type="text"
                value={formData.bengaliAppName}
                onChange={(e) => setFormData({ ...formData, bengaliAppName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default UI Language
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    language === 'bn'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  বাংলা (Bengali)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visual Theme
              </label>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Identification Numbering Formats */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Hash className="w-4 h-4 text-blue-600" />
            <span>Identifier &amp; Receipt Number Prefixes</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                School Student ID Prefix
              </label>
              <input
                type="text"
                value={formData.studentIdPrefixSchool}
                onChange={(e) =>
                  setFormData({ ...formData, studentIdPrefixSchool: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">e.g. SCH-2026-00001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College Student ID Prefix
              </label>
              <input
                type="text"
                value={formData.studentIdPrefixCollege}
                onChange={(e) =>
                  setFormData({ ...formData, studentIdPrefixCollege: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">e.g. COL-2026-00001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Money Receipt Prefix
              </label>
              <input
                type="text"
                value={formData.receiptPrefix}
                onChange={(e) => setFormData({ ...formData, receiptPrefix: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">e.g. RCP-2026-000001</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Certificate Prefix
              </label>
              <input
                type="text"
                value={formData.certificatePrefix}
                onChange={(e) => setFormData({ ...formData, certificatePrefix: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase font-mono font-semibold"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">e.g. CERT-2026-000001</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.save}</span>
          </button>
        </div>
      </form>

      {/* In-App Version Updater Hub */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800/60 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>{language === 'bn' ? 'ইন-অ্যাপ ভার্সন আপগ্রেডার (In-App Version Updater)' : 'In-App Version Updater (Offline Code Overwrite)'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'নতুন ভার্সনের ZIP প্যাকেজ আপলোড করে কোড ফাইল ওভাররাইট করুন। ডাটাবেস ও স্টোরেজ সম্পূর্ণ অপরিবর্তিত রেখে সিস্টেম স্বয়ংক্রিয়ভাবে রিস্টার্ট হবে।'
                : 'Upload update ZIP archives to overwrite code files while strictly isolating and preserving the existing database, followed by automated reboot.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('version_updater')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{language === 'bn' ? 'ভার্সন আপগ্রেডার খুলুন' : 'Open Version Updater'}</span>
          </button>
        </div>
      </div>

      {/* Backup & Disaster Recovery Hub (Phase 14) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/60 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>{language === 'bn' ? 'সিস্টেম ব্যাকআপ ও ডাটা সুরক্ষা (Phase 14 Unlocked)' : 'System Backup & Disaster Recovery (Phase 14 Unlocked)'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'bn'
                ? 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ, প্রি-ফ্লাইট ইন্টিগ্রিটি চেক সহ রিস্টোর, অফলাইন রোলব্যাক স্ন্যাপশট ও স্টোরেজ অডিট।'
                : 'Offline-first full snapshot exports, SHA-256 verified JSON restore, rollback checkpoints, and database integrity audits.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer shrink-0"
          >
            <HardDrive className="w-4 h-4" />
            <span>{language === 'bn' ? 'ব্যাকআপ ও রিস্টোর হাব খুলুন' : 'Open Backup Center'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Testing & Re-initialization */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/60 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Testing &amp; Re-initialization (Database Reset)</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          This developer control wipes the local IndexedDB database and returns to the First-Time Setup Wizard. Use this when you want to test the setup flow again with fresh data.
        </p>

        <button
          type="button"
          onClick={handleResetDatabase}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Database &amp; Re-run Setup Wizard</span>
        </button>
      </div>
    </div>
  );
};
