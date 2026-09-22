import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentReportsTab } from './StudentReportsTab';
import { AttendanceReportsTab } from './AttendanceReportsTab';
import { ExamReportsTab } from './ExamReportsTab';
import { FeeReportsTab } from './FeeReportsTab';
import { FinancialReportsCenterTab } from './FinancialReportsCenterTab';
import { RegulatoryBanbeisTab } from './RegulatoryBanbeisTab';
import { ReportPrintModal } from './ReportPrintModal';
import {
  FileText,
  Users,
  ClipboardCheck,
  Award,
  CreditCard,
  Calculator,
  Landmark,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const ReportCenter: React.FC = () => {
  const { activeInstitute, activeAcademicYear } = useApp();

  const [activeTab, setActiveTab] = useState<
    'students' | 'attendance' | 'exams' | 'fees' | 'finance' | 'banbeis'
  >('students');

  // Print modal state
  const [printModalConfig, setPrintModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
    data: Record<string, any>[];
    summaryCards?: { label: string; value: string | number }[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    columns: [],
    data: [],
    summaryCards: [],
  });

  const handleOpenPrintModal = (config: {
    title: string;
    subtitle: string;
    columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
    data: Record<string, any>[];
    summaryCards?: { label: string; value: string | number }[];
  }) => {
    setPrintModalConfig({
      isOpen: true,
      ...config,
    });
  };

  const handleClosePrintModal = () => {
    setPrintModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const tabs = [
    {
      id: 'students' as const,
      label: 'Students & Bio-data',
      bengaliLabel: 'শিক্ষার্থী পরিসংখ্যান',
      icon: Users,
      badge: 'Active',
    },
    {
      id: 'attendance' as const,
      label: 'Attendance & Absentees',
      bengaliLabel: 'উপস্থিতি ও অ্যালার্ট',
      icon: ClipboardCheck,
    },
    {
      id: 'exams' as const,
      label: 'Exams & Merit Lists',
      bengaliLabel: 'পরীক্ষা ও মেধা তালিকা',
      icon: Award,
    },
    {
      id: 'fees' as const,
      label: 'Fee Collections & Dues',
      bengaliLabel: 'ফি আদায় ও বকেয়া',
      icon: CreditCard,
    },
    {
      id: 'finance' as const,
      label: 'Accounts & Audit',
      bengaliLabel: 'আয়-ব্যয় বিবরণী',
      icon: Calculator,
    },
    {
      id: 'banbeis' as const,
      label: 'BANBEIS & Regulatory',
      bengaliLabel: 'ব্যানবেইস তথ্য ফরম',
      icon: Landmark,
      badge: 'National',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Phase 13 • Official Report Center
              </span>
              {activeAcademicYear && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Session: {activeAcademicYear.yearName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 font-serif">
              <FileText className="w-8 h-8 text-blue-400" />
              <span>Institutional Reports &amp; Analytics Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Generate, audit, print, and export high-precision institutional reports with official
              Bengali letterheads, board affiliations, and authenticated digital signatures for{' '}
              <strong className="text-white">
                {activeInstitute?.name || 'School & College'}
              </strong>
              .
            </p>
          </div>

          {/* Institution Identity Card */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <div className="w-12 h-12 rounded-lg bg-white/20 p-1 flex items-center justify-center overflow-hidden">
              {activeInstitute?.logoUrl ? (
                <img
                  src={activeInstitute.logoUrl}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-white/80" />
              )}
            </div>
            <div className="text-left text-xs">
              <div className="font-bold text-white line-clamp-1">
                {activeInstitute?.name || 'Dhaka Model College'}
              </div>
              <div className="text-slate-300 text-[11px]">
                EIIN: {activeInstitute?.eiin || '108452'} • Code: {activeInstitute?.code || '3201'}
              </div>
              <div className="text-emerald-300 text-[10px] font-medium mt-0.5">
                Head: {activeInstitute?.headRole || (activeInstitute?.type === 'college' ? 'Principal' : 'Headmaster')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className={`text-[10px] font-normal opacity-80`}>
                  {tab.bengaliLabel}
                </div>
              </div>
              {tab.badge && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div>
        {activeTab === 'students' && (
          <StudentReportsTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceReportsTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}

        {activeTab === 'exams' && (
          <ExamReportsTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}

        {activeTab === 'fees' && (
          <FeeReportsTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}

        {activeTab === 'finance' && (
          <FinancialReportsCenterTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}

        {activeTab === 'banbeis' && (
          <RegulatoryBanbeisTab
            institute={activeInstitute}
            academicYear={activeAcademicYear}
            onOpenPrint={handleOpenPrintModal}
          />
        )}
      </div>

      {/* Printable Report Modal */}
      <ReportPrintModal
        isOpen={printModalConfig.isOpen}
        onClose={handleClosePrintModal}
        title={printModalConfig.title}
        subtitle={printModalConfig.subtitle}
        institute={activeInstitute}
        academicYear={activeAcademicYear}
        columns={printModalConfig.columns}
        data={printModalConfig.data}
        summaryCards={printModalConfig.summaryCards}
      />
    </div>
  );
};
