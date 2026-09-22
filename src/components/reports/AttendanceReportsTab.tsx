import React, { useState } from 'react';
import { Institute, AcademicYear } from '../../types';
import {
  AttendanceSummaryRow,
  LowAttendanceAlertRow,
  SAMPLE_ATTENDANCE_SUMMARY,
  SAMPLE_LOW_ATTENDANCE,
} from './sampleReportData';
import { exportToCsv } from '../../utils/exportUtils';
import {
  ClipboardCheck,
  AlertTriangle,
  Printer,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneCall,
} from 'lucide-react';

interface AttendanceReportsTabProps {
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

export const AttendanceReportsTab: React.FC<AttendanceReportsTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const [activeSubView, setActiveSubView] = useState<'daily' | 'low_attendance' | 'staff'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Daily Totals
  const totalEnrolled = SAMPLE_ATTENDANCE_SUMMARY.reduce((acc, r) => acc + r.totalEnrolled, 0);
  const totalPresent = SAMPLE_ATTENDANCE_SUMMARY.reduce((acc, r) => acc + r.present, 0);
  const totalAbsent = SAMPLE_ATTENDANCE_SUMMARY.reduce((acc, r) => acc + r.absent, 0);
  const totalLate = SAMPLE_ATTENDANCE_SUMMARY.reduce((acc, r) => acc + r.late, 0);
  const overallRate = totalEnrolled > 0 ? ((totalPresent / totalEnrolled) * 100).toFixed(1) : '0';

  const handlePrintDaily = () => {
    onOpenPrint({
      title: 'Daily Student Attendance & Absentees Summary Register',
      subtitle: `Class-wise daily roll attendance verification for Date: ${selectedDate}`,
      columns: [
        { header: 'Class', key: 'className' },
        { header: 'Section / Group', key: 'sectionName' },
        { header: 'Enrolled', key: 'totalEnrolled', align: 'right' },
        { header: 'Present', key: 'present', align: 'right' },
        { header: 'Absent', key: 'absent', align: 'right' },
        { header: 'Late', key: 'late', align: 'right' },
        { header: 'Attendance %', key: 'attendanceRateStr', align: 'center' },
      ],
      data: SAMPLE_ATTENDANCE_SUMMARY.map((r) => ({
        ...r,
        attendanceRateStr: `${r.attendanceRate}%`,
      })),
      summaryCards: [
        { label: 'Date', value: selectedDate },
        { label: 'Total Enrolled', value: totalEnrolled },
        { label: 'Present Today', value: totalPresent },
        { label: 'Overall Rate', value: `${overallRate}%` },
      ],
    });
  };

  const handlePrintLowAttendance = () => {
    onOpenPrint({
      title: 'Chronic Absenteeism & Low Attendance (<75%) Alert Report',
      subtitle: `List of students failing the 75% mandatory class attendance criterion for Board Exam eligibility`,
      columns: [
        { header: 'Adm No', key: 'admissionNo' },
        { header: 'Student Name', key: 'name' },
        { header: 'Class', key: 'className' },
        { header: 'Section', key: 'sectionName' },
        { header: 'Roll', key: 'roll', align: 'center' },
        { header: 'Working Days', key: 'workingDays', align: 'right' },
        { header: 'Attended Days', key: 'attendedDays', align: 'right' },
        { header: 'Attendance %', key: 'percentageStr', align: 'center' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Guardian Phone', key: 'guardianPhone' },
      ],
      data: SAMPLE_LOW_ATTENDANCE.map((r) => ({
        ...r,
        percentageStr: `${r.percentage}%`,
      })),
      summaryCards: [
        { label: 'Defaulters Count', value: SAMPLE_LOW_ATTENDANCE.length },
        { label: 'Mandatory Threshold', value: '75%' },
        { label: 'Notice Status', value: 'Guardian Alert' },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-750 rounded-lg">
          <button
            onClick={() => setActiveSubView('daily')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubView === 'daily'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Attendance Summary
          </button>
          <button
            onClick={() => setActiveSubView('low_attendance')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubView === 'low_attendance'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Low Attendance Alert (&lt;75%)
          </button>
          <button
            onClick={() => setActiveSubView('staff')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              activeSubView === 'staff'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Faculty &amp; Staff Attendance
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (activeSubView === 'daily') {
                const headers = ['Class', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Rate %'];
                const rows = SAMPLE_ATTENDANCE_SUMMARY.map((r) => [
                  r.className,
                  r.sectionName,
                  r.totalEnrolled,
                  r.present,
                  r.absent,
                  r.late,
                  `${r.attendanceRate}%`,
                ]);
                exportToCsv('daily_attendance_summary', headers, rows);
              } else {
                const headers = ['Adm No', 'Name', 'Class', 'Section', 'Roll', 'Working Days', 'Attended', '%', 'Status', 'Guardian Phone'];
                const rows = SAMPLE_LOW_ATTENDANCE.map((r) => [
                  r.admissionNo,
                  r.name,
                  r.className,
                  r.sectionName,
                  r.roll,
                  r.workingDays,
                  r.attendedDays,
                  `${r.percentage}%`,
                  r.status,
                  r.guardianPhone,
                ]);
                exportToCsv('low_attendance_alert_report', headers, rows);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={activeSubView === 'daily' ? handlePrintDaily : handlePrintLowAttendance}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Register</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overall Attendance Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {overallRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">High participation day</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Present Today</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalPresent}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Out of {totalEnrolled} total</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Absent Count</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {totalAbsent}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">SMS alerts dispatched</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {totalLate}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Under 15 mins delay</div>
        </div>
      </div>

      {/* Daily View Table */}
      {activeSubView === 'daily' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Class-wise Daily Attendance Sheet</span>
            </h4>
            <span className="text-xs text-slate-400">Date: {selectedDate}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section / Stream</th>
                  <th className="py-3 px-4 text-right">Total Enrolled</th>
                  <th className="py-3 px-4 text-right">Present</th>
                  <th className="py-3 px-4 text-right">Absent</th>
                  <th className="py-3 px-4 text-right">Late</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {SAMPLE_ATTENDANCE_SUMMARY.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {row.className}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {row.sectionName}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                      {row.totalEnrolled}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {row.present}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {row.absent}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                      {row.late}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      <span
                        className={
                          row.attendanceRate >= 95
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.attendanceRate >= 90
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {row.attendanceRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        Synchronized
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    Total Institutional Roll Count
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {totalEnrolled}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {totalPresent}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                    {totalAbsent}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                    {totalLate}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-600 font-black">
                    {overallRate}%
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-500 font-normal">
                    Daily Closed
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Low Attendance Alert Table */}
      {activeSubView === 'low_attendance' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs space-y-4">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold text-sm">
                Students Below Statutory 75% Attendance (Board Exam Ineligibility Alert)
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Ministry of Education Rule: Min 75% Regular or 60% Non-collegiate
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class &amp; Section</th>
                  <th className="py-3 px-4 text-center">Roll</th>
                  <th className="py-3 px-4 text-right">Working Days</th>
                  <th className="py-3 px-4 text-right">Attended</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                  <th className="py-3 px-4 text-center">Severity</th>
                  <th className="py-3 px-4">Guardian Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {SAMPLE_LOW_ATTENDANCE.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.admissionNo}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {s.className} ({s.sectionName})
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {s.roll}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                      {s.workingDays}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {s.attendedDays}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                      {s.percentage}%
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status.includes('Critical')
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{s.guardianPhone}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff View */}
      {activeSubView === 'staff' && (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
          <Clock className="w-8 h-8 text-blue-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Teacher &amp; Staff Biometric Punch Integration
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            32 teachers registered with biometric fingerprint and RFID attendance. 30 on duty, 1 casual leave, 1 official duty.
          </p>
        </div>
      )}
    </div>
  );
};
