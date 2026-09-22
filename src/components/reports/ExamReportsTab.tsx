import React, { useState } from 'react';
import { Institute, AcademicYear } from '../../types';
import {
  ExamSummaryRow,
  MeritListRow,
  SAMPLE_EXAM_SUMMARIES,
  SAMPLE_MERIT_LIST,
} from './sampleReportData';
import { exportToCsv } from '../../utils/exportUtils';
import {
  Award,
  Trophy,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Medal,
  Sparkles,
} from 'lucide-react';

interface ExamReportsTabProps {
  institute: Institute | null;
  academicYear: AcademicYear | null;
  onOpenPrint: (config: {
    title: string;
    subtitle: string;
    columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
    data: Record<string, any>[];
    summaryCards?: { label: string; value: string | number }[];
  }) => void;
}

export const ExamReportsTab: React.FC<ExamReportsTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const [subView, setSubView] = useState<'summaries' | 'merit_list'>('summaries');

  // Aggregates
  const totalAppeared = SAMPLE_EXAM_SUMMARIES.reduce((acc, r) => acc + r.totalAppeared, 0);
  const totalPassed = SAMPLE_EXAM_SUMMARIES.reduce((acc, r) => acc + r.passed, 0);
  const totalFailed = SAMPLE_EXAM_SUMMARIES.reduce((acc, r) => acc + r.failed, 0);
  const totalGpa5 = SAMPLE_EXAM_SUMMARIES.reduce((acc, r) => acc + r.gpa5Count, 0);
  const overallPassRate = totalAppeared > 0 ? ((totalPassed / totalAppeared) * 100).toFixed(1) : '0';

  const handlePrintSummary = () => {
    onOpenPrint({
      title: 'Institutional Examination Result & Grading Analytics Summary',
      subtitle: `Official performance metrics, pass percentages, and GPA distribution for Academic Year ${academicYear?.yearName || '2026'}`,
      columns: [
        { header: 'Class / Stream', key: 'className' },
        { header: 'Appeared', key: 'totalAppeared', align: 'right' },
        { header: 'Passed', key: 'passed', align: 'right' },
        { header: 'Failed', key: 'failed', align: 'right' },
        { header: 'Pass %', key: 'passRateStr', align: 'center' },
        { header: 'GPA 5.0 (A+)', key: 'gpa5Count', align: 'right' },
        { header: 'Grade A', key: 'gpa4Count', align: 'right' },
        { header: 'Grade A-', key: 'gpa35Count', align: 'right' },
        { header: 'Grade B', key: 'gpa3Count', align: 'right' },
      ],
      data: SAMPLE_EXAM_SUMMARIES.map((r) => ({
        ...r,
        passRateStr: `${r.passRate}%`,
      })),
      summaryCards: [
        { label: 'Total Appeared', value: totalAppeared },
        { label: 'Passed Students', value: totalPassed },
        { label: 'Overall Pass Rate', value: `${overallPassRate}%` },
        { label: 'GPA 5.00 (Golden A+)', value: totalGpa5 },
      ],
    });
  };

  const handlePrintMeritList = () => {
    onOpenPrint({
      title: 'Official Merit List & Top Achievers Honor Roll',
      subtitle: `Academic Distinction and Ranking based on cumulative terminal marks for Class 10 (Science)`,
      columns: [
        { header: 'Rank', key: 'rank', align: 'center' },
        { header: 'Roll', key: 'roll', align: 'center' },
        { header: 'Student ID', key: 'studentId' },
        { header: 'Student Name', key: 'name' },
        { header: 'বাংলা নাম', key: 'bengaliName' },
        { header: 'Class & Section', key: 'classSection' },
        { header: 'Total Marks', key: 'totalMarks', align: 'right' },
        { header: 'GPA', key: 'gpa', align: 'center' },
        { header: 'Grade', key: 'grade', align: 'center' },
      ],
      data: SAMPLE_MERIT_LIST.map((r) => ({
        ...r,
        classSection: `${r.className} (${r.sectionName})`,
      })),
      summaryCards: [
        { label: 'Class Examined', value: 'Class 10 Science' },
        { label: 'Highest Score', value: `${SAMPLE_MERIT_LIST[0]?.totalMarks} / 800` },
        { label: 'First Rank Holder', value: SAMPLE_MERIT_LIST[0]?.name || '' },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-750 rounded-lg">
          <button
            onClick={() => setSubView('summaries')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'summaries'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Exam Pass &amp; GPA Summary
          </button>
          <button
            onClick={() => setSubView('merit_list')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'merit_list'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Merit List &amp; Top Achievers
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (subView === 'summaries') {
                const headers = ['Exam', 'Class', 'Appeared', 'Passed', 'Failed', 'Pass %', 'GPA 5', 'Grade A', 'Grade A-', 'Grade B'];
                const rows = SAMPLE_EXAM_SUMMARIES.map((r) => [
                  r.examName,
                  r.className,
                  r.totalAppeared,
                  r.passed,
                  r.failed,
                  `${r.passRate}%`,
                  r.gpa5Count,
                  r.gpa4Count,
                  r.gpa35Count,
                  r.gpa3Count,
                ]);
                exportToCsv('exam_result_summary', headers, rows);
              } else {
                const headers = ['Rank', 'Roll', 'ID', 'Name', 'Bangla Name', 'Class', 'Total Marks', 'GPA', 'Grade'];
                const rows = SAMPLE_MERIT_LIST.map((r) => [
                  r.rank,
                  r.roll,
                  r.studentId,
                  r.name,
                  r.bengaliName,
                  `${r.className} (${r.sectionName})`,
                  r.totalMarks,
                  r.gpa,
                  r.grade,
                ]);
                exportToCsv('merit_list_honor_roll', headers, rows);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={subView === 'summaries' ? handlePrintSummary : handlePrintMeritList}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Tabulation</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overall Pass Rate</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {overallPassRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{totalPassed} passed of {totalAppeared}</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Golden A+ (GPA 5.00)</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {totalGpa5} Students
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Exceptional performance</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Unsuccessful / Failed</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {totalFailed} Students
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Special coaching queued</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Grading Standard</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            Board Standard
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">33% Passing threshold</div>
        </div>
      </div>

      {/* Main Tables */}
      {subView === 'summaries' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Comprehensive Examination Result Sheet &amp; Grade Count</span>
            </h4>
            <span className="text-xs text-slate-400">Term: Half Yearly &amp; First Term 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Exam Term</th>
                  <th className="py-3 px-4">Class &amp; Stream</th>
                  <th className="py-3 px-4 text-right">Appeared</th>
                  <th className="py-3 px-4 text-right">Passed</th>
                  <th className="py-3 px-4 text-right">Failed</th>
                  <th className="py-3 px-4 text-center">Pass %</th>
                  <th className="py-3 px-4 text-right text-amber-600">GPA 5 (A+)</th>
                  <th className="py-3 px-4 text-right text-emerald-600">Grade A</th>
                  <th className="py-3 px-4 text-right text-blue-600">Grade A-</th>
                  <th className="py-3 px-4 text-right">Grade B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {SAMPLE_EXAM_SUMMARIES.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-medium text-slate-600 dark:text-slate-400">
                      {row.examName}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.className}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                      {row.totalAppeared}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.passed}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {row.failed}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {row.passRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {row.gpa5Count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {row.gpa4Count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                      {row.gpa35Count}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {row.gpa3Count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-amber-50/30 dark:bg-amber-950/20">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>Honor Roll &amp; Top Achievers (Class 10 Science)</span>
            </h4>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Gold Medal Standards
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4 text-center">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class &amp; Section</th>
                  <th className="py-3 px-4 text-right">Total Marks</th>
                  <th className="py-3 px-4 text-center">GPA</th>
                  <th className="py-3 px-4 text-center">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {SAMPLE_MERIT_LIST.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 text-center">
                      {s.rank <= 3 ? (
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-white text-xs ${
                            s.rank === 1
                              ? 'bg-amber-500 shadow-xs'
                              : s.rank === 2
                              ? 'bg-slate-400 shadow-xs'
                              : 'bg-amber-700 shadow-xs'
                          }`}
                        >
                          {s.rank}
                        </span>
                      ) : (
                        <span className="font-bold text-slate-600 dark:text-slate-400">
                          #{s.rank}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {s.roll}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {s.rank === 1 && <Medal className="w-3.5 h-3.5 text-amber-500 inline" />}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.bengaliName}</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {s.className} ({s.sectionName})
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {s.totalMarks} / 800
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {s.gpa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {s.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
