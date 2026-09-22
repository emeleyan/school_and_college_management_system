import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  Send,
  Save,
  MessageSquare,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll, putItem, deleteItem } from '../../db/indexedDB';
import {
  Student,
  ClassItem,
  SectionItem,
  SubjectItem,
  StudentAttendanceRecord,
  AttendanceStatus,
  SMSAlertLog,
} from '../../types';

interface StudentAttendanceTabProps {
  onRefreshStats?: () => void;
}

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({ onRefreshStats }) => {
  const { activeInstitute, activeAcademicYear, currentUser, logAudit, language, hasPermission } = useApp();

  // Selection states
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isSubjectWise, setIsSubjectWise] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, {
    status: AttendanceStatus;
    remarks: string;
    entryTime: string;
  }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // SMS Modal states
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [smsTemplate, setSmsTemplate] = useState<string>(
    language === 'bn'
      ? 'সম্মানিত অভিভাবক, আপনার সন্তান {StudentName} (রোল: {Roll}, শ্রেণি: {Class}, শাখা: {Section}) আজ {Date} তারিখে ক্লাসে অনুপস্থিত রয়েছে। - {InstituteName}'
      : 'Dear Guardian, your ward {StudentName} (Roll: {Roll}, Class: {Class}, Section: {Section}) is ABSENT today ({Date}). - Principal, {InstituteName}'
  );
  const [sendingSms, setSendingSms] = useState<boolean>(false);
  const [smsSuccessCount, setSmsSuccessCount] = useState<number | null>(null);

  // Fetch classes, sections, and subjects
  useEffect(() => {
    async function loadMeta() {
      if (!activeInstitute) return;
      try {
        const [allClasses, allSections, allSubjects] = await Promise.all([
          getAll<ClassItem>('classes'),
          getAll<SectionItem>('sections'),
          getAll<SubjectItem>('subjects'),
        ]);

        const instClasses = allClasses.filter((c) => c.instituteId === activeInstitute.id);
        const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);
        const instSubjects = allSubjects.filter((sub) => sub.instituteId === activeInstitute.id);

        setClasses(instClasses);
        setSections(instSections);
        setSubjects(instSubjects);

        if (instClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(instClasses[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes and sections:', err);
      }
    }
    loadMeta();
  }, [activeInstitute]);

  // Update selected section when class changes
  useEffect(() => {
    const classSections = sections.filter((s) => s.classId === selectedClassId);
    if (classSections.length > 0) {
      setSelectedSectionId(classSections[0].id);
    } else {
      setSelectedSectionId('');
    }
  }, [selectedClassId, sections]);

  // Load students and existing attendance
  useEffect(() => {
    async function loadAttendanceData() {
      if (!activeInstitute || !selectedClassId) return;
      setLoading(true);
      try {
        const [allStudents, allAttendance] = await Promise.all([
          getAll<Student>('students'),
          getAll<StudentAttendanceRecord>('studentAttendance'),
        ]);

        // Filter students for active institute, academic year, class, and section
        const filteredStudents = allStudents.filter(
          (s) =>
            s.instituteId === activeInstitute.id &&
            s.classId === selectedClassId &&
            (!selectedSectionId || s.sectionId === selectedSectionId) &&
            s.status === 'active'
        ).sort((a, b) => a.rollNumber - b.rollNumber);

        setStudents(filteredStudents);

        // Find existing attendance records for the date and class/section/subject
        const existingRecords = allAttendance.filter((rec) => {
          const matchDate = rec.date === selectedDate;
          const matchInstitute = rec.instituteId === activeInstitute.id;
          const matchClass = rec.classId === selectedClassId;
          const matchSection = !selectedSectionId || rec.sectionId === selectedSectionId;
          const matchSubject = isSubjectWise
            ? rec.subjectId === selectedSubjectId && rec.periodNo === selectedPeriod
            : !rec.subjectId;
          return matchDate && matchInstitute && matchClass && matchSection && matchSubject;
        });

        const newMap: Record<string, { status: AttendanceStatus; remarks: string; entryTime: string }> = {};
        
        filteredStudents.forEach((student) => {
          const record = existingRecords.find((r) => r.studentId === student.id);
          if (record) {
            newMap[student.id] = {
              status: record.status,
              remarks: record.remarks || '',
              entryTime: record.entryTime || '08:15',
            };
          } else {
            // Default to 'present' for easy marking
            newMap[student.id] = {
              status: 'present',
              remarks: '',
              entryTime: '08:15',
            };
          }
        });

        setAttendanceMap(newMap);
      } catch (err) {
        console.error('Failed to load students and attendance:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceData();
  }, [
    activeInstitute,
    activeAcademicYear,
    selectedDate,
    selectedClassId,
    selectedSectionId,
    isSubjectWise,
    selectedSubjectId,
    selectedPeriod,
  ]);

  // Current class and section objects
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Available sections for current class
  const classSections = sections.filter((s) => s.classId === selectedClassId);

  // Filtered students by search query
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const nameEn = `${s.firstName || ''} ${s.lastName || ''}`.trim() || (s as any).name || '';
      return (
        nameEn.toLowerCase().includes(q) ||
        (s.bengaliName && s.bengaliName.includes(q)) ||
        s.studentId.toLowerCase().includes(q) ||
        String(s.rollNumber).includes(q)
      );
    });
  }, [students, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let halfDay = 0;

    students.forEach((s) => {
      const att = attendanceMap[s.id];
      if (!att) return;
      if (att.status === 'present') present++;
      else if (att.status === 'absent') absent++;
      else if (att.status === 'late') late++;
      else if (att.status === 'excused') excused++;
      else if (att.status === 'half_day') halfDay++;
    });

    const total = students.length;
    const presentRate = total > 0 ? Math.round(((present + late + halfDay * 0.5) / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      halfDay,
      presentRate,
    };
  }, [students, attendanceMap]);

  // Absent students list
  const absentStudents = useMemo(() => {
    return students.filter((s) => attendanceMap[s.id]?.status === 'absent');
  }, [students, attendanceMap]);

  // Batch actions
  const markAll = (status: AttendanceStatus) => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => {
        next[s.id] = {
          ...(next[s.id] || { remarks: '', entryTime: '08:15' }),
          status,
        };
      });
      return next;
    });
  };

  const updateStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { remarks: '', entryTime: '08:15' }),
        status,
      },
    }));
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present', entryTime: '08:15' }),
        remarks,
      },
    }));
  };

  const updateStudentEntryTime = (studentId: string, entryTime: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'present', remarks: '' }),
        entryTime,
      },
    }));
  };

  // Save Attendance to IndexedDB
  const handleSaveAttendance = async () => {
    if (!activeInstitute || !selectedClassId) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const now = new Date().toISOString();
      const recordsToSave: StudentAttendanceRecord[] = students.map((student) => {
        const att = attendanceMap[student.id] || { status: 'present', remarks: '', entryTime: '08:15' };
        const id = isSubjectWise
          ? `att-stu-${student.id}-${selectedDate}-${selectedSubjectId || 'sub'}-p${selectedPeriod}`
          : `att-stu-${student.id}-${selectedDate}`;

        return {
          id,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id || '',
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          classId: selectedClassId,
          className: currentClass?.name || '',
          sectionId: selectedSectionId,
          sectionName: currentSection?.name || '',
          date: selectedDate,
          status: att.status,
          entryTime: att.status === 'present' || att.status === 'late' ? att.entryTime : undefined,
          remarks: att.remarks || undefined,
          subjectId: isSubjectWise ? selectedSubjectId : undefined,
          subjectName: isSubjectWise ? currentSubject?.name : undefined,
          periodNo: isSubjectWise ? selectedPeriod : undefined,
          markedBy: currentUser?.fullName || 'Teacher',
          createdAt: now,
          updatedAt: now,
        };
      });

      // Save each record
      for (const rec of recordsToSave) {
        await putItem('studentAttendance', rec);
      }

      await logAudit(
        'mark_student_attendance',
        'attendance',
        `Recorded attendance for Class: ${currentClass?.name}, Section: ${currentSection?.name || 'All'} on ${selectedDate} (${stats.present} Present, ${stats.absent} Absent)`
      );

      setSaveMessage(language === 'bn' ? 'উপস্থিতি সফলভাবে সংরক্ষিত হয়েছে!' : 'Attendance successfully saved!');
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Send Absentee SMS Simulation
  const handleSendAbsenteeSms = async () => {
    if (!activeInstitute || absentStudents.length === 0) return;
    setSendingSms(true);

    try {
      const now = new Date().toISOString();
      let sentCount = 0;

      for (const student of absentStudents) {
        const phone = student.guardian?.emergencyContactPhone || student.guardian?.fatherPhone || student.guardian?.motherPhone || student.phone || '01700000000';
        const studentFullName = `${student.firstName} ${student.lastName}`;
        const formattedMsg = smsTemplate
          .replace('{StudentName}', studentFullName)
          .replace('{Roll}', String(student.rollNumber))
          .replace('{Class}', currentClass?.name || '')
          .replace('{Section}', currentSection?.name || '-')
          .replace('{Date}', selectedDate)
          .replace('{InstituteName}', activeInstitute.name);

        const smsLog: SMSAlertLog = {
          id: `sms-${student.id}-${selectedDate}-${Date.now()}`,
          instituteId: activeInstitute.id,
          date: selectedDate,
          recipientPhone: phone,
          recipientName: student.guardian?.emergencyContactName || student.guardian?.fatherName || 'Guardian',
          studentName: studentFullName,
          rollNumber: student.rollNumber,
          className: currentClass?.name || '',
          sectionName: currentSection?.name || '',
          message: formattedMsg,
          status: 'sent',
          sentAt: now,
        };

        await putItem('smsLogs', smsLog);
        sentCount++;
      }

      await logAudit(
        'send_absent_sms',
        'attendance',
        `Sent ${sentCount} absentee SMS notifications for ${currentClass?.name} on ${selectedDate}`
      );

      setSmsSuccessCount(sentCount);
      setTimeout(() => {
        setSmsSuccessCount(null);
        setShowSmsModal(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to dispatch absentee SMS:', err);
      alert('Failed to send SMS notifications.');
    } finally {
      setSendingSms(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Control Panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
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

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'bn' ? 'শ্রেণি' : 'Class / Grade'}</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.bengaliName ? `(${cls.bengaliName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'শাখা' : 'Section'}
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{language === 'bn' ? '-- সকল শাখা --' : '-- All Sections --'}</option>
              {classSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} {sec.bengaliName ? `(${sec.bengaliName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'bn' ? 'নাম বা রোল...' : 'Name or Roll...'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'উপস্থিতির ধরণ' : 'Attendance Type'}
            </label>
            <button
              onClick={() => setIsSubjectWise(!isSubjectWise)}
              className={`w-full px-3 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isSubjectWise
                  ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {isSubjectWise
                  ? language === 'bn' ? 'বিষয়ভিত্তিক উপস্থিতি' : 'Subject-wise'
                  : language === 'bn' ? 'দৈনিক উপস্থিতি' : 'Daily Roll Call'}
              </span>
            </button>
          </div>
        </div>

        {/* Subject & Period selection if subject-wise */}
        {isSubjectWise && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                {language === 'bn' ? 'বিষয়' : 'Subject'}
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="">{language === 'bn' ? '-- বিষয় নির্বাচন করুন --' : '-- Select Subject --'}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-900 dark:text-purple-200 mb-1">
                {language === 'bn' ? 'পিরিয়ড নম্বর' : 'Period No.'}
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    {language === 'bn' ? `${p}ম পিরিয়ড` : `Period ${p}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="text-xs text-purple-700 dark:text-purple-300 pb-2">
                {language === 'bn'
                  ? 'কলেজ ও উচ্চ মাধ্যমিকের জন্য পিরিয়ডভিত্তিক উপস্থিতি প্রযোজ্য।'
                  : 'College & Higher classes record period-wise lecture attendance.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'মোট শিক্ষার্থী' : 'Total Students'}
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
            <span className="text-xs font-normal text-rose-600 ml-1.5">
              ({stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {language === 'bn' ? 'দেরিতে আগমন' : 'Late'}
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
              {language === 'bn' ? 'ছুটি / লিভ' : 'Excused'}
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
              {language === 'bn' ? 'উপস্থিতির হার' : 'Presence Rate'}
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">
            {stats.presentRate}%
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {(hasPermission('attendance', 'add') || hasPermission('attendance', 'edit')) && (
        <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('present')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সবাইকে উপস্থিত করুন' : 'Mark All Present'}</span>
            </button>

            <button
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সবাইকে অনুপস্থিত করুন' : 'Mark All Absent'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {stats.absent > 0 && (
              <button
                onClick={() => setShowSmsModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {language === 'bn' ? `অনুপস্থিতির এসএমএস (${stats.absent})` : `Absentee SMS Alert (${stats.absent})`}
                </span>
              </button>
            )}

            <button
              onClick={handleSaveAttendance}
              disabled={saving || loading || students.length === 0}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'উপস্থিতি সংরক্ষণ করুন' : 'Save Attendance')}</span>
            </button>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Attendance Sheet Roster Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 w-16 text-center">{language === 'bn' ? 'রোল' : 'Roll'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'শিক্ষার্থী' : 'Student Info'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'উপস্থিতি স্ট্যাটাস' : 'Attendance Status'}</th>
                <th className="px-4 py-3 w-28 text-center">{language === 'bn' ? 'প্রবেশ সময়' : 'In-Time'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'মন্তব্য' : 'Remarks / Note'}</th>
                <th className="px-4 py-3 text-right">{language === 'bn' ? 'অভিভাবকের ফোন' : 'Guardian Phone'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading students...'}
                  </td>
                </tr>
              ) : displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {language === 'bn'
                      ? 'এই শ্রেণি ও শাখায় কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি।'
                      : 'No active students found in this class & section.'}
                  </td>
                </tr>
              ) : (
                displayedStudents.map((student) => {
                  const att = attendanceMap[student.id] || {
                    status: 'present',
                    remarks: '',
                    entryTime: '08:15',
                  };

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors ${
                        att.status === 'absent' ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Roll Number */}
                      <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {String(student.rollNumber).padStart(2, '0')}
                      </td>

                      {/* Student Info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0 overflow-hidden">
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={`${student.firstName} ${student.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (student.firstName || 'S').charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {student.studentId} • {student.bengaliName || ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          {/* Present */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, 'present')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                            }`}
                            title="Present (P)"
                          >
                            P
                          </button>

                          {/* Absent */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, 'absent')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-rose-600'
                            }`}
                            title="Absent (A)"
                          >
                            A
                          </button>

                          {/* Late */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, 'late')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-500 hover:text-amber-500'
                            }`}
                            title="Late (L)"
                          >
                            L
                          </button>

                          {/* Excused / Leave */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, 'excused')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'excused'
                                ? 'bg-sky-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-sky-600'
                            }`}
                            title="Excused / On Leave (E)"
                          >
                            E
                          </button>

                          {/* Half Day */}
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(student.id, 'half_day')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              att.status === 'half_day'
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-500 hover:text-purple-600'
                            }`}
                            title="Half Day (H)"
                          >
                            H
                          </button>
                        </div>
                      </td>

                      {/* Entry Time */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="time"
                          value={att.entryTime || '08:15'}
                          onChange={(e) => updateStudentEntryTime(student.id, e.target.value)}
                          disabled={att.status === 'absent' || att.status === 'excused'}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={att.remarks}
                          onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                          placeholder={
                            att.status === 'absent'
                              ? language === 'bn' ? 'অনুপস্থিতির কারণ...' : 'Reason for absence...'
                              : language === 'bn' ? 'মন্তব্য...' : 'Optional remarks...'
                          }
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Guardian Phone */}
                      <td className="px-4 py-3 text-right text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {student.guardian?.emergencyContactPhone || student.guardian?.fatherPhone || student.phone || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absentee SMS Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'bn' ? 'অনুপস্থিতির এসএমএস নোটিফিকেশন' : 'Send Absentee SMS Notifications'}
                </h3>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {language === 'bn'
                  ? `মোট ${absentStudents.length} জন অনুপস্থিত শিক্ষার্থীর অভিভাবকের কাছে স্বয়ংক্রিয় নোটিফিকেশন পাঠানো হবে।`
                  : `Automated absent notice will be sent to the guardians of ${absentStudents.length} absent students.`}
              </span>
            </div>

            {/* Recipient Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                {language === 'bn' ? 'প্রাপক শিক্ষার্থী তালিকা' : 'Recipients'}
              </label>
              <div className="max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap gap-1.5 text-xs">
                {absentStudents.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    Roll {s.rollNumber}: {`${s.firstName || ''} ${s.lastName || ''}`.trim() || (s as any).name || 'Student'} ({s.guardian?.emergencyContactPhone || s.guardian?.fatherPhone || s.phone || 'No Phone'})
                  </span>
                ))}
              </div>
            </div>

            {/* SMS Template */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'এসএমএস বার্তা টেমপ্লেট' : 'SMS Message Template'}
              </label>
              <textarea
                rows={4}
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-sans"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Variables: &#123;StudentName&#125;, &#123;Roll&#125;, &#123;Class&#125;, &#123;Section&#125;, &#123;Date&#125;, &#123;InstituteName&#125;</span>
                <span>{smsTemplate.length} chars</span>
              </div>
            </div>

            {smsSuccessCount !== null && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'bn'
                    ? `সফলভাবে ${smsSuccessCount} টি এসএমএস পাঠানো হয়েছে!`
                    : `Successfully dispatched ${smsSuccessCount} absentee SMS messages!`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSendAbsenteeSms}
                disabled={sendingSms}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingSms
                    ? (language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Dispatching SMS...')
                    : (language === 'bn' ? 'এসএমএস পাঠান' : 'Send SMS Now')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
