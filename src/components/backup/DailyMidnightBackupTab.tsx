import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { executeMidnightAutoBackup } from '../../utils/backupService';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Calendar,
  AlertTriangle,
  Play,
  FileCheck,
  FolderArchive,
  Download,
  Database,
  Sparkles,
} from 'lucide-react';

interface AutoBackupDiskFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

interface AutoBackupInfo {
  success: boolean;
  targetDailyTime: string;
  targetDailyTimeLabel: string;
  nextScheduledRun: string;
  totalBackupsOnDisk: number;
  lastBackupFile: AutoBackupDiskFile | null;
  backups: AutoBackupDiskFile[];
}

export const DailyMidnightBackupTab: React.FC<{ onBackupRun?: () => void }> = ({
  onBackupRun,
}) => {
  const { language, currentUser } = useApp();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<AutoBackupInfo | null>(null);
  const [runningTest, setRunningTest] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [countdown, setCountdown] = useState<string>('');
  const [workerActive, setWorkerActive] = useState<boolean>(true);
  const [autoExportSnapshot, setAutoExportSnapshot] = useState<boolean>(() => {
    return localStorage.getItem('auto_export_snapshot_file') !== 'false';
  });

  // Calculate live countdown to next 11:59 PM
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 59, 0, 0);

      // If already past 11:59 PM, next target is tomorrow 11:59 PM
      if (now.getTime() >= target.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setCountdown(
        `${String(hours).padStart(2, '0')}h : ${String(mins).padStart(2, '0')}m : ${String(secs).padStart(2, '0')}s`
      );
      setCurrentTime(now.toLocaleTimeString());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Web Worker for 11:59 PM daily background automatic execution
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      const workerScript = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data.action === 'START') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              const now = new Date();
              if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 0) {
                self.postMessage({ type: 'EXECUTE_1159_SNAPSHOT', timestamp: now.toISOString() });
              }
            }, 1000);
            self.postMessage({ type: 'WORKER_ONLINE' });
          } else if (e.data.action === 'STOP') {
            if (timer) clearInterval(timer);
          }
        };
      `;
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));

      worker.onmessage = async (e) => {
        if (e.data.type === 'WORKER_ONLINE') {
          setWorkerActive(true);
        } else if (e.data.type === 'EXECUTE_1159_SNAPSHOT') {
          console.log('[WebWorker] 11:59 PM reached - auto creating IndexedDB snapshot export...');
          try {
            await executeMidnightAutoBackup(
              currentUser ? { id: currentUser.id, username: currentUser.username } : undefined,
              false
            );
            fetchServerBackupInfo();
            onBackupRun?.();
          } catch (err) {
            console.error('[WebWorker] 11:59 PM snapshot execution failed:', err);
          }
        }
      };

      worker.postMessage({ action: 'START' });
    } catch (workerErr) {
      console.warn('Dedicated Web Worker initialization fallback to interval:', workerErr);
      setWorkerActive(false);
    }

    return () => {
      if (worker) {
        worker.postMessage({ action: 'STOP' });
        worker.terminate();
      }
    };
  }, [currentUser]);

  const fetchServerBackupInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/auto-backup-info');
      const data = await res.json();
      if (data.success) {
        setInfo(data);
      }
    } catch (err) {
      console.warn('Could not retrieve disk backup info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerBackupInfo();
  }, []);

  const handleRunImmediateBackup = async () => {
    setRunningTest(true);
    setFeedback(null);
    try {
      const result = await executeMidnightAutoBackup(
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined,
        true
      );
      setFeedback({
        type: 'success',
        message: isBn ? result.bengaliMessage : result.message,
      });
      await fetchServerBackupInfo();
      onBackupRun?.();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || (isBn ? 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে' : 'Failed to trigger backup'),
      });
    } finally {
      setRunningTest(false);
    }
  };

  const lastBackupDate = localStorage.getItem('last_1159_auto_backup_date');
  const lastBackupTime = localStorage.getItem('last_1159_auto_backup_time');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-700/30 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Clock className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {isBn
                    ? 'প্রতিদিন রাত ১১:৫৯ মিনিট স্বয়ংক্রিয় ব্যাকআপ'
                    : 'Daily 11:59 PM Scheduled Auto-Backup'}
                </h2>
                <p className="text-xs text-indigo-200/80">
                  {isBn
                    ? 'অফলাইন ও সার্ভার ডিস্কে আগের দিনের সকল তথ্যের সম্পূর্ণ স্বয়ংক্রিয় সংরক্ষণ'
                    : 'Scheduled automated preservation of previous days data to local disk and IndexedDB'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{currentTime}</span>
            </div>
          </div>

          <p className="text-xs text-indigo-100/90 leading-relaxed max-w-3xl">
            {isBn
              ? '💡 আপনি নিজে ম্যানুয়াল ব্যাকআপ নিতে ভুলে গেলেও কোনো চিন্তা নেই! প্রতিদিন রাত ১১:৫৯ মিনিটে সিস্টেম স্বয়ংক্রিয়ভাবে পুরো প্রতিষ্ঠানের যাবতীয় ডাটা (শিক্ষার্থী, ফি, রসিদ, মার্কশিট, আয়-ব্যয়) একটি নিরাপদ ফাইলে ব্যাকআপ করে রাখে। এমনকি যদি রাতে কম্পিউটার বন্ধও থাকে, পরদিন সকালে সিস্টেম খোলার সাথে সাথে গতদিনের ব্যাকআপটি স্বয়ংক্রিয়ভাবে প্রস্তুত হয়ে যাবে।'
              : 'Never worry about forgetting to back up. At exactly 11:59 PM daily, the system automatically captures and archives all data to local disk and storage. If the machine was powered off at 11:59 PM, a catch-up backup executes automatically upon next launch.'}
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          <div className="text-xs font-medium flex-1">{feedback.message}</div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Grid: Timing & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Live 11:59 Countdown & Worker Thread */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isBn ? '১১:৫৯ কাউন্টডাউন' : 'Countdown to 11:59 PM'}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              {workerActive ? 'Worker Active' : 'Scheduler Active'}
            </span>
          </div>
          <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-300 tracking-tight">
            {countdown || 'Calculating...'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isBn ? 'আজ রাত ১১:৫৯ মিনিটে স্বয়ংক্রিয় এক্সপোর্ট হবে' : 'Zero manual user action needed'}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'ওয়েব ওয়ার্কার থ্রেড সচল' : 'Web Worker Thread Running'}</span>
          </div>
        </div>

        {/* Card 2: Target Schedule */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isBn ? 'নির্ধারিত ব্যাকআপ সময়' : 'Target Schedule'}
            </h3>
          </div>
          <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
            11:59 PM
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isBn ? 'প্রতিদিন রাত ১১:৫৯ মিনিটে কার্যকর' : 'Executes daily at 23:59:00'}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isBn ? 'ব্যাকগ্রাউন্ড শিডিউলার সক্রিয়' : 'Auto Snapshot Verified'}</span>
          </div>
        </div>

        {/* Card 3: Last Auto-Backup Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isBn ? 'সর্বশেষ অটো-ব্যাকআপ' : 'Last Auto-Backup'}
            </h3>
          </div>
          <div className="text-base font-bold text-slate-800 dark:text-slate-100 font-mono">
            {lastBackupDate || (isBn ? 'আজকের ব্যাকআপ অপেক্ষমাণ' : 'Pending for today')}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : isBn ? 'রাত ১১:৫৯ এ চলবে' : 'Will run at 23:59'}
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>
              {info
                ? `${info.totalBackupsOnDisk} ${isBn ? 'টি ডিস্ক ফাইল সংরক্ষিত' : 'files on disk'}`
                : '100% Offline Preserved'}
            </span>
          </div>
        </div>

        {/* Card 4: Test Trigger */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
              <Play className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isBn ? 'পরীক্ষামূলক ব্যাকআপ টেস্ট' : 'Manual Test Run'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              {isBn
                ? '১১:৫৯ শিডিউলারের কার্যকারিতা ও ডিস্কে ফাইল সংরক্ষণ এখনই পরীক্ষা করুন।'
                : 'Immediately simulate the automated 11:59 PM snapshot process.'}
            </p>
          </div>

          <button
            onClick={handleRunImmediateBackup}
            disabled={runningTest}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {runningTest ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isBn ? '১১:৫৯ অটো-ব্যাকআপ এখনই টেস্ট করুন' : 'Test 11:59 PM Backup Now'}
          </button>
        </div>
      </div>

      {/* Disk Archive Files List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <FolderArchive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isBn
                  ? 'লোকাল ডিস্কে সংরক্ষিত দৈনিক ব্যাকআপ আর্কাইভ (backups/)'
                  : 'Saved Daily Disk Archives (backups/)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'সার্ভারের নিজস্ব ফোল্ডারে স্বয়ংক্রিয়ভাবে সংরক্ষিত ফাইল'
                  : 'Automatically written JSON backup archives stored on server disk'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchServerBackupInfo}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{isBn ? 'ডিস্ক ব্যাকআপ ফাইল খোঁজা হচ্ছে...' : 'Scanning disk archives...'}</span>
          </div>
        ) : !info || info.backups.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isBn
              ? 'এখনও কোনো দৈনিক ব্যাকআপ ডিস্ক ফাইল তৈরি হয়নি। আজ রাত ১১:৫৯ মিনিটে প্রথম ফাইল তৈরি হবে।'
              : 'No disk backup files found yet. The first archive will be generated at 11:59 PM.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {info.backups.map((file, idx) => (
              <div
                key={file.filename}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-750 transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Database className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {file.filename}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(file.createdAt).toLocaleString()} &bull;{' '}
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {isBn ? 'সংরক্ষিত' : 'Verified'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
