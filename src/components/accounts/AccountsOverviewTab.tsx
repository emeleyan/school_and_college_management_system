import React from 'react';
import { useApp } from '../../context/AppContext';
import { AccountHead, BankAccountItem, FinancialVoucher, StaffPayrollItem } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  PlusCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface AccountsOverviewTabProps {
  accountHeads: AccountHead[];
  bankAccounts: BankAccountItem[];
  vouchers: FinancialVoucher[];
  payrollItems: StaffPayrollItem[];
  onOpenNewVoucher: (type: 'debit' | 'credit' | 'contra') => void;
  onSelectVoucherToPrint: (v: FinancialVoucher) => void;
  onSwitchTab: (tab: 'vouchers' | 'payroll' | 'chart' | 'banks' | 'reports') => void;
}

export const AccountsOverviewTab: React.FC<AccountsOverviewTabProps> = ({
  accountHeads,
  bankAccounts,
  vouchers,
  payrollItems,
  onOpenNewVoucher,
  onSelectVoucherToPrint,
  onSwitchTab,
}) => {
  const { language } = useApp();

  // Financial calculations
  const totalIncome = vouchers
    .filter((v) => v.voucherType === 'credit' && v.status === 'posted')
    .reduce((sum, v) => sum + v.amount, 0);

  const totalExpense = vouchers
    .filter((v) => v.voucherType === 'debit' && v.status === 'posted')
    .reduce((sum, v) => sum + v.amount, 0);

  const netSurplus = totalIncome - totalExpense;

  // Cash in hand from head or bank item
  const cashAccount = bankAccounts.find((b) => b.accountType === 'cash') || {
    currentBalance: 48500,
  };
  const cashInHand = cashAccount.currentBalance;

  const totalBankBalance = bankAccounts
    .filter((b) => b.accountType !== 'cash')
    .reduce((sum, b) => sum + b.currentBalance, 0);

  // Unpaid payroll count & amount
  const unpaidPayroll = payrollItems.filter((p) => p.paymentStatus === 'unpaid');
  const unpaidPayrollTotal = unpaidPayroll.reduce((sum, p) => sum + p.netPayable, 0);

  // Recent 5 vouchers
  const recentVouchers = [...vouchers]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 5 KEY FINANCIAL STAT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'মোট আয় (চলতি বছর)' : 'Total Revenue'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ৳{totalIncome.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>{vouchers.filter((v) => v.voucherType === 'credit').length} credit vouchers</span>
          </div>
        </div>

        {/* Total Expenditure */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'মোট ব্যয় (চলতি বছর)' : 'Total Expenditure'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            ৳{totalExpense.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
            <span>{vouchers.filter((v) => v.voucherType === 'debit').length} debit vouchers</span>
          </div>
        </div>

        {/* Net Operating Surplus */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'পরিচালন উদ্বৃত্ত / ঘাটতি' : 'Operating Surplus'}
            </span>
            <div
              className={`w-8 h-8 rounded-lg ${
                netSurplus >= 0
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
              } flex items-center justify-center`}
            >
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-xl font-bold font-mono ${
              netSurplus >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'
            }`}
          >
            {netSurplus >= 0 ? `+৳${netSurplus.toLocaleString()}` : `-৳${Math.abs(netSurplus).toLocaleString()}`}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {netSurplus >= 0 ? 'Positive institutional balance' : 'Expenditure exceeds income'}
          </div>
        </div>

        {/* Bank Balances */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'ব্যাংক মোট জমা' : 'Bank Balances'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            ৳{totalBankBalance.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across {bankAccounts.length} institutional accounts
          </div>
        </div>

        {/* Cash in Hand */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'নগদ ক্যাশ উদ্বৃত্ত' : 'Cash in Hand'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            ৳{cashInHand.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Counter Safe balance</div>
        </div>
      </div>

      {/* QUICK ACTIONS & SHORTCUTS */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          {language === 'bn' ? 'দ্রুত লেনদেন এন্ট্রি' : 'Quick Financial Operations'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onOpenNewVoucher('debit')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 hover:border-rose-500 dark:hover:border-rose-500 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'ডেবিট ভাউচার (খরচ)' : 'New Debit Voucher'}
              </div>
              <div className="text-[10px] text-slate-500">Record institutional expense</div>
            </div>
          </button>

          <button
            onClick={() => onOpenNewVoucher('credit')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'ক্রেডিট ভাউচার (জমা)' : 'New Credit Voucher'}
              </div>
              <div className="text-[10px] text-slate-500">Record revenue &amp; grant</div>
            </div>
          </button>

          <button
            onClick={() => onOpenNewVoucher('contra')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'কন্ট্রা ভাউচার (ব্যাংক)' : 'Bank / Cash Contra'}
              </div>
              <div className="text-[10px] text-slate-500">Bank deposit or withdrawal</div>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('payroll')}
            className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'bn' ? 'শিক্ষক পে-রোল' : 'Faculty Payroll'}
              </div>
              <div className="text-[10px] text-slate-500">
                {unpaidPayroll.length > 0 ? `${unpaidPayroll.length} pending payouts` : 'Salary sheets'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN GRID: BANK ACCOUNTS STATUS & RECENT VOUCHERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bank Accounts Liquidity */}
        <div className="lg:col-span-1 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>{language === 'bn' ? 'প্রাতিষ্ঠানিক ব্যাংক হিসাবসমূহ' : 'Bank Accounts Liquidity'}</span>
            </h3>
            <button
              onClick={() => onSwitchTab('banks')}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{b.bankName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {b.accountType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {b.accountNumber} • {b.branchName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                    ৳{b.currentBalance.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">Active</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500">Cumulative Liquid Funds:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white">
              ৳{(totalBankBalance + cashInHand).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Right Column: Recent Transactions / Vouchers */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{language === 'bn' ? 'সাম্প্রতিক ভাউচারসমূহ' : 'Recent Financial Vouchers'}</span>
            </h3>
            <button
              onClick={() => onSwitchTab('vouchers')}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              View All Vouchers ({vouchers.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-750">
                <tr>
                  <th className="pb-2.5 font-semibold">Voucher No</th>
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold">Head / Particulars</th>
                  <th className="pb-2.5 font-semibold">Type</th>
                  <th className="pb-2.5 font-semibold text-right">Amount</th>
                  <th className="pb-2.5 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentVouchers.map((v) => {
                  const isDebit = v.voucherType === 'debit';
                  const isCredit = v.voucherType === 'credit';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                        {v.voucherNumber}
                      </td>
                      <td className="py-2.5 text-slate-500">{v.date}</td>
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {v.accountHeadName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {v.description}
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isDebit
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : isCredit
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {v.voucherType}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono font-bold text-right text-slate-900 dark:text-white">
                        <span className={isDebit ? 'text-rose-600' : isCredit ? 'text-emerald-600' : 'text-blue-600'}>
                          {isDebit ? '-' : isCredit ? '+' : ''}৳{v.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => onSelectVoucherToPrint(v)}
                          title="Print official voucher"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
