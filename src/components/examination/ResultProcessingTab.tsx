import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ExamTerm,
  ClassItem,
  SectionItem,
  AcademicSubject,
  Student,
  MarkEntryRecord,
  StudentResultSummary,
} from '../../types';
import { putItem } from '../../db/indexedDB';
import { calculateOverallGPA } from '../../utils/gradingSystem';
import {
  Calculator,
  Award,
  Printer,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  UserCheck,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';

interface ResultProcessingTabProps {
  terms: ExamTerm[];
  classes: ClassItem[];
  sections: SectionItem[];
  subjects: AcademicSubject[];
  students: Student[];
  marks: MarkEntryRecord[];
  results: StudentResultSummary[];
  selectedTermId: string;
  onSelectTermId: (id: string) => void;
  onRefresh: () => void;
}

export const ResultProcessingTab: React.FC<ResultProcessingTabProps> = ({
  terms,
  classes,
  sections,
  subjects,
  students,
  marks,
  results,
  selectedTermId,
  onSelectTermId,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, language } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<string | null>(null);

  // Selected student for Report Card Modal
  const [activeReportStudent, setActiveReportStudent] = useState<Student | null>(null);

  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms[0];
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Filter existing processed results
  const filteredResults = results
    .filter((r) => {
      if (r.examTermId !== activeTerm?.id) return false;
      if (r.classId !== selectedClassId) return false;
      if (selectedSectionId !== 'all' && r.sectionId !== selectedSectionId) return false;
      if (
        searchTerm &&
        !r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !String(r.rollNumber).includes(searchTerm)
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.meritRankClass - b.meritRankClass);

  // Calculate High-level batch metrics
  const totalCount = filteredResults.length;
  const passedCount = filteredResults.filter((r) => r.isPassedAll).length;
  const failedCount = totalCount - passedCount;
  const aPlusCount = filteredResults.filter((r) => r.gpaWith4th === 5.0).length;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : '0';

  /**
   * Run Comprehensive Result Engine:
   * 1. Aggregate all subject marks for each student in the selected class
   * 2. Calculate Board-standard GPA with 4th subject addition
   * 3. Sort students by GPA (descending) & total marks (tie-breaker) to assign class and section merit ranks
   * 4. Save results to IndexedDB
   */
  const handleProcessResults = async () => {
    if (!activeInstitute || !activeTerm || !currentClass) return;

    setIsProcessing(true);
    setProcessMessage(null);

    try {
      const classStudents = students.filter((s) => s.classId === currentClass.id);

      const computedSummaries: StudentResultSummary[] = [];

      for (const st of classStudents) {
        const studentMarks = marks.filter(
          (m) =>
            m.examTermId === activeTerm.id &&
            m.studentId === st.id &&
            m.classId === currentClass.id
        );

        if (studentMarks.length === 0) continue;

        const totalMarksObtained = studentMarks.reduce((sum, m) => sum + m.totalMarks, 0);
        const maxPossibleMarks = studentMarks.length * 100;
        const percentage =
          maxPossibleMarks > 0
            ? Number(((totalMarksObtained / maxPossibleMarks) * 100).toFixed(1))
            : 0;

        const gpaEval = calculateOverallGPA(
          studentMarks.map((m) => ({
            grade: m.grade,
            point: m.point,
            isOptional4th: m.isOptionalSubject,
          }))
        );

        computedSummaries.push({
          id: `res-${st.id}-${activeTerm.id}`,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id || '',
          examTermId: activeTerm.id,
          classId: currentClass.id,
          className: currentClass.name,
          sectionId: st.sectionId || 'sec-01',
          sectionName: 'A',
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          rollNumber: st.rollNumber,
          totalMarksObtained,
          maxPossibleMarks,
          percentage,
          gpaWithout4th: gpaEval.gpaWithout4th,
          gpaWith4th: gpaEval.gpaWith4th,
          finalGrade: gpaEval.finalGrade,
          meritRankClass: 0,
          meritRankSection: 0,
          isPassedAll: gpaEval.isPassed,
          failedSubjectCount: gpaEval.failedCount,
          passedSubjectCount: studentMarks.length - gpaEval.failedCount,
          generatedAt: new Date().toISOString(),
        });
      }

      // 1. Sort by GPA with 4th, then total marks obtained
      computedSummaries.sort((a, b) => {
        // Passed students always rank before failed students
        if (a.isPassedAll && !b.isPassedAll) return -1;
        if (!a.isPassedAll && b.isPassedAll) return 1;

        if (b.gpaWith4th !== a.gpaWith4th) {
          return b.gpaWith4th - a.gpaWith4th;
        }
        return b.totalMarksObtained - a.totalMarksObtained;
      });

      // 2. Assign Class Merit Ranks
      computedSummaries.forEach((res, index) => {
        res.meritRankClass = index + 1;
      });

      // 3. Assign Section Merit Ranks
      const sectionGroups: Record<string, StudentResultSummary[]> = {};
      computedSummaries.forEach((r) => {
        if (!sectionGroups[r.sectionId]) sectionGroups[r.sectionId] = [];
        sectionGroups[r.sectionId].push(r);
      });

      Object.values(sectionGroups).forEach((secList) => {
        secList.forEach((r, idx) => {
          r.meritRankSection = idx + 1;
        });
      });

      // Save to IndexedDB
      await Promise.all(computedSummaries.map((res) => putItem('results', res)));

      await logAudit(
        'process_results',
        'examination',
        `Processed and generated tabulations for ${currentClass.name} (${activeTerm.name}): ${computedSummaries.length} candidates evaluated`
      );

      setProcessMessage(
        `Result calculation completed successfully for ${computedSummaries.length} students! Merit ranks published.`
      );
      setTimeout(() => setProcessMessage(null), 4000);
      onRefresh();
    } catch (err) {
      console.error('Error processing results:', err);
      alert('Failed to process results. Please check database connectivity.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredResults.length === 0) return;

    const headers = [
      'Merit Position',
      'Roll',
      'Student Name',
      'Class',
      'GPA (with 4th)',
      'Letter Grade',
      'Total Marks',
      'Percentage (%)',
      'Result Status',
    ];

    const rows = filteredResults.map((r) => [
      r.meritRankClass,
      r.rollNumber,
      `"${r.studentName}"`,
      r.className,
      r.gpaWith4th.toFixed(2),
      r.finalGrade,
      r.totalMarksObtained,
      r.percentage,
      r.isPassedAll ? 'Passed' : `Failed (${r.failedSubjectCount})`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Tabulation_Sheet_${currentClass?.name || 'Class'}_${activeTerm?.name || 'Exam'}.csv`
    );
    link.click();
  };

  // Get marks list for the active report student modal
  const studentMarksForReport = activeReportStudent
    ? marks.filter(
        (m) =>
          m.examTermId === activeTerm?.id &&
          m.studentId === activeReportStudent.id &&
          m.classId === selectedClassId
      )
    : [];

  const studentResultForReport = activeReportStudent
    ? results.find(
        (r) => r.examTermId === activeTerm?.id && r.studentId === activeReportStudent.id
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Configuration & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Term */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Exam Term
            </label>
            <select
              value={activeTerm?.id || ''}
              onChange={(e) => onSelectTermId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Sections</option>
              {sections
                .filter((s) => s.classId === selectedClassId)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={filteredResults.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Tabulation</span>
          </button>

          <button
            onClick={handleProcessResults}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing Engine...' : 'Process & Generate Ranks'}</span>
          </button>
        </div>
      </div>

      {processMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{processMessage}</span>
        </div>
      )}

      {/* Cohort Performance KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Candidates
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Class {currentClass?.name}</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Pass Rate (%)
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {passRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {passedCount} Passed, {failedCount} Failed
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            GPA 5.00 (A+)
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {aPlusCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Outstanding Achievers</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Merit Rank 1 Top Score
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {filteredResults[0]?.totalMarksObtained || 0}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            {filteredResults[0]?.studentName || 'Not calculated yet'}
          </div>
        </div>
      </div>

      {/* Tabulation Sheet Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span>Official Tabulation &amp; Merit Register</span>
              <Award className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-xs text-slate-400">
              {currentClass?.name} • {activeTerm?.name} • Session {activeAcademicYear?.yearName || '2026'}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calculator className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No results processed for {currentClass?.name}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Make sure subject marks are entered in the "Marks Entry" tab, then click "Process &amp; Generate Ranks" to calculate GPA and merit positions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-3 py-3 text-center w-16">Merit</th>
                  <th className="px-3 py-3 text-center w-14">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-3 py-3 text-center">Total Marks</th>
                  <th className="px-3 py-3 text-center">Percentage</th>
                  <th className="px-3 py-3 text-center">GPA (No 4th)</th>
                  <th className="px-3 py-3 text-center">GPA (with 4th)</th>
                  <th className="px-3 py-3 text-center">Grade</th>
                  <th className="px-3 py-3 text-center">Result Status</th>
                  <th className="px-4 py-3 text-right">Progress Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredResults.map((res) => {
                  const studentObj = students.find((s) => s.id === res.studentId);
                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      {/* Merit Position */}
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs ${
                            res.meritRankClass === 1
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400'
                              : res.meritRankClass === 2
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                              : res.meritRankClass === 3
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'text-slate-600 dark:text-slate-400 font-mono'
                          }`}
                        >
                          {res.meritRankClass}
                        </span>
                      </td>

                      {/* Roll */}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {String(res.rollNumber).padStart(2, '0')}
                      </td>

                      {/* Student Name */}
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {res.studentName}
                          {studentObj?.bengaliName && (
                            <span className="text-slate-400 text-xs font-normal ml-1">
                              ({studentObj.bengaliName})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {studentObj?.studentId || '-'}
                        </div>
                      </td>

                      {/* Total Marks */}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {res.totalMarksObtained}{' '}
                        <span className="text-slate-400 font-normal text-[10px]">
                          / {res.maxPossibleMarks}
                        </span>
                      </td>

                      {/* Percentage */}
                      <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-300">
                        {res.percentage}%
                      </td>

                      {/* GPA without 4th */}
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                        {res.gpaWithout4th.toFixed(2)}
                      </td>

                      {/* GPA with 4th */}
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {res.gpaWith4th.toFixed(2)}
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            res.finalGrade === 'A+'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : res.finalGrade === 'F'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {res.finalGrade}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 text-center">
                        {res.isPassedAll ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Passed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            Failed ({res.failedSubjectCount})
                          </span>
                        )}
                      </td>

                      {/* Action: View Report Card */}
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => setActiveReportStudent(studentObj || null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Report Card</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Report Card Modal (Official Transcript View) */}
      {activeReportStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 dark:border-slate-700 my-8 text-slate-900 dark:text-white print:p-0 print:border-none print:shadow-none">
            {/* Action Bar (hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Official Academic Transcript Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report Card</span>
                </button>
                <button
                  onClick={() => setActiveReportStudent(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Institute Header */}
            <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900 dark:border-slate-100">
              <h2 className="text-xl font-bold tracking-tight uppercase">
                {activeInstitute?.name}
              </h2>
              {activeInstitute?.bengaliName && (
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {activeInstitute.bengaliName}
                </p>
              )}
              <p className="text-xs text-slate-500">
                EIIN: {activeInstitute?.eiin || '123456'} • {activeInstitute?.address}
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold tracking-wider uppercase">
                  ACADEMIC TRANSCRIPT &amp; PROGRESS REPORT
                </span>
              </div>
              <p className="text-xs font-semibold pt-1 text-slate-700 dark:text-slate-300">
                {activeTerm?.name} • Session {activeAcademicYear?.yearName || '2026'}
              </p>
            </div>

            {/* Student Metadata Card */}
            <div className="grid grid-cols-2 gap-4 my-6 text-xs p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-400">Student / শিক্ষার্থী:</span>{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {activeReportStudent.firstName} {activeReportStudent.lastName}
                    {activeReportStudent.bengaliName && ` (${activeReportStudent.bengaliName})`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Father / পিতা:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeReportStudent.guardian?.fatherName || (activeReportStudent as any).fatherName || 'N/A'}
                    {(activeReportStudent.guardian?.fatherNameBn || (activeReportStudent as any).fatherNameBn) &&
                      ` (${activeReportStudent.guardian?.fatherNameBn || (activeReportStudent as any).fatherNameBn})`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Mother / মাতা:</span>{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeReportStudent.guardian?.motherName || (activeReportStudent as any).motherName || 'N/A'}
                    {(activeReportStudent.guardian?.motherNameBn || (activeReportStudent as any).motherNameBn) &&
                      ` (${activeReportStudent.guardian?.motherNameBn || (activeReportStudent as any).motherNameBn})`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Student ID:</span>{' '}
                  <strong className="font-mono">{activeReportStudent.studentId}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Class &amp; Section:</span>{' '}
                  <strong>{currentClass?.name} (Section A)</strong>
                </div>
              </div>
              <div className="space-y-1 text-right sm:text-left">
                <div>
                  <span className="text-slate-400">Class Roll:</span>{' '}
                  <strong className="font-mono">{activeReportStudent.rollNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Merit Position:</span>{' '}
                  <strong className="text-blue-600 dark:text-blue-400">
                    {studentResultForReport?.meritRankClass || '-'}th in Class
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Result Status:</span>{' '}
                  <strong
                    className={
                      studentResultForReport?.isPassedAll ? 'text-emerald-600' : 'text-red-600'
                    }
                  >
                    {studentResultForReport?.isPassedAll ? 'PASSED' : 'FAILED'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-700">
                      Subject Name &amp; Code
                    </th>
                    <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700">
                      CQ
                    </th>
                    <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700">
                      MCQ
                    </th>
                    <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700">
                      Prac
                    </th>
                    <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700">
                      Total
                    </th>
                    <th className="p-2 text-center border-r border-slate-200 dark:border-slate-700">
                      Grade
                    </th>
                    <th className="p-2 text-center">Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                  {studentMarksForReport.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 border-r border-slate-200 dark:border-slate-700">
                        {m.subjectName}{' '}
                        {m.isOptionalSubject && (
                          <span className="text-[10px] text-blue-600 font-bold">
                            (4th Subject)
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          ({m.subjectCode})
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                        {m.cqMarks}
                      </td>
                      <td className="p-2 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                        {m.mcqMarks}
                      </td>
                      <td className="p-2 text-center font-mono border-r border-slate-200 dark:border-slate-700">
                        {m.practicalMarks || '-'}
                      </td>
                      <td className="p-2 text-center font-mono font-bold border-r border-slate-200 dark:border-slate-700">
                        {m.totalMarks}
                      </td>
                      <td className="p-2 text-center font-bold border-r border-slate-200 dark:border-slate-700">
                        <span
                          className={m.grade === 'F' ? 'text-red-600 font-bold' : 'text-slate-800 dark:text-slate-200'}
                        >
                          {m.grade}
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono font-bold">{m.point.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GPA Summary Strip */}
            <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-slate-500">Total Marks:</span>{' '}
                <strong className="text-base font-bold font-mono">
                  {studentResultForReport?.totalMarksObtained}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">GPA (without 4th):</span>{' '}
                <strong className="text-base font-mono">
                  {studentResultForReport?.gpaWithout4th.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Final GPA (with 4th):</span>{' '}
                <strong className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {studentResultForReport?.gpaWith4th.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Letter Grade:</span>{' '}
                <span className="px-2.5 py-0.5 rounded text-sm font-bold bg-blue-600 text-white">
                  {studentResultForReport?.finalGrade}
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700 dark:text-slate-300">
                  Class Teacher
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700 dark:text-slate-300">
                  Exam Controller
                </div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700 dark:text-slate-300">
                  Headmaster / Principal
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
