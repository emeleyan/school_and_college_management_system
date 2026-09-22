import React, { useState } from 'react';
import { Institute, AcademicYear } from '../../types';
import {
  FeeCollectionRow,
  DueFeeRow,
  SAMPLE_FEE_COLLECTIONS,
  SAMPLE_DUE_FEES,
} from './sampleReportData';
import { exportToCsv, formatCurrencyBDT } from '../../utils/exportUtils';
import {
  CreditCard,
  AlertCircle,
  Printer,
  Download,
  Receipt,
  Search,
  CheckCircle2,
  DollarSign,
  PhoneCall,
  Calendar,
} from 'lucide-react';

interface FeeReportsTabProps {
  institute: Institute | null;
  academicYear: AcademicYear | null;
  onOpenPrint: (config: {
    title: string;
    subtitle: string;
    columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
    data: Record<string, any>[];
    summaryCards?: { label: string; value: string | number }[];
  }) => void;
}

export const FeeReportsTab: React.FC<FeeReportsTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const [subView, setSubView] = useState<'collection' | 'dues'>('collection');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculations
  const totalCollected = SAMPLE_FEE_COLLECTIONS.reduce((acc, r) => acc + r.amount, 0);
  const totalDues = SAMPLE_DUE_FEES.reduce((acc, r) => acc + r.totalDues, 0);

  const filteredCollections = SAMPLE_FEE_COLLECTIONS.filter(
    (c) =>
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.feeHead.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDues = SAMPLE_DUE_FEES.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrintCollection = () => {
    onOpenPrint({
      title: 'Fee Collection & Cash Counter Daily Statement',
      subtitle: `Official fee receipts, payment gateways, and category-wise realization for Session ${academicYear?.yearName || '2026'}`,
      columns: [
        { header: 'Receipt No', key: 'receiptNo' },
        { header: 'Date', key: 'date', align: 'center' },
        { header: 'Student Name', key: 'studentName' },
        { header: 'Class & Roll', key: 'classRoll' },
        { header: 'Fee Particulars', key: 'feeHead' },
        { header: 'Payment Method', key: 'paymentMethod' },
        { header: 'Amount (৳)', key: 'amountFormatted', align: 'right' },
        { header: 'Collector', key: 'collector' },
      ],
      data: filteredCollections.map((c) => ({
        ...c,
        classRoll: `${c.className} (Roll ${c.roll})`,
        amountFormatted: formatCurrencyBDT(c.amount),
      })),
      summaryCards: [
        { label: 'Total Collections', value: formatCurrencyBDT(totalCollected) },
        { label: 'Transactions Count', value: filteredCollections.length },
        { label: 'Status', value: 'Bank Cleared' },
      ],
    });
  };

  const handlePrintDues = () => {
    onOpenPrint({
      title: 'Student Outstanding Fee Dues & Defaulters Register',
      subtitle: `Class-wise outstanding fee ledger with guardian contact numbers for recovery reminders`,
      columns: [
        { header: 'Adm No', key: 'admissionNo' },
        { header: 'Student Name', key: 'name' },
        { header: 'Class & Section', key: 'classSection' },
        { header: 'Roll', key: 'roll', align: 'center' },
        { header: 'Guardian Name', key: 'guardianName' },
        { header: 'Guardian Phone', key: 'guardianPhone' },
        { header: 'Overdue Period', key: 'dueMonths' },
        { header: 'Outstanding Due (৳)', key: 'dueFormatted', align: 'right' },
        { header: 'Last Paid', key: 'lastPaymentDate', align: 'center' },
      ],
      data: filteredDues.map((d) => ({
        ...d,
        classSection: `${d.className} (${d.sectionName})`,
        dueFormatted: formatCurrencyBDT(d.totalDues),
      })),
      summaryCards: [
        { label: 'Total Outstanding Dues', value: formatCurrencyBDT(totalDues) },
        { label: 'Defaulter Students', value: filteredDues.length },
        { label: 'Action Required', value: 'Guardian Notice' },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-750 rounded-lg">
          <button
            onClick={() => setSubView('collection')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'collection'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Fee Collection Register
          </button>
          <button
            onClick={() => setSubView('dues')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              subView === 'dues'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Outstanding Dues &amp; Defaulters
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search receipt, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (subView === 'collection') {
                const headers = ['Receipt No', 'Date', 'Student', 'Class', 'Roll', 'Fee Head', 'Method', 'Amount', 'Collector'];
                const rows = filteredCollections.map((c) => [
                  c.receiptNo,
                  c.date,
                  c.studentName,
                  c.className,
                  c.roll,
                  c.feeHead,
                  c.paymentMethod,
                  c.amount,
                  c.collector,
                ]);
                exportToCsv('fee_collection_statement', headers, rows);
              } else {
                const headers = ['Adm No', 'Student', 'Class', 'Section', 'Roll', 'Guardian', 'Phone', 'Due Period', 'Total Due', 'Last Paid'];
                const rows = filteredDues.map((d) => [
                  d.admissionNo,
                  d.name,
                  d.className,
                  d.sectionName,
                  d.roll,
                  d.guardianName,
                  d.guardianPhone,
                  d.dueMonths,
                  d.totalDues,
                  d.lastPaymentDate,
                ]);
                exportToCsv('fee_dues_defaulters', headers, rows);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={subView === 'collection' ? handlePrintCollection : handlePrintDues}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recent Collections</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrencyBDT(totalCollected)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified receipts</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Outstanding Fee Dues</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrencyBDT(totalDues)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{SAMPLE_DUE_FEES.length} students overdue</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Collection Efficiency</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            94.5%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">High recovery rate</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Payment Modes</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            Cash, bKash, Bank
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Multi-channel enabled</div>
        </div>
      </div>

      {/* Tables */}
      {subView === 'collection' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Real-time Fee Collection Vouchers &amp; Receipts</span>
            </h4>
            <span className="text-xs text-slate-400">Total: {filteredCollections.length} entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4 text-center">Date</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class &amp; Roll</th>
                  <th className="py-3 px-4">Fee Head / Purpose</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount (৳)</th>
                  <th className="py-3 px-4">Collector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {filteredCollections.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.receiptNo}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {c.date}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {c.studentName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {c.className} (Roll {c.roll})
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {c.feeHead}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {c.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyBDT(c.amount)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {c.collector}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="py-3 px-4" colSpan={6}>
                    Total Reconciled Collections
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black">
                    {formatCurrencyBDT(totalCollected)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    Balanced
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-rose-50/40 dark:bg-rose-950/20">
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Outstanding Fee Defaulters Register</span>
            </h4>
            <span className="text-xs text-rose-600 font-semibold">
              Notice Issuance Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class &amp; Section</th>
                  <th className="py-3 px-4 text-center">Roll</th>
                  <th className="py-3 px-4">Guardian Name</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4">Overdue Months</th>
                  <th className="py-3 px-4 text-right">Total Due (৳)</th>
                  <th className="py-3 px-4 text-center">Last Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {filteredDues.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {d.admissionNo}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                      {d.name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                      {d.className} ({d.sectionName})
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      {d.roll}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">
                      {d.guardianName}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{d.guardianPhone}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-medium">
                      {d.dueMonths}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      {formatCurrencyBDT(d.totalDues)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                      {d.lastPaymentDate}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                <tr>
                  <td className="py-3 px-4" colSpan={7}>
                    Total Uncollected / Overdue Outstanding
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-black">
                    {formatCurrencyBDT(totalDues)}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-500">
                    Follow-up Required
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
