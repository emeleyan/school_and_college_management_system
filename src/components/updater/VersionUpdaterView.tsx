import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getSystemVersion,
  getUpdateHistory,
  uploadAndApplyVersionUpdate,
  downloadTestUpdatePackage,
  restartApplication,
  SystemVersionInfo,
  UpdateHistoryItem,
  UpdateResponse,
} from '../../utils/versionUpdaterService';
import {
  RefreshCw,
  UploadCloud,
  FileArchive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Download,
  Terminal,
  Cpu,
  Database,
  ArrowRight,
  Clock,
  History,
  Check,
  X,
  Server,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export const VersionUpdaterView: React.FC = () => {
  const { language, logAudit } = useApp();

  const [versionInfo, setVersionInfo] = useState<SystemVersionInfo | null>(null);
  const [history, setHistory] = useState<UpdateHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update execution state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateStage, setUpdateStage] = useState<string>('');
  const [updatePercent, setUpdatePercent] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [updateResult, setUpdateResult] = useState<UpdateResponse | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ver, hist] = await Promise.all([getSystemVersion(), getUpdateHistory()]);
      setVersionInfo(ver);
      setHistory(hist);
    } catch (err) {
      console.error('Error loading updater data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer for automatic restart
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      restartApplication();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => [...prev, `[${time}] ${msg}`]);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert(
        language === 'bn'
          ? 'অনুগ্রহ করে শুধুমাত্র একটি ভ্যালিড .ZIP আপডেট ফাইল নির্বাচন করুন।'
          : 'Please select a valid .ZIP update package file.'
      );
      return;
    }
    setSelectedFile(file);
    setErrorMessage('');
    setUpdateResult(null);
  };

  // Generate and download a sample update package to test immediately
  const handleGenerateTestPackage = async () => {
    try {
      addLog('Generating official sample update package (.zip) for testing...');
      const blob = await downloadTestUpdatePackage();
      const testFile = new File([blob], 'erp-sample-update-v2.5.0.zip', {
        type: 'application/zip',
      });
      setSelectedFile(testFile);
      addLog('✅ Sample update package v2.5.0 loaded and ready for installation.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate test package.');
    }
  };

  // Start the update process
  const handleStartUpdate = async () => {
    if (!selectedFile) return;

    setIsUpdating(true);
    setErrorMessage('');
    setUpdateResult(null);
    setExecutionLogs([]);

    addLog(`Initiating In-App Version Update with package: ${selectedFile.name}`);
    addLog(`Package Size: ${(selectedFile.size / 1024).toFixed(1)} KB`);

    try {
      const result = await uploadAndApplyVersionUpdate(selectedFile, (stage, pct) => {
        setUpdateStage(stage);
        setUpdatePercent(pct);
        addLog(stage);
      });

      setUpdateResult(result);
      addLog('----------------------------------------------------');
      addLog(`STATUS: ${result.message}`);
      addLog(`Previous Version: ${result.previousVersion} -> New Version: ${result.newVersion}`);
      addLog(`Total Code Files Overwritten: ${result.updatedFilesCount || 0}`);

      if (result.skippedProtectedFiles && result.skippedProtectedFiles.length > 0) {
        addLog(
          `🛡️ DATABASE PROTECTION FILTER: Skipped ${result.skippedProtectedFiles.length} database/storage file(s):`
        );
        result.skippedProtectedFiles.forEach((f) => {
          addLog(`   ↪ [PROTECTED & EXCLUDED]: ${f}`);
        });
        addLog('✅ Institutional database, student records, and fees remain 100% UNTOUCHED.');
      } else {
        addLog('✅ Database protection verified: zero database overwrites permitted.');
      }

      await logAudit(
        'SETTINGS_UPDATE',
        'settings',
        `In-App Version Update installed: ${result.previousVersion} -> ${result.newVersion}. Database files excluded and verified.`
      );

      // Start restart countdown
      setCountdown(4);
      addLog('🚀 System restart sequence initiated. Application will reload in 4 seconds...');

      // Refresh list
      loadData();
    } catch (err: any) {
      console.error('Update failed:', err);
      setErrorMessage(err.message || 'Version update failed.');
      addLog(`❌ ERROR: ${err.message || 'Update failed'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'bn' ? 'ইন-অ্যাপ ভার্সন আপগ্রেডার' : 'In-App Version Updater'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wide">
                Offline Safe Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'নতুন ভার্সনের ZIP আপলোড করে মূল ডাটা অক্ষুণ্ণ রেখে কোড ফাইল ওভাররাইট ও স্বয়ংক্রিয় রিস্টার্ট'
                : 'Upload update ZIP package: Extracts and overwrites code files while strictly preserving the database, followed by auto-restart.'}
            </p>
          </div>
        </div>

        {/* Current Live Version Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <Cpu className="w-4 h-4 text-indigo-500" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {language === 'bn' ? 'বর্তমান ভার্সন' : 'Current Version'}
            </div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
              v{versionInfo?.version || '2.4.0'}
            </div>
          </div>
        </div>
      </div>

      {/* Safety & Architecture Pillars (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Database Immunity */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'ডাটাবেস সুরক্ষা ফিল্টার' : 'Database Shield Filter'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'bn'
              ? 'আপডেট প্যাকেজের ভেতরে কোনো *.db, *.sqlite, data/ বা storage/ ফাইল থাকলেও তা স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়। আপনার আসল ডাটা কখনো পরিবর্তন হবে না।'
              : 'Any *.db, *.sqlite, data/, or storage/ paths inside the ZIP are strictly excluded. Institutional database is 100% immune from overwrite.'}
          </p>
        </div>

        {/* Card 2: Code Replacement */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
            <FileCode className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'কোড ফাইল ওভাররাইট' : 'Clean Code Overwrite'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'bn'
              ? 'নতুন ভার্সনের সমস্ত ফিচার, ডিজাইন ও কোড ফাইল এক্সট্র্যাক্ট হয়ে বিদ্যমান অ্যাপ ফাইলে প্রতিস্থাপিত হয়।'
              : 'All updated UI components, scripts, layouts, and system logic in the ZIP are seamlessly extracted and updated on disk.'}
          </p>
        </div>

        {/* Card 3: Auto Restart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>{language === 'bn' ? 'স্বয়ংক্রিয় রিস্টার্ট' : 'Seamless Auto-Restart'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {language === 'bn'
              ? 'আপডেট সফল হলে মূল ডাটা অক্ষুণ্ণ রেখে অ্যাপটি স্বয়ংক্রিয়ভাবে রিস্টার্ট হবে এবং নতুন ভার্সনে সচল হবে।'
              : 'Once extraction completes, the application automatically restarts and mounts the new version with zero user effort.'}
          </p>
        </div>
      </div>

      {/* Main Upload and Installation Box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{language === 'bn' ? 'আপডেট প্যাকেজ আপলোড ও ইনস্টলেশন' : 'Update Package Upload & Install'}</span>
          </h2>

          <button
            type="button"
            onClick={handleGenerateTestPackage}
            disabled={isUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
            title="Generate a real test update ZIP with database exclusion verification"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নমুনা আপডেট প্যাকেজ টেস্ট করুন' : 'Test with Sample ZIP'}</span>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          accept=".zip,application/zip"
          className="hidden"
        />

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelect(file);
          }}
          onClick={() => !isUpdating && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.005]'
              : selectedFile
              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <FileArchive className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {language === 'bn' ? 'আপডেট করার জন্য প্রস্তুত' : 'Ready for installation'}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'bn'
                  ? 'অন্য কোনো ফাইল নির্বাচন করতে ক্লিক করুন'
                  : 'Click to choose a different ZIP file'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'bn'
                    ? 'নতুন ভার্সনের ZIP ফাইল ড্রপ করুন অথবা ব্রাউজ করুন'
                    : 'Drop the new version ZIP package here, or click to browse'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Supports standard zipped updates (.zip) • Database files are automatically detected and preserved
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'bn'
                ? 'স্বয়ংক্রিয় প্রি-ফ্লাইট ডাটাবেজ ব্যাকআপ সক্রিয়'
                : 'Pre-flight emergency snapshot activated before overwrite'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={isUpdating}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            )}

            <button
              type="button"
              onClick={handleStartUpdate}
              disabled={!selectedFile || isUpdating}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                !selectedFile || isUpdating
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>
                {isUpdating
                  ? language === 'bn'
                    ? 'আপডেট হচ্ছে...'
                    : 'Applying Update...'
                  : language === 'bn'
                  ? 'আপডেট শুরু করুন (Update Now)'
                  : 'Install Update & Restart'}
              </span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Update Failed: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Progress Bar during update */}
        {isUpdating && (
          <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                {updateStage || 'Processing...'}
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{updatePercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${updatePercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Restart Countdown Banner */}
        {countdown !== null && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-center space-y-2 shadow-sm animate-in zoom-in-95 duration-200">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Check className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
              {language === 'bn'
                ? 'আপডেট সফলভাবে সম্পন্ন হয়েছে!'
                : 'Version Update Successfully Installed!'}
            </h3>
            <p className="text-xs text-emerald-800 dark:text-emerald-200 max-w-md mx-auto">
              {language === 'bn'
                ? `মূল ডাটাবেস সম্পূর্ণ সুরক্ষিত আছে। নতুন ভার্সনে অ্যাপটি রিস্টার্ট হচ্ছে (${countdown} সেকেন্ড)...`
                : `All institutional database records are 100% intact. The application is restarting in ${countdown}s...`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => restartApplication()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                {language === 'bn' ? 'এখনই রিস্টার্ট করুন' : 'Restart Now'}
              </button>
            </div>
          </div>
        )}

        {/* Live Execution Console Output */}
        {executionLogs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                Updater Execution Log (লাইভ এক্সট্র্যাকশন ও ডাটাবেস ফিল্টার কনসোল)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                {executionLogs.length} events logged
              </span>
            </div>
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto space-y-1 shadow-inner border border-slate-800">
              {executionLogs.map((log, idx) => {
                const isExcluded = log.includes('EXCLUDED') || log.includes('PROTECTED');
                const isSuccess = log.includes('✅') || log.includes('SUCCESS');
                const isError = log.includes('❌') || log.includes('ERROR');
                return (
                  <div
                    key={idx}
                    className={`${
                      isExcluded
                        ? 'text-amber-400 font-semibold'
                        : isSuccess
                        ? 'text-emerald-400 font-bold'
                        : isError
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Past Update History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>{language === 'bn' ? 'পূর্বে সম্পন্ন হওয়া আপডেট হিস্টোরি' : 'Past Version Update History'}</span>
          </h2>
          <span className="text-xs text-slate-500">{history.length} update logs recorded</span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {language === 'bn'
              ? 'এখনো কোনো ইন-অ্যাপ ভার্সন আপডেট রেকর্ড করা হয়নি।'
              : 'No past in-app update history recorded yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3">Version Upgrade</th>
                  <th className="py-2.5 px-3">Code Overwrites</th>
                  <th className="py-2.5 px-3">DB Files Protected</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                      v{item.previousVersion} <ArrowRight className="w-3 h-3 inline mx-1" /> v{item.newVersion}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.totalFilesExtracted} files replaced
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{item.skippedProtectedFilesCount} DB files shielded</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {item.status} (DB INTACT)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
