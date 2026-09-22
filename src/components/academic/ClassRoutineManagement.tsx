import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AcademicClass,
  AcademicSection,
  AcademicSubject,
  ClassRoutinePeriod,
  DayOfWeek,
} from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Printer,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  BookOpen,
  User,
  MapPin,
} from 'lucide-react';

const DAYS_LIST: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Saturday',
];

const PERIOD_SLOTS = [
  { num: 1, defaultStart: '08:00 AM', defaultEnd: '08:45 AM' },
  { num: 2, defaultStart: '08:50 AM', defaultEnd: '09:35 AM' },
  { num: 3, defaultStart: '09:40 AM', defaultEnd: '10:25 AM' },
  { num: 4, defaultStart: '10:45 AM', defaultEnd: '11:30 AM' },
  { num: 5, defaultStart: '11:35 AM', defaultEnd: '12:20 PM' },
  { num: 6, defaultStart: '12:25 PM', defaultEnd: '01:10 PM' },
  { num: 7, defaultStart: '01:15 PM', defaultEnd: '02:00 PM' },
];

export const ClassRoutineManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [routines, setRoutines] = useState<ClassRoutinePeriod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<ClassRoutinePeriod | null>(null);

  const [formData, setFormData] = useState({
    dayOfWeek: 'Sunday' as DayOfWeek,
    periodNumber: 1,
    startTime: '08:00 AM',
    endTime: '08:45 AM',
    subjectId: '',
    teacherName: '',
    roomNumber: '',
  });

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchData = async () => {
    if (!activeInstitute) return;
    setLoading(true);
    try {
      const [allClasses, allSections, allSubjects, allRoutines] = await Promise.all([
        getAll<AcademicClass>('classes'),
        getAll<AcademicSection>('sections'),
        getAll<AcademicSubject>('subjects'),
        getAll<ClassRoutinePeriod>('subjectAssignments'),
      ]);

      const instClasses = allClasses
        .filter((c) => c.instituteId === activeInstitute.id)
        .sort((a, b) => a.numericLevel - b.numericLevel);
      const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);
      const instSubjects = allSubjects.filter((s) => s.instituteId === activeInstitute.id);
      const instRoutines = allRoutines.filter((r) => r.instituteId === activeInstitute.id);

      setClasses(instClasses);
      setSections(instSections);
      setSubjects(instSubjects);
      setRoutines(instRoutines);

      if (instClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(instClasses[0].id);
        const firstClassSecs = instSections.filter((s) => s.classId === instClasses[0].id);
        if (firstClassSecs.length > 0) {
          setSelectedSectionId(firstClassSecs[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching class routine data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeInstitute]);

  // Handle class selection changes
  const handleClassChange = (clsId: string) => {
    setSelectedClassId(clsId);
    const secs = sections.filter((s) => s.classId === clsId);
    if (secs.length > 0) {
      setSelectedSectionId(secs[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  // Open modal to add or edit a period for a specific slot
  const openPeriodModal = (day: DayOfWeek, periodNum: number, existing?: ClassRoutinePeriod) => {
    const defaultSlot = PERIOD_SLOTS.find((s) => s.num === periodNum) || PERIOD_SLOTS[0];
    const targetSection = sections.find((s) => s.id === selectedSectionId);

    if (existing) {
      setEditingPeriod(existing);
      setFormData({
        dayOfWeek: existing.dayOfWeek,
        periodNumber: existing.periodNumber,
        startTime: existing.startTime,
        endTime: existing.endTime,
        subjectId: existing.subjectId,
        teacherName: existing.teacherName || '',
        roomNumber: existing.roomNumber || targetSection?.roomNumber || '',
      });
    } else {
      setEditingPeriod(null);
      const classSubjects = subjects.filter((s) => s.classId === selectedClassId);
      setFormData({
        dayOfWeek: day,
        periodNumber: periodNum,
        startTime: defaultSlot.defaultStart,
        endTime: defaultSlot.defaultEnd,
        subjectId: classSubjects[0]?.id || '',
        teacherName: '',
        roomNumber: targetSection?.roomNumber || 'Room 101',
      });
    }
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute || !selectedClassId || !selectedSectionId) return;

    const chosenSubject = subjects.find((s) => s.id === formData.subjectId);
    if (!chosenSubject) {
      setErrorMsg('Please select a valid Subject for this period.');
      return;
    }

    try {
      if (editingPeriod) {
        const updated: ClassRoutinePeriod = {
          ...editingPeriod,
          dayOfWeek: formData.dayOfWeek,
          periodNumber: formData.periodNumber,
          startTime: formData.startTime.trim(),
          endTime: formData.endTime.trim(),
          subjectId: chosenSubject.id,
          subjectName: chosenSubject.name,
          teacherName: formData.teacherName.trim() || undefined,
          roomNumber: formData.roomNumber.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        await update('subjectAssignments', updated);
        await logAudit(
          'UPDATE_ROUTINE_PERIOD',
          'academic',
          `Updated routine: ${updated.dayOfWeek} P${updated.periodNumber} - ${updated.subjectName}`,
          updated.id
        );
        setSuccessMsg(`Period updated for ${formData.dayOfWeek}.`);
      } else {
        const newId = `routine_${selectedSectionId}_${formData.dayOfWeek}_${formData.periodNumber}_${Date.now()}`;
        const created: ClassRoutinePeriod = {
          id: newId,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id || 'default_year',
          classId: selectedClassId,
          sectionId: selectedSectionId,
          dayOfWeek: formData.dayOfWeek,
          periodNumber: formData.periodNumber,
          startTime: formData.startTime.trim(),
          endTime: formData.endTime.trim(),
          subjectId: chosenSubject.id,
          subjectName: chosenSubject.name,
          teacherName: formData.teacherName.trim() || undefined,
          roomNumber: formData.roomNumber.trim() || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await add('subjectAssignments', created);
        await logAudit(
          'CREATE_ROUTINE_PERIOD',
          'academic',
          `Assigned routine: ${created.dayOfWeek} P${created.periodNumber} - ${created.subjectName}`,
          created.id
        );
        setSuccessMsg(`Period created for ${formData.dayOfWeek}.`);
      }

      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save period routine.');
    }
  };

  const handleDeletePeriod = async (period: ClassRoutinePeriod) => {
    if (!window.confirm(`Remove Period ${period.periodNumber} (${period.subjectName})?`)) return;
    try {
      await remove('subjectAssignments', period.id);
      await logAudit(
        'DELETE_ROUTINE_PERIOD',
        'academic',
        `Removed routine period: ${period.dayOfWeek} P${period.periodNumber}`,
        period.id
      );
      setSuccessMsg('Period removed from routine.');
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete period.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeClassObj = classes.find((c) => c.id === selectedClassId);
  const activeSectionObj = sections.find((s) => s.id === selectedSectionId);
  const availableSections = sections.filter((s) => s.classId === selectedClassId);
  const classSubjects = subjects.filter((s) => s.classId === selectedClassId);

  // Filter routine for current selected section
  const sectionRoutines = routines.filter((r) => r.sectionId === selectedSectionId);

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Routine Controls and Print Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.bengaliName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
              Select Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
            >
              {availableSections.length === 0 ? (
                <option value="">No sections created</option>
              ) : (
                availableSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.bengaliName})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Routine</span>
          </button>
        </div>
      </div>

      {/* Routine Timetable Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-5 space-y-4">
        {/* Printable Institution Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4 text-center space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {language === 'bn'
              ? activeInstitute?.bengaliName || activeInstitute?.name
              : activeInstitute?.name}
          </h3>
          <p className="text-xs text-slate-500">
            Official Class Routine &amp; Timetable — Academic Session:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {activeAcademicYear?.yearName || '2026'}
            </strong>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <span>
              Class: <strong>{activeClassObj?.name || 'N/A'}</strong>
            </span>
            <span>•</span>
            <span>
              Section: <strong>{activeSectionObj?.name || 'N/A'}</strong>
            </span>
            <span>•</span>
            <span>
              Room:{' '}
              <strong>{activeSectionObj?.roomNumber || 'Assigned Hall'}</strong>
            </span>
            <span>•</span>
            <span>
              Teacher:{' '}
              <strong>{activeSectionObj?.classTeacherName || 'Class Guide'}</strong>
            </span>
          </div>
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-700">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300">
                <th className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold w-24">
                  Day
                </th>
                {PERIOD_SLOTS.map((slot) => (
                  <th
                    key={slot.num}
                    className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold text-center min-w-[130px]"
                  >
                    <div>Period {slot.num}</div>
                    <div className="text-[10px] font-normal text-slate-500 font-mono">
                      {slot.defaultStart} - {slot.defaultEnd}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_LIST.map((day) => (
                <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="p-2.5 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/40">
                    {day}
                  </td>
                  {PERIOD_SLOTS.map((slot) => {
                    const match = sectionRoutines.find(
                      (r) => r.dayOfWeek === day && r.periodNumber === slot.num
                    );
                    return (
                      <td
                        key={slot.num}
                        className="p-2 border border-slate-200 dark:border-slate-700 text-center align-top relative group min-h-[70px]"
                      >
                        {match ? (
                          <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-left space-y-1">
                            <div className="font-bold text-blue-950 dark:text-blue-200 text-xs truncate">
                              {match.subjectName}
                            </div>
                            {match.teacherName && (
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 truncate">
                                <User className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                <span>{match.teacherName}</span>
                              </div>
                            )}
                            <div className="text-[9px] text-slate-400 font-mono">
                              {match.startTime} - {match.endTime}
                            </div>
                            <div className="pt-1 flex items-center justify-end gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openPeriodModal(day, slot.num, match)}
                                className="p-0.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeletePeriod(match)}
                                className="p-0.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center p-2">
                            <button
                              onClick={() => openPeriodModal(day, slot.num)}
                              className="hidden group-hover:inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 rounded text-[10px] transition-colors cursor-pointer print:hidden"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Assign</span>
                            </button>
                            <span className="group-hover:hidden text-[11px] text-slate-300 dark:text-slate-600">
                              -
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routine Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingPeriod ? 'Edit Period Details' : `Assign Period ${formData.periodNumber}`} (
                {formData.dayOfWeek})
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="">-- Choose Subject --</option>
                  {classSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.bengaliName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Teacher
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rafiqul Islam"
                  value={formData.teacherName}
                  onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 101 or Science Lab 2"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
