import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FeePaymentRecord, StudentFeeInvoice } from '../../types';
import { deleteItem, putItem } from '../../db/indexedDB';
import { MoneyReceiptModal } from './MoneyReceiptModal';
import {
  DollarSign,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Building2,
  Trash2,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface DailyCollectionTabProps {
  payments: FeePaymentRecord[];
  invoices: StudentFeeInvoice[];
  onRefresh: () => void;
}

export const DailyCollectionTab: React.FC<DailyCollectionTabProps> = ({
  payments,
  invoices,
  onRefresh,
}) => {
  const { activeInstitute, currentUser, logAudit } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [activeReceipt, setActiveReceipt] = useState<FeePaymentRecord | null>(null);

  // Filter payments by date and method
  const filteredPayments = payments.filter((p) => {
    if (selectedDate && p.paymentDate !== selectedDate) return false;
    if (methodFilter !== 'all' && p.paymentMethod !== methodFilter) return false;
    return true;
  });

  // Calculate breakdown
  const totalCollected = filteredPayments.reduce((acc, p) => acc + p.totalCollected, 0);

  const cashCollected = filteredPayments
    .filter((p) => p.paymentMethod === 'cash')
    .reduce((acc, p) => acc + p.totalCollected, 0);

  const mobileBankingCollected = filteredPayments
    .filter((p) => ['bkash', 'nagad', 'rocket'].includes(p.paymentMethod))
    .reduce((acc, p) => acc + p.totalCollected, 0);

  const bankCollected = filteredPayments
    .filter((p) => ['bank_challan', 'pos'].includes(p.paymentMethod))
    .reduce((acc, p) => acc + p.totalCollected, 0);

  const handleVoidPayment = async (p: FeePaymentRecord) => {
    if (
      !confirm(
        `Are you sure you want to VOID receipt #${p.receiptNumber} for ${p.studentName} (৳${p.totalCollected})? This will revert invoice status to unpaid.`
      )
    )
      return;

    try {
      // 1. Delete payment record
      await deleteItem('payments', p.id);

      // 2. Revert invoice if exists
      if (p.invoiceId) {
        const inv = invoices.find((i) => i.id === p.invoiceId);
        if (inv) {
          const updatedInv: StudentFeeInvoice = {
            ...inv,
            paidAmount: Math.max(0, inv.paidAmount - p.paidAmount),
            dueAmount: inv.dueAmount + p.paidAmount,
            status: 'unpaid',
            updatedAt: new Date().toISOString(),
          };
          await putItem('feeCharges', updatedInv);
        }
      }

      await logAudit(
        'void_payment',
        'fees',
        `Voided receipt #${p.receiptNumber} of ৳${p.totalCollected} for ${p.studentName}`
      );

      onRefresh();
    } catch (err) {
      console.error('Failed to void payment:', err);
    }
  };

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = [
      'Receipt #',
      'Date',
      'Student Name',
      'Roll',
      'Class',
      'Section',
      'Month Covered',
      'Method',
      'Trx Ref',
      'Amount (BDT)',
      'Fine (BDT)',
      'Total Received (BDT)',
      'Collected By',
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber,
      p.paymentDate,
      `"${p.studentName}"`,
      p.rollNumber,
      p.className,
      p.sectionName,
      `"${p.monthCovered}"`,
      p.paymentMethod,
      p.transactionRef || 'N/A',
      p.paidAmount,
      p.lateFinePaid,
      p.totalCollected,
      `"${p.collectedBy}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daily_Collection_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Date & Filter Selector Toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Collection Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-medium"
              >
                Today
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Payment Method
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash Only (নগদ)</option>
              <option value="bkash">bKash (বিকাশ)</option>
              <option value="nagad">Nagad (নগদ)</option>
              <option value="bank_challan">Bank Challan</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Daily Register</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Collection on Date
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{totalCollected.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {filteredPayments.length} Receipts Issued
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Cash in Hand (নগদ জমা)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ৳{cashCollected.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Physical counter cash</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            bKash / Nagad / Rocket
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ৳{mobileBankingCollected.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">MFS digital merchant</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
            Bank Challan &amp; Cheque
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ৳{bankCollected.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Institutional bank account</span>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Receipt #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-2 text-center">Roll</th>
                <th className="py-3 px-3">Class &amp; Sec</th>
                <th className="py-3 px-3">Month Covered</th>
                <th className="py-3 px-3">Channel / Method</th>
                <th className="py-3 px-3 text-right">Collected (৳)</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No payment collections recorded for this date.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {p.receiptNumber}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.studentName}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                      #{p.rollNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {p.className} ({p.sectionName})
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {p.monthCovered}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {p.paymentMethod}
                      </span>
                      {p.transactionRef && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          {p.transactionRef}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ৳{p.totalCollected.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {p.collectedBy}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActiveReceipt(p)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleVoidPayment(p)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                          title="Void / Revert Receipt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reprint Receipt Modal */}
      {activeReceipt && (
        <MoneyReceiptModal
          payment={activeReceipt}
          invoice={invoices.find((i) => i.id === activeReceipt.invoiceId)}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
