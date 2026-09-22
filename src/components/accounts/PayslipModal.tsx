import React from 'react';
import { useApp } from '../../context/AppContext';
import { StaffPayrollItem } from '../../types';
import { numberToBengaliWords, numberToEnglishWords } from './sampleAccountsData';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface PayslipModalProps {
  payroll: StaffPayrollItem;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ payroll, onClose }) => {
  const { activeInstitute, activeAcademicYear } = useApp();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 print:border-none print:shadow-none print:p-0">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              Faculty & Staff Monthly Salary Slip
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              {payroll.month}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pay Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PAYSLIP CONTAINER */}
        <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 shadow-xs print:border-none print:p-0">
          {/* Header */}
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
            </div>
            <p className="text-[10px] text-slate-500">
              {activeInstitute?.address || 'Main Road, Sadar, Bangladesh'}
            </p>
          </div>

          {/* Payslip Title */}
          <div className="text-center my-3">
            <div className="inline-block px-4 py-1 rounded bg-slate-100 border border-slate-300 font-bold text-xs uppercase tracking-wider text-slate-900">
              Monthly Salary Certificate & Pay Slip (বেতন স্লিপ)
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1">
              For the Month of: <span className="font-bold text-slate-900">{payroll.month}</span>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="border border-slate-800 text-xs mt-3 bg-slate-50/50">
            <div className="grid grid-cols-2 p-2 border-b border-slate-800 gap-2">
              <div>
                <span className="text-slate-500">Staff Name: </span>
                <span className="font-bold text-slate-950">{payroll.teacherName}</span>
              </div>
              <div>
                <span className="text-slate-500">Designation: </span>
                <span className="font-bold text-slate-950">
                  {payroll.designation} {payroll.bengaliDesignation && `(${payroll.bengaliDesignation})`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 p-2 gap-2">
              <div>
                <span className="text-slate-500">Employment Scale: </span>
                <span className="font-bold text-slate-950 uppercase">
                  {payroll.mpoType === 'mpo' ? 'Government MPO Scale' : 'Institutional Scale'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Bank & A/C No: </span>
                <span className="font-mono font-bold text-slate-950">
                  {payroll.bankName || 'Bank'} - {payroll.bankAccountNumber || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="grid grid-cols-2 border border-slate-800 border-t-0 text-xs">
            {/* Earnings Column */}
            <div className="border-r border-slate-800">
              <div className="bg-slate-100 p-2 font-bold text-slate-900 border-b border-slate-800 flex justify-between">
                <span>Earnings (উপার্জন)</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-2 flex justify-between">
                  <span className="text-slate-600">Basic Pay (মূল বেতন)</span>
                  <span className="font-mono font-semibold">৳{payroll.basicSalary.toLocaleString()}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-slate-600">House Rent Allowance (বাড়ি ভাড়া)</span>
                  <span className="font-mono font-semibold">৳{payroll.houseRent.toLocaleString()}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-slate-600">Medical Allowance (চিকিৎসা ভাতা)</span>
                  <span className="font-mono font-semibold">৳{payroll.medicalAllowance.toLocaleString()}</span>
                </div>
                {payroll.specialAllowance > 0 && (
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Special / Responsibility Allowance</span>
                    <span className="font-mono font-semibold">৳{payroll.specialAllowance.toLocaleString()}</span>
                  </div>
                )}
                {payroll.festivalBonus > 0 && (
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Festival Bonus (উৎসব ভাতা)</span>
                    <span className="font-mono font-semibold">৳{payroll.festivalBonus.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-800 font-bold flex justify-between">
                <span>Gross Earnings (মোট উপার্জন):</span>
                <span className="font-mono text-emerald-700">৳{payroll.grossSalary.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <div className="bg-slate-100 p-2 font-bold text-slate-900 border-b border-slate-800 flex justify-between">
                <span>Deductions (কর্তন)</span>
                <span>Amount (৳)</span>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="p-2 flex justify-between">
                  <span className="text-slate-600">Provident Fund / GPF (প্রভিডেন্ট ফান্ড)</span>
                  <span className="font-mono font-semibold">৳{payroll.providentFundDeduction.toLocaleString()}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-slate-600">Welfare Trust Fund (কল্যাণ তহবিল)</span>
                  <span className="font-mono font-semibold">৳{payroll.welfareDeduction.toLocaleString()}</span>
                </div>
                {payroll.advanceDeduction > 0 && (
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Salary Advance Recovery (অগ্রিম বেতন)</span>
                    <span className="font-mono font-semibold">৳{payroll.advanceDeduction.toLocaleString()}</span>
                  </div>
                )}
                {payroll.otherDeductions > 0 && (
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Tax / Other Deductions</span>
                    <span className="font-mono font-semibold">৳{payroll.otherDeductions.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="p-2 bg-slate-50 border-t border-slate-800 font-bold flex justify-between">
                <span>Total Deductions (মোট কর্তন):</span>
                <span className="font-mono text-rose-700">৳{payroll.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Payable Highlight */}
          <div className="border border-slate-800 border-t-0 p-3 bg-slate-100 flex items-center justify-between text-sm font-bold">
            <div className="text-slate-950">Net Disbursed / Payable (নিট প্রদেয় বেতন):</div>
            <div className="text-base font-mono text-emerald-800">
              ৳{payroll.netPayable.toLocaleString()}.00
            </div>
          </div>

          {/* Amount in Words */}
          <div className="border border-t-0 border-slate-800 p-2.5 text-xs bg-slate-50/50 space-y-1">
            <div className="flex gap-2">
              <span className="font-semibold text-slate-600">In Words:</span>
              <span className="font-semibold text-slate-900">{numberToEnglishWords(payroll.netPayable)}</span>
            </div>
            <div className="flex gap-2 font-serif text-[11px]">
              <span className="font-semibold text-slate-600">কথায়:</span>
              <span className="font-bold text-slate-900">{numberToBengaliWords(payroll.netPayable)}</span>
            </div>
          </div>

          {/* Status and Method */}
          <div className="flex items-center justify-between border border-t-0 border-slate-800 p-2 text-xs">
            <div>
              <span className="text-slate-500">Payment Status: </span>
              <span className={`font-bold ${payroll.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {payroll.paymentStatus === 'paid' ? 'PAID / পরিশোধিত' : 'PENDING APPROVAL'}
              </span>
              {payroll.paymentDate && (
                <span className="text-slate-500 ml-2">({payroll.paymentDate})</span>
              )}
            </div>
            <div>
              <span className="text-slate-500">Method: </span>
              <span className="font-semibold uppercase">{payroll.paymentMethod || 'Bank Transfer'}</span>
            </div>
          </div>

          {/* Official Signatures */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-3 text-center text-[10px] text-slate-700">
            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">Accountant</div>
              <div>Prepared By (হিসাবরক্ষক)</div>
            </div>

            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">{payroll.teacherName}</div>
              <div>Receiver's Signature (গ্রহীতার স্বাক্ষর)</div>
            </div>

            <div className="border-t border-slate-900 pt-1">
              <div className="font-bold text-slate-900">Headmaster / Principal</div>
              <div>Sanctioning Authority (অধ্যক্ষ)</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
            <span>Official Computer-Generated Payroll Slip</span>
            <span>Academic Year: {activeAcademicYear?.yearName || '2026'}</span>
            <span>Printed on: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
