import React from 'react';
import { useApp } from '../../context/AppContext';
import { FinancialVoucher } from '../../types';
import { numberToBengaliWords, numberToEnglishWords } from './sampleAccountsData';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface VoucherPrintModalProps {
  voucher: FinancialVoucher;
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({ voucher, onClose }) => {
  const { activeInstitute, activeAcademicYear } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const getVoucherTitle = () => {
    switch (voucher.voucherType) {
      case 'debit':
        return {
          en: 'DEBIT VOUCHER (PAYMENT)',
          bn: 'ডেবিট ভাউচার (খরচ / পরিশোধ)',
          color: 'border-red-600 text-red-700 bg-red-50 dark:bg-red-950/40',
        };
      case 'credit':
        return {
          en: 'CREDIT VOUCHER (RECEIPT)',
          bn: 'ক্রেডিট ভাউচার (জমা / প্রাপ্তি)',
          color: 'border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40',
        };
      case 'contra':
        return {
          en: 'CONTRA VOUCHER (BANK/CASH TRANSFER)',
          bn: 'কন্ট্রা ভাউচার (ব্যাংক / নগদ স্থানান্তর)',
          color: 'border-blue-600 text-blue-700 bg-blue-50 dark:bg-blue-950/40',
        };
      default:
        return {
          en: 'JOURNAL VOUCHER',
          bn: 'জার্নাল ভাউচার (সমন্বয়)',
          color: 'border-indigo-600 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40',
        };
    }
  };

  const titleInfo = getVoucherTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 print:border-none print:shadow-none print:p-0">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Official Institutional Voucher
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
              {voucher.voucherNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE VOUCHER PAPER */}
        <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-xs print:border-none print:p-0">
          {/* Institution Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3">
            <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase font-serif">
              {activeInstitute?.name || 'MODEL SCHOOL & COLLEGE'}
            </h1>
            <p className="text-sm font-bold text-slate-800 font-serif">
              {activeInstitute?.bengaliName || 'মডেল স্কুল অ্যান্ড কলেজ'}
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 mt-1">
              <span>EIIN: {activeInstitute?.eiin || '134215'}</span>
              <span>•</span>
              <span>Code: {activeInstitute?.code || '5401'}</span>
              <span>•</span>
              <span>Est: {activeInstitute?.establishedYear || '1998'}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {activeInstitute?.address || 'Main Road, Sadar, Bangladesh'}
            </p>
          </div>

          {/* Voucher Title Pill */}
          <div className="flex items-center justify-between mt-4 mb-3">
            <div className="text-xs">
              <span className="text-slate-500">Voucher No: </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {voucher.voucherNumber}
              </span>
            </div>

            <div
              className={`px-4 py-1 rounded-md border-2 font-bold text-center tracking-wider text-xs ${titleInfo.color}`}
            >
              <div>{titleInfo.en}</div>
              <div className="text-[10px] font-normal font-serif">{titleInfo.bn}</div>
            </div>

            <div className="text-xs text-right">
              <span className="text-slate-500">Date: </span>
              <span className="font-mono font-bold text-slate-900">{voucher.date}</span>
            </div>
          </div>

          {/* Voucher Body Table */}
          <div className="border border-slate-900 text-xs mt-3">
            <div className="grid grid-cols-3 border-b border-slate-900 p-2.5 bg-slate-50">
              <div className="col-span-1 font-semibold text-slate-600">
                {voucher.voucherType === 'credit' ? 'Received From (গ্রহীতা):' : 'Paid To (প্রাপক):'}
              </div>
              <div className="col-span-2 font-bold text-slate-950 text-sm">
                {voucher.payeeRecipient}
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-900 p-2.5">
              <div className="col-span-1 font-semibold text-slate-600">Head of Account (হিসাব খাত):</div>
              <div className="col-span-2 font-bold text-slate-900">
                {voucher.accountHeadName} {voucher.accountHeadCode && `(Code: ${voucher.accountHeadCode})`}
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-900 p-2.5 bg-slate-50">
              <div className="col-span-1 font-semibold text-slate-600">Payment Mode (পরিশোধ পদ্ধতি):</div>
              <div className="col-span-2 font-semibold text-slate-900 uppercase">
                {voucher.paymentMethod.replace('_', ' ')}
                {voucher.bankAccountName && ` - ${voucher.bankAccountName}`}
                {voucher.chequeNumber && ` (Cheque No: ${voucher.chequeNumber})`}
              </div>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-900 p-2.5 min-h-[70px]">
              <div className="col-span-1 font-semibold text-slate-600">Description / Particulars (বিবরণ):</div>
              <div className="col-span-2 text-slate-800 leading-relaxed">
                {voucher.description}
              </div>
            </div>

            <div className="grid grid-cols-3 p-2.5 bg-slate-100 font-bold">
              <div className="col-span-1 text-slate-800">Total Amount (মোট টাকার পরিমাণ):</div>
              <div className="col-span-2 text-right text-base font-mono text-slate-950">
                ৳{voucher.amount.toLocaleString()}.00
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="border border-t-0 border-slate-900 p-2.5 text-xs bg-slate-50/50 space-y-1">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-600">In Words:</span>
              <span className="font-semibold text-slate-900">{numberToEnglishWords(voucher.amount)}</span>
            </div>
            <div className="flex gap-2 font-serif text-[11px]">
              <span className="font-semibold text-slate-600">কথায়:</span>
              <span className="font-bold text-slate-900">{numberToBengaliWords(voucher.amount)}</span>
            </div>
          </div>

          {/* 4 Official Signature Blocks */}
          <div className="grid grid-cols-4 gap-4 mt-16 pt-3 text-center text-[10px] text-slate-700">
            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">{voucher.preparedBy}</div>
              <div>Prepared By</div>
              <div className="font-serif text-[9px]">(প্রস্তুতকারক)</div>
            </div>

            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">{voucher.checkedBy || 'Checked'}</div>
              <div>Checked By</div>
              <div className="font-serif text-[9px]">(যাচাইকারী)</div>
            </div>

            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">Head Accountant</div>
              <div>Accountant</div>
              <div className="font-serif text-[9px]">(হিসাবরক্ষক)</div>
            </div>

            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">{voucher.approvedBy}</div>
              <div>Principal / Headmaster</div>
              <div className="font-serif text-[9px]">(অধ্যক্ষ / প্রধান শিক্ষক)</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
            <span>Generated from Digital Institutional ERP</span>
            <span>Academic Year: {activeAcademicYear?.yearName || '2026'}</span>
            <span>Date Printed: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
