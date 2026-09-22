import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getDatabaseStats } from '../../db/indexedDB';
import {
  getLocalSnapshots,
  getStorageQuota,
} from '../../utils/backupService';
import { CreateBackupTab } from './CreateBackupTab';
import { RestoreBackupTab } from './RestoreBackupTab';
import { LocalSnapshotsTab } from './LocalSnapshotsTab';
import { StorageAuditTab } from './StorageAuditTab';
import { DailyMidnightBackupTab } from './DailyMidnightBackupTab';
import {
  HardDrive,
  Download,
  Upload,
  History,
  Activity,
  Database,
  Layers,
  ShieldCheck,
  FileCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const BackupManagement: React.FC = () => {
  const { language, setActiveTab } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'create' | 'restore' | 'snapshots' | 'daily_auto' | 'audit'
  >('daily_auto');

  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalStores, setTotalStores] = useState<number>(0);
  const [snapshotCount, setSnapshotCount] = useState<number>(0);
  const [storageUsed, setStorageUsed] = useState<string>('0 MB');

  const refreshOverviewStats = async () => {
    try {
      const stats = await getDatabaseStats();
      const records = stats.reduce((acc, s) => acc + s.count, 0);
      setTotalRecords(records);
      setTotalStores(stats.length);

      const snaps = await getLocalSnapshots();
      setSnapshotCount(snaps.length);

      const quota = await getStorageQuota();
      const mb = (quota.usageBytes / (1024 * 1024)).toFixed(1);
      setStorageUsed(`${mb} MB`);
    } catch (err) {
      console.error('Failed to calculate backup overview stats:', err);
    }
  };

  useEffect(() => {
    refreshOverviewStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn'
                  ? 'সিস্টেম ব্যাকআপ ও রিস্টোর হাব'
                  : 'Backup & Disaster Recovery Center'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'সম্পূর্ণ অফলাইন ডাটাবেজ ব্যাকআপ, প্রি-ফ্লাইট ভেরিফিকেশন, ও তাৎক্ষণিক লোকাল রোলব্যাক সিস্টেম'
                  : 'Enterprise-grade offline persistence, SHA-256 verified exports, and one-click rollback checkpoints.'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions & Offline Badge */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('version_updater')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ভার্সন আপগ্রেডার' : 'Version Updater'}</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'bn' ? 'অফলাইন ডাটাবেস সুরক্ষিত' : 'Offline Database Protected'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {language === 'bn' ? 'মোট ডাটা রেকর্ড' : 'Indexed Records'}
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {totalRecords.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'bn' ? 'সকল ৪৪টি টেবিলে' : `Across ${totalStores} stores`}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {language === 'bn' ? 'লোকাল চেকপয়েন্ট' : 'Rollback Checkpoints'}
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {snapshotCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'bn' ? 'দ্রুত রোলব্যাকের জন্য প্রস্তুত' : 'Ready for instant restore'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {language === 'bn' ? 'স্টোরেজ ব্যবহার' : 'Storage Consumed'}
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {storageUsed}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'bn' ? 'ব্রাউজার IndexedDB' : 'Browser Sandbox'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            {language === 'bn' ? 'ডাটাবেজ সংস্করণ' : 'Engine Schema'}
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">
            v6.0
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {language === 'bn' ? 'স্বয়ংক্রিয় সিঙ্ক সক্ষম' : 'Multi-Store Verified'}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto gap-1">
        <button
          id="tab-btn-daily-auto"
          onClick={() => setActiveSubTab('daily_auto')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'daily_auto'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{language === 'bn' ? 'রাত ১১:৫৯ অটো ব্যাকআপ' : '11:59 PM Auto-Backup'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
            {language === 'bn' ? 'স্বয়ংক্রিয়' : 'Auto'}
          </span>
        </button>

        <button
          id="tab-btn-create-backup"
          onClick={() => setActiveSubTab('create')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'create'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>{language === 'bn' ? 'ব্যাকআপ তৈরি ও ডাউনলোড' : 'Create & Download Backup'}</span>
        </button>

        <button
          id="tab-btn-restore-backup"
          onClick={() => setActiveSubTab('restore')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'restore'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{language === 'bn' ? 'ডাটা রিস্টোর ও রিকভারি' : 'Restore & Recover Database'}</span>
        </button>

        <button
          id="tab-btn-snapshots"
          onClick={() => setActiveSubTab('snapshots')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'snapshots'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>
            {language === 'bn' ? 'লোকাল চেকপয়েন্ট ও রোলব্যাক' : 'Local Snapshots & Rollback'}
          </span>
          {snapshotCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {snapshotCount}
            </span>
          )}
        </button>

        <button
          id="tab-btn-audit"
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{language === 'bn' ? 'স্টোরেজ ও ডাটাবেজ স্বাস্থ্য' : 'Storage & Health Audit'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'daily_auto' && (
          <DailyMidnightBackupTab
            onBackupRun={() => {
              refreshOverviewStats();
            }}
          />
        )}

        {activeSubTab === 'create' && (
          <CreateBackupTab
            onSnapshotCreated={() => {
              refreshOverviewStats();
            }}
          />
        )}

        {activeSubTab === 'restore' && (
          <RestoreBackupTab
            onRestoreSuccess={() => {
              refreshOverviewStats();
            }}
          />
        )}

        {activeSubTab === 'snapshots' && (
          <LocalSnapshotsTab
            onRollbackComplete={() => {
              refreshOverviewStats();
            }}
          />
        )}

        {activeSubTab === 'audit' && (
          <StorageAuditTab
            onDatabaseReset={() => {
              refreshOverviewStats();
            }}
          />
        )}
      </div>
    </div>
  );
};
