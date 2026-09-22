import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AccountHead, AccountType } from '../../types';
import { Plus, Search, Filter, Trash2, Edit2, ShieldAlert, FolderTree, X, Check } from 'lucide-react';

interface ChartOfAccountsTabProps {
  accountHeads: AccountHead[];
  onSaveHead: (head: AccountHead) => Promise<void>;
  onDeleteHead: (id: string) => Promise<void>;
}

export const ChartOfAccountsTab: React.FC<ChartOfAccountsTabProps> = ({
  accountHeads,
  onSaveHead,
  onDeleteHead,
}) => {
  const { activeInstitute, language } = useApp();

  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHead, setEditingHead] = useState<AccountHead | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formType, setFormType] = useState<AccountType>('expense');
  const [formCategory, setFormCategory] = useState('Operating Expense');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');

  const filteredHeads = accountHeads.filter((h) => {
    if (activeType !== 'all' && h.type !== activeType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = h.code.toLowerCase().includes(q);
      const matchName = h.name.toLowerCase().includes(q);
      const matchBn = h.nameBn.toLowerCase().includes(q);
      const matchCat = h.category.toLowerCase().includes(q);
      if (!matchCode && !matchName && !matchBn && !matchCat) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingHead(null);
    // suggest code
    const highestCode = Math.max(...accountHeads.map((h) => Number(h.code) || 0), 410);
    setFormCode(String(highestCode + 1));
    setFormName('');
    setFormNameBn('');
    setFormType('expense');
    setFormCategory('General Operations');
    setFormOpeningBalance('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: AccountHead) => {
    setEditingHead(h);
    setFormCode(h.code);
    setFormName(h.name);
    setFormNameBn(h.nameBn);
    setFormType(h.type);
    setFormCategory(h.category);
    setFormOpeningBalance(String(h.openingBalance || 0));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) return;

    const headToSave: AccountHead = {
      id: editingHead ? editingHead.id : `head-${Date.now()}`,
      instituteId: activeInstitute?.id || 'inst-01',
      code: formCode.trim(),
      name: formName.trim(),
      nameBn: formNameBn.trim() || formName.trim(),
      type: formType,
      category: formCategory.trim() || 'General',
      openingBalance: Number(formOpeningBalance) || 0,
      currentBalance: editingHead ? editingHead.currentBalance : Number(formOpeningBalance) || 0,
      isSystem: editingHead?.isSystem || false,
      status: 'active',
    };

    await onSaveHead(headToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'হিসাব খাত খুঁজুন...' : 'Search account head or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'income', 'expense', 'asset', 'liability'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  activeType === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer self-end sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'নতুন হিসাব খাত' : 'Add Account Head'}</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-750">
              <tr>
                <th className="py-3 px-4 font-semibold">Code</th>
                <th className="py-3 px-4 font-semibold">Account Head Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Balance (৳)</th>
                <th className="py-3 px-4 font-semibold text-center">Nature</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHeads.map((h) => {
                const isInc = h.type === 'income';
                const isExp = h.type === 'expense';
                return (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {h.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                      <div className="text-[11px] font-serif text-slate-500">{h.nameBn}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isInc
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isExp
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {h.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{h.category}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ৳{h.currentBalance.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          h.isSystem
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        }`}
                      >
                        {h.isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(h)}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!h.isSystem && (
                          <button
                            onClick={() => onDeleteHead(h.id)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingHead ? 'Edit Account Head' : 'Add New Account Head'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Account Type *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as AccountType)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="expense">Expense (ব্যয়)</option>
                    <option value="income">Income (আয়)</option>
                    <option value="asset">Asset (সম্পদ)</option>
                    <option value="liability">Liability (দায়)</option>
                    <option value="equity">Equity / Fund (তহবিল)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Head Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Lab Maintenance"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Head Name (বাংলায়)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কম্পিউটার ল্যাব রক্ষণাবেক্ষণ"
                  value={formNameBn}
                  onChange={(e) => setFormNameBn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-serif"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Category Group
                </label>
                <input
                  type="text"
                  placeholder="e.g., Academic Operations / Utilities"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                >
                  Save Head
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
