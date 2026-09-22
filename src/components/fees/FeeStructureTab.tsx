import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeeHeadItem, FeeStructureItem, ClassItem } from '../../types';
import { putItem, deleteItem } from '../../db/indexedDB';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Tag,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface FeeStructureTabProps {
  feeHeads: FeeHeadItem[];
  feeStructures: FeeStructureItem[];
  classes: ClassItem[];
  onRefresh: () => void;
}

export const FeeStructureTab: React.FC<FeeStructureTabProps> = ({
  feeHeads,
  feeStructures,
  classes,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit } = useApp();

  const [activeSubView, setActiveSubView] = useState<'heads' | 'structures'>('structures');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Modals
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);

  // New Fee Head Form
  const [headForm, setHeadForm] = useState({
    name: '',
    bengaliName: '',
    code: '',
    frequency: 'monthly' as FeeHeadItem['frequency'],
    description: '',
    isMandatory: true,
  });

  // Fee Structure Form
  const [structForm, setStructForm] = useState({
    classId: classes[0]?.id || '',
    feeHeadId: feeHeads[0]?.id || '',
    amount: 1000,
    dueDateDayOfMonth: 15,
    lateFineAmount: 50,
  });

  const handleSaveFeeHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    try {
      const hId = `fh-${Date.now()}`;
      const item: FeeHeadItem = {
        id: hId,
        instituteId: activeInstitute.id,
        name: headForm.name.trim(),
        bengaliName: headForm.bengaliName.trim(),
        code: headForm.code.trim().toUpperCase() || 'FEE',
        frequency: headForm.frequency,
        description: headForm.description.trim() || undefined,
        isMandatory: headForm.isMandatory,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await putItem('feeTypes', item);
      await logAudit('add_fee_head', 'fees', `Added Fee Head ${item.name} (${item.bengaliName})`);

      setShowHeadModal(false);
      setHeadForm({
        name: '',
        bengaliName: '',
        code: '',
        frequency: 'monthly',
        description: '',
        isMandatory: true,
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to save fee head:', err);
    }
  };

  const handleDeleteFeeHead = async (head: FeeHeadItem) => {
    if (!confirm(`Delete fee head "${head.name}"?`)) return;

    try {
      await deleteItem('feeTypes', head.id);
      await logAudit('delete_fee_head', 'fees', `Deleted Fee Head ${head.name}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete fee head:', err);
    }
  };

  const handleSaveFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    const cls = classes.find((c) => c.id === structForm.classId);
    const head = feeHeads.find((h) => h.id === structForm.feeHeadId);

    try {
      const sId = `fs-${structForm.classId}-${structForm.feeHeadId}`;
      const item: FeeStructureItem = {
        id: sId,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || 'ay-2026',
        classId: structForm.classId,
        className: cls?.name || 'Class',
        feeHeadId: structForm.feeHeadId,
        feeHeadName: head?.name || 'Fee Head',
        amount: Number(structForm.amount) || 0,
        dueDateDayOfMonth: Number(structForm.dueDateDayOfMonth) || 15,
        lateFineAmount: Number(structForm.lateFineAmount) || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await putItem('feeStructures', item);
      await logAudit(
        'set_fee_structure',
        'fees',
        `Set ${item.feeHeadName} for ${item.className} to ৳${item.amount}`
      );

      setShowStructureModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save fee structure:', err);
    }
  };

  const handleDeleteFeeStructure = async (struct: FeeStructureItem) => {
    if (!confirm(`Remove structure for ${struct.feeHeadName} in ${struct.className}?`)) return;

    try {
      await deleteItem('feeStructures', struct.id);
      await logAudit('delete_fee_structure', 'fees', `Deleted fee structure ${struct.id}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete fee structure:', err);
    }
  };

  const filteredStructures = feeStructures.filter(
    (fs) => selectedClassId === 'all' || fs.classId === selectedClassId
  );

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubView('structures')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubView === 'structures'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Class-Wise Fee Rates ({feeStructures.length})
          </button>
          <button
            onClick={() => setActiveSubView('heads')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeSubView === 'heads'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Fee Heads &amp; Categories ({feeHeads.length})
          </button>
        </div>

        {activeSubView === 'structures' ? (
          <button
            onClick={() => {
              setStructForm({
                classId: classes[0]?.id || '',
                feeHeadId: feeHeads[0]?.id || '',
                amount: 1000,
                dueDateDayOfMonth: 15,
                lateFineAmount: 50,
              });
              setShowStructureModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Configure Class Rate</span>
          </button>
        ) : (
          <button
            onClick={() => setShowHeadModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fee Head</span>
          </button>
        )}
      </div>

      {/* VIEW 1: Class-Wise Fee Rates */}
      {activeSubView === 'structures' && (
        <div className="space-y-4">
          {/* Class Filter */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">Filter by Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredStructures.length} fee rules
            </span>
          </div>

          {/* Structures Grid / Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Fee Head</th>
                  <th className="py-3 px-4 text-right">Amount (৳)</th>
                  <th className="py-3 px-4 text-center">Due Day of Month</th>
                  <th className="py-3 px-4 text-right">Late Fine (৳)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredStructures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No class fee structures configured yet. Click &quot;Configure Class Rate&quot; to set up monthly and term fees.
                    </td>
                  </tr>
                ) : (
                  filteredStructures.map((fs) => (
                    <tr
                      key={fs.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {fs.className}
                      </td>
                      <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">
                        {fs.feeHeadName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ৳{fs.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-300">
                        {fs.dueDateDayOfMonth || 15}th of month
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-600 font-bold">
                        {fs.lateFineAmount ? `+৳${fs.lateFineAmount}` : 'None'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                          {fs.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteFeeStructure(fs)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          title="Delete Structure"
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
        </div>
      )}

      {/* VIEW 2: Fee Heads Catalog */}
      {activeSubView === 'heads' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeHeads.map((head) => (
            <div
              key={head.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {head.name}
                    </h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      {head.bengaliName}
                    </p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {head.code}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2">
                  {head.description || 'Institutional fee category for student billing'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="capitalize px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    {head.frequency}
                  </span>
                  {head.isMandatory && (
                    <span className="text-[10px] text-amber-600 font-bold">Mandatory</span>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteFeeHead(head)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                  title="Delete Fee Head"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Fee Head */}
      {showHeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add Fee Head / Category
            </h3>

            <form onSubmit={handleSaveFeeHead} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Tuition Fee"
                  value={headForm.name}
                  onChange={(e) => setHeadForm({ ...headForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Name (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাসিক বেতন"
                  value={headForm.bengaliName}
                  onChange={(e) => setHeadForm({ ...headForm, bengaliName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TUITION"
                    value={headForm.code}
                    onChange={(e) => setHeadForm({ ...headForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={headForm.frequency}
                    onChange={(e) =>
                      setHeadForm({
                        ...headForm,
                        frequency: e.target.value as FeeHeadItem['frequency'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="monthly">Monthly (মাসিক)</option>
                    <option value="termly">Termly (পরীক্ষা/টার্ম)</option>
                    <option value="annually">Annually (বার্ষিক/সেশন)</option>
                    <option value="one_time">One-Time (এককালীন/ভর্তি)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Optional details or policy notes"
                  value={headForm.description}
                  onChange={(e) => setHeadForm({ ...headForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="head-mandatory"
                  checked={headForm.isMandatory}
                  onChange={(e) => setHeadForm({ ...headForm, isMandatory: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="head-mandatory" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Mandatory fee for all enrolled students in class
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowHeadModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Fee Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Configure Fee Structure */}
      {showStructureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Configure Class Fee Rate
            </h3>

            <form onSubmit={handleSaveFeeStructure} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Class *
                </label>
                <select
                  value={structForm.classId}
                  onChange={(e) => setStructForm({ ...structForm, classId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                  Fee Head *
                </label>
                <select
                  value={structForm.feeHeadId}
                  onChange={(e) => setStructForm({ ...structForm, feeHeadId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {feeHeads.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.bengaliName}) - {h.frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount in BDT (৳) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={structForm.amount}
                  onChange={(e) =>
                    setStructForm({ ...structForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Day of Month
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={structForm.dueDateDayOfMonth}
                    onChange={(e) =>
                      setStructForm({
                        ...structForm,
                        dueDateDayOfMonth: parseInt(e.target.value) || 15,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Late Fine (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={structForm.lateFineAmount}
                    onChange={(e) =>
                      setStructForm({
                        ...structForm,
                        lateFineAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-amber-600 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Rate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
