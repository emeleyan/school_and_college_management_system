import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamTerm, ExamScheduleSlot, ClassItem, AcademicSubject } from '../../types';
import { putItem, deleteItem } from '../../db/indexedDB';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Printer,
  Search,
  Filter,
  Building,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface ExamScheduleTabProps {
  terms: ExamTerm[];
  schedules: ExamScheduleSlot[];
  classes: ClassItem[];
  subjects: AcademicSubject[];
  selectedTermId: string;
  onSelectTermId: (id: string) => void;
  onRefresh: () => void;
}

export const ExamScheduleTab: React.FC<ExamScheduleTabProps> = ({
  terms,
  schedules,
  classes,
  subjects,
  selectedTermId,
  onSelectTermId,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, language } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const [slotForm, setSlotForm] = useState({
    classId: classes[0]?.id || '',
    subjectId: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '13:00',
    roomNumber: 'Main Hall',
    fullMarks: 100,
    theoryMarks: 70,
    mcqMarks: 30,
    practicalMarks: 0,
  });

  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms[0];

  const filteredSlots = schedules.filter((s) => {
    if (s.examTermId !== activeTerm?.id) return false;
    if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
    return true;
  });

  // Sort by exam date then start time
  filteredSlots.sort((a, b) => {
    if (a.examDate !== b.examDate) return a.examDate.localeCompare(b.examDate);
    return a.startTime.localeCompare(b.startTime);
  });

  const handleClassChangeInModal = (clsId: string) => {
    const classSubjs = subjects.filter((sub) => sub.classId === clsId || !sub.classId);
    setSlotForm({
      ...slotForm,
      classId: clsId,
      subjectId: classSubjs[0]?.id || '',
      fullMarks: classSubjs[0]?.fullMarks || 100,
      theoryMarks: classSubjs[0]?.theoryMarks || 70,
      mcqMarks: classSubjs[0]?.mcqMarks || 30,
      practicalMarks: classSubjs[0]?.practicalMarks || 0,
    });
  };

  const handleSubjectChangeInModal = (subId: string) => {
    const sub = subjects.find((s) => s.id === subId);
    if (sub) {
      setSlotForm({
        ...slotForm,
        subjectId: subId,
        fullMarks: sub.fullMarks || 100,
        theoryMarks: sub.theoryMarks || (sub.hasPractical ? 50 : 70),
        mcqMarks: sub.mcqMarks || 30,
        practicalMarks: sub.practicalMarks || (sub.hasPractical ? 20 : 0),
      });
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute || !activeTerm) return;

    const cls = classes.find((c) => c.id === slotForm.classId);
    const sub = subjects.find((s) => s.id === slotForm.subjectId);

    if (!cls || !sub) return;

    try {
      const slot: ExamScheduleSlot = {
        id: `slot-${Date.now()}`,
        examTermId: activeTerm.id,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || '',
        classId: cls.id,
        className: cls.name,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code || '101',
        examDate: slotForm.examDate,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        roomNumber: slotForm.roomNumber.trim(),
        fullMarks: Number(slotForm.fullMarks),
        theoryMarks: Number(slotForm.theoryMarks),
        mcqMarks: Number(slotForm.mcqMarks),
        practicalMarks: Number(slotForm.practicalMarks),
        createdAt: new Date().toISOString(),
      };

      await putItem('examSchedules', slot);
      await logAudit(
        'create_exam_schedule',
        'examination',
        `Scheduled exam: ${sub.name} for ${cls.name} on ${slot.examDate}`
      );

      setShowModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to schedule exam slot:', err);
    }
  };

  const handleDeleteSlot = async (slot: ExamScheduleSlot) => {
    if (!confirm(`Remove exam schedule for ${slot.subjectName} (${slot.className})?`)) return;

    try {
      await deleteItem('examSchedules', slot.id);
      await logAudit(
        'delete_exam_schedule',
        'examination',
        `Removed exam schedule: ${slot.subjectName} for ${slot.className}`
      );
      onRefresh();
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Term Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Examination Term
            </label>
            <select
              value={activeTerm?.id || ''}
              onChange={(e) => onSelectTermId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Routine</span>
          </button>

          <button
            onClick={() => {
              if (classes.length > 0) {
                handleClassChangeInModal(classes[0].id);
              }
              setShowModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Routine Slot</span>
          </button>
        </div>
      </div>

      {/* Routine Table / Printable View */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {activeTerm?.name || 'Examination Routine'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeInstitute?.name} • Session {activeAcademicYear?.yearName || '2026'}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
            Total Papers: {filteredSlots.length}
          </span>
        </div>

        {filteredSlots.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No exam slots scheduled for this term
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Add Routine Slot" to schedule examination dates, time, and room allocations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Date &amp; Day</th>
                  <th className="px-4 py-3">Time Window</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Subject &amp; Code</th>
                  <th className="px-4 py-3 text-center">Marks Distribution (CQ/MCQ/Prac)</th>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredSlots.map((slot) => {
                  const dateObj = new Date(slot.examDate);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                  return (
                    <tr
                      key={slot.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {slot.examDate}
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                          {dayName}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                          {slot.className}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div>{slot.subjectName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Code: {slot.subjectCode}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {slot.fullMarks} Marks
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          CQ: {slot.theoryMarks} | MCQ: {slot.mcqMarks} | Prac: {slot.practicalMarks}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                        {slot.roomNumber || 'Main Hall'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteSlot(slot)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Delete routine slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Schedule New Slot */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add Routine Schedule Slot
            </h3>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class *
                </label>
                <select
                  value={slotForm.classId}
                  onChange={(e) => handleClassChangeInModal(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject *
                </label>
                <select
                  value={slotForm.subjectId}
                  onChange={(e) => handleSubjectChangeInModal(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {subjects
                    .filter((s) => s.classId === slotForm.classId || !s.classId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || '101'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={slotForm.examDate}
                    onChange={(e) => setSlotForm({ ...slotForm, examDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Hall
                  </label>
                  <input
                    type="text"
                    value={slotForm.roomNumber}
                    onChange={(e) => setSlotForm({ ...slotForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    CQ / Theory
                  </label>
                  <input
                    type="number"
                    value={slotForm.theoryMarks}
                    onChange={(e) => setSlotForm({ ...slotForm, theoryMarks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    MCQ
                  </label>
                  <input
                    type="number"
                    value={slotForm.mcqMarks}
                    onChange={(e) => setSlotForm({ ...slotForm, mcqMarks: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Practical
                  </label>
                  <input
                    type="number"
                    value={slotForm.practicalMarks}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, practicalMarks: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
