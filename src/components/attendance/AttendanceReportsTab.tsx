import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  Search,
  Send,
  Sparkles,
  Layers,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAll } from '../../db/indexedDB';
import {
  Student,
  ClassItem,
  SectionItem,
  StudentAttendanceRecord,
} from '../../types';

export const AttendanceReportsTab: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language } = useApp();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | 'collegiate' | 'non_collegiate' | 'dis_collegiate'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getStudentFullName = (st: Student) => {
    const en = `${st.firstName || ''} ${st.lastName || ''}`.trim() || (st as any).name || 'Student';
    return st.bengaliName ? `${en} (${st.bengaliName})` : en;
  };

  const getStudentPhone = (st: Student) => {
    return (
      st.guardian?.emergencyContactPhone ||
      st.guardian?.fatherPhone ||
      st.phone ||
      (st as any).guardianPhone ||
      (st as any).fatherPhone ||
      '-'
    );
  };

  useEffect(() => {
    async function loadData() {
      if (!activeInstitute) return;
      setLoading(true);
      try {
        const [allStudents, allClasses, allSections, allAtt] = await Promise.all([
          getAll<Student>('students'),
          getAll<ClassItem>('classes'),
          getAll<SectionItem>('sections'),
          getAll<StudentAttendanceRecord>('studentAttendance'),
        ]);

        const instStudents = allStudents.filter(
          (s) => s.instituteId === activeInstitute.id && s.status === 'active'
        );
        const instClasses = allClasses.filter((c) => c.instituteId === activeInstitute.id);
        const instSections = allSections.filter((sec) => sec.instituteId === activeInstitute.id);
        const instAtt = allAtt.filter((r) => r.instituteId === activeInstitute.id && !r.subjectId);

        setStudents(instStudents);
        setClasses(instClasses);
        setSections(instSections);
        setAttendanceRecords(instAtt);
      } catch (err) {
        console.error('Failed to load attendance report data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [activeInstitute]);

  // Compute student stats
  const studentStats = useMemo(() => {
    // Unique dates where attendance was recorded for the institute
    const datesSet = new Set(attendanceRecords.map((r) => r.date));
    const totalRecordedDays = Math.max(1, datesSet.size);

    return students.map((student) => {
      const records = attendanceRecords.filter((r) => r.studentId === student.id);
      const presentCount = records.filter((r) => r.status === 'present').length;
      const lateCount = records.filter((r) => r.status === 'late').length;
      const absentCount = records.filter((r) => r.status === 'absent').length;
      const excusedCount = records.filter((r) => r.status === 'excused').length;

      // In Bangladeshi institutions, working days considered is either the days class was held
      const workingDays = Math.max(records.length, 1);
      const attendedDays = presentCount + lateCount;
      const rate = Math.round((attendedDays / workingDays) * 100);

      let eligibility: 'collegiate' | 'non_collegiate' | 'dis_collegiate' = 'collegiate';
      if (rate >= 75) {
        eligibility = 'collegiate';
      } else if (rate >= 60) {
        eligibility = 'non_collegiate';
      } else {
        eligibility = 'dis_collegiate';
      }

      return {
        student,
        workingDays,
        presentCount,
        lateCount,
        absentCount,
        excusedCount,
        attendedDays,
        rate,
        eligibility,
      };
    });
  }, [students, attendanceRecords]);

  // Class-wise attendance analysis
  const classBreakdowns = useMemo(() => {
    return classes.map((cls) => {
      const clsStudents = studentStats.filter((s) => s.student.classId === cls.id);
      if (clsStudents.length === 0) return { classItem: cls, total: 0, averageRate: 0 };
      const avg = Math.round(
        clsStudents.reduce((acc, curr) => acc + curr.rate, 0) / clsStudents.length
      );
      return {
        classItem: cls,
        total: clsStudents.length,
        averageRate: avg,
      };
    });
  }, [classes, studentStats]);

  // Filtered students for Defaulters/Eligibility Table
  const filteredStudents = useMemo(() => {
    return studentStats.filter((item) => {
      const matchClass = selectedClassId === 'all' || item.student.classId === selectedClassId;
      const matchElig = eligibilityFilter === 'all' || item.eligibility === eligibilityFilter;
      const fullName = getStudentFullName(item.student).toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        fullName.includes(searchQuery.toLowerCase()) ||
        String(item.student.rollNumber).includes(searchQuery) ||
        item.student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchElig && matchSearch;
    });
  }, [studentStats, selectedClassId, eligibilityFilter, searchQuery]);

  // Overview counts
  const overview = useMemo(() => {
    const total = studentStats.length;
    const collegiateCount = studentStats.filter((s) => s.eligibility === 'collegiate').length;
    const nonCollegiateCount = studentStats.filter((s) => s.eligibility === 'non_collegiate').length;
    const disCollegiateCount = studentStats.filter((s) => s.eligibility === 'dis_collegiate').length;
    const overallAverage =
      total > 0 ? Math.round(studentStats.reduce((acc, curr) => acc + curr.rate, 0) / total) : 0;

    return {
      total,
      collegiateCount,
      nonCollegiateCount,
      disCollegiateCount,
      overallAverage,
    };
  }, [studentStats]);

  // Export CSV
  const exportDefaultersCSV = () => {
    const header = ['Roll', 'Student ID', 'Name', 'Class', 'Section', 'Working Days', 'Attended', 'Rate %', 'Eligibility Status', 'Guardian Phone'];
    const rows = filteredStudents.map((item) => {
      const cls = classes.find((c) => c.id === item.student.classId)?.name || 'Class';
      const sec = sections.find((s) => s.id === item.student.sectionId)?.name || 'Section';
      return [
        item.student.rollNumber,
        item.student.studentId,
        getStudentFullName(item.student),
        cls,
        sec,
        item.workingDays,
        item.attendedDays,
        `${item.rate}%`,
        item.eligibility === 'collegiate'
          ? 'Collegiate (>=75%)'
          : item.eligibility === 'non_collegiate'
          ? 'Non-Collegiate (60-74%)'
          : 'Dis-Collegiate (<60%)',
        getStudentPhone(item.student),
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Attendance Report - ${activeInstitute?.name || ''}`,
        `Academic Year: ${activeAcademicYear?.yearName || ''}`,
        '',
        header.join(','),
        ...rows.map((r) => r.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Eligibility_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'গড় উপস্থিতি' : 'Overall Average'}
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {overview.overallAverage}%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'bn' ? 'সকল শ্রেণি মিলিয়ে সামগ্রিক হার' : 'Across all registered classes'}
          </p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              {language === 'bn' ? 'নিয়মিত (Collegiate)' : 'Collegiate (≥75%)'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">
            {overview.collegiateCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {language === 'bn' ? 'পরীক্ষায় অংশগ্রহণে সম্পূর্ণ যোগ্য' : 'Fully eligible for Board exam'}
          </p>
        </div>

        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              {language === 'bn' ? 'নন-কলেজিয়েট (৬০-৭৪%)' : 'Non-Collegiate'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">
            {overview.nonCollegiateCount}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
            {language === 'bn' ? 'বিশেষ জরিমানা ও মুচলেকা সাপেক্ষে' : 'Requires fine & head clearance'}
          </p>
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              {language === 'bn' ? 'ডিস-কলেজিয়েট (<৬০%)' : 'Dis-Collegiate'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-800 dark:text-rose-200">
            {overview.disCollegiateCount}
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
            {language === 'bn' ? 'বোর্ড নিয়মে পরীক্ষায় অযোগ্য' : 'Ineligible under Board rules'}
          </p>
        </div>
      </div>

      {/* Class Comparison Chart */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>{language === 'bn' ? 'শ্রেণিভিত্তিক উপস্থিতির তুলনা' : 'Class-by-Class Attendance Rate Comparison'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {classBreakdowns.map((item) => (
            <div
              key={item.classItem.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  {item.classItem.name}
                </span>
                <span className="text-xs font-bold text-blue-600">
                  {item.averageRate}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.averageRate >= 85
                      ? 'bg-emerald-500'
                      : item.averageRate >= 75
                      ? 'bg-blue-500'
                      : item.averageRate >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, item.averageRate))}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                <span>{item.total} {language === 'bn' ? 'শিক্ষার্থী' : 'students'}</span>
                <span>{item.averageRate >= 75 ? 'Satisfactory' : 'Needs attention'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Board Exam Defaulter / Eligibility Roster */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>{language === 'bn' ? 'বোর্ড পরীক্ষা ও বার্ষিক পরীক্ষার উপস্থিতি যোগ্যতা তালিকা' : 'Board Examination Attendance Eligibility & Defaulters'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'bn'
                ? 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ডের নীতিমালা অনুযায়ী ৭৫% এর কম উপস্থিত শিক্ষার্থীদের তালিকা।'
                : 'Eligibility classifications per Secondary & Higher Secondary Education Board criteria.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportDefaultersCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'নোটিশ প্রিন্ট করুন' : 'Print Notice'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Filter */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">{language === 'bn' ? '-- সকল শ্রেণি --' : '-- All Classes --'}</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Eligibility Filter */}
          <div>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="all">{language === 'bn' ? '-- সকল স্ট্যাটাস --' : '-- All Eligibility --'}</option>
              <option value="collegiate">{language === 'bn' ? 'নিয়মিত (Collegiate >= ৭৫%)' : 'Collegiate (>=75%)'}</option>
              <option value="non_collegiate">{language === 'bn' ? 'নন-কলেজিয়েট (৬০-৭৪%)' : 'Non-Collegiate (60-74%)'}</option>
              <option value="dis_collegiate">{language === 'bn' ? 'ডিস-কলেজিয়েট (< ৬০%)' : 'Dis-Collegiate (<60%)'}</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'শিক্ষার্থী খুঁজুন...' : 'Search student...'}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3 w-16 text-center">{language === 'bn' ? 'রোল' : 'Roll'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'শিক্ষার্থী' : 'Student Name'}</th>
                <th className="px-4 py-3">{language === 'bn' ? 'শ্রেণি ও শাখা' : 'Class & Section'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'মোট ক্লাস' : 'Working Days'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'উপস্থিত দিন' : 'Present'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'উপস্থিতির হার' : 'Rate %'}</th>
                <th className="px-4 py-3 text-center">{language === 'bn' ? 'বোর্ড যোগ্যতা' : 'Board Eligibility'}</th>
                <th className="px-4 py-3 text-right">{language === 'bn' ? 'অভিভাবকের ফোন' : 'Guardian Phone'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    {language === 'bn' ? 'কোন শিক্ষার্থী পাওয়া যায়নি।' : 'No student records match this filter.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="px-4 py-2.5 text-center font-bold">
                      {String(item.student.rollNumber).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {getStudentFullName(item.student)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.student.studentId}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {classes.find((c) => c.id === item.student.classId)?.name || 'Class'} (
                      {sections.find((s) => s.id === item.student.sectionId)?.name || 'Section'})
                    </td>
                    <td className="px-4 py-2.5 text-center font-medium">
                      {item.workingDays}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600">
                      {item.attendedDays}
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-sm">
                      <span
                        className={
                          item.rate >= 75
                            ? 'text-emerald-600'
                            : item.rate >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }
                      >
                        {item.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {item.eligibility === 'collegiate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {language === 'bn' ? 'নিয়মিত (Collegiate)' : 'Collegiate (Eligible)'}
                        </span>
                      )}
                      {item.eligibility === 'non_collegiate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {language === 'bn' ? 'নন-কলেজিয়েট (সতর্কতা)' : 'Non-Collegiate (Fine)'}
                        </span>
                      )}
                      {item.eligibility === 'dis_collegiate' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {language === 'bn' ? 'ডিস-কলেজিয়েট (অযোগ্য)' : 'Dis-Collegiate (Ineligible)'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-slate-500">
                      {getStudentPhone(item.student)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
