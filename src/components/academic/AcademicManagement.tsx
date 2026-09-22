import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { ClassManagement } from './ClassManagement';
import { SectionManagement } from './SectionManagement';
import { SubjectManagement } from './SubjectManagement';
import { GroupShiftDeptManagement } from './GroupShiftDeptManagement';
import { ClassRoutineManagement } from './ClassRoutineManagement';
import { AcademicYearManagement } from './AcademicYearManagement';
import { ClassSyllabusManagement } from './ClassSyllabusManagement';
import { seedStandardCurriculum } from '../../db/seedAcademicData';

type AcademicSubTab =
  | 'classes'
  | 'sections'
  | 'subjects'
  | 'syllabus'
  | 'routine'
  | 'groups_shifts_depts'
  | 'academic_years';

export const AcademicManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit, t } = useApp();
  const [activeTab, setActiveTab] = useState<AcademicSubTab>('classes');
  const [seeding, setSeeding] = useState<boolean>(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string>('');
  const [seedErrorMsg, setSeedErrorMsg] = useState<string>('');

  const isSchool = activeInstitute?.type === 'school';

  const handleSeedCurriculum = async () => {
    if (!activeInstitute) return;
    const confirmSeed = window.confirm(
      `Populate standard ${
        isSchool ? 'Secondary School (Classes 6-10)' : 'College Higher Secondary (Classes 11-12)'
      } curriculum, including classes, sections, core subjects, and shifts? Existing custom items will not be overwritten.`
    );
    if (!confirmSeed) return;

    setSeeding(true);
    setSeedSuccessMsg('');
    setSeedErrorMsg('');

    try {
      const res = await seedStandardCurriculum(activeInstitute, activeAcademicYear);
      await logAudit(
        'SEED_CURRICULUM',
        'academic',
        `Loaded standard curriculum for ${activeInstitute.name} (${res.classesCount} classes, ${res.subjectsCount} subjects, ${res.sectionsCount} sections)`,
        activeInstitute.id
      );
      setSeedSuccessMsg(
        `Standard curriculum successfully initialized: ${res.classesCount} Classes, ${res.subjectsCount} Subjects, and ${res.sectionsCount} Sections configured!`
      );
      // Reload the active tab component by briefly toggling
      const current = activeTab;
      setActiveTab('classes');
    } catch (err: any) {
      console.error('Error seeding curriculum:', err);
      setSeedErrorMsg(err.message || 'Failed to initialize standard curriculum.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (Professional Polish Dark Highlight) */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-6 text-white shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Phase 2 • Academic &amp; Curriculum Engine
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-medium">
                {isSchool ? 'School Structure' : 'College Structure'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <span>
                {language === 'bn' ? 'একাডেমিক ব্যবস্থাপনা ও পাঠ্যক্রম' : 'Academic Management'}
              </span>
            </h2>

            <p className="text-xs text-slate-400 max-w-2xl">
              {language === 'bn'
                ? 'শ্রেণি, শাখা, বিভাগ, বিষয়, পূর্ণমান ও পাসের মানদণ্ড এবং সাপ্তাহিক ক্লাস রুটিন পরিচালনা করুন।'
                : 'Configure classes, sections, academic groups/shifts, subjects syllabus, marks distribution, and weekly class timetables.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              onClick={handleSeedCurriculum}
              disabled={seeding}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              <span>
                {seeding
                  ? 'Initializing Curriculum...'
                  : language === 'bn'
                  ? 'আদর্শ পাঠ্যক্রম লোড করুন'
                  : 'Quick Seed Curriculum'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Seeding Feedback */}
      {seedSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{seedSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSeedSuccessMsg('')}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {seedErrorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{seedErrorMsg}</span>
          </div>
          <button
            onClick={() => setSeedErrorMsg('')}
            className="text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{language === 'bn' ? 'শ্রেণি ও গ্রেড' : 'Classes & Grades'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === 'bn' ? 'শাখা' : 'Sections'}</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{language === 'bn' ? 'বিষয় ও ম্যাপিং' : 'Subjects & Mapping'}</span>
        </button>

        <button
          onClick={() => setActiveTab('syllabus')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{language === 'bn' ? 'শ্রেণিভিত্তিক সিলেবাস (৩টি পরীক্ষা)' : 'Class Syllabus (3 Terms)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('routine')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'routine'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{language === 'bn' ? 'ক্লাস রুটিন' : 'Class Routine'}</span>
        </button>

        <button
          onClick={() => setActiveTab('groups_shifts_depts')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'groups_shifts_depts'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{language === 'bn' ? 'বিভাগ, শিফট ও অনুষদ' : 'Groups, Shifts & Depts'}</span>
        </button>

        <button
          onClick={() => setActiveTab('academic_years')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'academic_years'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{language === 'bn' ? 'শিক্ষাবর্ষ' : 'Academic Years'}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'classes' && <ClassManagement />}
        {activeTab === 'sections' && <SectionManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'syllabus' && <ClassSyllabusManagement />}
        {activeTab === 'routine' && <ClassRoutineManagement />}
        {activeTab === 'groups_shifts_depts' && <GroupShiftDeptManagement />}
        {activeTab === 'academic_years' && <AcademicYearManagement />}
      </div>
    </div>
  );
};
