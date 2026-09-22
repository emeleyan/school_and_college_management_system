import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  validateBackupFile,
  executeRestore,
} from '../../utils/backupService';
import { BackupPackage } from '../../types';
import {
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Layers,
  Calendar,
  Building,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

export const RestoreBackupTab: React.FC<{
  onRestoreSuccess: () => void;
}> = ({ onRestoreSuccess }) => {
  const { activeInstitute, currentUser, language, refreshContext, logAudit } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedPkg, setParsedPkg] = useState<BackupPackage | null>(null);
  const [checksumMatches, setChecksumMatches] = useState<boolean>(true);
  const [storeCounts, setStoreCounts] = useState<Record<string, number>>({});
  const [totalRecords, setTotalRecords] = useState(0);

  // Restore Configuration
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [confirmInput, setConfirmInput] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<{ message: string; percent: number }>({
    message: '',
    percent: 0,
  });
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    restoredRecords: number;
    storesRestored: number;
    emergencySnapshotId?: string;
  } | null>(null);

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setParsedPkg(null);
    setRestoreResult(null);
    setConfirmInput('');
    setAnalyzing(true);

    try {
      const text = await file.text();
      const validation = await validateBackupFile(text);

      if (!validation.valid || !validation.pkg) {
        setErrorMsg(validation.error || 'Failed to parse backup payload.');
        return;
      }

      setParsedPkg(validation.pkg);
      setChecksumMatches(validation.checksumMatches ?? true);
      setStoreCounts(validation.storeCounts || {});
      setTotalRecords(validation.totalRecords || 0);
    } catch (err: any) {
      setErrorMsg(`Error reading file: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExecuteRestore = async () => {
    if (!parsedPkg) return;

    if (restoreMode === 'overwrite' && confirmInput.trim().toUpperCase() !== 'RESTORE') {
      alert(
        language === 'bn'
          ? 'নিশ্চিতকরণের জন্য বক্সে "RESTORE" টাইপ করুন।'
          : 'Please type "RESTORE" in the confirmation box to proceed.'
      );
      return;
    }

    setIsRestoring(true);
    setRestoreProgress({ message: 'Starting database recovery...', percent: 5 });

    try {
      const result = await executeRestore(
        parsedPkg,
        restoreMode,
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined,
        (message, percent) => {
          setRestoreProgress({ message, percent });
        }
      );

      if (!result.success) {
        alert(`Restore encountered an issue: ${result.error}`);
        return;
      }

      await logAudit(
        'BACKUP_RESTORED',
        'backup',
        `Restored backup "${parsedPkg.metadata.backupId}" (${result.restoredRecords} records, mode: ${restoreMode})`
      );

      setRestoreResult({
        success: true,
        restoredRecords: result.restoredRecords,
        storesRestored: result.storesRestored,
        emergencySnapshotId: result.emergencySnapshotId,
      });

      // Refresh application context so all components re-render with new data
      await refreshContext();
      onRestoreSuccess();
    } catch (err: any) {
      alert(`Fatal restore error: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const resetSelection = () => {
    setParsedPkg(null);
    setErrorMsg(null);
    setRestoreResult(null);
    setConfirmInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* File Dropzone or Initial Selection */}
      {!parsedPkg && !restoreResult && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-800'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.erpbak"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
            {analyzing ? (
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {language === 'bn'
              ? 'ব্যাকআপ ফাইল এখানে টেনে আনুন অথবা ক্লিক করে সিলেক্ট করুন'
              : 'Drag and drop backup file here, or click to browse'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {language === 'bn'
              ? 'সমর্থিত ফরম্যাট: .JSON বা .ERPBAK (পূর্বে তৈরিকৃত অফলাইন সিস্টেম ব্যাকআপ ফাইল)'
              : 'Supports standard JSON or .erpbak backups exported from School & College ERP.'}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {language === 'bn'
                ? 'স্বয়ংক্রিয় প্রাক-যাচাই ও ক্রিপ্টোগ্রাফিক চেকার সক্রিয়'
                : 'Pre-flight integrity & structure verification enabled'}
            </span>
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-start gap-3 text-red-900 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <div className="font-bold">{language === 'bn' ? 'ফাইল পড়তে ব্যর্থ হয়েছে' : 'Failed to Process Backup File'}</div>
            <div className="text-red-700 dark:text-red-300 mt-0.5">{errorMsg}</div>
          </div>
          <button
            onClick={resetSelection}
            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Retry'}
          </button>
        </div>
      )}

      {/* Restore Result Card */}
      {restoreResult && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-6 text-emerald-900 dark:text-emerald-200 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {language === 'bn'
                  ? 'ডাটাবেজ রিস্টোর সফলভাবে সম্পন্ন হয়েছে!'
                  : 'Database Restored Successfully!'}
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                {language === 'bn'
                  ? 'আপনার সিস্টেম ডাটাবেজে ব্যাকআপ থেকে সকল রেকর্ড সঠিকভাবে সন্নিবেশিত হয়েছে।'
                  : 'All records and object stores from the backup file have been loaded into IndexedDB.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'মোট রিস্টোরকৃত রেকর্ড' : 'Restored Records'}
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {restoreResult.restoredRecords.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'প্রভাবিত টেবিল' : 'Stores Restored'}
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {restoreResult.storesRestored}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-emerald-900/40 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                {language === 'bn' ? 'ইমার্জেন্সি রোলব্যাক' : 'Safety Safeguard'}
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                {restoreResult.emergencySnapshotId ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {language === 'bn' ? 'স্ন্যাপশট সংরক্ষিত' : 'Rollback Saved'}
                  </span>
                ) : (
                  'Merge Mode'
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={resetSelection}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              {language === 'bn' ? 'আরেকটি রিস্টোর করুন' : 'Done & Load Another'}
            </button>
          </div>
        </div>
      )}

      {/* Pre-flight Inspection & Execution View */}
      {parsedPkg && !restoreResult && (
        <div className="space-y-6">
          {/* Header of Inspecting File */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-700 text-blue-600">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'bn'
                        ? 'ব্যাকআপ ফাইল প্রাক-যাচাই ও বিশ্লেষণ'
                        : 'Backup File Pre-Flight Inspection'}
                    </h3>
                    {checksumMatches ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>SHA-256 Validated</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Hash Modified</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    ID: {parsedPkg.metadata.backupId}
                  </div>
                </div>
              </div>

              <button
                onClick={resetSelection}
                disabled={isRestoring}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer self-start sm:self-auto"
              >
                {language === 'bn' ? 'ফাইল পরিবর্তন' : 'Change File'}
              </button>
            </div>

            {/* Metadata Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'bn' ? 'প্রতিষ্ঠান' : 'Institute'}
                </div>
                <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                  {parsedPkg.metadata.instituteInfo?.name || 'Multi-Institute ERP'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  EIIN: {parsedPkg.metadata.instituteInfo?.eiin || 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'bn' ? 'তৈরির তারিখ ও সময়' : 'Created Date'}
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {new Date(parsedPkg.metadata.createdAt).toLocaleDateString()}
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(parsedPkg.metadata.createdAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'bn' ? 'মোট ডাটা রেকর্ড' : 'Total Records'}
                </div>
                <div className="font-bold text-blue-600 dark:text-blue-400 text-sm font-mono mt-0.5">
                  {totalRecords.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">
                  {Object.keys(storeCounts).length} Object Stores
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {language === 'bn' ? 'ব্যাকআপের ধরন' : 'Scope & Version'}
                </div>
                <div className="font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                  {parsedPkg.metadata.scope || 'Full'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  v{parsedPkg.metadata.appVersion || '1.0'}
                </div>
              </div>
            </div>

            {/* Included Store Chips */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                {language === 'bn'
                  ? 'এই ফাইলে অন্তর্ভুক্ত টেবিলসমূহ ও রেকর্ড সংখ্যা:'
                  : 'Included Tables & Record Breakdown:'}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                {Object.entries(storeCounts).map(([store, count]) => (
                  <span
                    key={store}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-medium">{store}:</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Restore Mode Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              {language === 'bn' ? 'রিস্টোর মোড নির্বাচন করুন' : 'Select Recovery Mode'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRestoreMode('overwrite')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  restoreMode === 'overwrite'
                    ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 ring-2 ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-red-600" />
                    {language === 'bn'
                      ? 'ক্লিন ওভাররাইট (Clean Wipe & Replace)'
                      : 'Clean Overwrite (Recommended for Full Restores)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'বর্তমান ডাটা মুছে ব্যাকআপ ফাইলের তথ্য সম্পূর্ণ নতুন করে প্রতিস্থাপন করবে। রিস্টোরের পূর্বে একটি অটো-রোলব্যাক পয়েন্ট স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'
                    : 'Clears target stores and restores exact backup snapshot. An emergency rollback point is created automatically before wiping.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRestoreMode('merge')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  restoreMode === 'merge'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    {language === 'bn' ? 'মার্জ মোড (Safe Merge / Upsert)' : 'Safe Merge & Upsert'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'bn'
                    ? 'মিল থাকা আইডিগুলো আপডেট করবে এবং নতুন ডাটা যোগ করবে, কিন্তু বিদ্যমান অন্য কোনো ডাটা মুছবে না।'
                    : 'Updates existing IDs and inserts new records without deleting existing non-conflicting records.'}
                </p>
              </button>
            </div>

            {/* Safety Confirmation Input */}
            {restoreMode === 'overwrite' && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {language === 'bn'
                      ? 'সতর্কতা: ক্লিন ওভাররাইট নিশ্চিতকরণ'
                      : 'Critical Safeguard Confirmation'}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  {language === 'bn'
                    ? 'অনভিপ্রেত ডাটা প্রতিস্থাপন রোধে নিচের বক্সে ইংরেজিতে "RESTORE" শব্দটি লিখুন:'
                    : 'To prevent accidental overwrites, please type "RESTORE" in the box below to unlock:'}
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="Type RESTORE to confirm"
                  className="w-full sm:w-64 px-3 py-1.5 text-xs font-mono font-bold tracking-wider rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            )}

            {/* Progress Bar (During Restore) */}
            {isRestoring && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{restoreProgress.message}</span>
                  </span>
                  <span className="font-mono">{restoreProgress.percent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${restoreProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Trigger */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetSelection}
                disabled={isRestoring}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                id="btn-execute-restore-action"
                type="button"
                onClick={handleExecuteRestore}
                disabled={
                  isRestoring ||
                  (restoreMode === 'overwrite' && confirmInput.trim().toUpperCase() !== 'RESTORE')
                }
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>
                  {isRestoring
                    ? language === 'bn'
                      ? 'ডাটাবেজ রিস্টোর হচ্ছে...'
                      : 'Restoring Database...'
                    : language === 'bn'
                    ? 'ডাটা রিস্টোর সম্পন্ন করুন'
                    : 'Execute Database Restore'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
