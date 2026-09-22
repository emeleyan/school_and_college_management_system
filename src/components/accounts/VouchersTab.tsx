import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountHead, BankAccountItem, FinancialVoucher, VoucherType, FinancialPaymentMethod } from '../../types';
import { numberToBengaliWords, numberToEnglishWords } from './sampleAccountsData';
import {
  Plus,
  Search,
  Filter,
  Printer,
  Trash2,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';

interface VouchersTabProps {
  vouchers: FinancialVoucher[];
  accountHeads: AccountHead[];
  bankAccounts: BankAccountItem[];
  onSaveVoucher: (voucher: FinancialVoucher) => Promise<void>;
  onDeleteVoucher: (id: string) => Promise<void>;
  onPrintVoucher: (voucher: FinancialVoucher) => void;
  newVoucherModalType: 'debit' | 'credit' | 'contra' | null;
  setNewVoucherModalType: (type: 'debit' | 'credit' | 'contra' | null) => void;
}

export const VouchersTab: React.FC<VouchersTabProps> = ({
  vouchers,
  accountHeads,
  bankAccounts,
  onSaveVoucher,
  onDeleteVoucher,
  onPrintVoucher,
  newVoucherModalType,
  setNewVoucherModalType,
}) => {
  const { activeInstitute, activeAcademicYear, language, currentUser } = useApp();

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterHead, setFilterHead] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Voucher Form state
  const [formType, setFormType] = useState<VoucherType>(newVoucherModalType || 'debit');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formHeadId, setFormHeadId] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<FinancialPaymentMethod>('cash');
  const [formBankAccountId, setFormBankAccountId] = useState<string>('');
  const [formChequeNumber, setFormChequeNumber] = useState<string>('');
  const [formChequeDate, setFormChequeDate] = useState<string>('');
  const [formPayee, setFormPayee] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync modal open request from overview
  React.useEffect(() => {
    if (newVoucherModalType) {
      setFormType(newVoucherModalType);
      // Auto pick default head
      if (newVoucherModalType === 'debit') {
        const defaultExp = accountHeads.find((h) => h.type === 'expense');
        if (defaultExp) setFormHeadId(defaultExp.id);
      } else if (newVoucherModalType === 'credit') {
        const defaultInc = accountHeads.find((h) => h.type === 'income');
        if (defaultInc) setFormHeadId(defaultInc.id);
      } else if (newVoucherModalType === 'contra') {
        const defaultAsset = accountHeads.find((h) => h.type === 'asset');
        if (defaultAsset) setFormHeadId(defaultAsset.id);
      }
    }
  }, [newVoucherModalType, accountHeads]);

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    if (filterType !== 'all' && v.voucherType !== filterType) return false;
    if (filterHead !== 'all' && v.accountHeadId !== filterHead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesNum = v.voucherNumber.toLowerCase().includes(q);
      const matchesPayee = v.payeeRecipient.toLowerCase().includes(q);
      const matchesDesc = v.description.toLowerCase().includes(q);
      const matchesHead = v.accountHeadName.toLowerCase().includes(q);
      if (!matchesNum && !matchesPayee && !matchesDesc && !matchesHead) return false;
    }
    return true;
  });

  // Calculate next voucher number
  const getNextVoucherNumber = (type: VoucherType) => {
    const prefix = type === 'debit' ? 'DV' : type === 'credit' ? 'CV' : type === 'contra' ? 'CT' : 'JV';
    const year = new Date().getFullYear();
    const count = vouchers.filter((v) => v.voucherType === type).length + 1;
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  };

  const handleOpenModal = (type: VoucherType) => {
    setFormType(type);
    setNewVoucherModalType(type === 'journal' ? 'debit' : type);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAmount('');
    setFormChequeNumber('');
    setFormChequeDate('');
    setFormDescription('');
    setFormPaymentMethod('cash');
    setFormBankAccountId('');

    // Pre-populate sensible head
    if (type === 'debit') {
      const h = accountHeads.find((x) => x.type === 'expense');
      if (h) setFormHeadId(h.id);
      setFormPayee('');
    } else if (type === 'credit') {
      const h = accountHeads.find((x) => x.type === 'income');
      if (h) setFormHeadId(h.id);
      setFormPayee('Counter Collection');
    } else {
      const h = accountHeads.find((x) => x.type === 'asset');
      if (h) setFormHeadId(h.id);
      setFormPayee('Institutional Bank Deposit');
    }
  };

  const handleSubmitNewVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) return;
    if (!formHeadId) return;

    setIsSubmitting(true);
    try {
      const selectedHead = accountHeads.find((h) => h.id === formHeadId);
      const selectedBank = bankAccounts.find((b) => b.id === formBankAccountId);

      const voucherNo = getNextVoucherNumber(formType);
      const newVoucher: FinancialVoucher = {
        id: `vouch-${Date.now()}`,
        instituteId: activeInstitute?.id || 'inst-01',
        academicYearId: activeAcademicYear?.id || 'ay-2026',
        voucherNumber: voucherNo,
        voucherType: formType,
        date: formDate,
        accountHeadId: formHeadId,
        accountHeadName: selectedHead?.name || 'General Head',
        accountHeadCode: selectedHead?.code,
        amount: Number(formAmount),
        paymentMethod: formPaymentMethod,
        bankAccountId: selectedBank?.id,
        bankAccountName: selectedBank ? `${selectedBank.bankName} (${selectedBank.accountNumber})` : undefined,
        chequeNumber: formChequeNumber || undefined,
        chequeDate: formChequeDate || undefined,
        payeeRecipient: formPayee || (formType === 'credit' ? 'Accounts Counter' : 'Payee'),
        description: formDescription || `${formType.toUpperCase()} voucher entry`,
        approvedBy: 'Principal / Headmaster',
        preparedBy: currentUser?.username || 'Accountant',
        status: 'posted',
        createdAt: new Date().toISOString(),
      };

      await onSaveVoucher(newVoucher);
      setNewVoucherModalType(null);
    } catch (err) {
      console.error('Failed to create voucher:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Heads available for selected type in form
  const availableHeads = accountHeads.filter((h) => {
    if (formType === 'debit') return h.type === 'expense' || h.type === 'asset';
    if (formType === 'credit') return h.type === 'income' || h.type === 'liability';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ACTION BAR & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
        {/* Left: Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'ভাউচার নং / প্রাপক খুঁজুন...' : 'Search voucher / payee...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">{language === 'bn' ? 'সকল ভাউচার' : 'All Types'}</option>
            <option value="debit">{language === 'bn' ? 'ডেবিট (খরচ)' : 'Debit (Expense)'}</option>
            <option value="credit">{language === 'bn' ? 'ক্রেডিট (জমা)' : 'Credit (Income)'}</option>
            <option value="contra">{language === 'bn' ? 'কন্ট্রা (স্থানান্তর)' : 'Contra (Transfer)'}</option>
          </select>

          {/* Account Head Filter */}
          <select
            value={filterHead}
            onChange={(e) => setFilterHead(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[180px] truncate"
          >
            <option value="all">{language === 'bn' ? 'সকল হিসাব খাত' : 'All Account Heads'}</option>
            {accountHeads.map((h) => (
              <option key={h.id} value={h.id}>
                {h.code} - {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Add Voucher Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleOpenModal('debit')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ডেবিট ভাউচার' : 'Debit Voucher'}</span>
          </button>

          <button
            onClick={() => handleOpenModal('credit')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'ক্রেডিট ভাউচার' : 'Credit Voucher'}</span>
          </button>

          <button
            onClick={() => handleOpenModal('contra')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'কন্ট্রা ভাউচার' : 'Contra'}</span>
          </button>
        </div>
      </div>

      {/* VOUCHERS TABLE */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
              <tr>
                <th className="py-3 px-4 font-semibold">Voucher No</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Account Head</th>
                <th className="py-3 px-4 font-semibold">Payee / Recipient</th>
                <th className="py-3 px-4 font-semibold">Payment Mode</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (৳)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <div>No vouchers found matching criteria</div>
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => {
                  const isDebit = v.voucherType === 'debit';
                  const isCredit = v.voucherType === 'credit';
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {v.voucherNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{v.date}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isDebit
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : isCredit
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {isDebit && <ArrowDownLeft className="w-3 h-3" />}
                          {isCredit && <ArrowUpRight className="w-3 h-3" />}
                          {!isDebit && !isCredit && <ArrowLeftRight className="w-3 h-3" />}
                          <span>{v.voucherType}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {v.accountHeadName}
                        </div>
                        {v.accountHeadCode && (
                          <div className="text-[10px] text-slate-400 font-mono">Code: {v.accountHeadCode}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {v.payeeRecipient}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{v.description}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 uppercase text-[11px]">
                        {v.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span
                          className={
                            isDebit
                              ? 'text-rose-600 dark:text-rose-400'
                              : isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          ৳{v.amount.toLocaleString()}.00
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onPrintVoucher(v)}
                            title="Print official voucher"
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteVoucher(v.id)}
                            title="Delete voucher"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW VOUCHER MODAL */}
      {newVoucherModalType !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                    formType === 'debit'
                      ? 'bg-rose-600'
                      : formType === 'credit'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {formType === 'debit' ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : formType === 'credit' ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowLeftRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {formType} Voucher Entry
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Auto-generated: {getNextVoucherNumber(formType)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNewVoucherModalType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewVoucher} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('debit');
                    const h = accountHeads.find((x) => x.type === 'expense');
                    if (h) setFormHeadId(h.id);
                  }}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    formType === 'debit'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  Debit (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('credit');
                    const h = accountHeads.find((x) => x.type === 'income');
                    if (h) setFormHeadId(h.id);
                  }}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    formType === 'credit'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  Credit (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('contra');
                    const h = accountHeads.find((x) => x.type === 'asset');
                    if (h) setFormHeadId(h.id);
                  }}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    formType === 'contra'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  Contra (Bank/Cash)
                </button>
              </div>

              {/* Date & Account Head */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Voucher Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Account Head (হিসাব খাত) *
                  </label>
                  <select
                    required
                    value={formHeadId}
                    onChange={(e) => setFormHeadId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Account Head</option>
                    {availableHeads.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.code} - {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount with Words Preview */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Amount in BDT (৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                {formAmount && Number(formAmount) > 0 && (
                  <div className="mt-1 p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] space-y-0.5">
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Words:</span> {numberToEnglishWords(Number(formAmount))}
                    </div>
                    <div className="font-serif text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">কথায়:</span> {numberToBengaliWords(Number(formAmount))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payee / Paid to */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {formType === 'credit' ? 'Received From (গ্রহীতা)' : 'Paid To / Payee (প্রাপক) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={formType === 'credit' ? 'Student counter / Ministry grant' : 'Vendor / Person / Organization name'}
                  value={formPayee}
                  onChange={(e) => setFormPayee(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Mode & Bank Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as FinancialPaymentMethod)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="cash">Cash (নগদ)</option>
                    <option value="bank_transfer">Bank Transfer (ব্যাংক ট্রান্সফার)</option>
                    <option value="cheque">Cheque (চেক)</option>
                    <option value="bkash">bKash (বিকাশ)</option>
                    <option value="nagad">Nagad (নগদ এমএফএস)</option>
                  </select>
                </div>

                {formPaymentMethod !== 'cash' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Institutional Bank A/C
                    </label>
                    <select
                      value={formBankAccountId}
                      onChange={(e) => setFormBankAccountId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white truncate"
                    >
                      <option value="">Select Bank Account</option>
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description / Particulars (খরচের বিবরণ)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed purpose of transaction..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewVoucherModalType(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Post Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
