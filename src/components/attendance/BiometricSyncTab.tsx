import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Radio,
  Fingerprint,
  Plus,
  Clock,
  Shield,
  Layers,
  ArrowDownCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll, putItem } from '../../db/indexedDB';
import { BiometricPunchLog, Teacher, Student } from '../../types';

export const BiometricSyncTab: React.FC = () => {
  const { activeInstitute, currentUser, logAudit, language, hasPermission } = useApp();

  const [logs, setLogs] = useState<BiometricPunchLog[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [filterType, setFilterType] = useState<'all' | 'teacher' | 'student'>('all');

  // Manual Punch Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualUserType, setManualUserType] = useState<'teacher' | 'student'>('teacher');
  const [manualUserId, setManualUserId] = useState<string>('');
  const [manualPunchType, setManualPunchType] = useState<'check_in' | 'check_out'>('check_in');
  const [manualVerifyType, setManualVerifyType] = useState<'fingerprint' | 'rfid' | 'face' | 'manual'>('rfid');

  // Load existing logs
  const fetchLogs = async () => {
    if (!activeInstitute) return;
    try {
      const [allLogs, allTeachers, allStudents] = await Promise.all([
        getAll<BiometricPunchLog>('biometricLogs'),
        getAll<Teacher>('teachers'),
        getAll<Student>('students'),
      ]);

      const instLogs = allLogs.filter((l) => l.instituteId === activeInstitute.id);
      const instTeachers = allTeachers.filter((t) => t.instituteId === activeInstitute.id);
      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);

      setLogs(instLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setTeachers(instTeachers);
      setStudents(instStudents);

      if (instTeachers.length > 0 && !manualUserId) {
        setManualUserId(instTeachers[0].id);
      }
    } catch (err) {
      console.error('Failed to load biometric logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeInstitute]);

  // Simulate Biometric Device Synchronization
  const handleSyncDevices = async () => {
    if (!activeInstitute) return;
    setSyncing(true);

    try {
      // Simulate reading latest punches from devices
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const generatedLogs: BiometricPunchLog[] = [];

      // Generate some punches for teachers who haven't punched yet
      const sampleTeachers = teachers.slice(0, 5);
      sampleTeachers.forEach((tch, idx) => {
        const punchHour = 8;
        const punchMin = 20 + idx * 7;
        const punchTime = `${String(punchHour).padStart(2, '0')}:${String(punchMin).padStart(2, '0')}:15`;

        generatedLogs.push({
          id: `bio-sync-${Date.now()}-${idx}`,
          instituteId: activeInstitute.id,
          deviceId: idx % 2 === 0 ? 'BIO-DEV-01' : 'BIO-DEV-02',
          deviceName: idx % 2 === 0 ? 'Main Gate Controller' : 'Staff Lounge Terminal',
          userType: 'teacher',
          userId: tch.id,
          userName: `${tch.firstName} ${tch.lastName}`,
          userIdentifier: tch.teacherId,
          punchType: 'in',
          verificationMode: idx % 3 === 0 ? 'facial' : idx % 2 === 0 ? 'fingerprint' : 'rfid',
          timestamp: `${today}T${punchTime}Z`,
          dateStr: today,
          timeStr: punchTime,
          status: 'synced',
          createdAt: now.toISOString(),
        });
      });

      for (const log of generatedLogs) {
        await putItem('biometricLogs', log);
      }

      await logAudit(
        'biometric_sync',
        'attendance',
        `Synchronized biometric records from ZKTeco Gate & Lounge controllers (${generatedLogs.length} events)`
      );

      setLastSyncTime(new Date().toLocaleTimeString());
      await fetchLogs();
    } catch (err) {
      console.error('Biometric sync failed:', err);
      alert('Device synchronization encountered an error.');
    } finally {
      setSyncing(false);
    }
  };

  // Add Manual Punch
  const handleAddManualPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute || !manualUserId) return;

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];

      let name = '';
      let identifier = '';

      if (manualUserType === 'teacher') {
        const tch = teachers.find((t) => t.id === manualUserId);
        if (tch) {
          name = `${tch.firstName} ${tch.lastName}`;
          identifier = tch.teacherId;
        }
      } else {
        const stu = students.find((s) => s.id === manualUserId);
        if (stu) {
          name = `${stu.firstName} ${stu.lastName}`;
          identifier = `Roll: ${stu.rollNumber}`;
        }
      }

      const newLog: BiometricPunchLog = {
        id: `bio-manual-${Date.now()}`,
        instituteId: activeInstitute.id,
        deviceId: 'BIO-MANUAL-DESK',
        deviceName: 'Manual Entry Desk',
        userType: manualUserType,
        userId: manualUserId,
        userName: name || 'User',
        userIdentifier: identifier,
        punchType: manualPunchType === 'check_in' ? 'in' : 'out',
        verificationMode: manualVerifyType === 'face' ? 'facial' : manualVerifyType,
        timestamp: now.toISOString(),
        dateStr: today,
        timeStr: timeStr,
        status: 'synced',
        createdAt: now.toISOString(),
      };

      await putItem('biometricLogs', newLog);
      await logAudit('manual_punch', 'attendance', `Manual punch logged for ${name} (${manualPunchType})`);

      setShowManualModal(false);
      fetchLogs();
    } catch (err) {
      console.error('Failed to log punch:', err);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'all') return true;
    return l.userType === filterType;
  });

  return (
    <div className="space-y-5">
      {/* Biometric Simulation Architecture Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>{language === 'bn' ? 'অফলাইন সিমুলেশন নোটিস' : 'Simulated Hardware Notice'}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 font-mono uppercase">
              Offline Mode
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
            {language === 'bn'
              ? 'এই অফলাইন ওয়েব অ্যাপ্লিকেশনে বায়োমেট্রিক ডিভাইস সিঙ্ক্রোনাইজেশনটি একটি পূর্ণাঙ্গ সিমুলেশন। কোনো ফিজিক্যাল ZKTeco বা RFID ডিভাইসের সাথে সরাসরি সংযোগের জন্য লোকাল নেটওয়ার্কে একটি ব্যাকএন্ড TCP ব্রিজ সার্ভিস প্রয়োজন। এখানে পরীক্ষামূলক পাঞ্চ ও লগ তৈরি করা হচ্ছে।'
              : 'Biometric device synchronization is running in browser simulation mode. Direct socket communication with physical ZKTeco or RFID hardware requires an on-premise local TCP bridge daemon. All punches generated here are stored offline in your browser IndexedDB.'}
          </p>
        </div>
      </div>

      {/* Device Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Device 1 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Main Gate Terminal (গেট-১)
                </h4>
                <p className="text-[10px] text-slate-400">ZKTeco IN01-A / SilkID</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>IP: 192.168.1.201:4370</span>
            <span>Protocol: TCP/Push</span>
          </div>
        </div>

        {/* Device 2 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                  Teachers Lounge (শিক্ষক কক্ষ)
                </h4>
                <p className="text-[10px] text-slate-400">ZKTeco K40 Fingerprint/RFID</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>IP: 192.168.1.202:4370</span>
            <span>Protocol: UDP/Push</span>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 p-4 rounded-xl border border-blue-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              {language === 'bn' ? 'ডিভাইস সিঙ্ক্রোনাইজেশন' : 'Real-time Hardware Sync'}
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {language === 'bn' ? `সর্বশেষ আপডেট: ${lastSyncTime}` : `Last sync completed: ${lastSyncTime}`}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-3">
            {hasPermission('attendance', 'edit') && (
              <button
                onClick={handleSyncDevices}
                disabled={syncing}
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (language === 'bn' ? 'এখনই সিঙ্ক করুন' : 'Sync Devices Now')}</span>
              </button>
            )}
            {hasPermission('attendance', 'add') && (
              <button
                onClick={() => setShowManualModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Manual Punch"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {language === 'bn' ? 'বায়োমেট্রিক পাঞ্চ হিস্ট্রি ও লাইভ স্ট্রিম' : 'Live Biometric Punch Records'}
            </h3>
          </div>

          <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'bn' ? 'সকল' : 'All'} ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('teacher')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'teacher'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'bn' ? 'শিক্ষক ও কর্মী' : 'Faculty'}
            </button>
            <button
              onClick={() => setFilterType('student')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'student'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {language === 'bn' ? 'শিক্ষার্থী' : 'Students'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">{language === 'bn' ? 'সময় ও তারিখ' : 'Timestamp'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'ব্যবহারকারী' : 'User'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'ধরণ' : 'Role'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'পাঞ্চ ধরণ' : 'Punch Type'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'ভেরিফিকেশন' : 'Method'}</th>
                <th className="px-4 py-3 text-right">{language === 'bn' ? 'ডিভাইস' : 'Terminal'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'কোন পাঞ্চ লগ পাওয়া যায়নি।' : 'No punch logs recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                      <div>{log.timeStr || (log as any).time}</div>
                      <div className="text-[10px] text-slate-400">{log.dateStr || (log as any).date}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.userName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.userIdentifier}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 capitalize font-medium text-slate-600 dark:text-slate-300">
                      {log.userType === 'teacher' ? (language === 'bn' ? 'শিক্ষক/কর্মী' : 'Faculty') : (language === 'bn' ? 'শিক্ষার্থী' : 'Student')}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.punchType === 'in' || (log.punchType as any) === 'check_in'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {log.punchType === 'in' || (log.punchType as any) === 'check_in' ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {log.verificationMode || (log as any).verificationType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-400">
                      {log.deviceId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Punch Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-blue-600" />
                <span>{language === 'bn' ? 'ম্যানুয়াল পাঞ্চ এন্ট্রি' : 'Manual Punch Entry'}</span>
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualPunch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ব্যবহারকারীর ধরণ' : 'User Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualUserType('teacher');
                      if (teachers.length > 0) setManualUserId(teachers[0].id);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      manualUserType === 'teacher'
                        ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {language === 'bn' ? 'শিক্ষক / কর্মী' : 'Faculty / Staff'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualUserType('student');
                      if (students.length > 0) setManualUserId(students[0].id);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      manualUserType === 'student'
                        ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {language === 'bn' ? 'শিক্ষার্থী' : 'Student'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ব্যক্তি নির্বাচন' : 'Select Person'}
                </label>
                <select
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {manualUserType === 'teacher'
                    ? teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName} ({t.teacherId})
                        </option>
                      ))
                    : students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.firstName} {s.lastName} (Roll: {s.rollNumber})
                        </option>
                      ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'পাঞ্চ ধরণ' : 'Punch Action'}
                  </label>
                  <select
                    value={manualPunchType}
                    onChange={(e) => setManualPunchType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="check_in">Check-In (প্রবেশ)</option>
                    <option value="check_out">Check-Out (প্রস্থান)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {language === 'bn' ? 'ভেরিফিকেশন' : 'Method'}
                  </label>
                  <select
                    value={manualVerifyType}
                    onChange={(e) => setManualVerifyType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="rfid">RFID Card</option>
                    <option value="fingerprint">Fingerprint</option>
                    <option value="face">Face Recognition</option>
                    <option value="manual">Manual Register</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {language === 'bn' ? 'পাঞ্চ রেকর্ড করুন' : 'Record Punch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
