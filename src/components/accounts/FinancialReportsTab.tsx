import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountHead, BankAccountItem, FinancialVoucher } from '../../types';
import { Printer, Calendar, Filter, FileSpreadsheet, BookOpen, Scale, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface FinancialReportsTabProps {
  accountHeads: AccountHead[];
  bankAccounts: BankAccountItem[];
  vouchers: FinancialVoucher[];
}

export const FinancialReportsTab: React.FC<FinancialReportsTabProps> = ({
  accountHeads,
  bankAccounts,
  vouchers,
}) => {
  const { activeInstitute, activeAcademicYear, language } = useApp();

  const [activeReport, setActiveReport] = useState<'cashbook' | 'income_expenditure' | 'ledger'>('cashbook');
  const [selectedHeadId, setSelectedHeadId] = useState<string>(accountHeads[0]?.id || '');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-12-31');

  // Filter vouchers by date range
  const dateFilteredVouchers = vouchers.filter((v) => {
    if (startDate && v.date < startDate) return false;
    if (endDate && v.date > endDate) return false;
    return true;
  });

  // 1. CASH BOOK CALCULATION
  const cashOpening = 25000;
  let runningCash = cashOpening;
  const cashBookRows = dateFilteredVouchers
    .filter((v) => v.paymentMethod === 'cash' || v.voucherType === 'contra')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => {
      const isReceipt = v.voucherType === 'credit';
      const isPayment = v.voucherType === 'debit' || (v.voucherType === 'contra' && v.bankAccountId);
      const receiptAmt = isReceipt ? v.amount : 0;
      const paymentAmt = isPayment ? v.amount : 0;
      runningCash = runningCash + receiptAmt - paymentAmt;

      return {
        id: v.id,
        date: v.date,
        voucherNo: v.voucherNumber,
        particulars: `${v.accountHeadName} - ${v.payeeRecipient}`,
        receipt: receiptAmt,
        payment: paymentAmt,
        balance: runningCash,
      };
    });

  // 2. INCOME & EXPENDITURE CALCULATION
  const incomeHeads = accountHeads.filter((h) => h.type === 'income');
  const expenseHeads = accountHeads.filter((h) => h.type === 'expense');

  const incomeItems = incomeHeads.map((h) => {
    const headVouchers = dateFilteredVouchers.filter(
      (v) => v.accountHeadId === h.id && v.voucherType === 'credit'
    );
    const total = headVouchers.reduce((sum, v) => sum + v.amount, 0);
    return {
      id: h.id,
      code: h.code,
      name: h.name,
      nameBn: h.nameBn,
      amount: total,
    };
  });

  const expenseItems = expenseHeads.map((h) => {
    const headVouchers = dateFilteredVouchers.filter(
      (v) => v.accountHeadId === h.id && v.voucherType === 'debit'
    );
    const total = headVouchers.reduce((sum, v) => sum + v.amount, 0);
    return {
      id: h.id,
      code: h.code,
      name: h.name,
      nameBn: h.nameBn,
      amount: total,
    };
  });

  const totalIncomeReport = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenseReport = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  const netSurplusReport = totalIncomeReport - totalExpenseReport;

  // 3. HEAD-WISE LEDGER CALCULATION
  const currentSelectedHead = accountHeads.find((h) => h.id === selectedHeadId) || accountHeads[0];
  let ledgerRunning = currentSelectedHead?.openingBalance || 0;
  const ledgerRows = dateFilteredVouchers
    .filter((v) => v.accountHeadId === selectedHeadId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((v) => {
      const isDebit = v.voucherType === 'debit';
      const debit = isDebit ? v.amount : 0;
      const credit = !isDebit ? v.amount : 0;

      if (currentSelectedHead?.type === 'expense' || currentSelectedHead?.type === 'asset') {
        ledgerRunning = ledgerRunning + debit - credit;
      } else {
        ledgerRunning = ledgerRunning + credit - debit;
      }

      return {
        id: v.id,
        date: v.date,
        voucherNo: v.voucherNumber,
        particulars: v.description || v.payeeRecipient,
        paymentMethod: v.paymentMethod,
        debit,
        credit,
        balance: ledgerRunning,
      };
    });

  return (
    <div className="space-y-6">
      {/* REPORT SWITCHER & DATE FILTER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs print:hidden">
        {/* Report Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveReport('cashbook')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeReport === 'cashbook'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ক্যাশ বুক' : 'Cash Book'}</span>
          </button>

          <button
            onClick={() => setActiveReport('income_expenditure')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeReport === 'income_expenditure'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'আয়-ব্যয় বিবরণী' : 'Income & Expenditure'}</span>
          </button>

          <button
            onClick={() => setActiveReport('ledger')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeReport === 'ledger'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'খতিয়ান বহি' : 'Head-wise Ledger'}</span>
          </button>
        </div>

        {/* Date Filter & Print */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {activeReport === 'ledger' && (
            <select
              value={selectedHeadId}
              onChange={(e) => setSelectedHeadId(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
            >
              {accountHeads.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} - {h.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* REPORT PRINT CONTAINER */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs print:border-none print:p-0">
        {/* Printable Institution Header */}
        <div className="text-center border-b-2 border-slate-900 dark:border-slate-100 pb-3 mb-6">
          <h1 className="text-lg font-black tracking-tight text-slate-950 dark:text-white uppercase font-serif">
            {activeInstitute?.name || 'MODEL SCHOOL & COLLEGE'}
          </h1>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-serif">
            {activeInstitute?.bengaliName || 'মডেল স্কুল অ্যান্ড কলেজ'}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            EIIN: {activeInstitute?.eiin || '134215'} • Academic Year: {activeAcademicYear?.yearName || '2026'}
          </div>

          <div className="mt-2 inline-block px-4 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {activeReport === 'cashbook' && (language === 'bn' ? 'দৈনিক ক্যাশ বুক ও রসিদ রেজিস্টার' : 'Official Cash Book (Receipts & Payments)')}
            {activeReport === 'income_expenditure' && (language === 'bn' ? 'বার্ষিক আয় ও ব্যয় বিবরণী (নিরীক্ষিত হিসাব)' : 'Statement of Income & Expenditure')}
            {activeReport === 'ledger' && `${language === 'bn' ? 'খতিয়ান হিসাব বহি: ' : 'General Ledger: '} ${currentSelectedHead?.name || ''}`}
          </div>

          <div className="text-[10px] text-slate-500 mt-1">
            Period: {startDate} to {endDate}
          </div>
        </div>

        {/* 1. CASH BOOK VIEW */}
        {activeReport === 'cashbook' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Date</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Voucher No</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Particulars (হিসাব খাত ও বিবরণ)</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right">Debit (Receipts - জমা)</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right">Credit (Payments - খরচ)</th>
                    <th className="p-2.5 text-right font-mono">Cash in Hand (উদ্বৃত্ত)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr className="bg-slate-50 dark:bg-slate-800/40 font-semibold text-slate-700 dark:text-slate-300">
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">{startDate}</td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono">-</td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">Opening Balance B/F (প্রারম্ভিক নগদ স্থিতি)</td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-emerald-600">
                      ৳{cashOpening.toLocaleString()}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono">-</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ৳{cashOpening.toLocaleString()}
                    </td>
                  </tr>

                  {cashBookRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">
                        {r.voucherNo}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        {r.particulars}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-emerald-600 font-semibold">
                        {r.receipt > 0 ? `৳${r.receipt.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-rose-600 font-semibold">
                        {r.payment > 0 ? `৳${r.payment.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ৳{r.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. INCOME & EXPENDITURE VIEW */}
        {activeReport === 'income_expenditure' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Income Column */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 border-b border-slate-300 dark:border-slate-700 font-bold text-emerald-800 dark:text-emerald-300 flex justify-between">
                  <span>Revenues &amp; Income (আয় খাতসমূহ)</span>
                  <span>Amount (৳)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 text-xs">
                  {incomeItems.map((inc) => (
                    <div key={inc.id} className="p-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{inc.name}</div>
                        <div className="text-[10px] font-serif text-slate-500">{inc.nameBn}</div>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ৳{inc.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 border-t border-slate-300 dark:border-slate-700 font-bold flex justify-between text-xs">
                  <span>Total Income (সর্বমোট আয়):</span>
                  <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">
                    ৳{totalIncomeReport.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Expenditure Column */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="bg-rose-50 dark:bg-rose-950/40 p-3 border-b border-slate-300 dark:border-slate-700 font-bold text-rose-800 dark:text-rose-300 flex justify-between">
                  <span>Expenditures (ব্যয় খাতসমূহ)</span>
                  <span>Amount (৳)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 text-xs">
                  {expenseItems.map((exp) => (
                    <div key={exp.id} className="p-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{exp.name}</div>
                        <div className="text-[10px] font-serif text-slate-500">{exp.nameBn}</div>
                      </div>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400">
                        ৳{exp.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 border-t border-slate-300 dark:border-slate-700 font-bold flex justify-between text-xs">
                  <span>Total Expenditure (সর্বমোট ব্যয়):</span>
                  <span className="font-mono text-sm text-rose-700 dark:text-rose-400">
                    ৳{totalExpenseReport.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Balance Card */}
            <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-sm font-bold">
              <div>
                <span className="text-slate-900 dark:text-white">
                  {language === 'bn' ? 'পরিচালন নীট উদ্বৃত্ত / (ঘাটতি):' : 'Operating Net Surplus / (Deficit):'}
                </span>
                <div className="text-[10px] font-normal text-slate-500">
                  Total Institutional Income minus Total Operating Expenditure
                </div>
              </div>
              <div
                className={`text-lg font-mono ${
                  netSurplusReport >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-700 dark:text-rose-400'
                }`}
              >
                {netSurplusReport >= 0 ? `+৳${netSurplusReport.toLocaleString()}` : `-৳${Math.abs(netSurplusReport).toLocaleString()}`}
              </div>
            </div>
          </div>
        )}

        {/* 3. HEAD-WISE LEDGER VIEW */}
        {activeReport === 'ledger' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Selected Head: </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentSelectedHead?.code} - {currentSelectedHead?.name} ({currentSelectedHead?.nameBn})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Opening Balance: </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ৳{(currentSelectedHead?.openingBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Date</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Voucher No</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700">Particulars</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right">Debit (৳)</th>
                    <th className="p-2.5 border-r border-slate-300 dark:border-slate-700 text-right">Credit (৳)</th>
                    <th className="p-2.5 text-right font-mono">Running Balance (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {ledgerRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No transactions found for this account head in selected period
                      </td>
                    </tr>
                  ) : (
                    ledgerRows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">
                          {r.voucherNo}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          {r.particulars}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-rose-600 font-semibold">
                          {r.debit > 0 ? `৳${r.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right font-mono text-emerald-600 font-semibold">
                          {r.credit > 0 ? `৳${r.credit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ৳{r.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Official Report Signatures Block */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-4 text-center text-[10px] text-slate-700 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1 font-bold text-slate-900 dark:text-white">
              Senior Accountant
            </div>
            <div>Prepared By (হিসাবরক্ষক)</div>
          </div>

          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1 font-bold text-slate-900 dark:text-white">
              Internal Audit Committee
            </div>
            <div>Audited By (অভ্যন্তরীণ নিরীক্ষক)</div>
          </div>

          <div>
            <div className="border-t border-slate-800 dark:border-slate-400 pt-1 font-bold text-slate-900 dark:text-white">
              Head of Institution
            </div>
            <div>Principal / Headmaster (অধ্যক্ষ)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
