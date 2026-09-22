import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Student,
  ClassItem,
  SectionItem,
  FeePaymentRecord,
  StudentFeeInvoice,
  PaymentMethod,
} from '../../types';
import { getAll, putItem, add } from '../../db/indexedDB';
import { recordReversibleAction } from '../../utils/actionUndoService';
import { MoneyReceiptModal } from './MoneyReceiptModal';
import {
  Search,
  User,
  CreditCard,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Calendar,
  Sparkles,
  Users,
  ShieldCheck,
  Gift,
  Coins,
  FileCheck,
  ArrowRight,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';

const MONTHS_LIST = [
  { key: 'January', bn: 'জানুয়ারি' },
  { key: 'February', bn: 'ফেব্রুয়ারি' },
  { key: 'March', bn: 'মার্চ' },
  { key: 'April', bn: 'এপ্রিল' },
  { key: 'May', bn: 'মে' },
  { key: 'June', bn: 'জুন' },
  { key: 'July', bn: 'জুলাই' },
  { key: 'August', bn: 'আগস্ট' },
  { key: 'September', bn: 'সেপ্টেম্বর' },
  { key: 'October', bn: 'অক্টোবর' },
  { key: 'November', bn: 'নভেম্বর' },
  { key: 'December', bn: 'ডিসেম্বর' },
];

export const QuickIdFeeCollection: React.FC = () => {
  const { activeInstitute, activeAcademicYear, currentUser, language, logAudit, setActiveTab } = useApp();

  // Core Data
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Selection
  const [studentIdInput, setStudentIdInput] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fee Calculation States
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    MONTHS_LIST[new Date().getMonth()].key,
  ]);
  const [includeExamFee, setIncludeExamFee] = useState<boolean>(false);
  const [includeSessionFee, setIncludeSessionFee] = useState<boolean>(false);
  const [includeIctFee, setIncludeIctFee] = useState<boolean>(false);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [lateFine, setLateFine] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [tenderedCash, setTenderedCash] = useState<number>(0);

  // Receipt Modal State
  const [receiptRecord, setReceiptRecord] = useState<FeePaymentRecord | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<StudentFeeInvoice | undefined>(undefined);

  // Standard Monthly Tuition Fee for current class (default ~800 BDT)
  const baseMonthlyTuition = useMemo(() => {
    if (!selectedStudent) return 800;
    // can vary slightly based on class, default 800
    return 800;
  }, [selectedStudent]);

  // Load all initial data
  const loadData = async () => {
    if (!activeInstitute) return;
    setIsLoading(true);
    try {
      const [allStudents, allClasses, allSections, allInvoices, allPayments] = await Promise.all([
        getAll<Student>('students'),
        getAll<ClassItem>('classes'),
        getAll<SectionItem>('sections'),
        getAll<StudentFeeInvoice>('feeCharges'),
        getAll<FeePaymentRecord>('payments'),
      ]);

      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);
      setStudents(instStudents);
      setClasses(allClasses.filter((c) => c.instituteId === activeInstitute.id));
      setSections(allSections.filter((s) => s.instituteId === activeInstitute.id));
      setInvoices(allInvoices || []);
      setPayments(allPayments || []);
    } catch (err) {
      console.error('Failed to load quick fee data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id, activeAcademicYear?.id]);

  // Auto-search / suggestions for student ID
  const suggestions = useMemo(() => {
    if (!studentIdInput.trim()) return [];
    const q = studentIdInput.toLowerCase().trim();
    return students
      .filter((s) => {
        return (
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.bengaliName && s.bengaliName.includes(q)) ||
          String(s.rollNumber).includes(q) ||
          (s.phone && s.phone.includes(q))
        );
      })
      .slice(0, 6);
  }, [students, studentIdInput]);

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setStudentIdInput(st.studentId || '');
  };

  // Find linked siblings
  const linkedSiblings = useMemo(() => {
    if (!selectedStudent) return [];
    const siblingIds = selectedStudent.siblingStudentIds || [];
    return students.filter(
      (s) => s.id !== selectedStudent.id && (siblingIds.includes(s.id) || siblingIds.includes(s.studentId))
    );
  }, [selectedStudent, students]);

  // Sibling fee concession calculation:
  // If student is linked with siblings and isSiblingFeePayer is false, monthly tuition fee is 100% WAIVED!
  const isFreeSiblingBeneficiary = Boolean(
    selectedStudent &&
    selectedStudent.isSiblingFeePayer === false &&
    linkedSiblings.length > 0
  );

  const isPrimaryPayerSibling = Boolean(
    selectedStudent &&
    selectedStudent.isSiblingFeePayer === true &&
    linkedSiblings.length > 0
  );

  // Fee calculation logic
  const monthCount = selectedMonths.length;
  const regularMonthlyTotal = monthCount * baseMonthlyTuition;
  // Sibling discount: 100% of regular monthly tuition if secondary sibling
  const siblingMonthlyDiscount = isFreeSiblingBeneficiary ? regularMonthlyTotal : 0;
  const netMonthlyTuition = regularMonthlyTotal - siblingMonthlyDiscount;

  const examFeeAmount = includeExamFee ? 400 : 0;
  const sessionFeeAmount = includeSessionFee ? 1200 : 0;
  const ictFeeAmount = includeIctFee ? 200 : 0;

  const subTotal = netMonthlyTuition + examFeeAmount + sessionFeeAmount + ictFeeAmount;
  const grandTotal = Math.max(0, subTotal + lateFine - customDiscount);
  const changeDue = tenderedCash > grandTotal ? tenderedCash - grandTotal : 0;

  // Toggle month
  const toggleMonth = (mKey: string) => {
    setSelectedMonths((prev) =>
      prev.includes(mKey) ? prev.filter((m) => m !== mKey) : [...prev, mKey]
    );
  };

  // Student class / section names
  const studentClassName = useMemo(() => {
    if (!selectedStudent) return '';
    const cls = classes.find((c) => c.id === selectedStudent.classId);
    return cls ? cls.name : `Class ${selectedStudent.classId}`;
  }, [selectedStudent, classes]);

  const studentSectionName = useMemo(() => {
    if (!selectedStudent) return '';
    const sec = sections.find((s) => s.id === selectedStudent.sectionId);
    return sec ? sec.name : 'A';
  }, [selectedStudent, sections]);

  // Handle Payment Collection & Receipt Generation
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !activeInstitute) return;
    if (grandTotal <= 0 && !isFreeSiblingBeneficiary) {
      alert(language === 'bn' ? 'অনুগ্রহ করে ফি এর খাত নির্বাচন করুন।' : 'Please select a valid fee item.');
      return;
    }

    try {
      const pId = `pay-${Date.now()}`;
      const rcptNum = `MR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const todayStr = new Date().toISOString().split('T')[0];

      const monthsStr = selectedMonths.join(', ') || 'Current Term';

      const paymentRecord: FeePaymentRecord = {
        id: pId,
        receiptNumber: rcptNum,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || selectedStudent.academicYearId || '2026-27',
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim(),
        rollNumber: selectedStudent.rollNumber || 1,
        classId: selectedStudent.classId || '',
        className: studentClassName,
        sectionName: studentSectionName,
        monthCovered: monthsStr,
        paidAmount: subTotal,
        lateFinePaid: lateFine,
        totalCollected: grandTotal,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
        remarks:
          remarks.trim() ||
          (isFreeSiblingBeneficiary
            ? 'Collected with 100% Sibling Concession Waiver'
            : 'Counter ID Fee Collection'),
        collectedBy: currentUser?.fullName || 'Cashier',
        paymentDate: todayStr,
        createdAt: new Date().toISOString(),
      };

      // Create a matching invoice summary
      const invoiceRecord: StudentFeeInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        instituteId: activeInstitute.id,
        academicYearId: activeAcademicYear?.id || '2026-27',
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`.trim(),
        rollNumber: selectedStudent.rollNumber || 1,
        classId: selectedStudent.classId || '',
        className: studentClassName,
        sectionId: selectedStudent.sectionId || '',
        sectionName: studentSectionName,
        month: monthsStr,
        billingDate: todayStr,
        dueDate: todayStr,
        items: [
          {
            feeHeadId: 'monthly_tuition',
            feeHeadName: `Monthly Tuition (${monthsStr})`,
            amount: regularMonthlyTotal,
            waiverDiscount: siblingMonthlyDiscount,
            netAmount: regularMonthlyTotal - siblingMonthlyDiscount,
          },
          ...(includeExamFee
            ? [
                {
                  feeHeadId: 'exam_fee',
                  feeHeadName: 'Term Examination Fee',
                  amount: examFeeAmount,
                  waiverDiscount: 0,
                  netAmount: examFeeAmount,
                },
              ]
            : []),
          ...(includeSessionFee
            ? [
                {
                  feeHeadId: 'session_charge',
                  feeHeadName: 'Annual Session Charge',
                  amount: sessionFeeAmount,
                  waiverDiscount: 0,
                  netAmount: sessionFeeAmount,
                },
              ]
            : []),
          ...(includeIctFee
            ? [
                {
                  feeHeadId: 'ict_fee',
                  feeHeadName: 'ICT & Lab Fee',
                  amount: ictFeeAmount,
                  waiverDiscount: 0,
                  netAmount: ictFeeAmount,
                },
              ]
            : []),
        ],
        totalAmount: regularMonthlyTotal + examFeeAmount + sessionFeeAmount + ictFeeAmount,
        totalWaiver: siblingMonthlyDiscount + customDiscount,
        payableAmount: grandTotal,
        paidAmount: grandTotal,
        dueAmount: 0,
        lateFine: lateFine,
        status: 'paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to IndexedDB
      await putItem('payments', paymentRecord);
      await putItem('feeCharges', invoiceRecord);

      setPayments((prev) => [paymentRecord, ...prev]);
      setInvoices((prev) => [invoiceRecord, ...prev]);

      logAudit(
        'CREATE',
        'fees',
        `Collected ৳${grandTotal} for Student ID ${selectedStudent.studentId} (${selectedStudent.firstName}) - Receipt ${rcptNum}`
      );

      // Register granular reversible action log for instantaneous single-action undo
      try {
        await recordReversibleAction({
          module: 'fees',
          actionType: 'FEE_PAYMENT',
          title: `Fee Collection: ৳${grandTotal} (${rcptNum})`,
          bengaliTitle: `ফি আদায়: ৳${grandTotal} (রসিদ #${rcptNum})`,
          details: `Collected ৳${grandTotal} for student ${selectedStudent.firstName} ${selectedStudent.lastName || ''} (${selectedStudent.studentId}) via ${paymentMethod.toUpperCase()}`,
          targetStore: 'feeCharges',
          targetId: invoiceRecord.id,
          targetIdentifier: rcptNum,
          userId: currentUser?.id || 'admin',
          username: currentUser?.username || 'Admin',
          instituteId: activeInstitute?.id,
          academicYearId: activeAcademicYear?.id,
          reversalData: {
            store: 'feeCharges',
            previousState: null,
            currentState: invoiceRecord,
            feeMeta: {
              paymentId: paymentRecord.id,
              receiptId: paymentRecord.id,
              feeChargeId: invoiceRecord.id,
              studentId: selectedStudent.id,
              studentName: `${selectedStudent.firstName} ${selectedStudent.lastName || ''}`.trim(),
              receiptNumber: rcptNum,
              amountReversed: grandTotal,
              previousPaidAmount: 0,
              previousDueAmount: grandTotal,
              previousPaymentStatus: 'unpaid',
            },
          },
        });
      } catch (logErr) {
        console.warn('Could not record reversible action:', logErr);
      }

      // Open Money Receipt Modal immediately for printing
      setReceiptRecord(paymentRecord);
      setReceiptInvoice(invoiceRecord);
    } catch (err) {
      console.error('Failed to collect payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'স্টুডেন্ট আইডি দিয়ে দ্রুত ফি আদায়' : 'Quick Fee Collection by Student ID'}</span>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full border border-emerald-300">
                  {language === 'bn' ? 'সহোদর ডিসকাউন্ট পলিসি সক্রিয়' : 'Sibling Fee Policy Active'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'bn'
                  ? 'স্টুডেন্টের ইউনিক আইডি (যেমন: 260001) ইনপুট করুন এবং স্বয়ংক্রিয় সহোদর রিলেশনশিপ চেক ও ফি গ্রহণ করুন।'
                  : 'Enter unique student ID (e.g. 260001) for instant lookup, sibling concession checks, and receipt generation.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('action_undo')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              title={
                language === 'bn'
                  ? 'ভুলবশত ফি উঠালে নির্দিষ্ট এন্ট্রিটি আনডু করুন'
                  : 'Undo mistakenly entered fee collection'
              }
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'bn' ? 'ভুল এন্ট্রি আনডু (Undo)' : 'Undo Mistaken Entry'}</span>
            </button>

            <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {language === 'bn' ? 'শিক্ষাবর্ষ: ' : 'Academic Year: '}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {activeAcademicYear?.yearName || '2026-27'}
              </strong>
            </div>
          </div>
        </div>

        {/* Student ID Fast Search Box */}
        <div className="mt-6 relative">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            {language === 'bn' ? 'স্টুডেন্ট আইডি নম্বর লিখুন অথবা সিলেক্ট করুন' : 'Enter or Scan Student ID Number'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              placeholder={
                language === 'bn'
                  ? 'যেমন: 260001 অথবা শিক্ষার্থীর নাম / রোল নম্বর...'
                  : 'e.g. 260001 or student name / roll number...'
              }
              className="w-full pl-12 pr-28 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-2 border-indigo-500/50 focus:border-indigo-600 rounded-xl text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all shadow-inner font-mono"
            />
            <Search className="w-6 h-6 text-indigo-500 absolute left-3.5 top-3.5" />
            {selectedStudent && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentIdInput('');
                }}
                className="absolute right-3 top-2.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          {!selectedStudent && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
              {suggestions.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleSelectStudent(st)}
                  className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {st.photoUrl ? (
                      <img
                        src={st.photoUrl}
                        alt="Photo"
                        className="w-10 h-10 rounded-full object-cover border border-slate-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                        {(st.firstName || st.bengaliName || 'S').charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{st.firstName} {st.lastName}</span>
                        {st.bengaliName && (
                          <span className="text-xs text-slate-500">({st.bengaliName})</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: <strong className="text-indigo-600 dark:text-indigo-400">{st.studentId}</strong> • Roll: {st.rollNumber} • Class {st.classId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {st.siblingStudentIds && st.siblingStudentIds.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        {st.isSiblingFeePayer === false ? 'Sibling (100% Free)' : 'Paying Sibling'}
                      </span>
                    )}
                    <span className="text-xs text-indigo-600 font-semibold flex items-center justify-end gap-1 mt-1">
                      Select <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: If Student Selected */}
      {selectedStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Profile & Sibling Mapping Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Student Profile Overview */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                {selectedStudent.photoUrl ? (
                  <img
                    src={selectedStudent.photoUrl}
                    alt="Photo"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                    {(selectedStudent.firstName || selectedStudent.bengaliName || 'S').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2.5 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-md font-mono text-xs font-bold border border-indigo-300">
                    ID: {selectedStudent.studentId}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1 truncate">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h2>
                  {selectedStudent.bengaliName && (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {selectedStudent.bengaliName}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Class: <strong>{studentClassName}</strong> • Sec: <strong>{studentSectionName}</strong> • Roll: <strong>{selectedStudent.rollNumber}</strong>
                  </p>
                </div>
              </div>

              {/* Quick Details Table */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 text-xs space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Father / পিতা:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium text-right">
                    {selectedStudent.guardian?.fatherName || (selectedStudent as any).fatherName || 'N/A'}
                    {(selectedStudent.guardian?.fatherNameBn || (selectedStudent as any).fatherNameBn) && (
                      <span className="block text-[11px] text-slate-400 font-normal">
                        ({selectedStudent.guardian?.fatherNameBn || (selectedStudent as any).fatherNameBn})
                      </span>
                    )}
                  </span>
                </div>
                {(selectedStudent.guardian?.motherName || selectedStudent.guardian?.motherNameBn) && (
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Mother / মাতা:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium text-right">
                      {selectedStudent.guardian?.motherName || 'N/A'}
                      {selectedStudent.guardian?.motherNameBn && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          ({selectedStudent.guardian?.motherNameBn})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Emergency Phone:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {selectedStudent.phone || selectedStudent.guardian?.emergencyContactPhone || selectedStudent.guardian?.fatherPhone || 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission Date:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {selectedStudent.admissionDate || '2026-01-05'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <strong className="text-rose-600 font-bold">
                    {selectedStudent.bloodGroup || 'O+'}
                  </strong>
                </div>
              </div>

              {/* Sibling Policy Concession Box (CRITICAL REQUIREMENT) */}
              <div className="rounded-xl border p-4 transition-all">
                {isFreeSiblingBeneficiary ? (
                  // Student is Secondary Sibling -> 100% Free Monthly Fee!
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                      <Gift className="w-5 h-5 text-emerald-600" />
                      <span>{language === 'bn' ? 'সহোদর সুবিধা: ১০০% মাসিক ফি ফ্রি' : 'Sibling Policy: 100% Free Monthly Tuition'}</span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                      {language === 'bn'
                        ? 'এই শিক্ষার্থীর সহোদর এই প্রতিষ্ঠানে অধ্যয়নরত এবং নিয়মিত ফি প্রদান করছেন। ফলে স্কুলের নিয়ম অনুযায়ী এই শিক্ষার্থীর নিয়মিত মাসিক বেতন সম্পূর্ণ মওকুফ (৳০)।'
                        : 'This student has a registered sibling in the school who is the primary fee payer. Per school policy, monthly tuition fees are 100% waived (৳0).'}
                    </p>

                    {linkedSiblings.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 space-y-1">
                        <span className="font-bold">Linked Paying Sibling(s):</span>
                        {linkedSiblings.map((sib) => (
                          <div key={sib.id} className="flex items-center justify-between font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800">
                            <span>{sib.firstName} {sib.lastName} (ID: {sib.studentId})</span>
                            <span className="text-[10px] font-bold text-blue-600">Roll: {sib.rollNumber}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : isPrimaryPayerSibling ? (
                  // Student is the Primary Paying Sibling
                  <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-black text-sm">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <span>{language === 'bn' ? 'প্রধান ফি প্রদানকারী সহোদর' : 'Designated Primary Fee Payer'}</span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300/90 leading-relaxed">
                      {language === 'bn'
                        ? 'এই শিক্ষার্থী পরিবারের প্রধান ফি প্রদানকারী হিসেবে নিবন্ধিত। অন্য সহোদররা ১০০% ফ্রি মাসিক বেতনের সুবিধা ভোগ করছে।'
                        : 'This student is the designated fee payer. Linked siblings in the school receive 100% free monthly tuition.'}
                    </p>

                    {linkedSiblings.length > 0 && (
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
                        <span className="font-bold">Dependent Free Sibling(s):</span>
                        {linkedSiblings.map((sib) => (
                          <div key={sib.id} className="flex items-center justify-between font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                            <span>{sib.firstName} {sib.lastName} (ID: {sib.studentId})</span>
                            <span className="text-[10px] font-bold text-emerald-600 font-sans">100% Free</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // No siblings linked
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{language === 'bn' ? 'একক শিক্ষার্থী (কোনো সহোদর লিংক নেই)' : 'Single Student (Standard Fee Schedule)'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Fee Heads, Month Selector, Breakdown & Collection Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleCollectPayment} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-600" />
                  <span>{language === 'bn' ? 'ফি নির্ধারণ ও আদায়' : 'Fee Assessment & Collection'}</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Base Tuition: ৳{baseMonthlyTuition}/mo
                </span>
              </div>

              {/* Month Multi-Selector Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month(s)'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {MONTHS_LIST.map((m) => {
                    const isSelected = selectedMonths.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleMonth(m.key)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        <div>{m.key.slice(0, 3)}</div>
                        <div className="text-[10px] opacity-80 font-normal">{m.bn}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Other Fee Heads */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {language === 'bn' ? 'অন্যান্য ফি এর খাত (ঐচ্ছিক)' : 'Additional Fee Heads (Optional)'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 cursor-pointer hover:border-indigo-300">
                    <input
                      type="checkbox"
                      checked={includeExamFee}
                      onChange={(e) => setIncludeExamFee(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Exam Fee</div>
                      <div className="text-slate-500 font-mono">+ ৳400</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 cursor-pointer hover:border-indigo-300">
                    <input
                      type="checkbox"
                      checked={includeSessionFee}
                      onChange={(e) => setIncludeSessionFee(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Session/Annual</div>
                      <div className="text-slate-500 font-mono">+ ৳1,200</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 cursor-pointer hover:border-indigo-300">
                    <input
                      type="checkbox"
                      checked={includeIctFee}
                      onChange={(e) => setIncludeIctFee(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">ICT & Lab</div>
                      <div className="text-slate-500 font-mono">+ ৳200</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Adjustments: Late Fine & Custom Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Late Fine / বিলম্ব ফি (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lateFine}
                    onChange={(e) => setLateFine(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Special Waiver / বিশেষ ছাড় (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Detailed Breakdown Invoice Summary Box */}
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-1.5 flex justify-between">
                  <span>Fee Item Description</span>
                  <span>Amount (BDT)</span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Monthly Tuition ({selectedMonths.length} Month(s) @ ৳{baseMonthlyTuition}):</span>
                  <span className="font-mono">৳{regularMonthlyTotal}</span>
                </div>

                {isFreeSiblingBeneficiary && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                    <span>সহোদর সুবিধা (100% Sibling Tuition Waiver):</span>
                    <span className="font-mono">- ৳{siblingMonthlyDiscount}</span>
                  </div>
                )}

                {includeExamFee && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Examination Fee:</span>
                    <span className="font-mono">+ ৳{examFeeAmount}</span>
                  </div>
                )}

                {includeSessionFee && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Session & Annual Charge:</span>
                    <span className="font-mono">+ ৳{sessionFeeAmount}</span>
                  </div>
                )}

                {includeIctFee && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>ICT & Computer Lab Fee:</span>
                    <span className="font-mono">+ ৳{ictFeeAmount}</span>
                  </div>
                )}

                {lateFine > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Late Fine:</span>
                    <span className="font-mono">+ ৳{lateFine}</span>
                  </div>
                )}

                {customDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Special Discount:</span>
                    <span className="font-mono">- ৳{customDiscount}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                  <span>{language === 'bn' ? 'সর্বমোট প্রদেয় ফি (Net Payable):' : 'Net Payable Total:'}</span>
                  <span className="text-xl font-mono text-indigo-600 dark:text-indigo-400">
                    ৳{grandTotal}
                  </span>
                </div>
              </div>

              {/* Payment Method & Cash Tendered */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium"
                  >
                    <option value="cash">Cash (নগদ)</option>
                    <option value="bkash">bKash (বিকাশ)</option>
                    <option value="nagad">Nagad (নগদ অ্যাপ)</option>
                    <option value="rocket">Rocket (রকেট)</option>
                    <option value="bank">Bank Deposit (ব্যাংক)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tendered Cash / প্রদত্ত টাকা
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tenderedCash || ''}
                    onChange={(e) => setTenderedCash(Number(e.target.value))}
                    placeholder={String(grandTotal)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Change Due / ফেরত টাকা
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-black text-emerald-600">
                    ৳{changeDue}
                  </div>
                </div>
              </div>

              {paymentMethod !== 'cash' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Transaction / TrxID Ref
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. 9J82KS10M"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-98"
              >
                <Printer className="w-5 h-5" />
                <span>
                  {language === 'bn'
                    ? `৳${grandTotal} ফি গ্রহণ করুন ও মানি রিসিট প্রিন্ট করুন`
                    : `Collect ৳${grandTotal} & Print Money Receipt`}
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-600">
            <Search className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {language === 'bn' ? 'শিক্ষার্থীর আইডি নম্বর ইনপুট করুন' : 'Enter Student ID to Start Collection'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'bn'
                ? 'উপরের সার্চ বক্সে শিক্ষার্থীর ইউনিক আইডি লিখলে সাথে সাথে তার প্রোফাইল, সহোদর স্ট্যাটাস এবং প্রদেয় ফি তালিকা দৃশ্যমান হবে।'
                : 'Type the student ID in the search box above to instantly inspect student profile, auto-detect sibling discount status, and collect fees.'}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap justify-center gap-2">
            {students.slice(0, 5).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => handleSelectStudent(st)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                ID: {st.studentId} ({st.firstName})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Money Receipt Print Modal */}
      {receiptRecord && (
        <MoneyReceiptModal
          payment={receiptRecord}
          invoice={receiptInvoice}
          onClose={() => {
            setReceiptRecord(null);
            setReceiptInvoice(undefined);
          }}
        />
      )}
    </div>
  );
};
