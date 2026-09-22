import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CalendarDays,
  FileCheck2,
  BarChart3,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentAttendanceTab } from './StudentAttendanceTab';
import { TeacherAttendanceTab } from './TeacherAttendanceTab';
import { MonthlyRegisterTab } from './MonthlyRegisterTab';
import { LeaveManagementTab } from './LeaveManagementTab';
import { AttendanceReportsTab } from './AttendanceReportsTab';
import { BiometricSyncTab } from './BiometricSyncTab';
import { seedAttendanceData } from './sampleAttendance';
import { getAll } from '../../db/indexedDB';
import { StudentAttendanceRecord, ClassItem, SectionItem } from '../../types';

export const AttendanceView: React.FC = () => {
  const { activeInstitute, language } = useApp();
  const [activeTab, setActiveTab] = useState<
    'student' | 'teacher' | 'register' | 'leave' | 'reports' | 'biometric'
  >('student');
  const [seeding, setSeeding] = useState<boolean>(false);

  // Auto-seed sample attendance data if empty
  useEffect(() => {
    async function checkAndSeed() {
      if (!activeInstitute) return;
      try {
        const records = await getAll<StudentAttendanceRecord>('studentAttendance');
        const instRecords = records.filter((r) => r.instituteId === activeInstitute.id);

        if (instRecords.length === 0) {
          setSeeding(true);
          const [classes, sections] = await Promise.all([
            getAll<ClassItem>('classes'),
            getAll<SectionItem>('sections'),
          ]);
          const instClass = classes.find((c) => c.instituteId === activeInstitute.id);
          const instSection = sections.find(
            (s) => s.instituteId === activeInstitute.id && (!instClass || s.classId === instClass.id)
          );

          if (instClass && instSection) {
            await seedAttendanceData(activeInstitute.id, instClass.id, instSection.id);
          }
          setSeeding(false);
        }
      } catch (err) {
        console.error('Failed checking attendance records:', err);
        setSeeding(false);
      }
    }

    checkAndSeed();
  }, [activeInstitute]);

  const tabs = [
    {
      id: 'student' as const,
      name: language === 'bn' ? 'শিক্ষার্থী হাজিরা' : 'Student Attendance',
      icon: GraduationCap,
      badge: null,
    },
    {
      id: 'teacher' as const,
      name: language === 'bn' ? 'শিক্ষক ও কর্মী হাজিরা' : 'Faculty & Staff',
      icon: Users,
      badge: null,
    },
    {
      id: 'register' as const,
      name: language === 'bn' ? 'মাসিক উপস্থিতি খাতা' : 'Monthly Register',
      icon: CalendarDays,
      badge: language === 'bn' ? 'মুদ্রণযোগ্য' : 'Printable',
    },
    {
      id: 'leave' as const,
      name: language === 'bn' ? 'ছুটি ব্যবস্থাপনা' : 'Leave Management',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'reports' as const,
      name: language === 'bn' ? 'বোর্ড যোগ্যতা ও রিপোর্ট' : 'Board Eligibility & Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'biometric' as const,
      name: language === 'bn' ? 'বায়োমেট্রিক ও পাঞ্চ' : 'Biometric Devices',
      icon: Cpu,
      badge: 'ZKTeco',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <span>
              {language === 'bn' ? 'উপস্থিতি ও ছুটি ব্যবস্থাপনা' : 'Attendance & Leave Management'}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Phase 5
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'দৈনিক শিক্ষার্থী ও শিক্ষক হাজিরা, অভিভাবক এসএমএস এলার্ট, মাসিক রেজিস্টার, সরকারি বোর্ড নিয়মের কলেজিয়েট যোগ্যতা ও বায়োমেট্রিক ডিভাইস।'
              : 'Comprehensive roll-call, faculty biometric sync, SMS alerts, monthly attendance sheet, and Board eligibility compliance.'}
          </p>
        </div>

        {seeding && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নমুনা হাজিরা ডাটা প্রস্তুত হচ্ছে...' : 'Initializing attendance data...'}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.name}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-md font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'student' && <StudentAttendanceTab />}
        {activeTab === 'teacher' && <TeacherAttendanceTab />}
        {activeTab === 'register' && <MonthlyRegisterTab />}
        {activeTab === 'leave' && <LeaveManagementTab />}
        {activeTab === 'reports' && <AttendanceReportsTab />}
        {activeTab === 'biometric' && <BiometricSyncTab />}
      </div>
    </div>
  );
};
