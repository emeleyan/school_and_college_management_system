import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BankAccountItem, BankAccountType, FinancialVoucher } from '../../types';
import {
  Building,
  Plus,
  ArrowLeftRight,
  Wallet,
  Landmark,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';

interface BankAccountsTabProps {
  bankAccounts: BankAccountItem[];
  onSaveBankAccount: (account: BankAccountItem) => Promise<void>;
  onTransferFunds: (
    fromId: string,
    toId: string,
    amount: number,
    description: string
  ) => Promise<void>;
}

export const BankAccountsTab: React.FC<BankAccountsTabProps> = ({
  bankAccounts,
  onSaveBankAccount,
  onTransferFunds,
}) => {
  const { activeInstitute, language } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Add form states
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('current');
  const [openingBalance, setOpeningBalance] = useState('');
  const [note, setNote] = useState('');

  // Transfer form states
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const totalBankLiquidity = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;

    const newAcc: BankAccountItem = {
      id: `bank-${Date.now()}`,
      instituteId: activeInstitute?.id || 'inst-01',
      bankName: bankName.trim(),
      bankNameBn: bankName.trim(),
      branchName: branchName.trim() || 'Principal Branch',
      accountName: accountName.trim() || `${activeInstitute?.name || 'School'} Account`,
      accountNumber: accountNumber.trim(),
      accountType,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      status: 'active',
      note: note.trim(),
    };

    await onSaveBankAccount(newAcc);
    setIsAddModalOpen(false);
    // reset
    setBankName('');
    setBranchName('');
    setAccountNumber('');
    setOpeningBalance('');
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId || transferFromId === transferToId) return;
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) return;

    const source = bankAccounts.find((b) => b.id === transferFromId);
    if (source && source.currentBalance < amt) {
      alert('Insufficient funds in the source account.');
      return;
    }

    setIsTransferring(true);
    try {
      await onTransferFunds(
        transferFromId,
        transferToId,
        amt,
        transferDesc || 'Inter-account fund transfer'
      );
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferDesc('');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH LIQUIDITY & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'মোট প্রাতিষ্ঠানিক তরল তহবিল' : 'Total Institutional Liquid Funds'}
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
            ৳{totalBankLiquidity.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {bankAccounts.length} institutional accounts &amp; cash points
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (bankAccounts.length >= 2) {
                setTransferFromId(bankAccounts[0].id);
                setTransferToId(bankAccounts[1].id);
              }
              setIsTransferModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'bn' ? 'তহবিল স্থানান্তর (কন্ট্রা)' : 'Fund Transfer (Contra)'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'নতুন ব্যাংক হিসাব' : 'Add Bank Account'}</span>
          </button>
        </div>
      </div>

      {/* BANK CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map((b) => {
          const isCash = b.accountType === 'cash';
          return (
            <div
              key={b.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isCash
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                      }`}
                    >
                      {isCash ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {b.bankName}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-mono">
                        {b.accountType} A/C
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="text-slate-500">Account Name:</div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {b.accountName}
                  </div>
                  <div className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    No: {b.accountNumber}
                  </div>
                  <div className="text-slate-400 text-[10px]">{b.branchName}</div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Available Balance:</span>
                <span className="text-lg font-bold font-mono text-slate-950 dark:text-white">
                  ৳{b.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD BANK ACCOUNT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Institutional Bank Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sonali Bank PLC / Dutch-Bangla Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sadar Branch"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="current">Current A/C</option>
                    <option value="savings">Savings A/C</option>
                    <option value="sndt">SNDT A/C</option>
                    <option value="fdr">FDR A/C</option>
                    <option value="cash">Cash in Hand Safe</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Account Name (Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Model School & College General Fund"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4401202..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Opening Balance (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUND TRANSFER (CONTRA) MODAL */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Transfer Funds (Contra Voucher)
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Inter-account balance transfer
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  From Account (Source) *
                </label>
                <select
                  required
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber}) - Bal: ৳{b.currentBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  To Account (Destination) *
                </label>
                <select
                  required
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber}) - Bal: ৳{b.currentBalance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Transfer Amount in BDT (৳) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1.5 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Transfer Particulars / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deposit of counter cash collection into Sonali Bank"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isTransferring ? 'Processing...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
