import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ExamTerm,
  ExamScheduleSlot,
  MarkEntryRecord,
  StudentResultSummary,
  QuestionBankItem,
  ClassItem,
  SectionItem,
  AcademicSubject,
  Student,
} from '../../types';
import { getAll, putItem } from '../../db/indexedDB';
import { generateSampleExamData } from './sampleExamData';
import { ExamTermsTab } from './ExamTermsTab';
import { ExamScheduleTab } from './ExamScheduleTab';
import { MarkEntryTab } from './MarkEntryTab';
import { ResultProcessingTab } from './ResultProcessingTab';
import { QuestionBankTab } from './QuestionBankTab';
import {
  Award,
  Calendar,
  Layers,
  FileSpreadsheet,
  BookOpen,
  Calculator,
  RefreshCw,
  Sparkles,
  Printer,
  Info,
} from 'lucide-react';

export const ExaminationManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, t } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'terms' | 'schedules' | 'marks' | 'results' | 'questions'
  >('terms');

  const [loading, setLoading] = useState(true);
  const [selectedTermId, setSelectedTermId] = useState<string>('');

  // Primary data arrays
  const [terms, setTerms] = useState<ExamTerm[]>([]);
  const [schedules, setSchedules] = useState<ExamScheduleSlot[]>([]);
  const [marks, setMarks] = useState<MarkEntryRecord[]>([]);
  const [results, setResults] = useState<StudentResultSummary[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);

  // Auxiliary context data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const loadData = async () => {
    if (!activeInstitute) return;
    setLoading(true);

    try {
      // 1. Fetch core academic references
      const [allClasses, allSections, allSubjects, allStudents] = await Promise.all([
        getAll<ClassItem>('classes'),
        getAll<SectionItem>('sections'),
        getAll<AcademicSubject>('subjects'),
        getAll<Student>('students'),
      ]);

      const instClasses = allClasses.filter((c) => c.instituteId === activeInstitute.id);
      const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);
      const instSubjects = allSubjects.filter((s) => s.instituteId === activeInstitute.id);
      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);

      setClasses(instClasses);
      setSections(instSections);
      setSubjects(instSubjects);
      setStudents(instStudents);

      // 2. Fetch examination stores
      const [allTerms, allSchedules, allMarks, allResults, allQuestions] = await Promise.all([
        getAll<ExamTerm>('exams'),
        getAll<ExamScheduleSlot>('examSchedules'),
        getAll<MarkEntryRecord>('marks'),
        getAll<StudentResultSummary>('results'),
        getAll<QuestionBankItem>('questionBank'),
      ]);

      let instTerms = allTerms.filter((t) => t.instituteId === activeInstitute.id);
      let instSchedules = allSchedules.filter((s) => s.instituteId === activeInstitute.id);
      let instMarks = allMarks.filter((m) => m.instituteId === activeInstitute.id);
      let instResults = allResults.filter((r) => r.instituteId === activeInstitute.id);
      let instQuestions = allQuestions.filter((q) => q.instituteId === activeInstitute.id);

      // Auto-populate comprehensive sample examination data if empty
      if (instTerms.length === 0) {
        const sample = generateSampleExamData(
          activeInstitute.id,
          activeAcademicYear?.id || 'ay-2026',
          instStudents,
          instClasses,
          instSections,
          instSubjects
        );

        await Promise.all([
          ...sample.examTerms.map((t) => putItem('exams', t)),
          ...sample.examSchedules.map((s) => putItem('examSchedules', s)),
          ...sample.markRecords.map((m) => putItem('marks', m)),
          ...sample.resultsSummary.map((r) => putItem('results', r)),
          ...sample.sampleQuestionBank.map((q) => putItem('questionBank', q)),
        ]);

        instTerms = sample.examTerms;
        instSchedules = sample.examSchedules;
        instMarks = sample.markRecords;
        instResults = sample.resultsSummary;
        instQuestions = sample.sampleQuestionBank;
      }

      setTerms(instTerms);
      setSchedules(instSchedules);
      setMarks(instMarks);
      setResults(instResults);
      setQuestions(instQuestions);

      if (!selectedTermId && instTerms.length > 0) {
        setSelectedTermId(instTerms[0].id);
      }
    } catch (err) {
      console.error('Failed to load examination module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id, activeAcademicYear?.id]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Examination &amp; Result Management</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Phase 6 • Board Standard
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam terms, routines, CQ/MCQ marks entry, GPA calculation with 4th subject bonus, and official transcripts.
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('terms')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'terms'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Exam Terms ({terms.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'schedules'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Exam Routines ({schedules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('marks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'marks'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Marks Entry (CQ / MCQ)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('results')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'results'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Result Processing &amp; Transcripts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('questions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
            activeSubTab === 'questions'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Bank &amp; Paper Maker</span>
        </button>
      </div>

      {/* Sub-Tab Content Views */}
      {activeSubTab === 'terms' && (
        <ExamTermsTab
          terms={terms}
          onRefresh={loadData}
          selectedTermId={selectedTermId}
          onSelectTermId={setSelectedTermId}
        />
      )}

      {activeSubTab === 'schedules' && (
        <ExamScheduleTab
          terms={terms}
          schedules={schedules}
          classes={classes}
          subjects={subjects}
          selectedTermId={selectedTermId}
          onSelectTermId={setSelectedTermId}
          onRefresh={loadData}
        />
      )}

      {activeSubTab === 'marks' && (
        <MarkEntryTab
          terms={terms}
          classes={classes}
          sections={sections}
          subjects={subjects}
          students={students}
          marks={marks}
          selectedTermId={selectedTermId}
          onSelectTermId={setSelectedTermId}
          onRefresh={loadData}
        />
      )}

      {activeSubTab === 'results' && (
        <ResultProcessingTab
          terms={terms}
          classes={classes}
          sections={sections}
          subjects={subjects}
          students={students}
          marks={marks}
          results={results}
          selectedTermId={selectedTermId}
          onSelectTermId={setSelectedTermId}
          onRefresh={loadData}
        />
      )}

      {activeSubTab === 'questions' && (
        <QuestionBankTab
          questions={questions}
          classes={classes}
          subjects={subjects}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};
