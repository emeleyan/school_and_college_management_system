import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AcademicClass,
  AcademicSubject,
  ClassSyllabusItem,
} from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  BookOpen,
  Calendar,
  Save,
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { UniversalExportModal } from '../common/UniversalExportModal';
import { printOrSavePdf } from '../../utils/exportUtils';

export const ClassSyllabusManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [syllabusList, setSyllabusList] = useState<ClassSyllabusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [activeTermKey, setActiveTermKey] = useState<string>('1st_term');

  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Standard 3 school terms requested by user
  const STANDARD_TERMS = [
    { key: '1st_term', nameEn: '1st Term Examination', nameBn: '১ম সাময়িক পরীক্ষা' },
    { key: 'half_yearly', nameEn: '2nd Term / Half Yearly Examination', nameBn: 'অর্ধ-বার্ষিক পরীক্ষা' },
    { key: 'final', nameEn: '3rd Term / Annual Examination', nameBn: 'বার্ষিক পরীক্ষা' },
  ];

  // Current editing term syllabus data
  const [termData, setTermData] = useState({
    chapters: '',
    topics: '',
    marksDistribution: 'Theory: 70, MCQ: 30',
    referenceBooks: '',
    notes: '',
  });

  const fetchData = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allClasses, allSubjects, allSyllabus] = await Promise.all([
        getAll<AcademicClass>('classes'),
        getAll<AcademicSubject>('subjects'),
        getAll<ClassSyllabusItem>('syllabus'),
      ]);

      const instClasses = allClasses
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);

      const instSubjects = allSubjects.filter((s) => s.instituteId === activeInstitute.id);
      const instSyllabus = allSyllabus.filter((s) => s.instituteId === activeInstitute.id);

      setClasses(instClasses);
      setSubjects(instSubjects);
      setSyllabusList(instSyllabus);

      if (instClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(instClasses[0].id);
      }
    } catch (err) {
      console.error('Error fetching syllabus data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute]);

  // Subjects for selected class
  const classSubjects = useMemo(() => {
    if (!selectedClassId) return [];
    return subjects.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId, subjects]);

  // Select first subject when class changes
  useEffect(() => {
    if (classSubjects.length > 0 && (!selectedSubjectId || !classSubjects.some((s) => s.id === selectedSubjectId))) {
      setSelectedSubjectId(classSubjects[0].id);
    } else if (classSubjects.length === 0) {
      setSelectedSubjectId('');
    }
  }, [classSubjects, selectedSubjectId]);

  // Load term data whenever selected class, subject, or active term changes
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setTermData({ chapters: '', topics: '', marksDistribution: '', referenceBooks: '', notes: '' });
      return;
    }

    const existing = syllabusList.find(
      (s) =>
        s.classId === selectedClassId &&
        s.subjectId === selectedSubjectId &&
        s.termType === activeTermKey
    );

    if (existing) {
      setTermData({
        chapters: existing.chapters || '',
        topics: existing.topics || '',
        marksDistribution: existing.marksDistribution || 'Theory: 70, MCQ: 30',
        referenceBooks: existing.referenceBooks || '',
        notes: existing.notes || '',
      });
    } else {
      setTermData({
        chapters: '',
        topics: '',
        marksDistribution: 'Theory: 70, MCQ: 30',
        referenceBooks: '',
        notes: '',
      });
    }
  }, [selectedClassId, selectedSubjectId, activeTermKey, syllabusList]);

  const handleSaveSyllabus = async () => {
    if (!activeInstitute || !selectedClassId || !selectedSubjectId) return;

    try {
      const currentSubj = subjects.find((s) => s.id === selectedSubjectId);
      const currentClass = classes.find((c) => c.id === selectedClassId);
      const termInfo = STANDARD_TERMS.find((t) => t.key === activeTermKey);

      const existingIndex = syllabusList.findIndex(
        (s) =>
          s.classId === selectedClassId &&
          s.subjectId === selectedSubjectId &&
          s.termType === activeTermKey
      );

      if (existingIndex >= 0) {
        const existing = syllabusList[existingIndex];
        const updatedObj: ClassSyllabusItem = {
          ...existing,
          chapters: termData.chapters,
          topics: termData.topics,
          marksDistribution: termData.marksDistribution,
          referenceBooks: termData.referenceBooks,
          notes: termData.notes,
          subjectName: currentSubj?.name,
          subjectCode: currentSubj?.code,
          updatedAt: new Date().toISOString(),
        };

        await update('syllabus', updatedObj);
        setSyllabusList((prev) =>
          prev.map((item) => (item.id === existing.id ? updatedObj : item))
        );
      } else {
        const newObj: ClassSyllabusItem = {
          id: `syl_${selectedClassId}_${selectedSubjectId}_${activeTermKey}_${Date.now()}`,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          subjectName: currentSubj?.name,
          subjectCode: currentSubj?.code,
          termType: activeTermKey,
          termName: termInfo ? `${termInfo.nameEn} (${termInfo.nameBn})` : activeTermKey,
          chapters: termData.chapters,
          topics: termData.topics,
          marksDistribution: termData.marksDistribution,
          referenceBooks: termData.referenceBooks,
          notes: termData.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await add('syllabus', newObj);
        setSyllabusList((prev) => [...prev, newObj]);
      }

      setStatusMsg(
        `Syllabus for ${currentSubj?.name} (${termInfo?.nameEn}) saved successfully.`
      );
      setTimeout(() => setStatusMsg(''), 4000);

      await logAudit(
        'SYLLABUS_UPDATE',
        'academic',
        `Updated syllabus for ${currentClass?.name} - ${currentSubj?.name} (${termInfo?.nameEn})`,
        selectedSubjectId
      );
    } catch (err: any) {
      console.error('Error saving syllabus:', err);
      setErrorMsg(err.message || 'Failed to save syllabus.');
    }
  };

  const handlePrintClassSyllabus = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    if (!currentClass) return;

    const classSyl = syllabusList.filter((s) => s.classId === selectedClassId);

    const headers = ['Subject Code', 'Subject Name', 'Exam Term', 'Chapters Covered', 'Topics & Outline', 'Marks Distribution'];
    const rows = classSyl.map((s) => [
      s.subjectCode || '-',
      s.subjectName || '-',
      s.termName || s.termType,
      s.chapters || '-',
      s.topics || '-',
      s.marksDistribution || '-',
    ]);

    printOrSavePdf({
      title: `Annual Class Syllabus & Curriculum Plan`,
      subtitle: `Class: ${currentClass.name} (${currentClass.bengaliName}) • Academic Session: ${activeAcademicYear?.yearName || '2025-26'}`,
      instituteName: activeInstitute?.name || 'School & College Management System',
      instituteEiin: activeInstitute?.eiin,
      headers,
      rows,
      paperSize: 'A4',
      orientation: 'landscape',
      footerNote: 'Official curriculum syllabus document issued for teachers and students',
    });
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Prepare table data for export
  const exportRows = useMemo(() => {
    const classSyl = syllabusList.filter((s) => s.classId === selectedClassId);
    return classSyl.map((s) => [
      selectedClass?.name || '-',
      s.subjectCode || '-',
      s.subjectName || '-',
      s.termName || s.termType,
      s.chapters || '-',
      s.topics || '-',
      s.marksDistribution || '-',
      s.referenceBooks || '-',
    ]);
  }, [syllabusList, selectedClassId, selectedClass]);

  const exportHeaders = ['Class', 'Subject Code', 'Subject Name', 'Term / Exam', 'Chapters', 'Topics', 'Marks Breakdown', 'Reference Books'];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
              3-Term Curriculum
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Class-wise &amp; Subject-by-Subject</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Class-wise Syllabus Maker (পাঠ্যক্রম ও সিলেবাস প্রণয়ন)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a class, browse its subjects, and define syllabus for 1st Term, 2nd Term (Half Yearly), and 3rd Term (Annual) exams.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={classSubjects.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Syllabus (Excel / PDF)</span>
          </button>

          <button
            onClick={handlePrintClassSyllabus}
            disabled={classSubjects.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Class Syllabus (A4 / Legal)</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Class Selector Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Select Class (শ্রেণি নির্বাচন):
        </span>
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {classes.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedClassId === c.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Left Subjects List, Right 3-Term Syllabus Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects for Selected Class (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>
                Subjects of {selectedClass?.name || 'Selected Class'} ({classSubjects.length})
              </span>
            </div>
          </div>

          <div className="p-2 space-y-1.5 max-h-[550px] overflow-y-auto flex-1">
            {classSubjects.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No subjects assigned to this class yet. Go to &quot;Subjects &amp; Syllabus&quot; tab to assign subjects from Master List.
              </div>
            ) : (
              classSubjects.map((subj) => {
                const isSelected = subj.id === selectedSubjectId;
                const termsCount = syllabusList.filter(
                  (s) => s.classId === selectedClassId && s.subjectId === subj.id
                ).length;

                return (
                  <button
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{subj.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {subj.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {subj.bengaliName} • {subj.fullMarks} Marks
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          termsCount === 3
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : termsCount > 0
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {termsCount}/3 Terms
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 3-Term Syllabus Editor for Active Subject (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden flex flex-col">
          {selectedSubject ? (
            <>
              {/* Subject Title & Term Tabs */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-blue-600" />
                      <span>{selectedSubject.name}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({selectedSubject.bengaliName} • Code: {selectedSubject.code})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: {selectedClass?.name} • Full Marks: {selectedSubject.fullMarks} (Theory:{' '}
                      {selectedSubject.theoryMarks}, MCQ: {selectedSubject.mcqMarks}
                      {selectedSubject.hasPractical ? `, Prac: ${selectedSubject.practicalMarks}` : ''})
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Session: {activeAcademicYear?.yearName || '2025-26'}
                  </span>
                </div>

                {/* 3 Standard Terms Tab Buttons */}
                <div className="flex flex-wrap gap-2">
                  {STANDARD_TERMS.map((term, index) => {
                    const isTermActive = activeTermKey === term.key;
                    const hasData = syllabusList.some(
                      (s) =>
                        s.classId === selectedClassId &&
                        s.subjectId === selectedSubjectId &&
                        s.termType === term.key &&
                        s.chapters.trim().length > 0
                    );

                    return (
                      <button
                        key={term.key}
                        onClick={() => setActiveTermKey(term.key)}
                        className={`flex-1 min-w-[160px] p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isTermActive
                            ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase opacity-80">Term {index + 1}</div>
                        <div className="text-xs font-bold truncate">{term.nameEn}</div>
                        <div className={`text-[10px] mt-0.5 flex items-center justify-between ${isTermActive ? 'text-blue-100' : 'text-slate-400'}`}>
                          <span>{term.nameBn}</span>
                          {hasData && (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Content for active term */}
              <div className="p-6 space-y-4 flex-1 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Chapters / Lessons Covered (অন্তর্ভুক্ত অধ্যায়সমূহ) *
                  </label>
                  <input
                    type="text"
                    value={termData.chapters}
                    onChange={(e) => setTermData({ ...termData, chapters: e.target.value })}
                    placeholder="e.g. অধ্যায় ১: বাস্তব সংখ্যা, অধ্যায় ২: সেট ও ফাংশন, অধ্যায় ৩: বীজগণিতীয় রাশি"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Specify chapters, unit numbers, or reading sections examined in this term.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Detailed Topics &amp; Learning Outcomes (বিস্তারিত পাঠ্যসূচি ও বিষয়বস্তু) *
                  </label>
                  <textarea
                    rows={4}
                    value={termData.topics}
                    onChange={(e) => setTermData({ ...termData, topics: e.target.value })}
                    placeholder="Write detailed topic breakdown, specific problem types, grammar items, lab experiments, or assignments..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Marks Distribution (নম্বর বণ্টন)
                    </label>
                    <input
                      type="text"
                      value={termData.marksDistribution}
                      onChange={(e) => setTermData({ ...termData, marksDistribution: e.target.value })}
                      placeholder="e.g. CQ: 70, MCQ: 30 or Theory: 50, Practical: 25, MCQ: 25"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reference Book &amp; Textbooks (সহায়ক বই ও নির্দেশিকা)
                    </label>
                    <input
                      type="text"
                      value={termData.referenceBooks}
                      onChange={(e) => setTermData({ ...termData, referenceBooks: e.target.value })}
                      placeholder="e.g. NCTB Prescribed Textbook, Page 1 - 85"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Teacher Notes / Instructions for Students (শিক্ষক ও শিক্ষার্থীর জন্য বিশেষ নির্দেশনা)
                  </label>
                  <input
                    type="text"
                    value={termData.notes}
                    onChange={(e) => setTermData({ ...termData, notes: e.target.value })}
                    placeholder="e.g. Class attendance of 80% required; term project must be submitted 2 weeks before exam"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer Save Button */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  Editing: <span className="font-bold text-slate-700 dark:text-slate-300">{selectedSubject.name}</span> •{' '}
                  <span className="font-bold text-blue-600">
                    {STANDARD_TERMS.find((t) => t.key === activeTermKey)?.nameEn}
                  </span>
                </div>

                <button
                  onClick={handleSaveSyllabus}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Syllabus for {STANDARD_TERMS.find((t) => t.key === activeTermKey)?.nameEn}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Please select a subject from the left panel to edit its syllabus.
            </div>
          )}
        </div>
      </div>

      {/* Universal Export Modal (Excel / PDF with A4 vs Legal) */}
      <UniversalExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={`Complete Syllabus Plan - ${selectedClass?.name || 'Class'}`}
        defaultFilename={`syllabus_${selectedClass?.name || 'class'}_${activeAcademicYear?.yearName || '2025-26'}`}
        headers={exportHeaders}
        rows={exportRows}
        subtitle={`Academic Session: ${activeAcademicYear?.yearName || '2025-26'} • 3-Term School Curriculum`}
      />
    </div>
  );
};
