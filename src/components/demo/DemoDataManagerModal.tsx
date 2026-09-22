import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  seedComprehensiveDemoData,
  purgeAllDemoData,
  isSystemInLiveMode,
  setSystemLiveMode,
} from '../../utils/demoDataService';
import {
  FlaskConical,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Database,
  Users,
  GraduationCap,
  Receipt,
  FileSpreadsheet,
  X,
  Info,
} from 'lucide-react';

interface DemoDataManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoDataManagerModal: React.FC<DemoDataManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    language,
    isLiveMode,
    setIsLiveMode,
    activeInstitute,
    activeAcademicYear,
    refreshContext,
  } = useApp();
  const isBn = language === 'bn';

  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [resultMsg, setResultMsg] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const [showLiveModeConfirm, setShowLiveModeConfirm] = useState(false);
  const [pendingLiveState, setPendingLiveState] = useState(false);

  if (!isOpen) return null;

  // Handle Generating Full Demo Data
  const handleGenerateDemoData = async () => {
    if (isLiveMode) {
      setResultMsg({
        type: 'warning',
        text: isBn
          ? 'সিস্টেম লাইভ মোডে রয়েছে! ডেমো ডাটা তৈরি সম্পূর্ণ নিষ্ক্রিয়।'
          : 'System is in Live Production Mode. Demo generation is blocked.',
      });
      return;
    }

    setLoading(true);
    setProgressPct(5);
    setProgressMsg(isBn ? 'ডেমো ডাটা প্রসেস শুরু হচ্ছে...' : 'Initializing demo generator...');
    setResultMsg(null);

    try {
      const result = await seedComprehensiveDemoData(
        activeInstitute?.id || 'inst_school',
        activeAcademicYear?.id || '2026',
        (msg, pct) => {
          setProgressMsg(msg);
          setProgressPct(pct);
        }
      );

      setResultMsg({
        type: 'success',
        text: isBn ? result.bengaliMessage : result.message,
      });
      await refreshContext();
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.message || (isBn ? 'ডেমো ডাটা লোড করতে সমস্যা হয়েছে।' : 'Failed to seed demo data.'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle 1-Click Purge Demo Data
  const handlePurgeDemoData = async () => {
    const confirmPrompt = window.confirm(
      isBn
        ? 'আপনি কি নিশ্চিত যে আপনি ১-ক্লিকে সকল ডেমো ডাটা মুছে ফেলতে চান? আপনার মূল কনফিগারেশন এবং রিয়েল ডাটা অক্ষুণ্ণ থাকবে।'
        : 'Are you sure you want to 1-Click Purge all demo records? Real master data will remain untouched.'
    );

    if (!confirmPrompt) return;

    setLoading(true);
    setProgressPct(10);
    setProgressMsg(isBn ? 'ডেমো ডাটা ক্লিন-আপ শুরু হচ্ছে...' : 'Initializing demo data purge...');
    setResultMsg(null);

    try {
      const result = await purgeAllDemoData((msg, pct) => {
        setProgressMsg(msg);
        setProgressPct(pct);
      });

      setResultMsg({
        type: 'success',
        text: isBn ? result.bengaliMessage : result.message,
      });
      await refreshContext();
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.message || (isBn ? 'ডেমো ডাটা মুছতে সমস্যা হয়েছে।' : 'Failed to purge demo data.'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Live Mode Toggle
  const promptToggleLiveMode = (targetState: boolean) => {
    setPendingLiveState(targetState);
    setShowLiveModeConfirm(true);
  };

  const confirmToggleLiveMode = async () => {
    setShowLiveModeConfirm(false);
    try {
      await setIsLiveMode(pendingLiveState);
      setResultMsg({
        type: 'success',
        text: pendingLiveState
          ? isBn
            ? 'সিস্টেম সফলভাবে লাইভ মোডে নেওয়া হয়েছে। সকল ডেমো সুবিধা নিষ্ক্রিয় করা হয়েছে।'
            : 'System switched to Live Production Mode. Demo generation is locked.'
          : isBn
            ? 'সিস্টেম টেস্টিং/ডেমো মোডে সেট করা হয়েছে। ডেমো ফিচার ব্যবহারের সুযোগ উন্মুক্ত।'
            : 'System switched to Demo Testing Mode. Demo features are now active.',
      });
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: err.message || 'Failed to change system mode.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <span
              className={`p-2.5 rounded-xl border ${
                isLiveMode
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isBn ? 'সিস্টেম ডেমো ডাটা ও লাইভ মোড কন্ট্রোল' : 'Demo Data & Live Mode Controller'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'সিস্টেম চেক করার জন্য ডেমো তথ্য যোগ বা ১-ক্লিকে মুছে ফেলার সুবিধা'
                  : 'Insert realistic demo information for testing, 1-click delete, or switch to Live mode'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Message Alert */}
          {resultMsg && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
                resultMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : resultMsg.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              {resultMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              )}
              <div className="text-xs font-medium flex-1">{resultMsg.text}</div>
              <button onClick={() => setResultMsg(null)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
          )}

          {/* Progress Bar (if running) */}
          {loading && (
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <span>{progressMsg}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Mode Switcher Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isLiveMode
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isLiveMode ? (
                  <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  {isBn ? 'বর্তমান সিস্টেম স্ট্যাটাস' : 'System Operational Status'}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isLiveMode
                  ? isBn
                    ? '🔴 লাইভ প্রোডাকশন মোড (Live Mode)'
                    : '🔴 Live Production Mode'
                  : isBn
                    ? '🧪 টেস্টিং ও ডেমো মোড (Testing Mode)'
                    : '🧪 Testing / Demo Mode'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md">
                {isLiveMode
                  ? isBn
                    ? 'সিস্টেম লাইভ অবস্থায় রয়েছে। কোনো ভুল বা কাল্পনিক ডেমো তথ্য যাতে আসল তথ্যের সাথে মিশে না যায়, সেজন্য ডেমো অপশন সম্পূর্ণ বন্ধ।'
                    : 'System is live. Generating demo data is strictly disabled to prevent fictional testing data from polluting production records.'
                  : isBn
                    ? 'সিস্টেম টেস্টিং মোডে আছে। আপনি ডেমো ডাটা তৈরি করে সকল ফিচার পরীক্ষা করতে পারেন এবং ১-ক্লিকে আবার মুছে ফেলতে পারবেন।'
                    : 'System is in testing mode. You can seed full demo records to verify features and purge them anytime with 1-click.'}
              </p>
            </div>

            <button
              onClick={() => promptToggleLiveMode(!isLiveMode)}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border flex-shrink-0 ${
                isLiveMode
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
              }`}
            >
              {isLiveMode ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  {isBn ? 'টেস্টিং মোডে সুইচ করুন' : 'Switch to Demo Mode'}
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  {isBn ? 'সিস্টেম লাইভ (Live) করুন' : 'Go Live (Lock Demo)'}
                </>
              )}
            </button>
          </div>

          {/* Action Cards: Generate Demo vs 1-Click Purge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Add Demo Data */}
            <div
              className={`p-5 rounded-xl border flex flex-col justify-between transition ${
                isLiveMode
                  ? 'opacity-60 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isBn ? 'ডেমো তথ্য যোগ করুন' : 'Seed Full Demo Data'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {isBn
                    ? 'সকল একাডেমিক শ্রেণি, শাখা, ১২ জন শিক্ষার্থী, শিক্ষক, হাজিরা, পরীক্ষার মার্কশিট, ফি রসিদ ও হিসাবের নমুনা তথ্য তৈরি করে সিস্টেমের কার্যকারিতা পরীক্ষা করুন।'
                    : 'Populate realistic classes, students, faculty, marks, fee vouchers and accounts to test and verify all ERP features.'}
                </p>

                {isLiveMode && (
                  <div className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                    <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>
                      {isBn
                        ? 'লাইভ মোডে ডেমো ডাটা তৈরি নিষিদ্ধ।'
                        : 'Demo seeding is disabled in Live mode.'}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateDemoData}
                disabled={isLiveMode || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {isBn ? 'সকল মডিউলের ডেমো ডাটা তৈরি করুন' : 'Generate Full Demo Data'}
              </button>
            </div>

            {/* Card 2: 1-Click Delete Demo Data */}
            <div className="p-5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {isBn ? '১-ক্লিকে ডেমো ডাটা মুছুন' : '1-Click Purge Demo Data'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {isBn
                    ? 'পরীক্ষা শেষে মাত্র ১-ক্লিকে সকল ডেমো শিক্ষার্থী, ফি, রসিদ এবং পরীক্ষার তথ্য মুছে ফেলুন। মূল প্রতিষ্ঠান ও সেটিংস ১০০% নিরাপদ থাকবে।'
                    : 'Instantly purge all testing demo records in 1 click. School configuration and real institutional data are 100% preserved.'}
                </p>

                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {isBn
                      ? 'মুছার পূর্বে স্বয়ংক্রিয় ব্যাকআপ নেওয়া হবে।'
                      : 'Auto-safety snapshot created before wipe.'}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePurgeDemoData}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-40"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isBn ? '১-ক্লিকে সকল ডেমো ডাটা মুছে ফেলুন' : '1-Click Delete All Demo Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Live Mode Toggle */}
      {showLiveModeConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {pendingLiveState
                    ? isBn
                      ? 'লাইভ মোড চালুর নিশ্চিতকরণ'
                      : 'Confirm Live Production Mode'
                    : isBn
                      ? 'টেস্টিং মোড চালুর নিশ্চিতকরণ'
                      : 'Confirm Testing Mode'}
                </h3>
                <p className="text-xs text-slate-500">
                  {pendingLiveState
                    ? (isBn
                      ? 'লাইভ মোড চালু হলে ডেমো ডাটা যোগ করা বন্ধ থাকবে।'
                      : 'Demo data seeding will be disabled in live mode.')
                    : (isBn
                      ? 'টেস্টিং মোড চালু হলে ডেমো ডাটা তৈরি করার সুযোগ পাওয়া যাবে।'
                      : 'Testing mode enables demo data seeding.')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {pendingLiveState
                ? isBn
                  ? 'আপনি কি সিস্টেমটি লাইভ মোডে নিতে চান? লাইভ মোডে কোনো কাল্পনিক ডেমো তথ্য যোগ করা যাবে না যাতে আসল শিক্ষার্থীদের ডাটা নিরাপদ থাকে।'
                  : 'Switching to Live Production locks all demo data generation tools to protect production records.'
                : isBn
                  ? 'টেস্টিং মোড চালু করলে পুনরায় ডেমো ডাটা যোগ ও টেস্ট করার সুযোগ চালু হবে।'
                  : 'Testing mode re-enables demo seeding tools for experimentation.'}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLiveModeConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmToggleLiveMode}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                {isBn ? 'হ্যাঁ, মোড পরিবর্তন করুন' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
