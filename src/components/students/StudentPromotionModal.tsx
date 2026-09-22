import React, { useState } from 'react';
import {
  Student,
  StudentEnrollment,
  AcademicClass,
  AcademicSection,
  Institute,
  AcademicYear,
} from '../../types';
import { update, add } from '../../db/indexedDB';
import { useApp } from '../../context/AppContext';
import {
  X,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';

interface StudentPromotionModalProps {
  students: Student[];
  classes: AcademicClass[];
  sections: AcademicSection[];
  academicYears: AcademicYear[];
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  students,
  classes,
  sections,
  academicYears,
  onClose,
  onSuccess,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit } = useApp();

  const [fromClassId, setFromClassId] = useState(classes[0]?.id || '');
  const [fromSectionId, setFromSectionId] = useState('');

  const [toClassId, setToClassId] = useState(classes[1]?.id || classes[0]?.id || '');
  const [toSectionId, setToSectionId] = useState('');
  const [targetYearId, setTargetYearId] = useState(activeAcademicYear?.id || '');

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Eligible students from source
  const sourceSections = sections.filter((s) => s.classId === fromClassId);
  const targetSections = sections.filter((s) => s.classId === toClassId);

  const eligibleStudents = students.filter(
    (s) =>
      s.classId === fromClassId &&
      (!fromSectionId || s.sectionId === fromSectionId) &&
      s.status === 'active'
  );

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map((s) => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePromote = async () => {
    if (!selectedStudentIds.length) {
      setErrorMsg('Please select at least one student to promote.');
      return;
    }
    if (!toClassId) {
      setErrorMsg('Please select a target class.');
      return;
    }
    if (!toSectionId) {
      setErrorMsg('Please select a target section.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let promotedCount = 0;
      for (const stdId of selectedStudentIds) {
        const student = students.find((s) => s.id === stdId);
        if (!student) continue;

        const updatedStudent: Student = {
          ...student,
          classId: toClassId,
          sectionId: toSectionId,
          academicYearId: targetYearId || student.academicYearId,
          updatedAt: new Date().toISOString(),
        };

        await update('students', updatedStudent);

        // Record new enrollment record
        const newEnrollment: StudentEnrollment = {
          id: `enr_${student.id}_${targetYearId || Date.now()}`,
          studentId: student.id,
          instituteId: activeInstitute?.id || '',
          academicYearId: targetYearId || student.academicYearId,
          classId: toClassId,
          sectionId: toSectionId,
          rollNumber: student.rollNumber,
          promotedFromEnrollmentId: `enr_${student.id}_${student.academicYearId}`,
          enrollmentDate: new Date().toISOString().split('T')[0],
          status: 'promoted',
          createdAt: new Date().toISOString(),
        };
        await add('studentEnrollments', newEnrollment);
        promotedCount++;
      }

      await logAudit(
        'PROMOTE_STUDENTS',
        'students',
        `Batch promoted ${promotedCount} students from Class ${
          classes.find((c) => c.id === fromClassId)?.name
        } to ${classes.find((c) => c.id === toClassId)?.name}`,
        undefined
      );

      onSuccess();
    } catch (err: any) {
      console.error('Promotion error:', err);
      setErrorMsg(err.message || 'Failed to complete student promotion.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Student Promotion &amp; Section Transfer
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Source */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Select Source Class &amp; Section
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Current Class
                </label>
                <select
                  value={fromClassId}
                  onChange={(e) => {
                    setFromClassId(e.target.value);
                    setFromSectionId('');
                    setSelectedStudentIds([]);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Current Section (Optional)
                </label>
                <select
                  value={fromSectionId}
                  onChange={(e) => {
                    setFromSectionId(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">All Sections</option>
                  {sourceSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* To Target */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                2. Target Placement
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Promote To Class *
                </label>
                <select
                  value={toClassId}
                  onChange={(e) => {
                    setToClassId(e.target.value);
                    const secs = sections.filter((s) => s.classId === e.target.value);
                    setToSectionId(secs[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Select Target Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Target Section *
                </label>
                <select
                  value={toSectionId}
                  onChange={(e) => setToSectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Select Target Section</option>
                  {targetSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Student Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Eligible Students ({eligibleStudents.length})</span>
              </span>
              {eligibleStudents.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {selectedStudentIds.length === eligibleStudents.length ? (
                    <>
                      <Square className="w-3 h-3" /> Deselect All
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3 h-3" /> Select All ({eligibleStudents.length})
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
              {eligibleStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active students found in the selected source class and section.
                </div>
              ) : (
                eligibleStudents.map((std) => {
                  const isChecked = selectedStudentIds.includes(std.id);
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudent(std.id)}
                      className={`flex items-center justify-between p-3 text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked && <CheckSquare className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {std.firstName} {std.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Roll: <strong className="text-slate-600 dark:text-slate-300">{std.rollNumber}</strong> • ID: {std.studentId}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {sections.find((s) => s.id === std.sectionId)?.name || 'Section'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <span className="text-xs text-slate-500">
            Selected: <strong className="text-slate-900 dark:text-white">{selectedStudentIds.length}</strong> students
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handlePromote}
              disabled={isProcessing || selectedStudentIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Confirm Promotion ({selectedStudentIds.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
