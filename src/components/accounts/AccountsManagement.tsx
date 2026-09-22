import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AccountHead,
  BankAccountItem,
  FinancialVoucher,
  StaffPayrollItem,
  Teacher,
} from '../../types';
import { getAll, add, update, remove, get } from '../../db/indexedDB';
import { generateSampleAccountsData } from './sampleAccountsData';
import { AccountsOverviewTab } from './AccountsOverviewTab';
import { VouchersTab } from './VouchersTab';
import { PayrollTab } from './PayrollTab';
import { ChartOfAccountsTab } from './ChartOfAccountsTab';
import { BankAccountsTab } from './BankAccountsTab';
import { FinancialReportsTab } from './FinancialReportsTab';
import { VoucherPrintModal } from './VoucherPrintModal';
import { PayslipModal } from './PayslipModal';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  FolderTree,
  Building,
  BarChart3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AccountsManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, currentUser, logAudit } = useApp();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'vouchers' | 'payroll' | 'chart' | 'banks' | 'reports'
  >('overview');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [accountHeads, setAccountHeads] = useState<AccountHead[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [vouchers, setVouchers] = useState<FinancialVoucher[]>([]);
  const [payrollItems, setPayrollItems] = useState<StaffPayrollItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Print modal states
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<FinancialVoucher | null>(
    null
  );
  const [selectedPayrollForPayslip, setSelectedPayrollForPayslip] =
    useState<StaffPayrollItem | null>(null);

  // New voucher shortcut state
  const [newVoucherModalType, setNewVoucherModalType] = useState<
    'debit' | 'credit' | 'contra' | null
  >(null);

  // Load all accounts data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const instId = activeInstitute?.id || 'inst-01';
      const yearId = activeAcademicYear?.id || 'ay-2026';

      const [storedHeads, storedBanks, storedVouchers, storedSalaries, storedTeachers] =
        await Promise.all([
          getAll<AccountHead>('accountHeads'),
          getAll<BankAccountItem>('bankAccounts'),
          getAll<FinancialVoucher>('vouchers'),
          getAll<StaffPayrollItem>('salaries'),
          getAll<Teacher>('teachers'),
        ]);

      setTeachers(storedTeachers);

      // If empty, auto-seed with sample institutional accounting data
      if (storedHeads.length === 0 && storedBanks.length === 0) {
        const seedData = generateSampleAccountsData(instId, yearId, storedTeachers);

        await Promise.all([
          ...seedData.accountHeads.map((h) => add('accountHeads', h)),
          ...seedData.bankAccounts.map((b) => add('bankAccounts', b)),
          ...seedData.vouchers.map((v) => add('vouchers', v)),
          ...seedData.payrollItems.map((p) => add('salaries', p)),
        ]);

        setAccountHeads(seedData.accountHeads);
        setBankAccounts(seedData.bankAccounts);
        setVouchers(seedData.vouchers);
        setPayrollItems(seedData.payrollItems);
      } else {
        setAccountHeads(storedHeads);
        setBankAccounts(storedBanks);
        setVouchers(storedVouchers);
        setPayrollItems(storedSalaries);
      }
    } catch (err) {
      console.error('Error loading accounts data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute, activeAcademicYear]);

  // Seed / Reset Sample Data manually
  const handleResetSampleData = async () => {
    if (
      !window.confirm(
        'Seed sample Bangladeshi school financial data (Chart of Accounts, Bank Accounts, Vouchers & Faculty Payroll)?'
      )
    ) {
      return;
    }
    setIsLoading(true);
    try {
      const instId = activeInstitute?.id || 'inst-01';
      const yearId = activeAcademicYear?.id || 'ay-2026';
      const seedData = generateSampleAccountsData(instId, yearId, teachers);

      await Promise.all([
        ...seedData.accountHeads.map((h) => add('accountHeads', h)),
        ...seedData.bankAccounts.map((b) => add('bankAccounts', b)),
        ...seedData.vouchers.map((v) => add('vouchers', v)),
        ...seedData.payrollItems.map((p) => add('salaries', p)),
      ]);

      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  // Save new voucher and adjust account balances
  const handleSaveVoucher = async (voucher: FinancialVoucher) => {
    await add('vouchers', voucher);

    // Update account head balance
    const head = accountHeads.find((h) => h.id === voucher.accountHeadId);
    if (head) {
      let updatedHeadBalance = head.currentBalance;
      if (voucher.voucherType === 'credit') {
        updatedHeadBalance += voucher.amount;
      } else if (voucher.voucherType === 'debit') {
        updatedHeadBalance += voucher.amount;
      }
      const updatedHead = { ...head, currentBalance: updatedHeadBalance };
      await update('accountHeads', updatedHead);
    }

    // Update bank balance if applicable
    if (voucher.bankAccountId) {
      const bank = bankAccounts.find((b) => b.id === voucher.bankAccountId);
      if (bank) {
        let updatedBankBal = bank.currentBalance;
        if (voucher.voucherType === 'credit' || voucher.voucherType === 'contra') {
          updatedBankBal += voucher.amount;
        } else if (voucher.voucherType === 'debit') {
          updatedBankBal -= voucher.amount;
        }
        const updatedBank = { ...bank, currentBalance: updatedBankBal };
        await update('bankAccounts', updatedBank);
      }
    }

    await logAudit(
      'create',
      'accounts',
      `Created ${voucher.voucherType.toUpperCase()} voucher #${voucher.voucherNumber} for ৳${voucher.amount.toLocaleString()}`,
      voucher.id
    );

    await loadData();
  };

  // Delete voucher
  const handleDeleteVoucher = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) return;
    await remove('vouchers', id);
    await logAudit('delete', 'accounts', `Deleted voucher ${id}`, id);
    await loadData();
  };

  // Disburse faculty salary and create corresponding Debit Voucher
  const handleDisburseSalary = async (
    item: StaffPayrollItem,
    method: 'bank_transfer' | 'cash'
  ) => {
    const paymentDate = new Date().toISOString().split('T')[0];

    // Find salary expense head
    const salHead =
      accountHeads.find((h) => h.code === '401' || h.name.toLowerCase().includes('salary')) ||
      accountHeads.find((h) => h.type === 'expense');

    // Find default bank account or cash
    const defaultBank = bankAccounts.find((b) => b.accountType !== 'cash') || bankAccounts[0];

    const voucherNumber = `DV-${new Date().getFullYear()}-${String(
      vouchers.filter((v) => v.voucherType === 'debit').length + 1
    ).padStart(4, '0')}`;

    const autoVoucher: FinancialVoucher = {
      id: `vouch-sal-${Date.now()}`,
      instituteId: activeInstitute?.id || 'inst-01',
      academicYearId: activeAcademicYear?.id || 'ay-2026',
      voucherNumber,
      voucherType: 'debit',
      date: paymentDate,
      accountHeadId: salHead?.id || 'head-sal',
      accountHeadName: salHead?.name || 'Teachers & Staff Salaries',
      accountHeadCode: salHead?.code || '401',
      amount: item.netPayable,
      paymentMethod: method,
      bankAccountId: method === 'bank_transfer' ? defaultBank?.id : undefined,
      bankAccountName: method === 'bank_transfer' ? defaultBank?.bankName : undefined,
      payeeRecipient: `${item.teacherName} (${item.designation})`,
      description: `Monthly salary payout for ${item.month} (Basic: ৳${item.basicSalary}, Gross: ৳${item.grossSalary}, Ded: ৳${item.totalDeductions})`,
      approvedBy: 'Principal / Headmaster',
      preparedBy: currentUser?.username || 'Accountant',
      status: 'posted',
      createdAt: new Date().toISOString(),
    };

    // Update payroll item
    const updatedPayroll: StaffPayrollItem = {
      ...item,
      paymentStatus: 'paid',
      paymentDate,
      paymentMethod: method,
      voucherId: autoVoucher.id,
      remarks: `Paid via ${method.replace('_', ' ')} with voucher ${voucherNumber}`,
    };

    await Promise.all([
      update('salaries', updatedPayroll),
      add('vouchers', autoVoucher),
    ]);

    await logAudit(
      'update',
      'accounts',
      `Disbursed salary for ${item.teacherName} (${item.month}) - ৳${item.netPayable}`,
      item.id
    );

    await loadData();
  };

  // Batch disburse all pending salary items for the month
  const handleBatchDisburse = async (month: string) => {
    const pending = payrollItems.filter(
      (p) => p.month === month && p.paymentStatus === 'unpaid'
    );
    for (const item of pending) {
      await handleDisburseSalary(item, 'bank_transfer');
    }
  };

  // Generate payroll sheet for a month
  const handleGeneratePayrollSheet = async (month: string) => {
    const instId = activeInstitute?.id || 'inst-01';
    const yearId = activeAcademicYear?.id || 'ay-2026';

    const sourceStaff =
      teachers.length > 0
        ? teachers
        : [
            {
              id: `t-01-${instId}`,
              firstName: 'Mohammad',
              lastName: 'Rahman',
              designation: 'Principal',
              basicSalary: 45000,
              bankAccountNumber: '4401202011221',
              bankName: 'Sonali Bank PLC',
              phone: '01711223344',
            } as any,
            {
              id: `t-02-${instId}`,
              firstName: 'Abdul',
              lastName: 'Karim',
              designation: 'Assistant Headmaster',
              basicSalary: 35000,
              bankAccountNumber: '4401202011222',
              bankName: 'Sonali Bank PLC',
              phone: '01811223344',
            } as any,
            {
              id: `t-03-${instId}`,
              firstName: 'Fatema',
              lastName: 'Begum',
              designation: 'Senior Teacher',
              basicSalary: 28000,
              bankAccountNumber: '1151200099881',
              bankName: 'Dutch-Bangla Bank',
              phone: '01911223344',
            } as any,
          ];

    const newItems: StaffPayrollItem[] = sourceStaff.map((st: any, idx: number) => {
      const basic = Number(st.basicSalary) || (25000 - idx * 2000);
      const houseRent = 1000;
      const medical = 500;
      const special = idx === 0 ? 3000 : 1000;
      const bonus = 0;
      const gross = basic + houseRent + medical + special + bonus;

      const pf = Math.round(basic * 0.06);
      const welfare = Math.round(basic * 0.04);
      const totalDed = pf + welfare;
      const net = gross - totalDed;

      return {
        id: `pr-${month.replace(/\s+/g, '-').toLowerCase()}-${st.id}`,
        instituteId: instId,
        academicYearId: yearId,
        month,
        teacherId: st.id,
        teacherName: `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.nameEn || 'Faculty Member',
        teacherPhone: st.phone || '01700000000',
        designation: st.designation || 'Teacher',
        bengaliDesignation: st.bengaliDesignation || 'শিক্ষক',
        mpoType: idx < 3 ? 'mpo' : 'non_mpo',
        bankAccountNumber: st.bankAccountNumber || `44012020${1000 + idx}`,
        bankName: st.bankName || 'Sonali Bank PLC',
        basicSalary: basic,
        houseRent,
        medicalAllowance: medical,
        specialAllowance: special,
        festivalBonus: bonus,
        grossSalary: gross,
        providentFundDeduction: pf,
        welfareDeduction: welfare,
        advanceDeduction: 0,
        otherDeductions: 0,
        totalDeductions: totalDed,
        netPayable: net,
        paymentStatus: 'unpaid',
      };
    });

    await Promise.all(newItems.map((item) => add('salaries', item)));
    await loadData();
  };

  // Chart of Accounts Save
  const handleSaveHead = async (head: AccountHead) => {
    await update('accountHeads', head);
    await logAudit(
      'update',
      'accounts',
      `Saved account head ${head.code} - ${head.name}`,
      head.id
    );
    await loadData();
  };

  // Chart of Accounts Delete
  const handleDeleteHead = async (id: string) => {
    if (!window.confirm('Delete this account head?')) return;
    await remove('accountHeads', id);
    await logAudit('delete', 'accounts', `Deleted account head ${id}`, id);
    await loadData();
  };

  // Bank Account Save
  const handleSaveBankAccount = async (bank: BankAccountItem) => {
    await update('bankAccounts', bank);
    await logAudit('update', 'accounts', `Saved bank account ${bank.bankName}`, bank.id);
    await loadData();
  };

  // Inter-account transfer (Contra Voucher)
  const handleTransferFunds = async (
    fromId: string,
    toId: string,
    amount: number,
    description: string
  ) => {
    const fromBank = bankAccounts.find((b) => b.id === fromId);
    const toBank = bankAccounts.find((b) => b.id === toId);
    if (!fromBank || !toBank) return;

    // Update balances
    const updatedFrom = { ...fromBank, currentBalance: fromBank.currentBalance - amount };
    const updatedTo = { ...toBank, currentBalance: toBank.currentBalance + amount };

    // Create Contra Voucher
    const voucherNumber = `CT-${new Date().getFullYear()}-${String(
      vouchers.filter((v) => v.voucherType === 'contra').length + 1
    ).padStart(4, '0')}`;

    const contraVoucher: FinancialVoucher = {
      id: `vouch-ct-${Date.now()}`,
      instituteId: activeInstitute?.id || 'inst-01',
      academicYearId: activeAcademicYear?.id || 'ay-2026',
      voucherNumber,
      voucherType: 'contra',
      date: new Date().toISOString().split('T')[0],
      accountHeadId: 'head-ast-02',
      accountHeadName: 'Bank Balances & Cash Transfer',
      accountHeadCode: '102',
      amount,
      paymentMethod: fromBank.accountType === 'cash' ? 'cash' : 'bank_transfer',
      bankAccountId: toBank.id,
      bankAccountName: `${toBank.bankName} (${toBank.accountNumber})`,
      payeeRecipient: `${toBank.bankName} (${toBank.accountNumber})`,
      description: `Contra Transfer: From ${fromBank.bankName} to ${toBank.bankName}. ${description}`,
      approvedBy: 'Principal / Headmaster',
      preparedBy: currentUser?.username || 'Accountant',
      status: 'posted',
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      update('bankAccounts', updatedFrom),
      update('bankAccounts', updatedTo),
      add('vouchers', contraVoucher),
    ]);

    await logAudit(
      'update',
      'accounts',
      `Fund transfer of ৳${amount} from ${fromBank.bankName} to ${toBank.bankName}`,
      contraVoucher.id
    );

    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* MODULE TOP TITLE & SUB-NAV BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{language === 'bn' ? 'হিসাব ও অর্থ ব্যবস্থাপনা' : 'Accounts & Finance Management'}</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Phase 8
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Double-entry institutional accounting, debit/credit vouchers, faculty payroll, bank ledger &amp; audited reports
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadData}
            title="Refresh accounts data"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleResetSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Financial Data</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{language === 'bn' ? 'সংক্ষিপ্ত চিত্র ও উদ্বৃত্ত' : 'Overview & Liquidity'}</span>
        </button>

        <button
          onClick={() => setActiveTab('vouchers')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'vouchers'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{language === 'bn' ? 'ভাউচার ব্যবস্থাপনা' : 'Voucher Ledger'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {vouchers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'payroll'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{language === 'bn' ? 'শিক্ষক বেতন ও পে-রোল' : 'Faculty Payroll'}</span>
        </button>

        <button
          onClick={() => setActiveTab('chart')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'chart'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{language === 'bn' ? 'হিসাব খাতসমূহ' : 'Chart of Accounts'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {accountHeads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('banks')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'banks'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{language === 'bn' ? 'ব্যাংক হিসাব ও নগদ' : 'Bank Accounts & Cash'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{language === 'bn' ? 'আর্থিক বিবরণী ও প্রতিবেদন' : 'Financial Statements'}</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
          <p className="text-xs">Loading accounts ledger and financial statements...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <AccountsOverviewTab
              accountHeads={accountHeads}
              bankAccounts={bankAccounts}
              vouchers={vouchers}
              payrollItems={payrollItems}
              onOpenNewVoucher={(type) => {
                setNewVoucherModalType(type);
                setActiveTab('vouchers');
              }}
              onSelectVoucherToPrint={(v) => setSelectedVoucherForPrint(v)}
              onSwitchTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'vouchers' && (
            <VouchersTab
              vouchers={vouchers}
              accountHeads={accountHeads}
              bankAccounts={bankAccounts}
              onSaveVoucher={handleSaveVoucher}
              onDeleteVoucher={handleDeleteVoucher}
              onPrintVoucher={(v) => setSelectedVoucherForPrint(v)}
              newVoucherModalType={newVoucherModalType}
              setNewVoucherModalType={setNewVoucherModalType}
            />
          )}

          {activeTab === 'payroll' && (
            <PayrollTab
              payrollItems={payrollItems}
              teachers={teachers}
              onDisburseSalary={handleDisburseSalary}
              onBatchDisburse={handleBatchDisburse}
              onGeneratePayrollSheet={handleGeneratePayrollSheet}
              onPrintPayslip={(p) => setSelectedPayrollForPayslip(p)}
            />
          )}

          {activeTab === 'chart' && (
            <ChartOfAccountsTab
              accountHeads={accountHeads}
              onSaveHead={handleSaveHead}
              onDeleteHead={handleDeleteHead}
            />
          )}

          {activeTab === 'banks' && (
            <BankAccountsTab
              bankAccounts={bankAccounts}
              onSaveBankAccount={handleSaveBankAccount}
              onTransferFunds={handleTransferFunds}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReportsTab
              accountHeads={accountHeads}
              bankAccounts={bankAccounts}
              vouchers={vouchers}
            />
          )}
        </>
      )}

      {/* PRINTABLE VOUCHER MODAL */}
      {selectedVoucherForPrint && (
        <VoucherPrintModal
          voucher={selectedVoucherForPrint}
          onClose={() => setSelectedVoucherForPrint(null)}
        />
      )}

      {/* PRINTABLE PAYSLIP MODAL */}
      {selectedPayrollForPayslip && (
        <PayslipModal
          payroll={selectedPayrollForPayslip}
          onClose={() => setSelectedPayrollForPayslip(null)}
        />
      )}
    </div>
  );
};
