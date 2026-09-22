import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Student,
  ClassItem,
  SectionItem,
  StudentFeeInvoice,
  FeePaymentRecord,
  FeeHeadItem,
  PaymentMethod,
} from '../../types';
import { putItem } from '../../db/indexedDB';
import { MoneyReceiptModal } from './MoneyReceiptModal';
import {
  Search,
  User,
  CreditCard,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Calendar,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface FeeCollectionCounterProps {
  students: Student[];
  classes: ClassItem[];
  sections: SectionItem[];
  invoices: StudentFeeInvoice[];
  payments: FeePaymentRecord[];
  feeHeads: FeeHeadItem[];
  onRefresh: () => void;
}

export const FeeCollectionCounter: React.FC<FeeCollectionCounterProps> = ({
  students,
  classes,
  sections,
  invoices,
  payments,
  feeHeads,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, currentUser, logAudit, hasPermission } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Payment Form States
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [lateFineAmount, setLateFineAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [tenderedCash, setTenderedCash] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<FeePaymentRecord | null>(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<StudentFeeInvoice | undefined>(
    undefined
  );

  const getStudentNameEn = (st: Student) =>
    `${st.firstName || ''} ${st.lastName || ''}`.trim() || (st as any).name || (st as any).nameEn || 'Student';
  const getStudentNameBn = (st: Student) => st.bengaliName || (st as any).nameBn || '';
  const getStudentClassName = (st: Student) =>
    classes.find((c) => c.id === st.classId)?.name || (st as any).className || 'Class N/A';
  const getStudentSectionName = (st: Student) =>
    sections.find((sec) => sec.id === st.sectionId)?.name || (st as any).sectionName || 'Sec N/A';
  const getStudentPhone = (st: Student) =>
    st.guardian?.emergencyContactPhone ||
    st.guardian?.fatherPhone ||
    st.phone ||
    (st as any).guardianMobile ||
    '';

  // Search Filter
  const filteredStudents = students
    .filter((s) => {
      if (!searchQuery.trim()) return false;
      const q = searchQuery.toLowerCase();
      const nEn = getStudentNameEn(s).toLowerCase();
      const nBn = getStudentNameBn(s);
      const phone = getStudentPhone(s);
      return (
        nEn.includes(q) ||
        (nBn && nBn.includes(q)) ||
        (s.rollNumber && s.rollNumber.toString().includes(q)) ||
        s.studentId.toLowerCase().includes(q) ||
        (phone && phone.includes(q))
      );
    })
    .slice(0, 8);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSearchQuery('');

    // Find student's unpaid / partial invoices
    const dueInvoices = invoices.filter(
      (inv) => inv.studentId === st.id && (inv.status === 'unpaid' || inv.status === 'partial')
    );

    if (dueInvoices.length > 0) {
      setSelectedInvoiceIds([dueInvoices[0].id]);
      const initialDue = dueInvoices[0].dueAmount;
      const initialFine = dueInvoices[0].lateFine || 0;
      setPaymentAmount(initialDue);
      setLateFineAmount(initialFine);
      setTenderedCash(initialDue + initialFine);
    } else {
      setSelectedInvoiceIds([]);
      setPaymentAmount(0);
      setLateFineAmount(0);
      setTenderedCash(0);
    }
  };

  const studentInvoices = selectedStudent
    ? invoices.filter((inv) => inv.studentId === selectedStudent.id)
    : [];

  const studentPayments = selectedStudent
    ? payments.filter((p) => p.studentId === selectedStudent.id)
    : [];

  const totalOutstandingDue = studentInvoices.reduce(
    (acc, inv) => acc + (inv.status !== 'paid' ? inv.dueAmount + (inv.lateFine || 0) : 0),
    0
  );

  const handleToggleInvoice = (invId: string) => {
    const next = selectedInvoiceIds.includes(invId)
      ? selectedInvoiceIds.filter((id) => id !== invId)
      : [...selectedInvoiceIds, invId];
    setSelectedInvoiceIds(next);

    const sumDue = studentInvoices
      .filter((inv) => next.includes(inv.id))
      .reduce((acc, inv) => acc + inv.dueAmount, 0);

    const sumFine = studentInvoices
      .filter((inv) => next.includes(inv.id))
      .reduce((acc, inv) => acc + (inv.lateFine || 0), 0);

    setPaymentAmount(sumDue);
    setLateFineAmount(sumFine);
    setTenderedCash(sumDue + sumFine - discountAmount);
  };

  const netPayable = Math.max(0, paymentAmount + lateFineAmount - discountAmount);
  const changeDue = tenderedCash > netPayable ? tenderedCash - netPayable : 0;

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !activeInstitute) return;
    if (netPayable <= 0) {
      alert('Please select an invoice or enter a valid payment amount.');
      return;
    }

    try {
      const pId = `pay-${Date.now()}`;
      const rcptNum = `MR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const chosenInvoices = studentInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
      const monthsCoveredStr =
        chosenInvoices.length > 0
          ? chosenInvoices.map((inv) => inv.month).join(', ')
          : 'Advance / General Fee Payment';

      const paymentRecord: FeePaymentRecord = {
        id: pId,
        receiptNumber: rcptNum,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || 'ay-2026',
        studentId: selectedStudent.id,
        studentName: getStudentNameEn(selectedStudent),
        rollNumber: selectedStudent.rollNumber || 1,
        classId: selectedStudent.classId || 'class-01',
        className: getStudentClassName(selectedStudent),
        sectionName: getStudentSectionName(selectedStudent),
        invoiceId: chosenInvoices[0]?.id,
        monthCovered: monthsCoveredStr,
        paidAmount: paymentAmount,
        lateFinePaid: lateFineAmount,
        totalCollected: netPayable,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        remarks: remarks.trim() || 'Counter fee collection',
        collectedBy: currentUser?.fullName || 'Cashier',
        paymentDate: todayStr,
        createdAt: new Date().toISOString(),
      };

      // 1. Save payment record
      await putItem('payments', paymentRecord);

      // 2. Update status of chosen invoices
      let remainingPayment = paymentAmount;
      for (const inv of chosenInvoices) {
        if (remainingPayment <= 0) break;

        const portion = Math.min(remainingPayment, inv.dueAmount);
        const newPaid = inv.paidAmount + portion;
        const newDue = Math.max(0, inv.dueAmount - portion);
        const newStatus: StudentFeeInvoice['status'] = newDue === 0 ? 'paid' : 'partial';

        const updatedInv: StudentFeeInvoice = {
          ...inv,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        await putItem('feeCharges', updatedInv);
        remainingPayment -= portion;
      }

      await logAudit(
        'fee_collection',
        'fees',
        `Collected ৳${netPayable} from ${getStudentNameEn(selectedStudent)} (Roll: ${selectedStudent.rollNumber}) Receipt #${rcptNum}`
      );

      // Trigger modal for printing receipt
      setActiveReceipt(paymentRecord);
      setActiveReceiptInvoice(chosenInvoices[0]);

      // Reset form
      setPaymentAmount(0);
      setLateFineAmount(0);
      setDiscountAmount(0);
      setTransactionRef('');
      setRemarks('');
      setTenderedCash(0);

      onRefresh();
    } catch (err) {
      console.error('Failed to collect payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Search & Quick Select Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Quick Find Student: Enter Roll Number, Student Name, Student ID, or Parent Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Quick Dropdown Results */}
          {filteredStudents.length > 0 && (
            <div className="absolute left-0 right-0 top-12 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleSelectStudent(st)}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      #{st.rollNumber}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {getStudentNameEn(st)}{' '}
                        {getStudentNameBn(st) && (
                          <span className="text-xs text-slate-500 font-normal">({getStudentNameBn(st)})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {getStudentClassName(st)} • Section {getStudentSectionName(st)} • ID: {st.studentId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="w-3 h-3" />
                      <span>{getStudentPhone(st) || 'No phone'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Student Banner */}
        {selectedStudent ? (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-850 border border-blue-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {(getStudentNameEn(selectedStudent) || getStudentNameBn(selectedStudent) || 'S').charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {getStudentNameEn(selectedStudent)}
                  </h3>
                  {getStudentNameBn(selectedStudent) && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      ({getStudentNameBn(selectedStudent)})
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Roll #{selectedStudent.rollNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Class: <strong className="text-slate-700 dark:text-slate-200">{getStudentClassName(selectedStudent)}</strong> • Section:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{getStudentSectionName(selectedStudent)}</strong> • ID:{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{selectedStudent.studentId}</strong> • Guardian:{' '}
                  <span className="font-mono">{getStudentPhone(selectedStudent) || 'N/A'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Outstanding Due
                </span>
                <span
                  className={`text-xl font-bold font-mono ${
                    totalOutstandingDue > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  ৳{totalOutstandingDue.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                Change Student
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 italic">
            <User className="w-3.5 h-3.5" />
            <span>Search and select a student above to open their fee collection register.</span>
          </div>
        )}
      </div>

      {/* Main Counter Workspace */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Pending Invoices & Due Months (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Pending Monthly Invoices ({studentInvoices.filter((i) => i.status !== 'paid').length})</span>
                </h4>
                <span className="text-xs text-slate-400">Click to select for collection</span>
              </div>

              {studentInvoices.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No fee invoices generated yet for this student. Use the &quot;Invoices &amp; Billing&quot; tab to generate monthly bills.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {studentInvoices.map((inv) => {
                    const isSelected = selectedInvoiceIds.includes(inv.id);
                    const isPaid = inv.status === 'paid';

                    return (
                      <div
                        key={inv.id}
                        onClick={() => !isPaid && handleToggleInvoice(inv.id)}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isPaid
                            ? 'bg-slate-50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-70 cursor-default'
                            : isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 cursor-pointer'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              disabled={isPaid}
                              checked={isSelected}
                              onChange={() => !isPaid && handleToggleInvoice(inv.id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {inv.month}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  ({inv.invoiceNumber})
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    inv.status === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : inv.status === 'partial'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                                <span>Due Date: {inv.dueDate}</span>
                                {inv.lateFine > 0 && (
                                  <span className="text-amber-600 font-semibold">
                                    +৳{inv.lateFine} Fine
                                  </span>
                                )}
                                {inv.totalWaiver > 0 && (
                                  <span className="text-emerald-600 font-semibold">
                                    -৳{inv.totalWaiver} Waiver
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">Payable / Due</span>
                            <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                              ৳{inv.dueAmount.toLocaleString()}
                            </span>
                            {inv.paidAmount > 0 && (
                              <span className="text-[10px] text-emerald-600 block">
                                Paid: ৳{inv.paidAmount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fee Heads breakdown chips */}
                        {inv.items && inv.items.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                            {inv.items.map((it, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                              >
                                {it.feeHeadName}: ৳{it.amount}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past Payment Receipts for this Student */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment History ({studentPayments.length} Receipts)</span>
              </h4>

              {studentPayments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No past payment records found.</p>
              ) : (
                <div className="space-y-2">
                  {studentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-750"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{p.receiptNumber}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-normal text-slate-600 dark:text-slate-300">{p.monthCovered}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Date: {p.paymentDate} • Method: <span className="uppercase">{p.paymentMethod}</span>
                          {p.transactionRef ? ` (${p.transactionRef})` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                          ৳{p.totalCollected.toLocaleString()}
                        </span>
                        {hasPermission('fees', 'print') && (
                          <button
                            onClick={() => {
                              setActiveReceipt(p);
                              const inv = studentInvoices.find((i) => i.id === p.invoiceId);
                              setActiveReceiptInvoice(inv);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Collection Counter Register & Receipt Generation (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs sticky top-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Fee Collection Counter (ক্যাশ কাউন্টার)</span>
              </h4>

              <form onSubmit={handleCollectPayment} className="space-y-4">
                {/* Selected Invoices summary */}
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Selected Invoices:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedInvoiceIds.length} Month(s)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500">
                    <span>Base Fee Total:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ৳{paymentAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-amber-600">
                    <span>Late Fine:</span>
                    <span className="font-mono font-bold">+৳{lateFineAmount.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-emerald-600">
                      <span>Waiver / Discount:</span>
                      <span className="font-mono font-bold">-৳{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                    <span>Net Payable (মোট দেয়):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      ৳{netPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount Adjustments if partial */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Paying Amount (৳)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={paymentAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setPaymentAmount(val);
                        setTenderedCash(val + lateFineAmount - discountAmount);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Late Fine (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={lateFineAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setLateFineAmount(val);
                        setTenderedCash(paymentAmount + val - discountAmount);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono text-amber-600 font-bold"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Payment Channel
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Cash (নগদ)' },
                      { id: 'bkash', label: 'bKash (বিকাশ)' },
                      { id: 'nagad', label: 'Nagad (নগদ)' },
                      { id: 'rocket', label: 'Rocket' },
                      { id: 'bank_challan', label: 'Bank Challan' },
                      { id: 'pos', label: 'Card / POS' },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`p-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction Ref for digital / bank payments */}
                {paymentMethod !== 'cash' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Transaction ID / Slip No. / Challan No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BK8923091 or Slip #4021"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Cash Tendered & Change Return */}
                {paymentMethod === 'cash' && (
                  <div className="grid grid-cols-2 gap-3 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
                        Cash Tendered (গ্রহীত)
                      </label>
                      <input
                        type="number"
                        value={tenderedCash}
                        onChange={(e) => setTenderedCash(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
                        Change Return (ফেরত)
                      </label>
                      <div className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white/70 dark:bg-slate-900/70 border border-emerald-300 dark:border-emerald-700 rounded">
                        ৳{changeDue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Receipt Remarks (ঐচ্ছিক মন্তব্য)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared via parent in person"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* Submit Payment Action */}
                <button
                  type="submit"
                  disabled={netPayable <= 0 || !hasPermission('fees', 'add')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                  title={!hasPermission('fees', 'add') ? 'Permission Denied: You cannot collect fees' : ''}
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    {!hasPermission('fees', 'add')
                      ? 'No Permission to Collect Fees'
                      : `Receive ৳${netPayable.toLocaleString()} & Print 3-Part Receipt`}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Money Receipt Modal */}
      {activeReceipt && (
        <MoneyReceiptModal
          payment={activeReceipt}
          invoice={activeReceiptInvoice}
          onClose={() => setActiveReceipt(null)}
        />
      )}
    </div>
  );
};
