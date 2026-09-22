import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FeeHeadItem,
  FeeStructureItem,
  StudentFeeInvoice,
  FeePaymentRecord,
  StudentFeeWaiver,
  Student,
  ClassItem,
  SectionItem,
} from '../../types';
import { getAll, putItem } from '../../db/indexedDB';
import { generateSampleFeeData } from './sampleFeeData';
import { FeeCollectionCounter } from './FeeCollectionCounter';
import { QuickIdFeeCollection } from './QuickIdFeeCollection';
import { FeeInvoicesTab } from './FeeInvoicesTab';
import { FeeStructureTab } from './FeeStructureTab';
import { DuesDefaultersTab } from './DuesDefaultersTab';
import { DailyCollectionTab } from './DailyCollectionTab';
import { WaiversTab } from './WaiversTab';
import {
  CreditCard,
  Receipt,
  FileSpreadsheet,
  AlertTriangle,
  History,
  Award,
  Sparkles,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit } = useApp();

  const [activeTab, setActiveTab] = useState<
    'id-quick' | 'counter' | 'invoices' | 'structures' | 'dues' | 'daily' | 'waivers'
  >('id-quick');

  const [loading, setLoading] = useState(true);
  const [feeHeads, setFeeHeads] = useState<FeeHeadItem[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);
  const [invoices, setInvoices] = useState<StudentFeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [feeWaivers, setFeeWaivers] = useState<StudentFeeWaiver[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);

  const loadData = async () => {
    if (!activeInstitute) return;
    setLoading(true);

    try {
      // 1. Fetch existing core academic data
      const [allStudents, allClasses, allSections] = await Promise.all([
        getAll<Student>('students'),
        getAll<ClassItem>('classes'),
        getAll<SectionItem>('sections'),
      ]);

      const instStudents = allStudents.filter((s) => s.instituteId === activeInstitute.id);
      const instClasses = allClasses.filter((c) => c.instituteId === activeInstitute.id);
      const instSections = allSections.filter((s) => s.instituteId === activeInstitute.id);

      setStudents(instStudents);
      setClasses(instClasses);
      setSections(instSections);

      // 2. Fetch fee modules data
      let [storedHeads, storedStructures, storedInvoices, storedPayments, storedWaivers] =
        await Promise.all([
          getAll<FeeHeadItem>('feeTypes'),
          getAll<FeeStructureItem>('feeStructures'),
          getAll<StudentFeeInvoice>('feeCharges'),
          getAll<FeePaymentRecord>('payments'),
          getAll<StudentFeeWaiver>('feeWaivers'),
        ]);

      let instHeads = storedHeads.filter((h) => h.instituteId === activeInstitute.id);
      let instStructures = storedStructures.filter((s) => s.instituteId === activeInstitute.id);
      let instInvoices = storedInvoices.filter((i) => i.instituteId === activeInstitute.id);
      let instPayments = storedPayments.filter((p) => p.instituteId === activeInstitute.id);
      let instWaivers = storedWaivers.filter((w) => w.instituteId === activeInstitute.id);

      // If empty, auto-seed realistic sample data for smooth experience
      if (instHeads.length === 0 || instInvoices.length === 0) {
        const sample = generateSampleFeeData(
          activeInstitute.id,
          activeAcademicYear?.id || 'ay-2026',
          instStudents,
          instClasses
        );

        await Promise.all([
          ...sample.feeHeads.map((h) => putItem('feeTypes', h)),
          ...sample.feeStructures.map((s) => putItem('feeStructures', s)),
          ...sample.feeWaivers.map((w) => putItem('feeWaivers', w)),
          ...sample.invoices.map((i) => putItem('feeCharges', i)),
          ...sample.payments.map((p) => putItem('payments', p)),
        ]);

        instHeads = sample.feeHeads;
        instStructures = sample.feeStructures;
        instWaivers = sample.feeWaivers;
        instInvoices = sample.invoices;
        instPayments = sample.payments;
      }

      setFeeHeads(instHeads);
      setFeeStructures(instStructures);
      setInvoices(instInvoices);
      setPayments(instPayments);
      setFeeWaivers(instWaivers);
    } catch (err) {
      console.error('Error loading Fee Management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id, activeAcademicYear?.id]);

  const handleResetSampleData = async () => {
    if (!activeInstitute) return;
    if (!confirm('Re-seed standard Bangladeshi school fee heads, structures, and student sample bills?')) return;

    setLoading(true);
    try {
      const sample = generateSampleFeeData(
        activeInstitute.id,
        activeAcademicYear?.id || 'ay-2026',
        students,
        classes
      );

      await Promise.all([
        ...sample.feeHeads.map((h) => putItem('feeTypes', h)),
        ...sample.feeStructures.map((s) => putItem('feeStructures', s)),
        ...sample.feeWaivers.map((w) => putItem('feeWaivers', w)),
        ...sample.invoices.map((i) => putItem('feeCharges', i)),
        ...sample.payments.map((p) => putItem('payments', p)),
      ]);

      await logAudit('reset_fee_sample', 'fees', 'Re-seeded sample fee data');
      await loadData();
    } catch (err) {
      console.error('Error seeding fee data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Top tabs
  const tabs = [
    {
      id: 'id-quick',
      label: language === 'bn' ? 'আইডি দিয়ে ফি আদায় (সহোদর সুবিধা)' : 'Quick ID Collection (Sibling Policy)',
      bnLabel: 'আইডি ফি আদায়',
      icon: Zap,
    },
    {
      id: 'counter',
      label: language === 'bn' ? 'সাধারণ ফি কাউন্টার' : 'Collection Counter',
      bnLabel: 'ক্যাশ কাউন্টার',
      icon: Receipt,
    },
    {
      id: 'invoices',
      label: language === 'bn' ? 'ইনভয়েস ও বিলিং' : 'Invoices & Billing',
      bnLabel: 'মাসিক বিল',
      icon: FileSpreadsheet,
    },
    {
      id: 'structures',
      label: language === 'bn' ? 'ফি কাঠামো ও খাতসমূহ' : 'Fee Structures',
      bnLabel: 'শ্রেণিভিত্তিক রেট',
      icon: CreditCard,
    },
    {
      id: 'dues',
      label: language === 'bn' ? 'বকেয়া ও এসএমএস রিমাইন্ডার' : 'Dues & Defaulters',
      bnLabel: 'বকেয়া রেজিস্টার',
      icon: AlertTriangle,
    },
    {
      id: 'daily',
      label: language === 'bn' ? 'দৈনিক আদায় রিপোর্ট' : 'Daily Collection',
      bnLabel: 'ক্যাশ সামারি',
      icon: History,
    },
    {
      id: 'waivers',
      label: language === 'bn' ? 'বৃত্তি ও বিশেষ ছাড়' : 'Fee Waivers',
      bnLabel: 'ওয়েভার',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'ফি ব্যবস্থাপনা ও ছাত্র-ছাত্রী বিলিং' : 'Fee Management & Student Billing'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Phase 7
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Bangladeshi institutional tuition billing, instant 3-part money receipts, class-wise fee schedules, waiver discounts &amp; parent SMS alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleResetSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors cursor-pointer"
            title="Populate test data for Bangladeshi fee heads, invoices, and payments"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-800 border-t-2 border-x border-slate-200 dark:border-slate-700 border-t-blue-600 text-blue-600 dark:text-blue-400 shadow-xs -mb-px'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70 font-normal">({tab.bnLabel})</span>
            </button>
          );
        })}
      </div>

      {/* Loading state or View Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <span>Loading Fee Management records &amp; billing ledgers...</span>
        </div>
      ) : (
        <div>
          {activeTab === 'id-quick' && <QuickIdFeeCollection />}

          {activeTab === 'counter' && (
            <FeeCollectionCounter
              students={students}
              classes={classes}
              sections={sections}
              invoices={invoices}
              payments={payments}
              feeHeads={feeHeads}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'invoices' && (
            <FeeInvoicesTab
              invoices={invoices}
              classes={classes}
              sections={sections}
              students={students}
              feeHeads={feeHeads}
              feeStructures={feeStructures}
              feeWaivers={feeWaivers}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'structures' && (
            <FeeStructureTab
              feeHeads={feeHeads}
              feeStructures={feeStructures}
              classes={classes}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'dues' && (
            <DuesDefaultersTab
              invoices={invoices}
              classes={classes}
              sections={sections}
              students={students}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'daily' && (
            <DailyCollectionTab
              payments={payments}
              invoices={invoices}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'waivers' && (
            <WaiversTab
              feeWaivers={feeWaivers}
              students={students}
              classes={classes}
              onRefresh={loadData}
            />
          )}
        </div>
      )}
    </div>
  );
};
