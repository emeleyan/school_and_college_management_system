import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialVoucher, StaffPayrollItem, Teacher } from '../../types';
import {
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  DollarSign,
  Download,
  Building,
  UserCheck,
} from 'lucide-react';

interface PayrollTabProps {
  payrollItems: StaffPayrollItem[];
  teachers: Teacher[];
  onDisburseSalary: (payrollItem: StaffPayrollItem, method: 'bank_transfer' | 'cash') => Promise<void>;
  onBatchDisburse: (month: string) => Promise<void>;
  onGeneratePayrollSheet: (month: string) => Promise<void>;
  onPrintPayslip: (payrollItem: StaffPayrollItem) => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  payrollItems,
  teachers,
  onDisburseSalary,
  onBatchDisburse,
  onGeneratePayrollSheet,
  onPrintPayslip,
}) => {
  const { language } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>('March 2026');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDisbursingBatch, setIsDisbursingBatch] = useState<boolean>(false);

  const months = [
    'March 2026',
    'February 2026',
    'January 2026',
    'December 2025',
    'November 2025',
    'October 2025',
  ];

  // Current month payroll records
  const monthRecords = payrollItems.filter((p) => p.month === selectedMonth);

  // Filtered records
  const filteredRecords = monthRecords.filter((p) => {
    if (filterStatus !== 'all' && p.paymentStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = p.teacherName.toLowerCase().includes(q);
      const matchesDesig = p.designation.toLowerCase().includes(q);
      const matchesAcc = (p.bankAccountNumber || '').toLowerCase().includes(q);
      if (!matchesName && !matchesDesig && !matchesAcc) return false;
    }
    return true;
  });

  // KPI calculations for selected month
  const totalStaff = monthRecords.length;
  const grossTotal = monthRecords.reduce((sum, p) => sum + p.grossSalary, 0);
  const deductionsTotal = monthRecords.reduce((sum, p) => sum + p.totalDeductions, 0);
  const netPayableTotal = monthRecords.reduce((sum, p) => sum + p.netPayable, 0);
  const paidCount = monthRecords.filter((p) => p.paymentStatus === 'paid').length;
  const pendingCount = totalStaff - paidCount;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGeneratePayrollSheet(selectedMonth);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchPay = async () => {
    if (!window.confirm(`Disburse salary to all ${pendingCount} pending staff for ${selectedMonth}?`)) {
      return;
    }
    setIsDisbursingBatch(true);
    try {
      await onBatchDisburse(selectedMonth);
    } finally {
      setIsDisbursingBatch(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* MONTH SELECTOR & SUMMARY HEADER */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {language === 'bn' ? 'বেতন মাস নির্বাচন:' : 'Payroll Month:'}
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {monthRecords.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Generating...' : 'Generate Payroll Sheet'}</span>
            </button>
          )}
        </div>

        {/* Batch Actions */}
        <div className="flex items-center gap-2">
          {pendingCount > 0 && monthRecords.length > 0 && (
            <button
              onClick={handleBatchPay}
              disabled={isDisbursingBatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>
                {isDisbursingBatch
                  ? 'Disbursing...'
                  : `Batch Pay Remaining (${pendingCount})`}
              </span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Salary Sheet</span>
          </button>
        </div>
      </div>

      {/* MONTH SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
          <div className="text-[11px] font-semibold text-slate-500">Total Staff / Faculty</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            {totalStaff} Persons
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Govt MPO &amp; Institutional</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
          <div className="text-[11px] font-semibold text-slate-500">Gross Salary</div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
            ৳{grossTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Basic + Allowances</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
          <div className="text-[11px] font-semibold text-slate-500">Deductions (GPF/CPF)</div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            ৳{deductionsTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Provident &amp; Welfare fund</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
          <div className="text-[11px] font-semibold text-slate-500">Net Disbursement</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            ৳{netPayableTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {paidCount} paid • {pendingCount} pending
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty name, designation, A/C..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All ({totalStaff})
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Paid ({paidCount})
          </button>
          <button
            onClick={() => setFilterStatus('unpaid')}
            className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
              filterStatus === 'unpaid'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Pending ({pendingCount})
          </button>
        </div>
      </div>

      {/* PAYROLL TABLE */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
              <tr>
                <th className="py-3 px-4 font-semibold">Faculty / Staff</th>
                <th className="py-3 px-4 font-semibold">Scale</th>
                <th className="py-3 px-4 font-semibold">Bank Account</th>
                <th className="py-3 px-4 font-semibold text-right">Basic Pay</th>
                <th className="py-3 px-4 font-semibold text-right">Allowances</th>
                <th className="py-3 px-4 font-semibold text-right">Deductions</th>
                <th className="py-3 px-4 font-semibold text-right">Net Payable</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div>No salary records found for this month</div>
                    {monthRecords.length === 0 && (
                      <button
                        onClick={handleGenerate}
                        className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer"
                      >
                        Generate {selectedMonth} Payroll
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((p) => {
                  const allowances = p.houseRent + p.medicalAllowance + p.specialAllowance + p.festivalBonus;
                  const isPaid = p.paymentStatus === 'paid';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {p.teacherName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.designation} {p.bengaliDesignation && `(${p.bengaliDesignation})`}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.mpoType === 'mpo'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {p.mpoType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <div>{p.bankName}</div>
                        <div className="text-slate-400">{p.bankAccountNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                        ৳{p.basicSalary.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        +৳{allowances.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        -৳{p.totalDeductions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ৳{p.netPayable.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{isPaid ? 'PAID' : 'PENDING'}</span>
                        </span>
                        {p.paymentDate && (
                          <div className="text-[9px] text-slate-400 mt-0.5">{p.paymentDate}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isPaid ? (
                            <button
                              onClick={() => onDisburseSalary(p, 'bank_transfer')}
                              className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                            >
                              Disburse
                            </button>
                          ) : (
                            <button
                              onClick={() => onPrintPayslip(p)}
                              title="Print official pay slip"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Pay Slip</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
