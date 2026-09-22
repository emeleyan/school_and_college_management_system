import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActionLogEntry, ERPModule, ReversibleActionType } from '../../types';
import { getActionLogs, executeGranularUndo } from '../../utils/actionUndoService';
import {
  Undo2,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  GraduationCap,
  DollarSign,
  ShieldCheck,
  Calendar,
  Clock,
  HelpCircle,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';

export const ActionUndoManager: React.FC = () => {
  const { currentUser, language } = useApp();
  const isBn = language === 'bn';

  const [actions, setActions] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'undone'>('all');

  // Undo confirmation modal state
  const [selectedAction, setSelectedAction] = useState<ActionLogEntry | null>(null);
  const [undoReason, setUndoReason] = useState('ভুল এন্ট্রি সংশোধন / Incorrect entry correction');
  const [undoing, setUndoing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const list = await getActionLogs({
        module: selectedModule !== 'all' ? selectedModule : undefined,
        search: searchQuery.trim() || undefined,
        isUndone: statusFilter === 'active' ? false : statusFilter === 'undone' ? true : undefined,
      });
      setActions(list);
    } catch (err) {
      console.error('Failed to load action logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [selectedModule, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActions();
  };

  const handleConfirmUndo = async () => {
    if (!selectedAction) return;
    setUndoing(true);
    setStatusMessage(null);
    try {
      const res = await executeGranularUndo(
        selectedAction.id,
        undoReason.trim() || 'No reason specified',
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );

      setStatusMessage({
        type: 'success',
        text: isBn ? res.bengaliMessage : res.message,
      });
      setSelectedAction(null);
      await fetchActions();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || (isBn ? 'আনডু করতে সমস্যা হয়েছে।' : 'Failed to execute undo.'),
      });
    } finally {
      setUndoing(false);
    }
  };

  const getModuleBadge = (mod: ERPModule) => {
    switch (mod) {
      case 'fees':
        return {
          label: isBn ? 'ফি ও হিসাব' : 'Fees & Accounts',
          icon: DollarSign,
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
        };
      case 'students':
        return {
          label: isBn ? 'শিক্ষার্থী' : 'Students',
          icon: User,
          color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
        };
      case 'examination':
        return {
          label: isBn ? 'পরীক্ষা ও ফলাফল' : 'Exams & Results',
          icon: GraduationCap,
          color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
        };
      default:
        return {
          label: mod,
          icon: FileSpreadsheet,
          color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-700/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/30">
                  <RotateCcw className="w-6 h-6" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isBn ? 'নির্দিষ্ট কাজ আনডু ও প্রত্যাহার সিস্টেম' : 'Granular Action Undo & Reversal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isBn ? 'ডাটা অক্ষুণ্ণ গ্যারান্টি' : 'Isolated Reversal Guaranteed'}
                </span>
              </div>
              <p className="text-sm text-indigo-200/90 max-w-3xl leading-relaxed">
                {isBn
                  ? 'কোনো কাজ (যেমন: ভুল রসিদ বা ফি কালেকশন, ভুল শিক্ষার্থী এন্ট্রি) ভুলবশত হয়ে থাকলে শুধুমাত্র সেই নির্দিষ্ট কাজটি আনডু করুন। এর পরে অন্যান্য শিক্ষকদের করা কোনো ডাটা এন্ট্রি বা কাজে কোনো ব্যাঘাত ঘটবে না।'
                  : 'Undo a specific mistaken operation (e.g. erroneous fee collection, accidental marks entry) without rolling back subsequent data entered by other users.'}
              </p>
            </div>

            <button
              onClick={fetchActions}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition border border-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {isBn ? 'রিফ্রেশ' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Status Notice Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          )}
          <div className="text-sm font-medium flex-1">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBn
                ? 'রসিদ নম্বর, শিক্ষার্থীর নাম, আইডি বা কাজের বিবরণ খুঁজুন...'
                : 'Search receipt number, student name, action description...'
            }
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Module Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{isBn ? 'সকল মডিউল' : 'All Modules'}</option>
              <option value="fees">{isBn ? 'ফি ও হিসাব (Fees)' : 'Fees & Accounts'}</option>
              <option value="students">{isBn ? 'শিক্ষার্থী (Students)' : 'Students'}</option>
              <option value="exams">{isBn ? 'পরীক্ষা ও ফলাফল (Exams)' : 'Exams & Marks'}</option>
              <option value="attendance">{isBn ? 'হাজিরা (Attendance)' : 'Attendance'}</option>
              <option value="accounts">{isBn ? 'আয়-ব্যয় (Accounts)' : 'Income & Expense'}</option>
            </select>
          </div>

          {/* Status Tabs */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isBn ? 'সব' : 'All'}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isBn ? 'সক্রিয় কাজ' : 'Active (Undoable)'}
            </button>
            <button
              onClick={() => setStatusFilter('undone')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === 'undone'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isBn ? 'বাতিলকৃত' : 'Reversed'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Logs List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>{isBn ? 'অপারেশন রেকর্ড লোড হচ্ছে...' : 'Loading action logs...'}</span>
          </div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RotateCcw className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isBn ? 'কোনো অপারেশন রেকর্ড পাওয়া যায়নি' : 'No Action Logs Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isBn
                ? 'সিস্টেমে যখনই কোনো ফি আদায় বা পরিবর্তন করা হবে, তা এখানে তাৎক্ষণিক আনডু করার জন্য সংরক্ষিত হবে।'
                : 'Whenever an operation like fee collection or record creation occurs, it appears here ready for isolated undo.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {actions.map((act) => {
              const badge = getModuleBadge(act.module);
              const Icon = badge.icon;
              return (
                <div
                  key={act.id}
                  className={`p-5 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    act.isUndone ? 'opacity-70 bg-amber-50/20 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${badge.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {isBn ? act.bengaliTitle || act.title : act.title}
                        </h4>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {act.targetIdentifier && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {act.targetIdentifier}
                          </span>
                        )}
                        {act.isUndone ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            {isBn ? 'বাতিলকৃত (Undone)' : 'Reversed'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isBn ? 'সক্রিয়' : 'Active'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                        {act.details}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(act.timestamp).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {isBn ? 'ব্যবহারকারী: ' : 'User: '}
                          <strong className="text-slate-700 dark:text-slate-300">{act.username}</strong>
                        </span>
                        {act.isUndone && act.undoneReason && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {isBn ? `বাতিলের কারণ: ${act.undoneReason}` : `Reason: ${act.undoneReason}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Undo Trigger */}
                  <div className="flex-shrink-0 self-end md:self-center">
                    {act.isUndone ? (
                      <div className="text-right text-xs text-slate-400 dark:text-slate-500">
                        <div>{isBn ? 'বাতিল সম্পন্ন' : 'Reversed'}</div>
                        <div className="text-[11px]">
                          {act.undoneAt ? new Date(act.undoneAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedAction(act)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        {isBn ? 'এই কাজটি আনডু করুন' : 'Undo This Action'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Guarantee Info Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
            {isBn ? 'গ্র্যানুলার নির্দিষ্ট আনডু পলিসি (Granular Action Undo Guarantee):' : 'Granular Undo Policy Guarantee:'}
          </strong>
          {isBn
            ? 'ফুল ডাটাবেস রিস্টোর না করে শুধুমাত্র উল্লেখিত একক কাজটি রিভার্স করা হয়। যেমন: কারো ভুল ফি কালেকশন আনডু করলে শুধুমাত্র ওই নির্দিষ্ট শিক্ষার্থীর রসিদ ও বকেয়া আগের অবস্থায় ফিরে আসবে; পরবর্তীতে জমা দেওয়া অন্য কারো ফি বা হাজিরা ডাটাবেজ থেকে মুছে যাবে না।'
            : 'Unlike full database restoration which reverts everything, granular undo pinpoints and reverses only the selected transaction. Subsequent student fees, attendance marks, or ledger entries remain fully intact.'}
        </div>
      </div>

      {/* Undo Confirmation Dialog Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
              <span className="p-2 bg-rose-500 text-white rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  {isBn ? 'নির্দিষ্ট কাজ প্রত্যাহারের নিশ্চিতকরণ' : 'Confirm Action Undo'}
                </h3>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  {isBn
                    ? 'শুধুমাত্র এই নির্দিষ্ট কাজটি আনডু হবে, অন্য সকল কাজ নিরাপদ থাকবে।'
                    : 'Only this specific action will be reversed. All other operations are safe.'}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {isBn ? selectedAction.bengaliTitle || selectedAction.title : selectedAction.title}
                </div>
                <div className="text-slate-600 dark:text-slate-300">{selectedAction.details}</div>
                {selectedAction.targetIdentifier && (
                  <div className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedAction.targetIdentifier}
                  </div>
                )}
              </div>

              {selectedAction.actionType === 'FEE_PAYMENT' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <strong>{isBn ? 'ফি প্রত্যাহারের ফলাফল:' : 'Reversal Details:'}</strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>
                      {isBn
                        ? 'রসিদ ও পেমেন্ট রেকর্ডটি বাতিল (Cancelled) হিসাবে চিহ্নিত হবে।'
                        : 'Payment record will be marked as cancelled.'}
                    </li>
                    <li>
                      {isBn
                        ? 'শিক্ষার্থীর ইনভয়েসে পূর্বের বকেয়া হিসাব পুনরায় বহাল হবে।'
                        : 'Previous student due amount balance will be restored.'}
                    </li>
                    <li>
                      {isBn
                        ? 'অন্যান্য কোনো শিক্ষার্থীর ফি বা লেনদেনের কোনো ক্ষতি হবে না।'
                        : 'Other students payments are untouched.'}
                    </li>
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'আনডু / বাতিলের কারণ (Reason for Reversal):' : 'Reason for Reversal:'}
                </label>
                <input
                  type="text"
                  value={undoReason}
                  onChange={(e) => setUndoReason(e.target.value)}
                  placeholder={
                    isBn
                      ? 'উদা: ভুল রসিদ কাটা হয়েছে / টাইপিং ভুল'
                      : 'e.g. Mistaken receipt entry / incorrect fee figure'
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAction(null)}
                disabled={undoing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmUndo}
                disabled={undoing}
                className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {undoing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Undo2 className="w-3.5 h-3.5" />
                )}
                {isBn ? 'হ্যাঁ, এই কাজটি আনডু করুন' : 'Confirm Specific Undo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
