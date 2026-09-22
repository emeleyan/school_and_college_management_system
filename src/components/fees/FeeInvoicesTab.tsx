import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  StudentFeeInvoice,
  ClassItem,
  SectionItem,
  FeeHeadItem,
  FeeStructureItem,
  Student,
  StudentFeeWaiver,
} from '../../types';
import { putItem, deleteItem } from '../../db/indexedDB';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface FeeInvoicesTabProps {
  invoices: StudentFeeInvoice[];
  classes: ClassItem[];
  sections: SectionItem[];
  students: Student[];
  feeHeads: FeeHeadItem[];
  feeStructures: FeeStructureItem[];
  feeWaivers: StudentFeeWaiver[];
  onRefresh: () => void;
}

export const FeeInvoicesTab: React.FC<FeeInvoicesTabProps> = ({
  invoices,
  classes,
  sections,
  students,
  feeHeads,
  feeStructures,
  feeWaivers,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, hasPermission } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchRollOrName, setSearchRollOrName] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Batch Generation Form State
  const [genMonth, setGenMonth] = useState('April 2026');
  const [genClassId, setGenClassId] = useState('all');
  const [genDueDate, setGenDueDate] = useState('2026-04-15');
  const [genBillingDate, setGenBillingDate] = useState('2026-04-01');

  // Month list from invoices
  const availableMonths = Array.from(new Set(invoices.map((i) => i.month)));

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedClassId !== 'all' && inv.classId !== selectedClassId) return false;
    if (selectedSectionId !== 'all' && inv.sectionId !== selectedSectionId) return false;
    if (selectedMonth !== 'all' && inv.month !== selectedMonth) return false;
    if (selectedStatus !== 'all' && inv.status !== selectedStatus) return false;
    if (searchRollOrName) {
      const q = searchRollOrName.toLowerCase();
      const matchName = inv.studentName.toLowerCase().includes(q);
      const matchRoll = inv.rollNumber.toString().includes(q);
      const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchInv) return false;
    }
    return true;
  });

  // Aggregates
  const totalInvoiced = filteredInvoices.reduce((acc, i) => acc + i.payableAmount, 0);
  const totalCollected = filteredInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalDue = filteredInvoices.reduce((acc, i) => acc + i.dueAmount, 0);
  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : '0';

  const handleBatchGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;
    setIsGenerating(true);

    try {
      const targetStudents = students.filter(
        (s) => genClassId === 'all' || s.classId === genClassId
      );

      let createdCount = 0;

      for (const st of targetStudents) {
        // Find existing invoice for this month
        const exists = invoices.some(
          (inv) => inv.studentId === st.id && inv.month === genMonth
        );
        if (exists) continue;

        // Find applicable fee structures for student's class
        const classStructures = feeStructures.filter(
          (fs) => fs.classId === st.classId && fs.status === 'active'
        );

        const items = classStructures.map((cs) => {
          let discount = 0;
          // Check tuition waiver
          if (cs.feeHeadName.toLowerCase().includes('tuition')) {
            const waiver = feeWaivers.find(
              (w) => w.studentId === st.id && w.status === 'active'
            );
            if (waiver) {
              discount = Math.round((cs.amount * waiver.percentage) / 100);
            }
          }

          return {
            feeHeadId: cs.feeHeadId,
            feeHeadName: cs.feeHeadName,
            amount: cs.amount,
            waiverDiscount: discount,
            netAmount: cs.amount - discount,
          };
        });

        // Default item if no structure configured yet
        if (items.length === 0) {
          items.push({
            feeHeadId: 'fh-default',
            feeHeadName: 'Monthly Tuition Fee',
            amount: 800,
            waiverDiscount: 0,
            netAmount: 800,
          });
        }

        const sumTotal = items.reduce((acc, it) => acc + it.amount, 0);
        const sumWaiver = items.reduce((acc, it) => acc + it.waiverDiscount, 0);
        const payable = sumTotal - sumWaiver;

        const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

        const stName = `${st.firstName || ''} ${st.lastName || ''}`.trim() || (st as any).name || (st as any).nameEn || 'Student';
        const stClassName = classes.find((c) => c.id === st.classId)?.name || (st as any).className || 'Class';
        const stSectionName = sections.find((s) => s.id === st.sectionId)?.name || (st as any).sectionName || 'A';

        const newInv: StudentFeeInvoice = {
          id: `inv-${st.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          invoiceNumber: invNumber,
          instituteId: activeInstitute.id,
          academicYearId: activeAcademicYear?.id || 'ay-2026',
          studentId: st.id,
          studentName: stName,
          rollNumber: st.rollNumber || 1,
          classId: st.classId || 'class-01',
          className: stClassName,
          sectionId: st.sectionId || 'sec-01',
          sectionName: stSectionName,
          month: genMonth,
          billingDate: genBillingDate,
          dueDate: genDueDate,
          items,
          totalAmount: sumTotal,
          totalWaiver: sumWaiver,
          payableAmount: payable,
          paidAmount: 0,
          dueAmount: payable,
          lateFine: 0,
          status: 'unpaid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await putItem('feeCharges', newInv);
        createdCount++;
      }

      await logAudit(
        'batch_invoices',
        'fees',
        `Generated ${createdCount} monthly invoices for month ${genMonth}`
      );

      setShowGenerateModal(false);
      onRefresh();
      alert(`Successfully generated ${createdCount} invoices for ${genMonth}!`);
    } catch (err) {
      console.error('Failed to generate batch invoices:', err);
      alert('Error generating invoices.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteInvoice = async (inv: StudentFeeInvoice) => {
    if (inv.paidAmount > 0) {
      alert('Cannot delete an invoice that has payments recorded against it.');
      return;
    }
    if (!confirm(`Delete invoice ${inv.invoiceNumber} for ${inv.studentName}?`)) return;

    try {
      await deleteItem('feeCharges', inv.id);
      await logAudit('delete_invoice', 'fees', `Deleted invoice ${inv.invoiceNumber}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete invoice:', err);
    }
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) return;

    const headers = [
      'Invoice #',
      'Student Name',
      'Roll',
      'Class',
      'Section',
      'Month',
      'Total Amount',
      'Waiver',
      'Payable',
      'Paid',
      'Due',
      'Late Fine',
      'Status',
      'Due Date',
    ];

    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      `"${i.studentName}"`,
      i.rollNumber,
      i.className,
      i.sectionName,
      i.month,
      i.totalAmount,
      i.totalWaiver,
      i.payableAmount,
      i.paidAmount,
      i.dueAmount,
      i.lateFine,
      i.status,
      i.dueDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Financial Aggregates Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Billed / Invoiced
          </span>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
            ৳{totalInvoiced.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">{filteredInvoices.length} Invoices</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            ৳{totalCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">{collectionRate}% Recovery Rate</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider block">
            Outstanding Due
          </span>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 font-mono mt-1">
            ৳{totalDue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">
            {filteredInvoices.filter((i) => i.status !== 'paid').length} unpaid bills
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Batch Billing
            </span>
            <span className="text-xs text-slate-500 mt-1 block">Generate monthly fees</span>
          </div>

          {hasPermission('fees', 'add') && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Invoices</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Class
            </label>
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

          {/* Month Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Billing Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Search Roll or Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Filter by Student / Roll / Inv #
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchRollOrName}
              onChange={(e) => setSearchRollOrName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasPermission('fees', 'export') && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoices Master Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-2 text-center">Roll</th>
                <th className="py-3 px-3">Class &amp; Sec</th>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3 text-right">Payable (৳)</th>
                <th className="py-3 px-3 text-right">Paid (৳)</th>
                <th className="py-3 px-3 text-right">Due (৳)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Due Date</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No fee invoices found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {inv.studentName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                      #{inv.rollNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {inv.className} ({inv.sectionName})
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {inv.month}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ৳{inv.payableAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{inv.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                      ৳{inv.dueAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'partial'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                      {inv.dueDate}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasPermission('fees', 'delete') && (
                        <button
                          onClick={() => handleDeleteInvoice(inv)}
                          disabled={inv.paidAmount > 0}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                          title={inv.paidAmount > 0 ? 'Cannot delete paid invoice' : 'Delete Invoice'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Invoice Generation Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Batch Generate Monthly Invoices</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Generate individual student fee bills from class fee structures with automatic waiver deductions.
            </p>

            <form onSubmit={handleBatchGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Month &amp; Year *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. April 2026"
                  value={genMonth}
                  onChange={(e) => setGenMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Class
                </label>
                <select
                  value={genClassId}
                  onChange={(e) => setGenClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="all">All Classes in Institute ({students.length} Students)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    required
                    value={genBillingDate}
                    onChange={(e) => setGenBillingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-semibold">Automated Features:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Pulls rates from configured class fee structures.</li>
                  <li>Automatically deducts scholarship/poor fund waivers.</li>
                  <li>Skips students who already have an invoice for this month.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
