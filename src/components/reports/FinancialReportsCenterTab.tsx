import React, { useState } from 'react';
import { Institute, AcademicYear } from '../../types';
import {
  IncomeExpenseStatementRow,
  SAMPLE_INCOME_EXPENSE,
} from './sampleReportData';
import { exportToCsv, formatCurrencyBDT } from '../../utils/exportUtils';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Calendar,
  Building2,
  FileText,
  DollarSign,
} from 'lucide-react';

interface FinancialReportsCenterTabProps {
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

export const FinancialReportsCenterTab: React.FC<FinancialReportsCenterTabProps> = ({
  institute,
  academicYear,
  onOpenPrint,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'income' | 'expense'>('all');

  const incomeRows = SAMPLE_INCOME_EXPENSE.filter((r) => r.category === 'income');
  const expenseRows = SAMPLE_INCOME_EXPENSE.filter((r) => r.category === 'expense');

  const totalIncome = incomeRows.reduce((acc, r) => acc + r.actualAmount, 0);
  const totalExpense = expenseRows.reduce((acc, r) => acc + r.actualAmount, 0);
  const netSurplus = totalIncome - totalExpense;

  const filteredRows = SAMPLE_INCOME_EXPENSE.filter(
    (r) => filterCategory === 'all' || r.category === filterCategory
  );

  const handlePrint = () => {
    onOpenPrint({
      title: 'Institutional Income & Expenditure Statement (আয়-ব্যয় বিবরণী)',
      subtitle: `Official financial audit ledger, heads of accounts, and net operating surplus for Academic Year ${academicYear?.yearName || '2026'}`,
      columns: [
        { header: 'Account Code', key: 'accountCode' },
        { header: 'Particulars / Account Head', key: 'headName' },
        { header: 'হিসাব খাত', key: 'bengaliHeadName' },
        { header: 'Type', key: 'categoryUpper', align: 'center' },
        { header: 'Budget (৳)', key: 'budgetFormatted', align: 'right' },
        { header: 'Actual (৳)', key: 'actualFormatted', align: 'right' },
        { header: 'Variance (৳)', key: 'varianceFormatted', align: 'right' },
      ],
      data: filteredRows.map((r) => ({
        ...r,
        categoryUpper: r.category.toUpperCase(),
        budgetFormatted: formatCurrencyBDT(r.budgetAmount),
        actualFormatted: formatCurrencyBDT(r.actualAmount),
        varianceFormatted: formatCurrencyBDT(r.variance),
      })),
      summaryCards: [
        { label: 'Total Revenue Realized', value: formatCurrencyBDT(totalIncome) },
        { label: 'Total Operational Expenditure', value: formatCurrencyBDT(totalExpense) },
        { label: 'Net Operating Surplus', value: formatCurrencyBDT(netSurplus) },
        { label: 'Fiscal Status', value: netSurplus >= 0 ? 'Surplus / Balanced' : 'Deficit' },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-750 rounded-lg">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'all'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Comprehensive Statement (All Heads)
          </button>
          <button
            onClick={() => setFilterCategory('income')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'income'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Income Heads Only
          </button>
          <button
            onClick={() => setFilterCategory('expense')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
              filterCategory === 'expense'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Expense Heads Only
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['Code', 'Particulars', 'Bangla Name', 'Type', 'Budget', 'Actual', 'Variance'];
              const rows = filteredRows.map((r) => [
                r.accountCode,
                r.headName,
                r.bengaliHeadName,
                r.category,
                r.budgetAmount,
                r.actualAmount,
                r.variance,
              ]);
              exportToCsv('income_expense_financial_statement', headers, rows);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Financial Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Realized Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrencyBDT(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tuition, MPO, fees</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Operational Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrencyBDT(totalExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Salaries, utilities, maintenance</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Fiscal Surplus</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div
            className={`text-xl font-bold mt-1 ${
              netSurplus >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'
            }`}
          >
            {formatCurrencyBDT(netSurplus)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {netSurplus >= 0 ? 'Positive institutional reserve' : 'Operating deficit'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Audit Readiness</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Reconciled
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for external audit</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>Income &amp; Expenditure Ledger Summary (আয়-ব্যয় হিসাব)</span>
          </h4>
          <span className="text-xs text-slate-400">
            Session: {academicYear?.yearName || '2026'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Head / Purpose</th>
                <th className="py-3 px-4">বাংলা বিবরণ</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Budget (৳)</th>
                <th className="py-3 px-4 text-right">Actual (৳)</th>
                <th className="py-3 px-4 text-right">Variance (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {filteredRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {r.accountCode}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {r.headName}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                    {r.bengaliHeadName}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.category === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {r.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                    {formatCurrencyBDT(r.budgetAmount)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono font-bold ${
                      r.category === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrencyBDT(r.actualAmount)}
                  </td>
                  <td
                    className={`py-2.5 px-4 text-right font-mono ${
                      r.variance > 0
                        ? 'text-emerald-600'
                        : r.variance < 0
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatCurrencyBDT(r.variance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
              <tr>
                <td className="py-3 px-4" colSpan={4}>
                  Net Operating Surplus (আয় - ব্যয়)
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-500">
                  {formatCurrencyBDT(
                    filteredRows.reduce((acc, r) => acc + r.budgetAmount, 0)
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                  {formatCurrencyBDT(netSurplus)}
                </td>
                <td className="py-3 px-4 text-right text-xs text-emerald-600">
                  Fiscal Balanced
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
