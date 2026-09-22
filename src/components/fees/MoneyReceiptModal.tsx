import React from 'react';
import { useApp } from '../../context/AppContext';
import { FeePaymentRecord, StudentFeeInvoice } from '../../types';
import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface MoneyReceiptModalProps {
  payment: FeePaymentRecord;
  invoice?: StudentFeeInvoice;
  onClose: () => void;
}

// Convert numbers to English words
function numberToWords(num: number): string {
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' and ' + convert(n % 100) : '')
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        ' Thousand' +
        (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        ' Lakh' +
        (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')
      );
    return num.toString();
  }

  return convert(Math.round(num)) + ' Taka Only';
}

export const MoneyReceiptModal: React.FC<MoneyReceiptModalProps> = ({
  payment,
  invoice,
  onClose,
}) => {
  const { activeInstitute } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const copies = [
    { title: 'Student Copy', bnTitle: 'শিক্ষার্থী কপি', color: 'border-blue-500' },
    { title: 'Office Copy', bnTitle: 'অফিস কপি', color: 'border-emerald-500' },
    { title: 'Accounts Copy', bnTitle: 'হিসাব শাখা কপি', color: 'border-purple-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 text-slate-900 dark:text-white print:p-0 print:border-none print:shadow-none print:my-0">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Money Receipt (মানি রিসিট)
              </h3>
              <p className="text-xs text-slate-500">
                Receipt #{payment.receiptNumber} • 3-Part Standard Print Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print 3-Part Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Part Receipt Slips (Vertical Stack with perforated cut borders) */}
        <div className="space-y-6 print:space-y-4">
          {copies.map((copy, index) => (
            <div
              key={index}
              className={`p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/40 relative overflow-hidden print:border print:border-slate-300 print:bg-white print:p-3 print:rounded-none ${
                index < 2 ? 'print:border-b-2 print:border-dashed print:border-slate-400' : ''
              }`}
            >
              {/* Top Perforation Marker */}
              {index > 0 && (
                <div className="absolute -top-3 left-0 right-0 hidden print:block text-center text-[9px] text-slate-400 font-mono tracking-widest">
                  ✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂
                </div>
              )}

              {/* Slip Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs print:w-8 print:h-8 print:text-sm">
                    {activeInstitute?.name?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white print:text-xs">
                      {activeInstitute?.name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 print:text-[10px]">
                      {activeInstitute?.bengaliName} • EIIN: {activeInstitute?.eiin || 'N/A'} • {activeInstitute?.address}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 uppercase tracking-wider print:border print:border-slate-300">
                    {copy.title} ({copy.bnTitle})
                  </div>
                  <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                    No: {payment.receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Date: {payment.paymentDate}
                  </div>
                </div>
              </div>

              {/* Student Demographics Grid */}
              <div className="grid grid-cols-4 gap-2 my-2.5 text-xs print:text-[10px] bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 print:border-none print:p-0">
                <div>
                  <span className="text-slate-400 block text-[10px]">Student Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{payment.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Class &amp; Section:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {payment.className} ({payment.sectionName})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Roll Number:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">#{payment.rollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Method:</span>
                  <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">
                    {payment.paymentMethod.replace('_', ' ')}
                    {payment.transactionRef ? ` (${payment.transactionRef})` : ''}
                  </span>
                </div>
              </div>

              {/* Fee Items Table */}
              <table className="w-full text-xs print:text-[10px] border border-slate-200 dark:border-slate-700 rounded overflow-hidden mb-2">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-1 px-2.5 text-left">SL</th>
                    <th className="py-1 px-2.5 text-left">Fee Head / Description (বিবরণ)</th>
                    <th className="py-1 px-2.5 text-center">Month Covered</th>
                    <th className="py-1 px-2.5 text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice && invoice.items.length > 0 ? (
                    invoice.items.map((item, iIdx) => (
                      <tr key={iIdx}>
                        <td className="py-1 px-2.5 text-slate-400 font-mono">{iIdx + 1}</td>
                        <td className="py-1 px-2.5 font-medium">{item.feeHeadName}</td>
                        <td className="py-1 px-2.5 text-center text-slate-500">{payment.monthCovered}</td>
                        <td className="py-1 px-2.5 text-right font-mono">৳{item.amount.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-1 px-2.5 text-slate-400 font-mono">1</td>
                      <td className="py-1 px-2.5 font-medium">Monthly Tuition &amp; Associated Institutional Charges</td>
                      <td className="py-1 px-2.5 text-center text-slate-500">{payment.monthCovered}</td>
                      <td className="py-1 px-2.5 text-right font-mono">৳{payment.paidAmount.toLocaleString()}</td>
                    </tr>
                  )}

                  {payment.lateFinePaid > 0 && (
                    <tr>
                      <td className="py-1 px-2.5 text-slate-400 font-mono">#</td>
                      <td className="py-1 px-2.5 font-medium text-amber-600">Late Fine Penalty</td>
                      <td className="py-1 px-2.5 text-center text-slate-500">-</td>
                      <td className="py-1 px-2.5 text-right font-mono text-amber-600">৳{payment.lateFinePaid.toLocaleString()}</td>
                    </tr>
                  )}

                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                    <td colSpan={3} className="py-1 px-2.5 text-right">Total Received (সর্বমোট আদায়):</td>
                    <td className="py-1 px-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 text-sm print:text-xs">
                      ৳{payment.totalCollected.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in words & Footer */}
              <div className="flex items-center justify-between text-[11px] print:text-[9px] text-slate-600 dark:text-slate-400 mb-4">
                <div>
                  <span className="font-semibold">In Words (কথায়): </span>
                  <span className="italic">{numberToWords(payment.totalCollected)}</span>
                </div>
                {payment.remarks && (
                  <div className="text-slate-400 italic">Note: {payment.remarks}</div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-4 text-center text-[10px] print:text-[8px] text-slate-500 border-t border-dotted border-slate-300 dark:border-slate-700">
                <div>
                  <div className="h-6 border-b border-slate-300 dark:border-slate-600 mb-1 w-32 mx-auto"></div>
                  <span>Student / Depositor</span>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-300 dark:border-slate-600 mb-1 w-32 mx-auto"></div>
                  <span>Cashier: {payment.collectedBy}</span>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-300 dark:border-slate-600 mb-1 w-32 mx-auto"></div>
                  <span>Headmaster / Principal Seal</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
