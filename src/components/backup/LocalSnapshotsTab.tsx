import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LocalSnapshot } from '../../types';
import {
  getLocalSnapshots,
  saveLocalSnapshot,
  deleteLocalSnapshot,
  rollbackToLocalSnapshot,
  downloadBackupFile,
} from '../../utils/backupService';
import {
  BookmarkPlus,
  History,
  RotateCcw,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eye,
} from 'lucide-react';

export const LocalSnapshotsTab: React.FC<{
  onRollbackComplete: () => void;
}> = ({ onRollbackComplete }) => {
  const { currentUser, language, refreshContext, logAudit } = useApp();

  const [snapshots, setSnapshots] = useState<LocalSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // New Checkpoint state
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotNotes, setNewSnapshotNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Rollback Modal state
  const [selectedSnapshot, setSelectedSnapshot] = useState<LocalSnapshot | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackProgress, setRollbackProgress] = useState<{ msg: string; pct: number }>({
    msg: '',
    pct: 0,
  });

  // Snapshot Inspection Modal
  const [inspectSnapshot, setInspectSnapshot] = useState<LocalSnapshot | null>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const data = await getLocalSnapshots();
      setSnapshots(data);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotName.trim()) return;

    setIsCreating(true);
    try {
      const snap = await saveLocalSnapshot(
        newSnapshotName.trim(),
        'manual',
        newSnapshotNotes.trim() || undefined,
        currentUser ? { id: currentUser.id, username: currentUser.username } : undefined
      );

      await logAudit(
        'LOCAL_SNAPSHOT_CREATED',
        'backup',
        `Created local snapshot "${snap.name}" (${snap.recordCount} records)`
      );

      setNewSnapshotName('');
      setNewSnapshotNotes('');
      await loadSnapshots();
    } catch (err: any) {
      alert(`Failed to save checkpoint: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        language === 'bn'
          ? `আপনি কি নিশ্চিতভাবে "${name}" স্ন্যাপশটটি মুছে ফেলতে চান?`
          : `Are you sure you want to delete snapshot "${name}"?`
      )
    ) {
      return;
    }

    try {
      await deleteLocalSnapshot(id);
      await logAudit('LOCAL_SNAPSHOT_DELETED', 'backup', `Deleted snapshot "${name}"`);
      await loadSnapshots();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExportSnapshot = (snap: LocalSnapshot) => {
    if (!snap.data) {
      alert('Snapshot data payload unavailable.');
      return;
    }

    const pkg = {
      format: 'SchoolCollegeERP_Backup_v1',
      metadata: {
        backupId: snap.id,
        formatVersion: '1.0',
        appVersion: '2.4.0',
        createdAt: snap.createdAt,
        createdBy: { userId: 'local', username: snap.createdBy },
        scope: 'full',
        totalStores: snap.storeCount,
        totalRecords: snap.recordCount,
        checksum: 'SNAPSHOT_EXPORT',
        systemNotes: snap.notes || snap.name,
      },
      data: snap.data,
    };

    downloadBackupFile(JSON.stringify(pkg, null, 2), 'SNAPSHOT', snap.name.replace(/\s+/g, '_'));
  };

  const handleConfirmRollback = async () => {
    if (!selectedSnapshot) return;

    setIsRollingBack(true);
    setRollbackProgress({ msg: 'Initiating rollback restore...', pct: 10 });

    try {
      const res = await rollbackToLocalSnapshot(selectedSnapshot.id, (msg, pct) => {
        setRollbackProgress({ msg, pct });
      });

      if (!res.success) {
        alert(`Rollback failed: ${res.error}`);
        return;
      }

      await logAudit(
        'LOCAL_SNAPSHOT_ROLLBACK',
        'backup',
        `Reverted entire database to snapshot "${selectedSnapshot.name}" from ${new Date(
          selectedSnapshot.createdAt
        ).toLocaleString()}`
      );

      setSelectedSnapshot(null);
      await refreshContext();
      onRollbackComplete();
      alert(
        language === 'bn'
          ? 'সফলভাবে পূর্ববর্তী স্ন্যাপশটে ডাটাবেজ রোলব্যাক করা হয়েছে!'
          : 'Database rolled back successfully to selected checkpoint!'
      );
    } catch (err: any) {
      alert(`Rollback error: ${err.message}`);
    } finally {
      setIsRollingBack(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Create Checkpoint Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <BookmarkPlus className="w-4 h-4 text-blue-600" />
          <span>
            {language === 'bn'
              ? 'তাৎক্ষণিক লোকাল চেকপয়েন্ট তৈরি করুন'
              : 'Create Instant Local Rollback Checkpoint'}
          </span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {language === 'bn'
            ? 'পরীক্ষার রেজাল্ট প্রসেসিং, বার্ষিক প্রমোশন বা বাল্ক ফি আদায়ের পূর্বে একটি দ্রুত রিস্টোর পয়েন্ট সংরক্ষণ করে রাখুন।'
            : 'Capture an instant offline recovery snapshot before running batch operations, annual student promotions, or fee adjustments.'}
        </p>

        <form onSubmit={handleCreateSnapshot} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {language === 'bn' ? 'চেকপয়েন্টের নাম *' : 'Checkpoint Title *'}
            </label>
            <input
              type="text"
              required
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'উদা: বার্ষিক পরীক্ষার রেজাল্ট প্রসেসিং এর আগে'
                  : 'e.g., Before batch marks entry'
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
              {language === 'bn' ? 'সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)' : 'Notes / Remarks (Optional)'}
            </label>
            <input
              type="text"
              value={newSnapshotNotes}
              onChange={(e) => setNewSnapshotNotes(e.target.value)}
              placeholder={
                language === 'bn' ? 'উদা: ক্লাস ৯-১০ এর নম্বর ইনপুট' : 'e.g., Class 9-10 final marks'
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-end">
            <button
              id="btn-save-instant-checkpoint"
              type="submit"
              disabled={isCreating || !newSnapshotName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>
                {isCreating
                  ? language === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving Checkpoint...'
                  : language === 'bn'
                  ? 'চেকপয়েন্ট সেভ করুন'
                  : 'Save Checkpoint'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Snapshots History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {language === 'bn'
                ? 'সংরক্ষিত লোকাল স্ন্যাপশট তালিকা'
                : 'Local Recovery Snapshots History'}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {snapshots.length}
            </span>
          </div>

          <button
            onClick={loadSnapshots}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {language === 'bn'
                ? 'এখনও কোনো লোকাল স্ন্যাপশট তৈরি করা হয়নি'
                : 'No Local Snapshots Created Yet'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {language === 'bn'
                ? 'উপরের ফর্মের মাধ্যমে একটি তাৎক্ষণিক রিস্টোর পয়েন্ট তৈরি করুন, অথবা ব্যাকআপ রিস্টোর করার সময় স্বয়ংক্রিয় সেফগার্ড স্ন্যাপশট যুক্ত হবে।'
                : 'Create an instant rollback checkpoint above, or pre-restore safeguards will be automatically generated whenever you restore.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">{language === 'bn' ? 'নাম ও ধরন' : 'Name & Type'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'রেকর্ড ও সাইজ' : 'Records & Size'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'তারিখ ও সময়' : 'Timestamp'}</th>
                  <th className="py-3 px-4">{language === 'bn' ? 'প্রস্তুতকারক' : 'Created By'}</th>
                  <th className="py-3 px-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {snapshots.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        {s.type === 'pre_restore' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Auto Safeguard
                          </span>
                        )}
                        {s.type === 'auto_scheduled' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Scheduled
                          </span>
                        )}
                      </div>
                      {s.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-blue-600 dark:text-blue-400">
                        {s.recordCount.toLocaleString()} {language === 'bn' ? 'রেকর্ড' : 'records'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {s.storeCount} stores • {formatBytes(s.sizeBytes)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-700 dark:text-slate-300">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(s.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {s.createdBy}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectSnapshot(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Inspect store counts"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleExportSnapshot(s)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="Export as JSON"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedSnapshot(s)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                          title="Rollback database to this snapshot"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'রোলব্যাক' : 'Rollback'}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rollback Confirmation Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scaleUp">
            <div className="flex items-start gap-3 text-red-600">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'স্ন্যাপশটে রোলব্যাক নিশ্চিতকরণ' : 'Confirm Database Rollback'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'bn'
                    ? 'ডাটাবেজ নির্বাচিত পয়েন্টের পূর্বাবস্থায় ফিরিয়ে নেওয়া হবে।'
                    : 'Your local database will be reverted to this exact saved state.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'bn' ? 'স্ন্যাপশট:' : 'Snapshot:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedSnapshot.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'bn' ? 'তারিখ:' : 'Created:'}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {new Date(selectedSnapshot.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'bn' ? 'মোট রেকর্ড:' : 'Records:'}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {selectedSnapshot.recordCount.toLocaleString()} records
                </span>
              </div>
            </div>

            {isRollingBack && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-blue-600">
                  <span>{rollbackProgress.msg}</span>
                  <span>{rollbackProgress.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-200"
                    style={{ width: `${rollbackProgress.pct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isRollingBack}
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-snapshot-rollback"
                type="button"
                disabled={isRollingBack}
                onClick={handleConfirmRollback}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRollingBack ? 'animate-spin' : ''}`} />
                <span>
                  {isRollingBack
                    ? language === 'bn'
                      ? 'রোলব্যাক হচ্ছে...'
                      : 'Rolling Back...'
                    : language === 'bn'
                    ? 'হ্যাঁ, রোলব্যাক করুন'
                    : 'Yes, Rollback Database'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Inspection Modal */}
      {inspectSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inspectSnapshot.name}
                </h4>
              </div>
              <button
                onClick={() => setInspectSnapshot(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {inspectSnapshot.data &&
                  Object.entries(inspectSnapshot.data).map(([store, items]) => (
                    <div
                      key={store}
                      className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                    >
                      <span className="font-medium text-slate-600 dark:text-slate-400 truncate">
                        {store}
                      </span>
                      <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                        {Array.isArray(items) ? items.length : 0}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectSnapshot(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
