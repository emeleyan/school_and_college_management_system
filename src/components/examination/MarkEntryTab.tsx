import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ExamTerm,
  ClassItem,
  SectionItem,
  AcademicSubject,
  Student,
  MarkEntryRecord,
} from '../../types';
import { putItem } from '../../db/indexedDB';
import { calculateGradeAndPoint, checkSubjectPassStatus } from '../../utils/gradingSystem';
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface MarkEntryTabProps {
  terms: ExamTerm[];
  classes: ClassItem[];
  sections: SectionItem[];
  subjects: AcademicSubject[];
  students: Student[];
  marks: MarkEntryRecord[];
  selectedTermId: string;
  onSelectTermId: (id: string) => void;
  onRefresh: () => void;
}

export const MarkEntryTab: React.FC<MarkEntryTabProps> = ({
  terms,
  classes,
  sections,
  subjects,
  students,
  marks,
  selectedTermId,
  onSelectTermId,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, currentUser, logAudit, hasPermission } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Local grid values: studentId -> { cq, mcq, practical, is4th }
  const [entryMap, setEntryMap] = useState<
    Record<
      string,
      {
        cq: number;
        mcq: number;
        practical: number;
        is4th: boolean;
        remarks: string;
      }
    >
  >({});

  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms[0];
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Filter subjects for the selected class
  const classSubjects = subjects.filter((s) => s.classId === selectedClassId || !s.classId);

  // Initialize selected subject if empty or not in class
  useEffect(() => {
    if (classSubjects.length > 0) {
      if (!selectedSubjectId || !classSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(classSubjects[0].id);
      }
    }
  }, [selectedClassId, classSubjects, selectedSubjectId]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Filter students in this class and section
  const classStudents = students
    .filter((s) => {
      if (s.classId !== selectedClassId) return false;
      if (selectedSectionId !== 'all' && s.sectionId !== selectedSectionId) return false;
      return true;
    })
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Load existing marks into entryMap
  useEffect(() => {
    if (!activeTerm || !selectedSubjectId || classStudents.length === 0) return;

    const newMap: Record<
      string,
      {
        cq: number;
        mcq: number;
        practical: number;
        is4th: boolean;
        remarks: string;
      }
    > = {};

    classStudents.forEach((st) => {
      const existing = marks.find(
        (m) =>
          m.examTermId === activeTerm.id &&
          m.studentId === st.id &&
          m.subjectId === selectedSubjectId
      );

      if (existing) {
        newMap[st.id] = {
          cq: existing.cqMarks || 0,
          mcq: existing.mcqMarks || 0,
          practical: existing.practicalMarks || 0,
          is4th: !!existing.isOptionalSubject,
          remarks: existing.remarks || '',
        };
      } else {
        newMap[st.id] = {
          cq: 0,
          mcq: 0,
          practical: 0,
          is4th: false,
          remarks: '',
        };
      }
    });

    setEntryMap(newMap);
  }, [activeTerm?.id, selectedClassId, selectedSectionId, selectedSubjectId, marks, classStudents.length]);

  const maxCq = currentSubject?.hasPractical ? 50 : currentSubject?.theoryMarks || 70;
  const maxMcq = currentSubject?.mcqMarks || 30;
  const maxPractical = currentSubject?.hasPractical ? currentSubject.practicalMarks || 20 : 0;
  const maxTotal = maxCq + maxMcq + maxPractical;

  const handleScoreChange = (
    studentId: string,
    field: 'cq' | 'mcq' | 'practical',
    val: number
  ) => {
    const current = entryMap[studentId] || { cq: 0, mcq: 0, practical: 0, is4th: false, remarks: '' };
    let bounded = Math.max(0, val);
    if (field === 'cq') bounded = Math.min(maxCq, bounded);
    if (field === 'mcq') bounded = Math.min(maxMcq, bounded);
    if (field === 'practical') bounded = Math.min(maxPractical, bounded);

    setEntryMap((prev) => ({
      ...prev,
      [studentId]: {
        ...current,
        [field]: bounded,
      },
    }));
  };

  const handleToggle4th = (studentId: string) => {
    const current = entryMap[studentId] || { cq: 0, mcq: 0, practical: 0, is4th: false, remarks: '' };
    setEntryMap((prev) => ({
      ...prev,
      [studentId]: {
        ...current,
        is4th: !current.is4th,
      },
    }));
  };

  const handleBatchAutoFill = (type: 'passing' | 'high') => {
    const updated = { ...entryMap };
    classStudents.forEach((st) => {
      const mult = type === 'high' ? 0.85 : 0.45;
      updated[st.id] = {
        cq: Math.round(maxCq * mult),
        mcq: Math.round(maxMcq * mult),
        practical: maxPractical > 0 ? Math.round(maxPractical * 0.9) : 0,
        is4th: updated[st.id]?.is4th || false,
        remarks: updated[st.id]?.remarks || '',
      };
    });
    setEntryMap(updated);
  };

  const handleSaveAll = async () => {
    if (!activeInstitute || !activeTerm || !currentClass || !currentSubject) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const promises = classStudents.map(async (st) => {
        const row = entryMap[st.id] || { cq: 0, mcq: 0, practical: 0, is4th: false, remarks: '' };
        const total = row.cq + row.mcq + row.practical;
        const { grade, point } = calculateGradeAndPoint(total, maxTotal);

        const passEval = checkSubjectPassStatus({
          cq: row.cq,
          mcq: row.mcq,
          practical: row.practical,
          maxCq,
          maxMcq,
          maxPractical,
        });

        const recordId = `mark-${st.id}-${currentSubject.id}-${activeTerm.id}`;
        const record: MarkEntryRecord = {
          id: recordId,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id || '',
          examTermId: activeTerm.id,
          classId: currentClass.id,
          className: currentClass.name,
          sectionId: st.sectionId || 'sec-01',
          sectionName: 'A',
          studentId: st.id,
          studentName: `${st.firstName} ${st.lastName}`,
          rollNumber: st.rollNumber,
          subjectId: currentSubject.id,
          subjectName: currentSubject.name,
          subjectCode: currentSubject.code || '101',
          isOptionalSubject: row.is4th,
          cqMarks: row.cq,
          mcqMarks: row.mcq,
          practicalMarks: row.practical,
          totalMarks: total,
          grade: passEval.isPassed ? grade : 'F',
          point: passEval.isPassed ? point : 0.0,
          isPassed: passEval.isPassed,
          remarks: row.remarks || passEval.failReason || '',
          enteredBy: currentUser?.fullName || 'Teacher',
          updatedAt: new Date().toISOString(),
        };

        return putItem('marks', record);
      });

      await Promise.all(promises);

      await logAudit(
        'save_marks',
        'examination',
        `Saved marks for ${currentSubject.name} (${currentClass.name}) in ${activeTerm.name} (${classStudents.length} students)`
      );

      setSaveMessage(`Successfully saved marks for ${classStudents.length} students!`);
      setTimeout(() => setSaveMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to save marks:', err);
      alert('Failed to save marks. Please check input values.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Term */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Exam Term
            </label>
            <select
              value={activeTerm?.id || ''}
              onChange={(e) => onSelectTermId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Sections</option>
              {sections
                .filter((sec) => sec.classId === selectedClassId)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Subject &amp; Paper
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 rounded-lg text-blue-900 dark:text-blue-300"
            >
              {classSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code || '101'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        {(hasPermission('examination', 'add') || hasPermission('examination', 'edit')) && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAutoFill('passing')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Fast demo filler (passes all)"
            >
              Fill Sample (Pass)
            </button>
            <button
              onClick={() => handleBatchAutoFill('high')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Fast demo filler (A/A+)"
            >
              Fill Sample (A+)
            </button>

            <button
              onClick={handleSaveAll}
              disabled={saving || classStudents.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving Marks...' : 'Save & Calculate All'}</span>
            </button>
          </div>
        )}
      </div>

      {saveMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Marks Allocation Rules Notice */}
      <div className="p-3 bg-blue-50 dark:bg-slate-800/80 rounded-xl border border-blue-100 dark:border-slate-700 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Board Evaluation Guidelines: </span>
          Full Marks: <strong>{maxTotal}</strong> | Theory (CQ): Max{' '}
          <strong>{maxCq}</strong> (Pass: {Math.ceil(maxCq * 0.33)}) | MCQ: Max{' '}
          <strong>{maxMcq}</strong> (Pass: {Math.ceil(maxMcq * 0.33)})
          {maxPractical > 0 && (
            <span>
              {' '}
              | Practical: Max <strong>{maxPractical}</strong> (Pass:{' '}
              {Math.ceil(maxPractical * 0.33)})
            </span>
          )}
          . A student must pass each component individually (33%) to be awarded a passing grade.
        </div>
      </div>

      {/* Student Marks Entry Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Layers className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No students found in {currentClass?.name || 'this class'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-3 py-3 w-12 text-center">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-3 py-3 text-center">4th Sub?</th>
                  <th className="px-3 py-3 text-center w-24">CQ (Max {maxCq})</th>
                  <th className="px-3 py-3 text-center w-24">MCQ (Max {maxMcq})</th>
                  {maxPractical > 0 && (
                    <th className="px-3 py-3 text-center w-24">Prac (Max {maxPractical})</th>
                  )}
                  <th className="px-3 py-3 text-center w-20">Total</th>
                  <th className="px-3 py-3 text-center w-16">Grade</th>
                  <th className="px-3 py-3 text-center w-16">GPA</th>
                  <th className="px-4 py-3">Status / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {classStudents.map((st) => {
                  const entry = entryMap[st.id] || {
                    cq: 0,
                    mcq: 0,
                    practical: 0,
                    is4th: false,
                    remarks: '',
                  };
                  const total = entry.cq + entry.mcq + entry.practical;
                  const { grade, point } = calculateGradeAndPoint(total, maxTotal);

                  const passEval = checkSubjectPassStatus({
                    cq: entry.cq,
                    mcq: entry.mcq,
                    practical: entry.practical,
                    maxCq,
                    maxMcq,
                    maxPractical,
                  });

                  const effectiveGrade = passEval.isPassed ? grade : 'F';
                  const effectivePoint = passEval.isPassed ? point : 0.0;

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors ${
                        !passEval.isPassed ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Roll */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                        {String(st.rollNumber).padStart(2, '0')}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-2">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {st.firstName} {st.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {st.studentId}
                        </div>
                      </td>

                      {/* 4th Subject Checkbox */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={entry.is4th}
                          onChange={() => handleToggle4th(st.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="Check if this is student's 4th / Optional subject"
                        />
                      </td>

                      {/* CQ Marks */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={maxCq}
                          value={entry.cq}
                          onChange={(e) =>
                            handleScoreChange(st.id, 'cq', Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* MCQ Marks */}
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={maxMcq}
                          value={entry.mcq}
                          onChange={(e) =>
                            handleScoreChange(st.id, 'mcq', Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      {/* Practical Marks */}
                      {maxPractical > 0 && (
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxPractical}
                            value={entry.practical}
                            onChange={(e) =>
                              handleScoreChange(st.id, 'practical', Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      )}

                      {/* Total */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {total}
                      </td>

                      {/* Grade */}
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            effectiveGrade === 'A+'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : effectiveGrade === 'F'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {effectiveGrade}
                        </span>
                      </td>

                      {/* GPA */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {effectivePoint.toFixed(2)}
                      </td>

                      {/* Status / Remarks */}
                      <td className="px-4 py-2">
                        {!passEval.isPassed ? (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{passEval.failReason}</span>
                          </div>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            Passed {entry.is4th ? '(4th Sub)' : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
