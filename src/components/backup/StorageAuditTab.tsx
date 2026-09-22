import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getStorageQuota,
  runDatabaseHealthAudit,
} from '../../utils/backupService';
import {
  getAll,
  clearStore,
  DB_STORES,
  DBStoreName,
} from '../../db/indexedDB';
import { exportToCsv } from '../../utils/exportUtils';
import {
  HardDrive,
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
} from 'lucide-react';

export const StorageAuditTab: React.FC<{
  onDatabaseReset: () => void;
}> = ({ onDatabaseReset }) => {
  const { language, logAudit } = useApp();

  const [quotaInfo, setQuotaInfo] = useState<{
    quotaBytes: number;
    usageBytes: number;
    usagePercent: number;
    isAvailable: boolean;
  }>({
    quotaBytes: 1024 * 1024 * 1024,
    usageBytes: 0,
    usagePercent: 0,
    isAvailable: false,
  });

  const [healthResult, setHealthResult] = useState<{
    healthy: boolean;
    totalRecords: number;
    storesAudited: number;
    issues: string[];
    storeMetrics: { storeName: string; count: number; status: 'ok' | 'empty' | 'warning' }[];
  } | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  // Prune & Reset modals
  const [resetInput, setResetInput] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    const q = await getStorageQuota();
    setQuotaInfo(q);

    setIsAuditing(true);
    const audit = await runDatabaseHealthAudit();
    setHealthResult(audit);
    setIsAuditing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleExportStoreCsv = async (storeName: DBStoreName) => {
    try {
      const records = await getAll<any>(storeName);
      if (records.length === 0) {
        alert(language === 'bn' ? 'এই টেবিলে কোনো ডাটা নেই।' : 'No data in this store to export.');
        return;
      }

      // Extract all unique keys as headers
      const keySet = new Set<string>();
      records.forEach((r) => {
        if (typeof r === 'object' && r !== null) {
          Object.keys(r).forEach((k) => keySet.add(k));
        }
      });
      const headers = Array.from(keySet);

      const rows = records.map((r) =>
        headers.map((h) => {
          const val = r[h];
          if (typeof val === 'object' && val !== null) {
            return JSON.stringify(val);
          }
          return val ?? '';
        })
      );

      exportToCsv(`${storeName}_dump`, headers, rows);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handlePruneAuditLogs = async () => {
    if (
      !window.confirm(
        language === 'bn'
          ? 'আপনি কি নিশ্চিতভাবে ৯০ দিনের পুরোনো অডিট লগগুলো মুছে ফেলতে চান?'
          : 'Are you sure you want to prune audit logs older than 90 days?'
      )
    ) {
      return;
    }

    try {
      const logs = await getAll<any>('auditLogs');
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const keptLogs = logs.filter((l) => new Date(l.timestamp) >= ninetyDaysAgo);
      const prunedCount = logs.length - keptLogs.length;

      await clearStore('auditLogs');
      for (const log of keptLogs) {
        // reinsert
        const { add } = await import('../../db/indexedDB');
        await add('auditLogs', log);
      }

      await logAudit(
        'AUDIT_LOGS_PRUNED',
        'backup',
        `Pruned ${prunedCount} audit logs older than 90 days`
      );

      alert(
        language === 'bn'
          ? `সফলভাবে ${prunedCount}টি পুরোনো অডিট লগ মুছে ফেলা হয়েছে।`
          : `Pruned ${prunedCount} old audit log entries.`
      );
      loadData();
    } catch (err: any) {
      alert(`Pruning failed: ${err.message}`);
    }
  };

  const handleConfirmFactoryReset = async () => {
    if (resetInput.trim().toUpperCase() !== 'RESET') {
      alert(
        language === 'bn'
          ? 'অনুগ্রহ করে বক্সে "RESET" টাইপ করুন।'
          : 'Please type "RESET" to confirm.'
      );
      return;
    }

    setIsResetting(true);
    try {
      indexedDB.deleteDatabase('SchoolCollegeERP_DB');
      localStorage.clear();
      onDatabaseReset();
      window.location.reload();
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
      setIsResetting(false);
    }
  };

  const filteredMetrics =
    healthResult?.storeMetrics.filter((m) =>
      m.storeName.toLowerCase().includes(filterQuery.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6">
      {/* Storage Quota & Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Quota Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {language === 'bn' ? 'ব্রাউজার স্টোরেজ কোটা' : 'Browser Storage Quota'}
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatBytes(quotaInfo.usageBytes)} / {formatBytes(quotaInfo.quotaBytes)}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                quotaInfo.usagePercent > 80
                  ? 'bg-red-500'
                  : quotaInfo.usagePercent > 50
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.max(2, quotaInfo.usagePercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {language === 'bn'
                ? `ব্যবহৃত: ${quotaInfo.usagePercent}%`
                : `Used: ${quotaInfo.usagePercent}%`}
            </span>
            <span>
              {language === 'bn'
                ? 'অফলাইন উইন্ডোজ ডেস্কটপ ও পারসিস্টেন্ট স্টোরেজ'
                : 'Persistent Offline Storage'}
            </span>
          </div>
        </div>

        {/* Database Integrity Status Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-700 text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {language === 'bn' ? 'ডাটাবেজ অখণ্ডতা ও স্বাস্থ্য' : 'Database Integrity & Health'}
              </span>
            </div>

            <button
              onClick={loadData}
              disabled={isAuditing}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'স্ক্যান করুন' : 'Scan'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {healthResult?.healthy ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'bn'
                    ? 'ডাটাবেজ সম্পূর্ণ সুসংগঠিত ও অটুট রয়েছে'
                    : 'All Database Relational Keys are Healthy & Consistent'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {language === 'bn'
                    ? `${healthResult?.issues.length} টি সতর্কতা পাওয়া গেছে`
                    : `${healthResult?.issues.length} integrity notices detected`}
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'bn'
              ? `মোট ${healthResult?.storesAudited || 0} টি টেবিল এবং ${
                  healthResult?.totalRecords.toLocaleString() || 0
                } টি রেকর্ড পরীক্ষিত হয়েছে।`
              : `Audited ${healthResult?.storesAudited || 0} stores with ${
                  healthResult?.totalRecords.toLocaleString() || 0
                } verified records.`}
          </div>
        </div>
      </div>

      {/* Issues list if any */}
      {healthResult && healthResult.issues.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 text-xs space-y-1.5 text-amber-900 dark:text-amber-200">
          <div className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{language === 'bn' ? 'শনাক্তকৃত পর্যবেক্ষণসমূহ:' : 'Diagnostic Observations:'}</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {healthResult.issues.map((iss, idx) => (
              <li key={idx}>{iss}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stores Breakdown & CSV Export Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'bn' ? 'সকল অবজেক্ট স্টোর ও ডাটা খাতা' : 'IndexedDB Object Stores Breakdown'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {DB_STORES.length}
            </span>
          </div>

          <div className="w-full sm:w-60">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={language === 'bn' ? 'টেবিল অনুসন্ধান...' : 'Search store name...'}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">{language === 'bn' ? 'টেবিলের নাম' : 'Store Name'}</th>
                <th className="py-2.5 px-4">{language === 'bn' ? 'মোট রেকর্ড' : 'Record Count'}</th>
                <th className="py-2.5 px-4">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-2.5 px-4 text-right">{language === 'bn' ? 'এক্সপোর্ট' : 'Export'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredMetrics.map((m) => (
                <tr
                  key={m.storeName}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                    {m.storeName}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {m.count.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4">
                    {m.count > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Populated
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                        Empty
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => handleExportStoreCsv(m.storeName as DBStoreName)}
                      disabled={m.count === 0}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Download as CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CSV</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance & Danger Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/60 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertOctagon className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {language === 'bn' ? 'রক্ষণাবেক্ষণ ও বিপজ্জনক এরিয়া' : 'Maintenance & Danger Zone'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Prune Logs */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'bn'
                  ? 'পুরোনো অডিট লগ ছাঁটাই (Prune Audit Trail)'
                  : 'Prune Historical Audit Logs'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? '৯০ দিনের পুরোনো সমস্ত সিস্টেম অডিট লগ মুছে ফেলে ডাটাবেজের স্টোরেজ অপ্টিমাইজ করুন।'
                  : 'Purge security and user action trail logs older than 90 days to conserve browser storage.'}
              </p>
            </div>
            <button
              onClick={handlePruneAuditLogs}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold self-start cursor-pointer"
            >
              {language === 'bn' ? 'অডিট লগ ক্লিন করুন' : 'Prune Logs (> 90 Days)'}
            </button>
          </div>

          {/* Factory Reset */}
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
                {language === 'bn' ? 'ফ্যাক্টরি ডাটাবেজ রিসেট' : 'Emergency Factory Reset'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'সম্পূর্ণ লোকাল ডাটাবেজ মুছে দিয়ে সিস্টেমকে প্রাথমিক সেটআপ উইজার্ডে ফিরিয়ে নিয়ে যাবে।'
                  : 'Permanently deletes all records and resets the system to the First-Time Setup Wizard.'}
              </p>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold self-start shadow-xs cursor-pointer"
            >
              {language === 'bn' ? 'ডাটাবেজ রিসেট করুন' : 'Factory Reset Database'}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-red-200 dark:border-red-800 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'ডাটাবেজ রিসেট চূড়ান্ত নিশ্চিতকরণ' : 'Emergency Factory Reset'}
                </h4>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
                  {language === 'bn'
                    ? 'সতর্কতা: এই পদক্ষেপটি অপরিবর্তনীয় এবং সকল তথ্য চিরতরে মুছে যাবে।'
                    : 'CRITICAL: This will irreversibly wipe all students, teachers, marks, and settings.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'bn'
                ? 'রিসেট সম্পন্ন করার জন্য নিচের বক্সে "RESET" লিখুন:'
                : 'To confirm and execute the reset, type "RESET" in the box below:'}
            </p>

            <input
              type="text"
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              placeholder="Type RESET to confirm"
              className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => {
                  setShowResetModal(false);
                  setResetInput('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-factory-reset"
                type="button"
                disabled={isResetting || resetInput.trim().toUpperCase() !== 'RESET'}
                onClick={handleConfirmFactoryReset}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isResetting
                    ? language === 'bn'
                      ? 'মুছে ফেলা হচ্ছে...'
                      : 'Wiping Database...'
                    : language === 'bn'
                    ? 'সম্পূর্ণ রিসেট করুন'
                    : 'Confirm & Reset'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
