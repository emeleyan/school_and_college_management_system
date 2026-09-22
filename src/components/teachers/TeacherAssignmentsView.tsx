import React, { useState } from 'react';
import {
  Teacher,
  AcademicClass,
  AcademicSection,
  AcademicSubject,
  SubjectTeacherAssignment,
  Institute,
  AcademicYear,
} from '../../types';
import {
  Award,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { update, add, remove } from '../../db/indexedDB';

interface TeacherAssignmentsViewProps {
  institute: Institute;
  academicYear: AcademicYear;
  teachers: Teacher[];
  classes: AcademicClass[];
  sections: AcademicSection[];
  subjects: AcademicSubject[];
  assignments: SubjectTeacherAssignment[];
  onRefresh: () => Promise<void>;
}

export const TeacherAssignmentsView: React.FC<TeacherAssignmentsViewProps> = ({
  institute,
  academicYear,
  teachers,
  classes,
  sections,
  subjects,
  assignments,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'class_teachers' | 'subject_workload'>('class_teachers');

  // Filter & Search
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Subject Assignment Form State
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [modalTeacherId, setModalTeacherId] = useState('');
  const [modalClassId, setModalClassId] = useState('');
  const [modalSectionId, setModalSectionId] = useState('');
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalPeriods, setModalPeriods] = useState<number>(4);
  const [saving, setSaving] = useState(false);

  const facultyTeachers = teachers.filter(
    (t) => t.employeeType === 'teacher' && t.status === 'active'
  );

  // Quick helper to get sections for selected modal class
  const modalClassSections = sections.filter((s) => s.classId === modalClassId);
  const modalClassSubjects = subjects.filter((s) => s.classId === modalClassId);

  // Assign Class Teacher to Section
  const handleAssignClassTeacher = async (section: AcademicSection, newTeacherId: string) => {
    try {
      const selectedTeacher = teachers.find((t) => t.id === newTeacherId);
      const updatedSection: AcademicSection = {
        ...section,
        classTeacherId: newTeacherId || undefined,
        classTeacherName: selectedTeacher
          ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
          : undefined,
        updatedAt: new Date().toISOString(),
      };
      await update('sections', updatedSection);
      await onRefresh();
    } catch (err) {
      console.error('Error assigning class teacher:', err);
    }
  };

  // Add Subject Assignment
  const handleSaveSubjectAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTeacherId || !modalClassId || !modalSubjectId) return;

    setSaving(true);
    try {
      const teacher = teachers.find((t) => t.id === modalTeacherId);
      const cls = classes.find((c) => c.id === modalClassId);
      const sec = sections.find((s) => s.id === modalSectionId);
      const subj = subjects.find((s) => s.id === modalSubjectId);

      const newAssignment: SubjectTeacherAssignment = {
        id: 'assign_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        instituteId: institute.id,
        academicYearId: academicYear.id,
        teacherId: modalTeacherId,
        teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher',
        classId: modalClassId,
        className: cls ? cls.name : 'Class',
        sectionId: modalSectionId || undefined,
        sectionName: sec ? sec.name : undefined,
        subjectId: modalSubjectId,
        subjectName: subj ? subj.name : 'Subject',
        periodsPerWeek: Number(modalPeriods) || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await add('teacherAssignments', newAssignment);
      await onRefresh();
      setShowAddSubjectModal(false);
      setModalTeacherId('');
      setModalClassId('');
      setModalSectionId('');
      setModalSubjectId('');
    } catch (err) {
      console.error('Error saving subject assignment:', err);
    } finally {
      setSaving(false);
    }
  };

  // Remove Subject Assignment
  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to remove this teaching assignment?')) return;
    try {
      await remove('teacherAssignments', id);
      await onRefresh();
    } catch (err) {
      console.error('Error removing assignment:', err);
    }
  };

  // Filtered Subject Assignments
  const filteredAssignments = assignments.filter((a) => {
    if (selectedClassId !== 'all' && a.classId !== selectedClassId) return false;
    if (selectedTeacherId !== 'all' && a.teacherId !== selectedTeacherId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.teacherName.toLowerCase().includes(q) ||
        a.subjectName.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-tabs header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSubTab('class_teachers')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'class_teachers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Class Teacher Designations (শ্রেণি শিক্ষক)</span>
          </button>

          <button
            onClick={() => setSubTab('subject_workload')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'subject_workload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subject Teaching &amp; Workload (পাঠদান বণ্টন)</span>
          </button>
        </div>

        {subTab === 'subject_workload' && (
          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Subject to Teacher</span>
          </button>
        )}
      </div>

      {/* VIEW 1: CLASS TEACHER DESIGNATION */}
      {subTab === 'class_teachers' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Designate Class Teachers by Section
              </h3>
              <p className="text-xs text-slate-500">
                Assign a dedicated faculty mentor / class teacher for each academic section in{' '}
                {academicYear.yearName}
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {sections.length} Sections Total
            </span>
          </div>

          <div className="p-4">
            {classes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No Academic Classes Found</p>
                <p className="text-[11px] mt-1">
                  Please setup Classes &amp; Sections in the Academic Structure module first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => {
                  const classSecs = sections.filter((s) => s.classId === cls.id);
                  return (
                    <div
                      key={cls.id}
                      className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {cls.name}
                          </h4>
                          {cls.bengaliName && (
                            <span className="text-xs text-slate-500 font-medium">
                              {cls.bengaliName}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {classSecs.length} Section{classSecs.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {classSecs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No sections configured for this class yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {classSecs.map((sec) => (
                            <div
                              key={sec.id}
                              className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  Section {sec.name}
                                </span>
                                {sec.classTeacherName ? (
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Assigned</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              <div>
                                <label className="block text-[10px] font-medium text-slate-400 mb-1">
                                  Designated Class Teacher:
                                </label>
                                <select
                                  value={sec.classTeacherId || ''}
                                  onChange={(e) => handleAssignClassTeacher(sec, e.target.value)}
                                  className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"
                                >
                                  <option value="">-- Select Class Teacher --</option>
                                  {facultyTeachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.firstName} {t.lastName} ({t.designation})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SUBJECT TEACHING ASSIGNMENTS & WORKLOAD */}
      {subTab === 'subject_workload' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by teacher, subject, or class..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Teachers</option>
                {facultyTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignments Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Faculty / Teacher Name</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Subject Name</th>
                    <th className="px-4 py-3 text-center">Periods / Week</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-xs">No teaching assignments found</p>
                        <p className="text-[11px] mt-0.5">
                          Click "Assign Subject to Teacher" to distribute subject responsibilities.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {a.teacherName}
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                          {a.className}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {a.sectionName || 'All Sections'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                          {a.subjectName}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {a.periodsPerWeek || 4}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveAssignment(a.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Remove assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Subject Teaching Assignment */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assign Subject to Teacher
                </h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleSaveSubjectAssignment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Faculty / Teacher *
                </label>
                <select
                  value={modalTeacherId}
                  onChange={(e) => setModalTeacherId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Choose Teacher --</option>
                  {facultyTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Class *
                </label>
                <select
                  value={modalClassId}
                  onChange={(e) => {
                    setModalClassId(e.target.value);
                    setModalSectionId('');
                    setModalSubjectId('');
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {modalClassId && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Section (Optional - leave empty for all sections)
                    </label>
                    <select
                      value={modalSectionId}
                      onChange={(e) => setModalSectionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">All Sections</option>
                      {modalClassSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          Section {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Subject *
                    </label>
                    <select
                      value={modalSubjectId}
                      onChange={(e) => setModalSubjectId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose Subject --</option>
                      {modalClassSubjects.map((sb) => (
                        <option key={sb.id} value={sb.id}>
                          {sb.name} ({sb.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Weekly Periods / Workload
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={modalPeriods}
                      onChange={(e) => setModalPeriods(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !modalSubjectId || !modalTeacherId}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Assigning...' : 'Assign Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
