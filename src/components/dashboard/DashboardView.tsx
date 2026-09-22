import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  ClipboardCheck,
  Award,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  HardDrive,
  Activity,
  Sparkles,
  RefreshCw,
  Clock,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { getAll } from '../../db/indexedDB';
import { AuditLog, Student, Teacher, StudentAttendanceRecord } from '../../types';

export const DashboardView: React.FC = () => {
  const {
    activeInstitute,
    activeAcademicYear,
    institutes,
    switchInstitute,
    setActiveTab,
    language,
    t,
  } = useApp();

  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [attendanceRate, setAttendanceRate] = useState<number>(92);
  const [feeCollectionTotal, setFeeCollectionTotal] = useState<number>(0);

  const fetchDashboardData = async () => {
    setLoadingLogs(true);
    try {
      const [logs, allStudents, allTeachers, allAttendance, allPayments] = await Promise.all([
        getAll<AuditLog>('auditLogs'),
        getAll<Student>('students'),
        getAll<Teacher>('teachers'),
        getAll<StudentAttendanceRecord>('studentAttendance'),
        getAll<any>('payments'),
      ]);

      // Sort descending by timestamp
      const sorted = logs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentLogs(sorted.slice(0, 6));

      if (activeInstitute) {
        const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);
        setStudentCount(instStudents.length);

        const instTeachers = allTeachers.filter((t) => t.instituteId === activeInstitute.id);
        setTeacherCount(instTeachers.length);

        const instAtt = allAttendance.filter((r) => r.instituteId === activeInstitute.id && !r.subjectId);
        if (instAtt.length > 0) {
          const present = instAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
          setAttendanceRate(Math.round((present / instAtt.length) * 100));
        }

        const instPayments = allPayments.filter((p) => p.instituteId === activeInstitute.id);
        const totalPaid = instPayments.reduce((acc, p) => acc + (p.totalCollected || 0), 0);
        setFeeCollectionTotal(totalPaid);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeInstitute]);

  const isSchool = activeInstitute?.type === 'school';

  return (
    <div className="space-y-6">
      {/* ACTIVE INSTITUTE CONTEXT BANNER (Professional Polish Dark Highlight) */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-6 sm:p-7 text-white shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {isSchool ? t.school : t.college} Context Active
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-medium">
                EIIN: {activeInstitute?.eiin || 'N/A'}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Est: {activeInstitute?.establishedYear || 'N/A'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {language === 'bn'
                ? activeInstitute?.bengaliName || activeInstitute?.name
                : activeInstitute?.name}
            </h2>

            <p className="text-xs text-slate-400 italic max-w-2xl">
              &ldquo;{activeInstitute?.motto || 'Empowering minds for a better tomorrow'}&rdquo;
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-400">
              <div>
                <strong className="text-slate-300">Principal:</strong> {activeInstitute?.principalName || 'N/A'}
              </div>
              <div>
                <strong className="text-slate-300">Session:</strong>{' '}
                <span className="text-emerald-400 font-semibold">
                  {activeAcademicYear?.yearName || 'Default'}
                </span>
              </div>
              <div>
                <strong className="text-slate-300">Address:</strong> {activeInstitute?.address || 'N/A'}
              </div>
            </div>
          </div>

          {/* Quick Institute Switcher on Dashboard */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 shrink-0 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {t.switchInstitute}
            </div>
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-md border border-slate-800">
              {institutes.map((inst) => {
                const isSelected = inst.id === activeInstitute?.id;
                return (
                  <button
                    key={inst.id}
                    id={`dash-switch-${inst.id}`}
                    onClick={() => switchInstitute(inst.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{inst.type === 'school' ? t.school : t.college}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subtle decorative background icon */}
        <Building2 className="absolute -right-6 -bottom-10 w-56 h-56 text-slate-800/40 pointer-events-none" />
      </div>

      {/* STATS OVERVIEW CARDS (Professional Polish) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => setActiveTab('students')}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              {t.totalStudents}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {studentCount}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Phase 3 Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate flex items-center justify-between">
            <span>Enrolled in {activeInstitute?.name}</span>
            <span className="text-emerald-600 text-[10px] font-semibold group-hover:underline">
              View Roster →
            </span>
          </p>
        </div>

        {/* Total Teachers */}
        <div
          onClick={() => setActiveTab('teachers')}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              {t.totalTeachers}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{teacherCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Phase 4 Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate flex items-center justify-between">
            <span>Faculty &amp; Staff roster</span>
            <span className="text-blue-600 text-[10px] font-semibold group-hover:underline">
              View Faculty →
            </span>
          </p>
        </div>

        {/* Today's Attendance */}
        <div
          onClick={() => setActiveTab('attendance')}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-amber-500 dark:hover:border-amber-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
              {t.presentToday}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceRate}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Phase 5 Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate flex items-center justify-between">
            <span>Daily logs &amp; biometrics</span>
            <span className="text-amber-600 text-[10px] font-semibold group-hover:underline">
              Mark Attendance →
            </span>
          </p>
        </div>

        {/* Fee Collection */}
        <div
          onClick={() => setActiveTab('fees')}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              {t.feeCollection}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              ৳{feeCollectionTotal.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Phase 7 Live
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate flex items-center justify-between">
            <span>Billing, receipts &amp; dues</span>
            <span className="text-emerald-600 text-[10px] font-semibold group-hover:underline">
              Fee Counter →
            </span>
          </p>
        </div>
      </div>

      {/* QUICK ACTION CARDS (Professional Polish) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>{t.quickActions}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <button
            id="dash-action-students"
            onClick={() => setActiveTab('students')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <GraduationCap className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {t.students}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Admissions, student roster, ID cards &amp; promotions
            </div>
          </button>

          <button
            id="dash-action-teachers"
            onClick={() => setActiveTab('teachers')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Users className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {t.teachers}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Faculty roster, service records, MPO &amp; workloads
            </div>
          </button>

          <button
            id="dash-action-attendance"
            onClick={() => setActiveTab('attendance')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'উপস্থিতি ও ছুটি' : 'Attendance & Leave'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Daily roll-call, SMS alerts, leave &amp; biometric sync
            </div>
          </button>

          <button
            id="dash-action-examination"
            onClick={() => setActiveTab('examination')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Award className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'পরীক্ষা ও ফলাফল' : 'Exams & Results'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              CQ/MCQ marks, GPA calculation with 4th subject &amp; transcripts
            </div>
          </button>

          <button
            id="dash-action-fees"
            onClick={() => setActiveTab('fees')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ফি ও বিলিং কাউন্টার' : 'Fees & Billing'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              3-part receipts, monthly bills, dues register &amp; SMS alerts
            </div>
          </button>

          <button
            id="dash-action-academic"
            onClick={() => setActiveTab('academic')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <BookOpen className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'একাডেমিক ব্যবস্থাপনা' : 'Academic Structure'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Classes, sections, subjects, syllabus &amp; class routine
            </div>
          </button>

          <button
            id="dash-action-institute"
            onClick={() => setActiveTab('institute')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Building2 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {t.institute}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Edit school &amp; college profiles, EIIN, contact
            </div>
          </button>

          <button
            id="dash-action-years"
            onClick={() => setActiveTab('academic_years')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Calendar className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Academic Years
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Add new sessions &amp; manage historical years
            </div>
          </button>

          <button
            id="dash-action-users"
            onClick={() => setActiveTab('users')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Users className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {t.users}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Manage accounts, roles, and granular RBAC
            </div>
          </button>

          <button
            id="dash-action-audit"
            onClick={() => setActiveTab('audit_logs')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-750 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <Activity className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {t.audit}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Inspect user actions, login trails &amp; changes
            </div>
          </button>

          <button
            id="dash-action-reports"
            onClick={() => setActiveTab('reports')}
            className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{language === 'bn' ? 'রিপোর্ট সেন্টার' : 'Report Center'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Phase 13</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Demographics, attendance, exams, fees, finance &amp; BANBEIS
            </div>
          </button>

          <button
            id="dash-action-backup"
            onClick={() => setActiveTab('backup')}
            className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group bg-white dark:bg-slate-800 shadow-xs cursor-pointer"
          >
            <HardDrive className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{language === 'bn' ? 'সিস্টেম ব্যাকআপ' : 'Backup & Restore'}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Phase 14</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Full snapshots, selective exports, pre-flight restore &amp; checkpoints
            </div>
          </button>
        </div>
      </div>

      {/* TWO COLUMN LOWER SECTION: RECENT AUDIT LOGS & DATABASE DIAGNOSTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Activity Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t.recentActivity}</span>
            </h3>
            <button
              onClick={fetchDashboardData}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No activity logs recorded yet.
              </div>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 px-6 py-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.username}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({log.module})
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      {log.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Offline Engine Diagnostics (Professional Polish Dark Highlight Card) */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xs text-white relative overflow-hidden space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>{t.systemHealth}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
              <span className="text-emerald-300 font-medium">
                Local Database
              </span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                ● Connected
              </span>
            </div>

            <div className="space-y-2.5 text-slate-400 text-[11px] pt-1">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Database Name:</span>
                <span className="font-mono text-slate-200">
                  SchoolCollegeERP_DB
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Schema Architecture:</span>
                <span className="font-semibold text-slate-200">
                  44 Object Stores
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span>Internet Status:</span>
                <span className="text-emerald-400 font-semibold">
                  Zero Cloud Dependencies
                </span>
              </div>
              <div className="flex justify-between">
                <span>Desktop Ready:</span>
                <span className="text-slate-200 font-medium">
                  Offline Web / Electron
                </span>
              </div>
            </div>

            <button
              id="dash-open-backup-btn"
              onClick={() => setActiveTab('backup')}
              className="w-full mt-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সিস্টেম ব্যাকআপ ও রিস্টোর' : 'Backup & Restore Hub'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
