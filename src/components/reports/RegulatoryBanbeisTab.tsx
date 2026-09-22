import React from 'react';
import { Institute, AcademicYear } from '../../types';
import { getSampleBanbeisData } from './sampleReportData';
import { exportToCsv } from '../../utils/exportUtils';
import {
  Landmark,
  Building,
  Users,
  GraduationCap,
  Computer,
  BookOpen,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface RegulatoryBanbeisTabProps {
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

export const RegulatoryBanbeisTab: React.FC<RegulatoryBanbeisTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const c = getSampleBanbeisData(
    institute?.eiin || '108452',
    institute?.type || 'both'
  );

  const handlePrintBanbeis = () => {
    onOpenPrint({
      title: 'BANBEIS Annual Educational Census & Statistical Return (ব্যানবেইস তথ্য ফরম)',
      subtitle: `Official statistical submission to Bangladesh Bureau of Educational Information and Statistics (BANBEIS), Ministry of Education`,
      columns: [
        { header: 'Metric Category', key: 'category' },
        { header: 'Indicator / Survey Field', key: 'indicator' },
        { header: 'Recorded Value', key: 'value', align: 'center' },
        { header: 'Validation Standard', key: 'standard' },
      ],
      data: [
        { category: 'Institute Profile', indicator: 'EIIN (শিক্ষা প্রতিষ্ঠান কোড)', value: institute?.eiin || c.eiin, standard: 'Verified National Database' },
        { category: 'Institute Profile', indicator: 'Institute Category', value: c.instituteType, standard: 'MOEDU Approved' },
        { category: 'Institute Profile', indicator: 'MPO Enlistment Status', value: c.management, standard: 'Ministry Recognized' },
        { category: 'Institute Profile', indicator: 'Education Board', value: institute?.educationBoard || 'Dhaka', standard: 'BISE Affiliated' },
        { category: 'Student Enrollment', indicator: 'Total Student Enrollment', value: c.totalStudents, standard: 'Active Enrolled' },
        { category: 'Student Enrollment', indicator: 'Female Students Count', value: `${c.femaleStudents} (${c.femaleStudentPercentage}%)`, standard: 'Gender Parity > 50%' },
        { category: 'Faculty & Staff', indicator: 'Total Teaching Faculty', value: c.totalTeachers, standard: 'Sanctioned Posts' },
        { category: 'Faculty & Staff', indicator: 'MPO Listed Teachers', value: c.mpoTeachers, standard: 'Government Subsidized' },
        { category: 'Faculty & Staff', indicator: 'Teacher-Student Ratio', value: c.teacherStudentRatio, standard: 'National Benchmark 1:30' },
        { category: 'Digital Infrastructure', indicator: 'Sheikh Russel Digital Lab', value: 'Active & Operational (25 Computers)', standard: 'ICT Division Bangladesh' },
        { category: 'Digital Infrastructure', indicator: 'Multimedia Classrooms', value: c.multimediaClassrooms, standard: 'Projector & Smart Board' },
        { category: 'Library & Labs', indicator: 'Library Catalog Holdings', value: `${c.libraryBookCount} Books`, standard: 'Curriculum & Reference' },
        { category: 'Library & Labs', indicator: 'Dedicated Science Labs', value: c.scienceLabCount, standard: 'Physics, Chemistry, Biology' },
      ],
      summaryCards: [
        { label: 'EIIN Number', value: institute?.eiin || c.eiin },
        { label: 'Total Enrolled', value: c.totalStudents },
        { label: 'Total Teachers', value: c.totalTeachers },
        { label: 'Female Ratio', value: `${c.femaleStudentPercentage}%` },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              BANBEIS Annual Census &amp; Statistical Survey (ব্যানবেইস তথ্য)
            </h3>
            <p className="text-[11px] text-slate-500">
              Compliant with Ministry of Education &amp; Directorate of Secondary and Higher Education (DSHE)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['Category', 'Indicator', 'Recorded Value'];
              const rows = [
                ['General', 'EIIN', institute?.eiin || c.eiin],
                ['General', 'Institute Name', institute?.name || ''],
                ['General', 'MPO Status', c.management],
                ['Students', 'Total Students', c.totalStudents],
                ['Students', 'Total Girls', c.femaleStudents],
                ['Teachers', 'Total Teachers', c.totalTeachers],
                ['Teachers', 'MPO Teachers', c.mpoTeachers],
                ['Teachers', 'Ratio', c.teacherStudentRatio],
                ['ICT', 'Multimedia Classrooms', c.multimediaClassrooms],
                ['ICT', 'Computer Labs', c.computerLabCount],
                ['Library', 'Total Books', c.libraryBookCount],
              ];
              exportToCsv('banbeis_census_return', headers, rows);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintBanbeis}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official BANBEIS Form</span>
          </button>
        </div>
      </div>

      {/* Grid of BANBEIS Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Section 1: Institution & MPO */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
            <Building className="w-4 h-4" />
            <span>১. সাধারণ পরিচিতি ও এমপিও তথ্য</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">ইআইআইএন (EIIN):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {institute?.eiin || c.eiin}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">প্রতিষ্ঠানের ধরন:</span>
              <span className="font-bold text-slate-900 dark:text-white capitalize">
                {c.instituteType}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">এমপিও ভুক্তি:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {c.management}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">শিক্ষা বোর্ড:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {institute?.educationBoard || 'Dhaka Board'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">প্রতিষ্ঠার সন:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                1998
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Student Enrollment & Diversity */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
            <Users className="w-4 h-4" />
            <span>২. শিক্ষার্থী পরিসংখ্যান ও অনুপাত</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">মোট শিক্ষার্থী সংখ্যা:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {c.totalStudents} জন
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">ছাত্রী সংখ্যা:</span>
              <span className="font-mono font-bold text-pink-600 dark:text-pink-400">
                {c.femaleStudents} জন ({c.femaleStudentPercentage}%)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">ছাত্র সংখ্যা:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {c.totalStudents - c.femaleStudents} জন
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">বিশেষ চাহিদা সম্পন্ন শিক্ষার্থী:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ১২ জন
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">উপবৃত্তি প্রাপ্ত শিক্ষার্থী:</span>
              <span className="font-mono font-bold text-emerald-600">
                ৩৫০ জন
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Faculty & Infrastructure */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
            <GraduationCap className="w-4 h-4" />
            <span>৩. শিক্ষক ও অবকাঠামো তথ্য</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">মোট শিক্ষক সংখ্যা:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {c.totalTeachers} জন
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">এমপিও শিক্ষক:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {c.mpoTeachers} জন
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">শিক্ষক-শিক্ষার্থী অনুপাত:</span>
              <span className="font-mono font-bold text-emerald-600">
                {c.teacherStudentRatio}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500">শেখ রাসেল ডিজিটাল ল্যাব:</span>
              <span className="font-bold text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                সচল ও সক্রিয়
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">লাইব্রেরিতে বইয়ের সংখ্যা:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {c.libraryBookCount} টি
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ICT & Digital Capacity Strip */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Computer className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              ডিজিটাল শিক্ষা ও আইসিটি অবকাঠামো অনুমোদন
            </div>
            <div className="text-[11px] text-slate-500">
              মাল্টিমিডিয়া ক্লাসরুম: {c.multimediaClassrooms} টি | কম্পিউটার ল্যাব: {c.computerLabCount} টি | সায়েন্স ল্যাব: {c.scienceLabCount} টি
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            ব্যানবেইস কোটা শতভাগ পূরণকৃত
          </span>
        </div>
      </div>
    </div>
  );
};
