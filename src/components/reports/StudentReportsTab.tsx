import React, { useState } from 'react';
import { Institute, AcademicYear } from '../../types';
import {
  StudentStrengthRow,
  StudentAdmissionRow,
  SAMPLE_STUDENT_STRENGTH,
  SAMPLE_STUDENT_ADMISSIONS,
} from './sampleReportData';
import { exportToCsv } from '../../utils/exportUtils';
import {
  Users,
  Printer,
  Download,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  PieChart,
  UserCheck,
} from 'lucide-react';

interface StudentReportsTabProps {
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

export const StudentReportsTab: React.FC<StudentReportsTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const [subReport, setSubReport] = useState<'strength' | 'admissions' | 'quota'>('strength');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');

  // Calculations for Strength
  const totalBoys = SAMPLE_STUDENT_STRENGTH.reduce((acc, r) => acc + r.boys, 0);
  const totalGirls = SAMPLE_STUDENT_STRENGTH.reduce((acc, r) => acc + r.girls, 0);
  const totalEnrolled = totalBoys + totalGirls;
  const femaleRatio = totalEnrolled > 0 ? ((totalGirls / totalEnrolled) * 100).toFixed(1) : '0';

  // Filtered Admissions
  const filteredAdmissions = SAMPLE_STUDENT_ADMISSIONS.filter((s) => {
    const matchQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bengaliName.includes(searchQuery) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toString() === searchQuery;
    const matchClass = selectedClass === 'all' || s.className.includes(selectedClass);
    const matchGender = selectedGender === 'all' || s.gender === selectedGender;
    return matchQuery && matchClass && matchGender;
  });

  // Print Handlers
  const handlePrintStrength = () => {
    onOpenPrint({
      title: 'Class-wise Student Enrollment & Demographic Strength Report',
      subtitle: `Official census breakdown by class, section, gender, and religion for Academic Session ${academicYear?.yearName || '2026'}`,
      columns: [
        { header: 'Class', key: 'className' },
        { header: 'Section', key: 'sectionName' },
        { header: 'Boys', key: 'boys', align: 'right' },
        { header: 'Girls', key: 'girls', align: 'right' },
        { header: 'Total Students', key: 'total', align: 'right' },
        { header: 'Muslim', key: 'muslim', align: 'right' },
        { header: 'Hindu', key: 'hindu', align: 'right' },
        { header: 'Others', key: 'otherRel', align: 'right' },
      ],
      data: SAMPLE_STUDENT_STRENGTH.map((r) => ({
        ...r,
        otherRel: r.christian + r.buddhist,
      })),
      summaryCards: [
        { label: 'Total Enrolled', value: totalEnrolled },
        { label: 'Total Boys', value: totalBoys },
        { label: 'Total Girls', value: totalGirls },
        { label: 'Female Ratio', value: `${femaleRatio}%` },
      ],
    });
  };

  const handlePrintAdmissions = () => {
    onOpenPrint({
      title: 'Student Admission Register & Guardian Directory',
      subtitle: `Verified student records, admission details, blood groups, and guardian emergency contacts`,
      columns: [
        { header: 'Adm No', key: 'admissionNo' },
        { header: 'Student Name', key: 'name' },
        { header: 'বাংলা নাম', key: 'bengaliName' },
        { header: 'Class', key: 'className' },
        { header: 'Section', key: 'sectionName' },
        { header: 'Roll', key: 'roll', align: 'center' },
        { header: 'Gender', key: 'gender', align: 'center' },
        { header: 'Blood Group', key: 'bloodGroup', align: 'center' },
        { header: 'Guardian Name', key: 'guardianName' },
        { header: 'Emergency Mobile', key: 'guardianPhone' },
        { header: 'Adm Date', key: 'admissionDate', align: 'center' },
      ],
      data: filteredAdmissions,
      summaryCards: [
        { label: 'Filtered Students', value: filteredAdmissions.length },
        { label: 'Classes Filter', value: selectedClass === 'all' ? 'All Classes' : selectedClass },
        { label: 'Gender Filter', value: selectedGender === 'all' ? 'Co-ed' : selectedGender },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub-report selector & Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-750 rounded-lg">
          <button
            onClick={() => setSubReport('strength')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subReport === 'strength'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Class-wise Strength &amp; Gender
          </button>
          <button
            onClick={() => setSubReport('admissions')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subReport === 'admissions'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Admission &amp; Bio-data Directory
          </button>
          <button
            onClick={() => setSubReport('quota')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subReport === 'quota'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quota &amp; Demographics
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (subReport === 'strength') {
                const headers = ['Class', 'Section', 'Boys', 'Girls', 'Total', 'Muslim', 'Hindu', 'Others'];
                const rows = SAMPLE_STUDENT_STRENGTH.map((r) => [
                  r.className,
                  r.sectionName,
                  r.boys,
                  r.girls,
                  r.total,
                  r.muslim,
                  r.hindu,
                  r.christian + r.buddhist,
                ]);
                exportToCsv('student_strength_report', headers, rows);
              } else {
                const headers = ['Admission No', 'Name', 'Bangla Name', 'Class', 'Section', 'Roll', 'Gender', 'Blood Group', 'Guardian', 'Phone', 'Admission Date', 'Quota'];
                const rows = filteredAdmissions.map((s) => [
                  s.admissionNo,
                  s.name,
                  s.bengaliName,
                  s.className,
                  s.sectionName,
                  s.roll,
                  s.gender,
                  s.bloodGroup,
                  s.guardianName,
                  s.guardianPhone,
                  s.admissionDate,
                  s.quota,
                ]);
                exportToCsv('student_admission_directory', headers, rows);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={subReport === 'strength' ? handlePrintStrength : handlePrintAdmissions}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalEnrolled.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all active sections</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Male Students</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {totalBoys}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {(((totalBoys / totalEnrolled) * 100) || 0).toFixed(1)}% of total
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Female Students</span>
            <span className="w-2 h-2 rounded-full bg-pink-500" />
          </div>
          <div className="text-xl font-bold text-pink-600 dark:text-pink-400 mt-1">
            {totalGirls}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{femaleRatio}% female ratio</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sections &amp; Groups</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {SAMPLE_STUDENT_STRENGTH.length} Units
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dual-shift capacity</div>
        </div>
      </div>

      {/* Main Content Area */}
      {subReport === 'strength' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Class-wise Student Strength &amp; Religion Breakdown</span>
            </h4>
            <span className="text-xs text-slate-400 font-medium">
              Academic Year: {academicYear?.yearName || '2026'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section / Group</th>
                  <th className="py-3 px-4 text-right">Boys</th>
                  <th className="py-3 px-4 text-right">Girls</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Muslim</th>
                  <th className="py-3 px-4 text-right">Hindu</th>
                  <th className="py-3 px-4 text-right">Others</th>
                  <th className="py-3 px-4 text-center">Gender Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {SAMPLE_STUDENT_STRENGTH.map((row, idx) => {
                  const girlPercent = ((row.girls / row.total) * 100).toFixed(0);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {row.className}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {row.sectionName}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                        {row.boys}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
                        {row.girls}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {row.muslim}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {row.hindu}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {row.christian + row.buddhist}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-blue-200 dark:bg-blue-900 overflow-hidden flex">
                            <div
                              className="bg-pink-500 h-full"
                              style={{ width: `${girlPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {girlPercent}% F
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="py-3 px-4" colSpan={2}>
                    Total Institutional Aggregate
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                    {totalBoys}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-pink-600 dark:text-pink-400">
                    {totalGirls}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-white">
                    {totalEnrolled}
                  </td>
                  <td
                    className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300"
                    colSpan={3}
                  >
                    100% Verified
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-600">
                    {femaleRatio}% Female
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {subReport === 'admissions' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs space-y-4">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, roll, admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="all">All Classes</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11 (College)</option>
                <option value="Class 12">Class 12 (College)</option>
              </select>

              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filteredAdmissions.length}</span> students
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
                  <th className="py-3 px-4 text-center">Blood</th>
                  <th className="py-3 px-4">Guardian Name</th>
                  <th className="py-3 px-4">Emergency Mobile</th>
                  <th className="py-3 px-4 text-center">Quota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {filteredAdmissions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.admissionNo}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.bengaliName}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{s.className}</span>
                      <span className="text-slate-400 ml-1">({s.sectionName})</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {s.roll}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-red-500 font-bold">
                      {s.bloodGroup}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {s.guardianName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {s.guardianPhone}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {s.quota}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subReport === 'quota' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Special Quota Distribution</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">General Merit Quota</span>
                <span className="font-bold text-slate-900 dark:text-white">92%</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Freedom Fighter (মুক্তিযোদ্ধা কোটা)</span>
                <span className="font-bold text-slate-900 dark:text-white">5%</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Special Needs (প্রতিবন্ধী কোটা)</span>
                <span className="font-bold text-slate-900 dark:text-white">1.5%</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-slate-600 dark:text-slate-400">Tribal / Ethnic (ক্ষুদ্র নৃগোষ্ঠী)</span>
                <span className="font-bold text-slate-900 dark:text-white">1.5%</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Blood Group Availability Index</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { group: 'A+', count: '28%' },
                { group: 'B+', count: '34%' },
                { group: 'O+', count: '26%' },
                { group: 'AB+', count: '8%' },
                { group: 'A-', count: '1.5%' },
                { group: 'O-', count: '1.2%' },
                { group: 'B-', count: '0.8%' },
                { group: 'AB-', count: '0.5%' },
              ].map((bg, i) => (
                <div key={i} className="p-2 rounded bg-slate-50 dark:bg-slate-750 text-center">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400">{bg.group}</span>
                  <span className="text-[11px] text-slate-500 ml-2 font-mono">{bg.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <span>Institutional Level Split</span>
            </h4>
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>School Section (Class 6-10)</span>
                  <span className="font-bold">580 Students</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>College Section (Class 11-12)</span>
                  <span className="font-bold">386 Students</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
