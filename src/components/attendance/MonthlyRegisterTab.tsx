import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  Users,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll } from '../../db/indexedDB';
import {
  Student,
  Teacher,
  ClassItem,
  SectionItem,
  StudentAttendanceRecord,
  TeacherAttendanceRecord,
  AttendanceStatus,
} from '../../types';

export const MonthlyRegisterTab: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language } = useApp();

  const [registerType, setRegisterType] = useState<'students' | 'teachers'>('students');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-indexed (0=Jan)

  // Class & Section filters for students
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  // Data
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [studentRecords, setStudentRecords] = useState<StudentAttendanceRecord[]>([]);
  const [teacherRecords, setTeacherRecords] = useState<TeacherAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isPrintMode, setIsPrintMode] = useState<boolean>(false);

  // Month names
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthNamesBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
  ];

  // Load Classes & Sections
  useEffect(() => {
    async function loadMeta() {
      if (!activeInstitute) return;
      try {
        const [allClasses, allSections] = await Promise.all([
          getAll<ClassItem>('classes'),
          getAll<SectionItem>('sections'),
        ]);

        const instClasses = allClasses.filter((c) => c.instituteId === activeInstitute.id);
        const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);

        setClasses(instClasses);
        setSections(instSections);

        if (instClasses.length > 0 && !selectedClassId) {
          setSelectedClassId(instClasses[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes for register:', err);
      }
    }
    loadMeta();
  }, [activeInstitute]);

  useEffect(() => {
    const classSections = sections.filter((s) => s.classId === selectedClassId);
    if (classSections.length > 0) {
      setSelectedSectionId(classSections[0].id);
    } else {
      setSelectedSectionId('');
    }
  }, [selectedClassId, sections]);

  // Load Register Data
  useEffect(() => {
    async function loadRegister() {
      if (!activeInstitute) return;
      setLoading(true);
      try {
        if (registerType === 'students') {
          const [allStudents, allStudentAtt] = await Promise.all([
            getAll<Student>('students'),
            getAll<StudentAttendanceRecord>('studentAttendance'),
          ]);

          const filteredStudents = allStudents.filter(
            (s) =>
              s.instituteId === activeInstitute.id &&
              s.classId === selectedClassId &&
              (!selectedSectionId || s.sectionId === selectedSectionId) &&
              s.status === 'active'
          ).sort((a, b) => a.rollNumber - b.rollNumber);

          setStudents(filteredStudents);
          setStudentRecords(allStudentAtt.filter((r) => r.instituteId === activeInstitute.id));
        } else {
          const [allTeachers, allTeacherAtt] = await Promise.all([
            getAll<Teacher>('teachers'),
            getAll<TeacherAttendanceRecord>('teacherAttendance'),
          ]);

          const instTeachers = allTeachers.filter(
            (t) => t.instituteId === activeInstitute.id && t.status === 'active'
          ).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

          setTeachers(instTeachers);
          setTeacherRecords(allTeacherAtt.filter((r) => r.instituteId === activeInstitute.id));
        }
      } catch (err) {
        console.error('Failed to load register data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRegister();
  }, [activeInstitute, registerType, selectedClassId, selectedSectionId, selectedYear, selectedMonth]);

  // Compute days in the selected month
  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth + 1, 0);
    const count = date.getDate();
    const days: { dayNumber: number; dateStr: string; isFriday: boolean; dayName: string }[] = [];

    for (let i = 1; i <= count; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      const isFriday = d.getDay() === 5; // Friday is weekend in Bangladesh
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      days.push({ dayNumber: i, dateStr, isFriday, dayName });
    }
    return days;
  }, [selectedYear, selectedMonth]);

  // Current Class & Section names
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const currentSection = sections.find((s) => s.id === selectedSectionId);

  // Helper to get status for a person on a specific date
  const getPersonStatus = (personId: string, dateStr: string): AttendanceStatus | null => {
    if (registerType === 'students') {
      const record = studentRecords.find(
        (r) => r.studentId === personId && r.date === dateStr && !r.subjectId
      );
      return record ? record.status : null;
    } else {
      const record = teacherRecords.find(
        (r) => r.teacherId === personId && r.date === dateStr
      );
      return record ? record.status : null;
    }
  };

  // Helper to calculate totals for a person
  const getPersonTotals = (personId: string) => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let workingDays = 0;

    daysInMonth.forEach((day) => {
      if (!day.isFriday) {
        workingDays++;
        const st = getPersonStatus(personId, day.dateStr);
        if (st === 'present') present++;
        else if (st === 'absent') absent++;
        else if (st === 'late') late++;
        else if (st === 'excused') excused++;
      }
    });

    const attended = present + late;
    const rate = workingDays > 0 ? Math.round((attended / workingDays) * 100) : 0;

    return { workingDays, present, absent, late, excused, rate };
  };

  // Export register to CSV
  const exportToCSV = () => {
    const titleRow = [
      activeInstitute?.name || 'Institution',
      `Monthly Attendance Register - ${monthNamesEn[selectedMonth]} ${selectedYear}`,
      registerType === 'students' ? `Class: ${currentClass?.name || ''} Section: ${currentSection?.name || ''}` : 'Faculty & Staff',
    ];

    const headerRow = [
      registerType === 'students' ? 'Roll' : 'ID',
      'Name',
      ...daysInMonth.map((d) => `Day ${d.dayNumber}${d.isFriday ? ' (Fri)' : ''}`),
      'Working Days',
      'Present',
      'Absent',
      'Late',
      'Leave',
      'Rate %',
    ];

    const rows: (string | number)[][] = [];
    const peopleList = registerType === 'students' ? students : teachers;

    peopleList.forEach((person) => {
      const totals = getPersonTotals(person.id);
      const personName = `${person.firstName} ${person.lastName}`;
      const row: (string | number)[] = [
        registerType === 'students' ? (person as Student).rollNumber : (person as Teacher).teacherId,
        personName,
      ];

      daysInMonth.forEach((d) => {
        if (d.isFriday) {
          row.push('HOLIDAY');
        } else {
          const st = getPersonStatus(person.id, d.dateStr);
          row.push(st ? st.toUpperCase().charAt(0) : '-');
        }
      });

      row.push(totals.workingDays, totals.present, totals.absent, totals.late, totals.excused, `${totals.rate}%`);
      rows.push(row);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [titleRow.join(','), '', headerRow.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Attendance_Register_${monthNamesEn[selectedMonth]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Status Badge for Cell
  const renderStatusCell = (status: AttendanceStatus | null, isFriday: boolean) => {
    if (isFriday) {
      return (
        <span className="text-[10px] font-semibold text-amber-600/70 dark:text-amber-400/60" title="Friday Holiday">
          F
        </span>
      );
    }

    if (!status) {
      return <span className="text-slate-300 dark:text-slate-700">-</span>;
    }

    switch (status) {
      case 'present':
        return (
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            P
          </span>
        );
      case 'absent':
        return (
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            A
          </span>
        );
      case 'late':
        return (
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            L
          </span>
        );
      case 'excused':
        return (
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            E
          </span>
        );
      case 'half_day':
        return (
          <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            H
          </span>
        );
      default:
        return <span>-</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Controls */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'রেজিস্টারের ধরণ' : 'Register Type'}
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
              <button
                type="button"
                onClick={() => setRegisterType('students')}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  registerType === 'students'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'bn' ? 'শিক্ষার্থী' : 'Students'}
              </button>
              <button
                type="button"
                onClick={() => setRegisterType('teachers')}
                className={`py-1.5 rounded-md transition-all cursor-pointer ${
                  registerType === 'teachers'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'bn' ? 'শিক্ষক/কর্মী' : 'Faculty'}
              </button>
            </div>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'bn' ? 'মাস' : 'Month'}</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {monthNamesEn.map((m, idx) => (
                <option key={idx} value={idx}>
                  {language === 'bn' ? monthNamesBn[idx] : m}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              {language === 'bn' ? 'বছর' : 'Year'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* If Students, show Class & Section */}
          {registerType === 'students' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'শ্রেণি' : 'Class'}
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'শাখা' : 'Section'}
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="">{language === 'bn' ? '-- সকল শাখা --' : '-- All Sections --'}</option>
                  {sections
                    .filter((s) => s.classId === selectedClassId)
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>
              {language === 'bn'
                ? 'শুক্রবার (F) সাপ্তাহিক ছুটির দিন হিসেবে চিহ্নিত। P=উপস্থিত, A=অনুপস্থিত, L=দেরি, E=ছুটি।'
                : 'Fridays (F) are highlighted as weekly institutional holidays. P=Present, A=Absent, L=Late, E=Leave.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportToCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'এক্সেল / CSV এক্সপোর্ট' : 'Export CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রেজিস্টার প্রিন্ট করুন' : 'Print Register'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Letterhead Header (visible on print or screen) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wide">
            {activeInstitute?.name || 'School & College'}
          </h2>
          {activeInstitute?.bengaliName && (
            <p className="text-sm font-bangla text-slate-600 dark:text-slate-300">
              {activeInstitute.bengaliName}
            </p>
          )}
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-4">
            <span>EIIN: {activeInstitute?.eiin || '108234'}</span>
            <span>•</span>
            <span>
              {language === 'bn' ? 'মাসিক উপস্থিতি খাতা' : 'Monthly Attendance Register'} (
              {language === 'bn' ? monthNamesBn[selectedMonth] : monthNamesEn[selectedMonth]} {selectedYear})
            </span>
            <span>•</span>
            <span>
              {registerType === 'students'
                ? `Class: ${currentClass?.name || 'All'} | Section: ${currentSection?.name || 'All'}`
                : 'Faculty & Staff Roster'}
            </span>
          </div>
        </div>

        {/* The Big Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-2 border border-slate-200 dark:border-slate-700 w-12 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10">
                  {registerType === 'students' ? 'Roll' : 'ID'}
                </th>
                <th className="p-2 border border-slate-200 dark:border-slate-700 text-left min-w-[140px] sticky left-12 bg-slate-100 dark:bg-slate-900 z-10">
                  {language === 'bn' ? 'নাম' : 'Name'}
                </th>

                {/* Day Columns */}
                {daysInMonth.map((d) => (
                  <th
                    key={d.dayNumber}
                    className={`p-1 w-7 border border-slate-200 dark:border-slate-700 font-semibold ${
                      d.isFriday
                        ? 'bg-amber-100/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>{d.dayNumber}</div>
                    <div className="text-[9px] text-slate-400 font-normal">{d.dayName}</div>
                  </th>
                ))}

                {/* Summary Headers */}
                <th className="p-1 border border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 w-9 font-bold">
                  P
                </th>
                <th className="p-1 border border-slate-200 dark:border-slate-700 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 w-9 font-bold">
                  A
                </th>
                <th className="p-1 border border-slate-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 w-9 font-bold">
                  L
                </th>
                <th className="p-1 border border-slate-200 dark:border-slate-700 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 w-9 font-bold">
                  E
                </th>
                <th className="p-1 border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 w-12 font-bold">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth.length + 7} className="py-12 text-center text-slate-400">
                    {language === 'bn' ? 'রেজিস্টার ডাটা লোড হচ্ছে...' : 'Loading register data...'}
                  </td>
                </tr>
              ) : (registerType === 'students' ? students : teachers).length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 7} className="py-12 text-center text-slate-400">
                    {language === 'bn' ? 'কোন রেকর্ড পাওয়া যায়নি।' : 'No records found for the selected filter.'}
                  </td>
                </tr>
              ) : (
                (registerType === 'students' ? students : teachers).map((person) => {
                  const totals = getPersonTotals(person.id);
                  const identifier =
                    registerType === 'students'
                      ? String((person as Student).rollNumber).padStart(2, '0')
                      : (person as Teacher).teacherId;

                  return (
                    <tr
                      key={person.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      {/* Identifier */}
                      <td className="p-1.5 border border-slate-200 dark:border-slate-700 font-bold sticky left-0 bg-white dark:bg-slate-800 z-10 text-slate-700 dark:text-slate-300">
                        {identifier}
                      </td>

                      {/* Name */}
                      <td className="p-1.5 border border-slate-200 dark:border-slate-700 text-left font-medium sticky left-12 bg-white dark:bg-slate-800 z-10 truncate max-w-[160px] text-slate-900 dark:text-white">
                        {person.firstName} {person.lastName}
                      </td>

                      {/* Day cells */}
                      {daysInMonth.map((d) => {
                        const status = getPersonStatus(person.id, d.dateStr);
                        return (
                          <td
                            key={d.dayNumber}
                            className={`p-0.5 border border-slate-200 dark:border-slate-700 ${
                              d.isFriday ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                            }`}
                          >
                            {renderStatusCell(status, d.isFriday)}
                          </td>
                        );
                      })}

                      {/* Totals */}
                      <td className="p-1 border border-slate-200 dark:border-slate-700 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                        {totals.present}
                      </td>
                      <td className="p-1 border border-slate-200 dark:border-slate-700 font-bold text-rose-700 dark:text-rose-300 bg-rose-50/40 dark:bg-rose-950/20">
                        {totals.absent}
                      </td>
                      <td className="p-1 border border-slate-200 dark:border-slate-700 font-bold text-amber-700 dark:text-amber-300 bg-amber-50/40 dark:bg-amber-950/20">
                        {totals.late}
                      </td>
                      <td className="p-1 border border-slate-200 dark:border-slate-700 font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/20">
                        {totals.excused}
                      </td>
                      <td
                        className={`p-1 border border-slate-200 dark:border-slate-700 font-bold ${
                          totals.rate >= 75
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/30'
                            : totals.rate >= 60
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50/30'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-50/30'
                        }`}
                      >
                        {totals.rate}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Official Bangladesh Signature Section (visible in print) */}
        <div className="mt-12 pt-8 border-t border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-3 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1.5 font-semibold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'শ্রেণি শিক্ষক / ইনচার্জের স্বাক্ষর' : 'Class Teacher Signature'}
            </div>
            <div className="text-[10px] text-slate-400">Date: ________________</div>
          </div>
          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1.5 font-semibold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'নিরীক্ষক / হিসাব শাখার স্বাক্ষর' : 'Checked & Verified By'}
            </div>
            <div className="text-[10px] text-slate-400">Date: ________________</div>
          </div>
          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1.5 font-semibold text-slate-700 dark:text-slate-300">
              {language === 'bn' ? 'অধ্যক্ষ / প্রধান শিক্ষকের স্বাক্ষর ও সিল' : 'Principal / Headmaster Signature & Seal'}
            </div>
            <div className="text-[10px] text-slate-400">Date: ________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
