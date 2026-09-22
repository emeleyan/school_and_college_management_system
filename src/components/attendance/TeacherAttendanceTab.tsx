import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  Save,
  Users,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll, putItem } from '../../db/indexedDB';
import {
  Teacher,
  TeacherAttendanceRecord,
  AttendanceStatus,
} from '../../types';

interface TeacherAttendanceTabProps {
  onRefreshStats?: () => void;
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({ onRefreshStats }) => {
  const { activeInstitute, currentUser, logAudit, language } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'teaching' | 'non-teaching'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, {
    status: AttendanceStatus;
    inTime: string;
    outTime: string;
    punchMethod: 'manual' | 'biometric' | 'rfid' | 'qr';
    remarks: string;
  }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load teachers and existing attendance
  useEffect(() => {
    async function loadData() {
      if (!activeInstitute) return;
      setLoading(true);
      try {
        const [allTeachers, allAttendance] = await Promise.all([
          getAll<Teacher>('teachers'),
          getAll<TeacherAttendanceRecord>('teacherAttendance'),
        ]);

        const instTeachers = allTeachers.filter(
          (t) => t.instituteId === activeInstitute.id && t.status === 'active'
        ).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

        setTeachers(instTeachers);

        // Check for records on selected date
        const existingRecords = allAttendance.filter(
          (r) => r.instituteId === activeInstitute.id && r.date === selectedDate
        );

        const newMap: Record<string, {
          status: AttendanceStatus;
          inTime: string;
          outTime: string;
          punchMethod: 'manual' | 'biometric' | 'rfid' | 'qr';
          remarks: string;
        }> = {};

        instTeachers.forEach((teacher) => {
          const rec = existingRecords.find((r) => r.teacherId === teacher.id);
          if (rec) {
            newMap[teacher.id] = {
              status: rec.status,
              inTime: rec.inTime || '08:30',
              outTime: rec.outTime || '16:30',
              punchMethod: rec.punchMethod || 'manual',
              remarks: rec.remarks || '',
            };
          } else {
            // Default to present
            newMap[teacher.id] = {
              status: 'present',
              inTime: '08:30',
              outTime: '16:30',
              punchMethod: 'manual',
              remarks: '',
            };
          }
        });

        setAttendanceMap(newMap);
      } catch (err) {
        console.error('Failed to load teacher attendance:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeInstitute, selectedDate]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const deps = new Set<string>();
    teachers.forEach((t) => {
      if (t.departmentName) deps.add(t.departmentName);
    });
    return Array.from(deps);
  }, [teachers]);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchDep = selectedDepartment === 'all' || t.departmentName === selectedDepartment;
      const isTeaching = t.employeeType === 'teacher' || (t as any).category === 'teaching';
      const matchCat =
        selectedCategory === 'all' ||
        (selectedCategory === 'teaching' && isTeaching) ||
        (selectedCategory === 'non-teaching' && !isTeaching);
      const fullName = `${t.firstName || ''} ${t.lastName || ''}`.trim() || (t as any).name || '';
      const tId = t.teacherId || (t as any).employeeId || '';
      const matchSearch =
        !searchQuery.trim() ||
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.bengaliName && t.bengaliName.includes(searchQuery)) ||
        tId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.designation && t.designation.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDep && matchCat && matchSearch;
    });
  }, [teachers, selectedDepartment, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    teachers.forEach((t) => {
      const att = attendanceMap[t.id];
      if (!att) return;
      if (att.status === 'present') present++;
      else if (att.status === 'absent') absent++;
      else if (att.status === 'late') late++;
      else if (att.status === 'excused') excused++;
    });

    const total = teachers.length;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, rate };
  }, [teachers, attendanceMap]);

  // Mass update
  const markAll = (status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      filteredTeachers.forEach((t) => {
        next[t.id] = {
          ...(next[t.id] || { inTime: '08:30', outTime: '16:30', punchMethod: 'manual', remarks: '' }),
          status,
        };
      });
      return next;
    });
  };

  const updateTeacherStatus = (teacherId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { inTime: '08:30', outTime: '16:30', punchMethod: 'manual', remarks: '' }),
        status,
      },
    }));
  };

  const updateTeacherTimes = (teacherId: string, field: 'inTime' | 'outTime', val: string) => {
    setAttendanceMap((prev) => {
      const current = prev[teacherId] || { status: 'present', inTime: '08:30', outTime: '16:30', punchMethod: 'manual', remarks: '' };
      const updated = { ...current, [field]: val };

      // Auto-detect late if inTime is after 09:00 AM
      if (field === 'inTime' && val > '09:00' && current.status === 'present') {
        updated.status = 'late';
      }

      return {
        ...prev,
        [teacherId]: updated,
      };
    });
  };

  const updateTeacherRemarks = (teacherId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [teacherId]: {
        ...(prev[teacherId] || { status: 'present', inTime: '08:30', outTime: '16:30', punchMethod: 'manual' }),
        remarks,
      },
    }));
  };

  // Save to IndexedDB
  const handleSave = async () => {
    if (!activeInstitute) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const now = new Date().toISOString();
      const recordsToSave: TeacherAttendanceRecord[] = teachers.map((teacher) => {
        const att = attendanceMap[teacher.id] || {
          status: 'present',
          inTime: '08:30',
          outTime: '16:30',
          punchMethod: 'manual',
          remarks: '',
        };

        // Calculate late minutes if after 09:00
        let lateMinutes = 0;
        if (att.inTime && att.inTime > '09:00') {
          const [h, m] = att.inTime.split(':').map(Number);
          lateMinutes = Math.max(0, (h - 9) * 60 + m);
        }

        return {
          id: `att-tch-${teacher.id}-${selectedDate}`,
          instituteId: activeInstitute.id,
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          employeeId: teacher.teacherId,
          designation: teacher.designation,
          departmentName: teacher.departmentName,
          date: selectedDate,
          status: att.status,
          inTime: att.status !== 'absent' && att.status !== 'excused' ? att.inTime : undefined,
          outTime: att.status !== 'absent' && att.status !== 'excused' ? att.outTime : undefined,
          lateMinutes: lateMinutes > 0 ? lateMinutes : undefined,
          punchMethod: att.punchMethod,
          remarks: att.remarks || undefined,
          markedBy: currentUser?.fullName || 'Administrator',
          createdAt: now,
          updatedAt: now,
        };
      });

      for (const rec of recordsToSave) {
        await putItem('teacherAttendance', rec);
      }

      await logAudit(
        'mark_teacher_attendance',
        'attendance',
        `Recorded Faculty & Staff attendance on ${selectedDate} (${stats.present} Present, ${stats.absent} Absent)`
      );

      setSaveMessage(
        language === 'bn'
          ? 'শিক্ষক ও কর্মীদের উপস্থিতি সংরক্ষিত হয়েছে।'
          : 'Faculty attendance records successfully saved.'
      );
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save teacher attendance:', err);
      alert('Failed to save attendance records.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters & Control Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'bn' ? 'তারিখ' : 'Attendance Date'}</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'bn' ? 'বিভাগ / ডিপার্টমেন্ট' : 'Department'}</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{language === 'bn' ? '-- সকল বিভাগ --' : '-- All Departments --'}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'পদমর্যাদার ধরণ' : 'Staff Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{language === 'bn' ? 'সকল শিক্ষক ও কর্মী' : 'All Faculty & Staff'}</option>
              <option value="teaching">{language === 'bn' ? 'শুধুমাত্র শিক্ষক (Teaching)' : 'Teaching Faculty'}</option>
              <option value="non-teaching">{language === 'bn' ? 'কর্মকর্তা ও কর্মচারী (Staff)' : 'Non-Teaching Staff'}</option>
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'শিক্ষক বা কর্মী খুঁজুন' : 'Search Teacher / Staff'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'নাম, পদবি বা আইডি...' : 'Name, Designation, ID...'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'মোট শিক্ষক/কর্মী' : 'Total Faculty'}
          </span>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {language === 'bn' ? 'উপস্থিত' : 'Present'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
            {stats.present}
            <span className="text-xs font-normal text-emerald-600 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {language === 'bn' ? 'অনুপস্থিত' : 'Absent'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-800 dark:text-rose-200">
            {stats.absent}
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {language === 'bn' ? 'দেরিতে আগমন' : 'Late Arrival'}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
            {stats.late}
          </div>
        </div>

        <div className="bg-sky-50/70 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
              {language === 'bn' ? 'অনুমোদিত ছুটি' : 'On Leave'}
            </span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-sky-800 dark:text-sky-200">
            {stats.excused}
          </div>
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              {language === 'bn' ? 'উপস্থিতির হার' : 'Attendance Rate'}
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">
            {stats.rate}%
          </div>
        </div>
      </div>

      {/* Batch Actions & Save */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAll('present')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সব শিক্ষক উপস্থিত করুন' : 'Mark All Present'}</span>
          </button>
          <button
            onClick={() => markAll('absent')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'সবাই অনুপস্থিত করুন' : 'Mark All Absent'}</span>
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading || teachers.length === 0}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'উপস্থিতি সংরক্ষণ করুন' : 'Save Attendance')}</span>
        </button>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{language === 'bn' ? 'শিক্ষক / কর্মী' : 'Faculty / Staff'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'বিভাগ ও পদবি' : 'Designation & Dept'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'উপস্থিতি' : 'Status'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'প্রবেশ (In)' : 'In Time'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'প্রস্থান (Out)' : 'Out Time'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'পদ্ধতি' : 'Method'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'মন্তব্য' : 'Remarks'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading faculty list...'}
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'কোন শিক্ষক বা কর্মী পাওয়া যায়নি।' : 'No faculty records found.'}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const att = attendanceMap[teacher.id] || {
                    status: 'present',
                    inTime: '08:30',
                    outTime: '16:30',
                    punchMethod: 'manual',
                    remarks: '',
                  };

                  return (
                    <tr
                      key={teacher.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors ${
                        att.status === 'absent' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Teacher Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {teacher.photoUrl ? (
                              <img src={teacher.photoUrl} alt={`${teacher.firstName} ${teacher.lastName}`} className="w-full h-full object-cover" />
                            ) : (
                              (teacher.firstName || 'T').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {teacher.firstName} {teacher.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {teacher.teacherId} {teacher.bengaliName ? `• ${teacher.bengaliName}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation & Dept */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {teacher.designation}
                        </div>
                        <div className="text-slate-400">
                          {teacher.departmentName || 'General'}
                        </div>
                      </td>

                      {/* Status Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => updateTeacherStatus(teacher.id, 'present')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                            title="Present"
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTeacherStatus(teacher.id, 'absent')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-rose-600'
                            }`}
                            title="Absent"
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTeacherStatus(teacher.id, 'late')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-500 hover:text-amber-500'
                            }`}
                            title="Late"
                          >
                            L
                          </button>
                          <button
                            type="button"
                            onClick={() => updateTeacherStatus(teacher.id, 'excused')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'excused'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-sky-600'
                            }`}
                            title="Leave / Excused"
                          >
                            E
                          </button>
                        </div>
                      </td>

                      {/* In Time */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="time"
                          value={att.inTime || '08:30'}
                          onChange={(e) => updateTeacherTimes(teacher.id, 'inTime', e.target.value)}
                          disabled={att.status === 'absent' || att.status === 'excused'}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        />
                      </td>

                      {/* Out Time */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="time"
                          value={att.outTime || '16:30'}
                          onChange={(e) => updateTeacherTimes(teacher.id, 'outTime', e.target.value)}
                          disabled={att.status === 'absent' || att.status === 'excused'}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        />
                      </td>

                      {/* Punch Method */}
                      <td className="px-4 py-3 text-center text-xs">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {att.punchMethod === 'biometric' ? 'Biometric' : 'Manual'}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={att.remarks}
                          onChange={(e) => updateTeacherRemarks(teacher.id, e.target.value)}
                          placeholder={language === 'bn' ? 'মন্তব্য বা ছুটির বিবরণ...' : 'Notes / remarks...'}
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
