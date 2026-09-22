import React, { useState, useEffect } from 'react';
import {
  Student,
  AcademicClass,
  AcademicSection,
  AcademicGroup,
} from '../../types';
import { getAll } from '../../db/indexedDB';
import { useApp } from '../../context/AppContext';
import {
  GraduationCap,
  Users,
  UserPlus,
  TrendingUp,
  RefreshCw,
  Building2,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { StudentRosterView } from './StudentRosterView';
import { StudentAdmissionForm } from './StudentAdmissionForm';
import { StudentPromotionModal } from './StudentPromotionModal';

type StudentSubTab = 'roster' | 'admission' | 'promotion';

export const StudentManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, t, hasPermission } = useApp();

  const [currentTab, setCurrentTab] = useState<StudentSubTab>('roster');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [groups, setGroups] = useState<AcademicGroup[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!activeInstitute) return;
    setIsLoading(true);
    try {
      const [allStudents, allClasses, allSections, allGroups] = await Promise.all([
        getAll<Student>('students'),
        getAll<AcademicClass>('classes'),
        getAll<AcademicSection>('sections'),
        getAll<AcademicGroup>('groups'),
      ]);

      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);
      const instClasses = allClasses
        .filter((c) => c.instituteId === activeInstitute.id && c.status === 'active')
        .sort((a, b) => a.numericLevel - b.numericLevel);
      const instSections = allSections.filter(
        (s) => s.instituteId === activeInstitute.id && s.status === 'active'
      );
      const instGroups = allGroups.filter((g) => g.instituteId === activeInstitute.id);

      setStudents(instStudents);
      setClasses(instClasses);
      setSections(instSections);
      setGroups(instGroups);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute, activeAcademicYear]);

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setCurrentTab('admission');
  };

  const handleAddNewStudent = () => {
    setEditingStudent(null);
    setCurrentTab('admission');
  };

  const handleAdmissionSuccess = async (saved: Student) => {
    setEditingStudent(null);
    await fetchData();
    setCurrentTab('roster');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context Info */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'শিক্ষার্থী ব্যবস্থাপনা (Student Management)' : 'Student Management'}
              </h1>
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Phase 3
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive student bio-data, roll directory, registration, ID cards, and batch promotions.
            </p>
          </div>
        </div>

        {/* Institution & Year Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{activeInstitute?.name}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
            <Calendar className="w-3.5 h-3.5 text-purple-500" />
            <span>{activeAcademicYear?.yearName || '2026'}</span>
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-px">
        <button
          onClick={() => {
            setEditingStudent(null);
            setCurrentTab('roster');
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
            currentTab === 'roster'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory &amp; Roster</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            {students.length}
          </span>
        </button>

        {(editingStudent ? hasPermission('students', 'edit') : hasPermission('students', 'add')) && (
          <button
            onClick={handleAddNewStudent}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-colors border-b-2 cursor-pointer ${
              currentTab === 'admission'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{editingStudent ? 'Edit Student Bio-Data' : 'New Admission Registration'}</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-xs text-slate-400">
          Loading student records from IndexedDB...
        </div>
      ) : currentTab === 'roster' ? (
        <StudentRosterView
          students={students}
          classes={classes}
          sections={sections}
          groups={groups}
          onAddNew={handleAddNewStudent}
          onEditStudent={handleEditStudent}
          onRefresh={fetchData}
        />
      ) : (
        <StudentAdmissionForm
          classes={classes}
          sections={sections}
          groups={groups}
          editingStudent={editingStudent}
          onSuccess={handleAdmissionSuccess}
          onCancel={() => {
            setEditingStudent(null);
            setCurrentTab('roster');
          }}
        />
      )}
    </div>
  );
};
