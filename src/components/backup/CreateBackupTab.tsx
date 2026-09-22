import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BACKUP_MODULE_GROUPS,
  createBackupPackage,
  downloadBackupFile,
  saveLocalSnapshot,
} from '../../utils/backupService';
import { getDatabaseStats } from '../../db/indexedDB';
import {
  Download,
  HardDrive,
  CheckCircle2,
  BookmarkPlus,
  ShieldCheck,
  Layers,
  FileCode,
  FileCheck,
  Info,
  Sparkles,
} from 'lucide-react';

export const CreateBackupTab: React.FC<{
  onSnapshotCreated: () => void;
}> = ({ onSnapshotCreated }) => {
  const { activeInstitute, activeAcademicYear, currentUser, language, logAudit } = useApp();

  const [scope, setScope] = useState<'full' | 'selective'>('full');
  const [selectedModules, setSelectedModules] = useState<string[]>(
    BACKUP_MODULE_GROUPS.map((m) => m.id)
  );
  const [includeAuditLogs, setIncludeAuditLogs] = useState(true);
  const [systemNotes, setSystemNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    type: 'download' | 'snapshot';
    filename?: string;
    snapshotName?: string;
    totalRecords: number;
    storesCount: number;
    checksum: string;
  } | null>(null);

  const [storeCounts, setStoreCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getDatabaseStats().then((stats) => {
      const map: Record<string, number> = {};
      stats.forEach((s) => {
        map[s.storeName] = s.count;
      });
      setStoreCounts(map);
    });
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedModules(BACKUP_MODULE_GROUPS.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedModules([]);
  };

  const getModuleRecordCount = (stores: string[]) => {
    return stores.reduce((acc, s) => acc + (storeCounts[s] || 0), 0);
  };

  const handleDownloadBackup = async () => {
    if (scope === 'selective' && selectedModules.length === 0) {
      alert(
        language === 'bn'
          ? 'অনুগ্রহ করে অন্তত একটি মডিউল নির্বাচন করুন।'
          : 'Please select at least one module for selective backup.'
      );
      return;
    }

    setIsGenerating(true);
    setSuccessInfo(null);

    try {
      const { pkg, jsonString, totalRecords } = await createBackupPackage({
        scope,
        selectedModules: scope === 'selective' ? selectedModules : undefined,
        includeAuditLogs,
        systemNotes: systemNotes || undefined,
        currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : undefined,
        activeInstitute,
        activeAcademicYear,
      });

      const institutePrefix = activeInstitute?.eiin || activeInstitute?.code || 'INST';
      const filename = downloadBackupFile(
        jsonString,
        institutePrefix,
        scope === 'full' ? 'FULL' : 'SELECTIVE'
      );

      await logAudit(
        'BACKUP_EXPORTED',
        'backup',
        `Exported ${scope} backup (${totalRecords} records across ${pkg.metadata.totalStores} stores)`
      );

      setSuccessInfo({
        type: 'download',
        filename,
        totalRecords,
        storesCount: pkg.metadata.totalStores,
        checksum: pkg.metadata.checksum,
      });
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateLocalRollback = async () => {
    setIsSnapshotting(true);
    setSuccessInfo(null);

    try {
      const snapshotName =
        systemNotes.trim() ||
        (language === 'bn'
          ? `ম্যানুয়াল চেকপয়েন্ট (${new Date().toLocaleTimeString('bn-BD')})`
          : `Manual Checkpoint (${new Date().toLocaleTimeString()})`);

      const snap = await saveLocalSnapshot(
        snapshotName,
        'manual',
        `Created by ${currentUser?.username || 'Admin'} from Backup Hub`,
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );

      await logAudit(
        'LOCAL_SNAPSHOT_CREATED',
        'backup',
        `Created local rollback snapshot "${snap.name}" (${snap.recordCount} records)`
      );

      onSnapshotCreated();

      setSuccessInfo({
        type: 'snapshot',
        snapshotName: snap.name,
        totalRecords: snap.recordCount,
        storesCount: snap.storeCount,
        checksum: 'LOCAL_INDEXEDDB',
      });
    } catch (err: any) {
      alert(`Snapshot failed: ${err.message}`);
    } finally {
      setIsSnapshotting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700/70 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'bn'
                  ? 'অফলাইন সিস্টেম ডাটাবেজ ব্যাকআপ'
                  : 'Offline System Database Backup'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {language === 'bn'
                  ? 'আপনার স্কুল ও কলেজের সকল তথ্য (শিক্ষার্থী, শিক্ষক, মার্কস, হিসাব, ফি ও রেজাল্ট) একটি সুরক্ষিত ও ভেরিফাইড JSON ফাইলে ডাউনলোড করে পেনড্রাইভ বা এক্সটার্নাল স্টোরেজে সংরক্ষণ করুন।'
                  : 'Export all institutional records, student registers, examination mark sheets, fee ledgers, and configurations into a verified JSON snapshot for offline preservation.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-create-local-snapshot"
              onClick={handleCreateLocalRollback}
              disabled={isSnapshotting}
              className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>
                {isSnapshotting
                  ? language === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving Checkpoint...'
                  : language === 'bn'
                  ? 'লোকাল চেকপয়েন্ট তৈরি'
                  : 'Instant Local Rollback'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 flex items-start gap-3 text-emerald-900 dark:text-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">
              {successInfo.type === 'download'
                ? language === 'bn'
                  ? 'সফলভাবে ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে!'
                  : 'Backup File Successfully Generated & Downloaded!'
                : language === 'bn'
                ? 'লোকাল রোলব্যাক স্ন্যাপশট সংরক্ষিত হয়েছে!'
                : 'Local Rollback Snapshot Created Successfully!'}
            </div>
            {successInfo.filename && (
              <div className="text-emerald-800 dark:text-emerald-300 font-mono text-[11px]">
                {language === 'bn' ? 'ফাইলের নাম:' : 'File:'} {successInfo.filename}
              </div>
            )}
            {successInfo.snapshotName && (
              <div className="text-emerald-800 dark:text-emerald-300 font-medium">
                {language === 'bn' ? 'স্ন্যাপশটের নাম:' : 'Checkpoint:'} {successInfo.snapshotName}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
              <span>
                {language === 'bn' ? 'মোট রেকর্ড:' : 'Total Records:'}{' '}
                <strong>{successInfo.totalRecords.toLocaleString()}</strong>
              </span>
              <span>•</span>
              <span>
                {language === 'bn' ? 'টেবিল সংখ্যা:' : 'Object Stores:'}{' '}
                <strong>{successInfo.storesCount}</strong>
              </span>
              {successInfo.checksum !== 'LOCAL_INDEXEDDB' && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[10px]">
                    SHA-256: {successInfo.checksum.substring(0, 16)}...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Scope Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            {language === 'bn' ? 'ব্যাকআপের পরিধি (Scope)' : 'Backup Scope'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScope('full')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'full'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  {language === 'bn' ? 'সম্পূর্ণ সিস্টেম ব্যাকআপ (Full)' : 'Complete System Backup'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  {language === 'bn' ? 'প্রস্তাবিত' : 'Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'সকল ৪৪+ টেবিল, শিক্ষার্থী, শিক্ষক, রেজাল্ট, ভাউচার ও সেটিংস একসাথে ব্যাকআপ হবে।'
                  : 'Includes all 44+ IndexedDB stores, profiles, examination archives, and finance.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setScope('selective')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                scope === 'selective'
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  {language === 'bn' ? 'মডিউলভিত্তিক কাস্টম ব্যাকআপ' : 'Custom Modular Backup'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {selectedModules.length} / {BACKUP_MODULE_GROUPS.length}{' '}
                  {language === 'bn' ? 'টি নির্বাচিত' : 'Selected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'bn'
                  ? 'নির্দিষ্ট কোনো শাখা (যেমন শুধুমাত্র শিক্ষার্থী বা শুধু পরীক্ষার ফলাফল) ব্যাকআপ করুন।'
                  : 'Select individual functional domains like Students, Exams, or Accounts to export.'}
              </p>
            </button>
          </div>
        </div>

        {/* Module Selection Grid (Visible when scope === 'selective') */}
        {scope === 'selective' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'মডিউল তালিকা নির্বাচন করুন:' : 'Select Modules to Include:'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                >
                  {language === 'bn' ? 'সব বাতিল' : 'Deselect All'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BACKUP_MODULE_GROUPS.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);
                const recCount = getModuleRecordCount(mod.stores);
                return (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-500/80 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {language === 'bn' ? mod.bengaliName : mod.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                          {recCount} recs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {language === 'bn' ? mod.bengaliDescription : mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Configurations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              {language === 'bn' ? 'ব্যাকআপ বিবরণ / নোট (ঐচ্ছিক)' : 'Backup Note / Memo (Optional)'}
            </label>
            <input
              type="text"
              value={systemNotes}
              onChange={(e) => setSystemNotes(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'উদা: অর্ধবার্ষিক পরীক্ষার ফলাফল প্রকাশের পূর্বের ব্যাকআপ'
                  : 'e.g., Pre-Annual Examination result release snapshot'
              }
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'অডিট লগ অন্তর্ভুক্ত করুন' : 'Include Audit Trail Logs'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ব্যবহারকারীর লগইন ও কার্যক্রমের ইতিহাস সংযুক্ত থাকবে'
                  : 'Preserves complete security trail and user action history'}
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeAuditLogs}
              onChange={(e) => setIncludeAuditLogs(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              {language === 'bn'
                ? 'ব্যাকআপ ফাইলটি SHA-256 ক্রিপ্টোগ্রাফিক চেকার দ্বারা স্বয়ংক্রিয়ভাবে সিল করা থাকবে।'
                : 'Files are cryptographically checksummed using SHA-256 for tamper detection.'}
            </span>
          </div>

          <button
            id="btn-download-backup-action"
            onClick={handleDownloadBackup}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isGenerating
                ? language === 'bn'
                  ? 'ব্যাকআপ ফাইল তৈরি হচ্ছে...'
                  : 'Packaging Backup...'
                : language === 'bn'
                ? 'ব্যাকআপ ফাইল ডাউনলোড করুন (.JSON)'
                : 'Download Verified Backup (.JSON)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
