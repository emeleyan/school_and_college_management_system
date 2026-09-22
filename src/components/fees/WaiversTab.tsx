import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentFeeWaiver, Student, ClassItem } from '../../types';
import { putItem, deleteItem } from '../../db/indexedDB';
import { Award, Plus, Trash2, CheckCircle2, UserCheck, ShieldCheck } from 'lucide-react';

interface WaiversTabProps {
  feeWaivers: StudentFeeWaiver[];
  students: Student[];
  classes: ClassItem[];
  onRefresh: () => void;
}

export const WaiversTab: React.FC<WaiversTabProps> = ({
  feeWaivers,
  students,
  classes,
  onRefresh,
}) => {
  const { activeInstitute, logAudit } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [category, setCategory] = useState<StudentFeeWaiver['category']>('merit');
  const [percentage, setPercentage] = useState<number>(50);
  const [remarks, setRemarks] = useState('');
  const [approvedBy, setApprovedBy] = useState('Principal / Headmaster');

  const handleSaveWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    try {
      const wId = `waiver-${student.id}-${Date.now()}`;
      const newWaiver: StudentFeeWaiver = {
        id: wId,
        instituteId: activeInstitute.id,
        studentId: student.id,
        studentName: student.nameEn,
        rollNumber: student.rollNumber || 1,
        className: student.className || 'Class',
        category,
        percentage: Number(percentage) || 0,
        remarks: remarks.trim() || 'Approved institutional waiver',
        approvedBy: approvedBy.trim() || 'Principal',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await putItem('feeWaivers', newWaiver);
      await logAudit(
        'add_fee_waiver',
        'fees',
        `Approved ${percentage}% ${category} waiver for ${student.nameEn} (Roll: ${student.rollNumber})`
      );

      setShowAddModal(false);
      setRemarks('');
      onRefresh();
    } catch (err) {
      console.error('Failed to save waiver:', err);
    }
  };

  const handleDeleteWaiver = async (waiver: StudentFeeWaiver) => {
    if (!confirm(`Revoke waiver for ${waiver.studentName}?`)) return;

    try {
      await deleteItem('feeWaivers', waiver.id);
      await logAudit('revoke_waiver', 'fees', `Revoked waiver for ${waiver.studentName}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to revoke waiver:', err);
    }
  };

  const categoryLabels: Record<StudentFeeWaiver['category'], { label: string; bn: string }> = {
    merit: { label: 'Merit Scholarship', bn: 'মেধাবৃত্তি' },
    poor_fund: { label: 'Poor & Welfare Fund', bn: 'দরিদ্র তহবিল অনুদান' },
    sibling: { label: 'Sibling Discount', bn: 'সহোদর ভাই/বোন ছাড়' },
    teacher_ward: { label: 'Teacher / Staff Ward', bn: 'শিক্ষক-কর্মচারী সন্তান' },
    special: { label: 'Special Managing Committee Waiver', bn: 'ম্যানেজিং কমিটি বিশেষ মওকুফ' },
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Student Fee Waivers &amp; Scholarships (বৃত্তি ও বিশেষ ছাড়)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configured percentage discounts are automatically deducted when generating monthly tuition bills.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Grant New Waiver</span>
        </button>
      </div>

      {/* Waivers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3 px-3 text-center">Roll</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-3">Class</th>
              <th className="py-3 px-3">Waiver Category</th>
              <th className="py-3 px-3 text-center">Discount %</th>
              <th className="py-3 px-4">Remarks / Recommendation</th>
              <th className="py-3 px-3">Approved By</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {feeWaivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No active student waivers registered. Click &quot;Grant New Waiver&quot; to assign scholarships or discounts.
                </td>
              </tr>
            ) : (
              feeWaivers.map((w) => (
                <tr
                  key={w.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                    #{w.rollNumber}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {w.studentName}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {w.className}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {categoryLabels[w.category]?.label || w.category}
                    </span>
                    <span className="block text-[10px] text-blue-600 dark:text-blue-400">
                      ({categoryLabels[w.category]?.bn})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {w.percentage}% OFF
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                    {w.remarks}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                    {w.approvedBy}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleDeleteWaiver(w)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                      title="Revoke Waiver"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grant Waiver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Grant Student Fee Waiver</span>
            </h3>

            <form onSubmit={handleSaveWaiver} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      Roll #{s.rollNumber} - {s.nameEn} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Waiver Category *
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as StudentFeeWaiver['category'])
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="merit">Merit Scholarship (মেধাবৃত্তি)</option>
                  <option value="poor_fund">Poor &amp; Welfare Fund (দরিদ্র তহবিল অনুদান)</option>
                  <option value="sibling">Sibling Discount (সহোদর ভাই/বোন ছাড়)</option>
                  <option value="teacher_ward">Teacher / Staff Ward (শিক্ষক-কর্মচারী সন্তান)</option>
                  <option value="special">Special Managing Committee Waiver (বিশেষ মওকুফ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tuition Fee Waiver Percentage (%) *
                </label>
                <div className="flex items-center gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      type="button"
                      key={pct}
                      onClick={() => setPercentage(pct)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        percentage === pct
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={percentage}
                    onChange={(e) => setPercentage(Number(e.target.value) || 0)}
                    className="w-20 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Approving Authority
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scored GPA 5.0 in JSC or board examination"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Grant Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
