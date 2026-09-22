import React, { useState, useEffect } from 'react';
import {
  InventoryItem,
  InventoryTransaction,
  InventoryCategory,
  ItemCondition,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { SAMPLE_INVENTORY_ITEMS, SAMPLE_INVENTORY_TRANSACTIONS } from '../operations/sampleOperationsData';
import {
  Package,
  Layers,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  Wrench,
  DollarSign,
  MapPin,
  Calendar,
  Filter,
  Trash2,
  Edit,
  X,
  TrendingUp,
  Boxes,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();

  // Active Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'assets' | 'transactions'>('assets');

  // Database State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [selectedItemForTx, setSelectedItemForTx] = useState<InventoryItem | null>(null);

  // New Asset Form State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    bengaliName: '',
    category: 'furniture',
    roomOrLocation: 'Classroom 10-A',
    quantity: 10,
    unit: 'Pcs',
    unitCost: 1500,
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierOrVendor: '',
    condition: 'good',
    notes: '',
  });

  // Transaction Form State
  const [txForm, setTxForm] = useState({
    transactionType: 'issue' as 'issue' | 'repair' | 'return' | 'write_off',
    quantity: 1,
    fromLocation: 'Central Store Room',
    toLocation: '',
    handledBy: 'Caregiver / Store Keeper',
    remarks: '',
    cost: 0,
  });

  // Load from IndexedDB with fallback seeding
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [itemList, txList] = await Promise.all([
        getAll<InventoryItem>('inventoryItems'),
        getAll<InventoryTransaction>('inventoryTransactions'),
      ]);

      if (!itemList || itemList.length === 0) {
        for (const it of SAMPLE_INVENTORY_ITEMS) {
          await add('inventoryItems', it);
        }
        setItems(SAMPLE_INVENTORY_ITEMS);
      } else {
        setItems(itemList);
      }

      if (!txList || txList.length === 0) {
        for (const t of SAMPLE_INVENTORY_TRANSACTIONS) {
          await add('inventoryTransactions', t);
        }
        setTransactions(SAMPLE_INVENTORY_TRANSACTIONS);
      } else {
        setTransactions(txList);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  // Handle Save / Add Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    try {
      const qty = Number(newItem.quantity) || 1;
      const cost = Number(newItem.unitCost) || 0;
      const totalValuation = qty * cost;

      if (editingItem) {
        const updated: InventoryItem = {
          ...editingItem,
          ...(newItem as InventoryItem),
          quantity: qty,
          unitCost: cost,
          totalValuation: totalValuation,
          updatedAt: new Date().toISOString(),
        };
        await update('inventoryItems', updated);
        logAudit('Update Asset', 'operations' as any, `Updated asset item ${updated.name}`, updated.id);
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        const catPrefix = newItem.category?.substring(0, 4).toUpperCase() || 'GEN';
        const code = `INV-${catPrefix}-${String(items.length + 1).padStart(3, '0')}`;

        const item: InventoryItem = {
          id: `inv-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          itemCode: code,
          name: newItem.name || '',
          bengaliName: newItem.bengaliName,
          category: (newItem.category as InventoryCategory) || 'furniture',
          roomOrLocation: newItem.roomOrLocation || 'Classroom 10-A',
          quantity: qty,
          unit: newItem.unit || 'Pcs',
          unitCost: cost,
          totalValuation: totalValuation,
          purchaseDate: newItem.purchaseDate || new Date().toISOString().split('T')[0],
          supplierOrVendor: newItem.supplierOrVendor,
          condition: (newItem.condition as ItemCondition) || 'good',
          warrantyExpiry: newItem.warrantyExpiry,
          notes: newItem.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await add('inventoryItems', item);
        logAudit('Add Asset', 'operations' as any, `Added new asset ${item.name} (${item.itemCode})`, item.id);
        setItems((prev) => [item, ...prev]);
      }

      setIsAddModalOpen(false);
      setEditingItem(null);
      setNewItem({
        name: '',
        bengaliName: '',
        category: 'furniture',
        roomOrLocation: 'Classroom 10-A',
        quantity: 10,
        unit: 'Pcs',
        unitCost: 1500,
        purchaseDate: new Date().toISOString().split('T')[0],
        supplierOrVendor: '',
        condition: 'good',
        notes: '',
      });
    } catch (err) {
      console.error('Error saving asset item:', err);
    }
  };

  // Quick Change Condition
  const handleUpdateCondition = async (item: InventoryItem, newCondition: ItemCondition) => {
    try {
      const updated: InventoryItem = {
        ...item,
        condition: newCondition,
        updatedAt: new Date().toISOString(),
      };
      await update('inventoryItems', updated);
      logAudit('Update Asset Condition', 'operations' as any, `Changed condition of ${item.name} to ${newCondition}`, item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to update condition:', err);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete asset "${name}" from inventory?`)) return;
    try {
      await remove('inventoryItems', itemId);
      logAudit('Delete Asset', 'operations' as any, `Deleted asset item ${name}`, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete asset:', err);
    }
  };

  // Record Movement / Repair Transaction
  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTx) return;

    try {
      const tx: InventoryTransaction = {
        id: `tx-${Date.now()}`,
        instituteId: activeInstitute?.id || 'inst-01',
        itemId: selectedItemForTx.id,
        itemName: selectedItemForTx.name,
        transactionType: txForm.transactionType,
        quantity: Number(txForm.quantity) || 1,
        fromLocation: txForm.fromLocation,
        toLocation: txForm.toLocation,
        handledBy: txForm.handledBy,
        date: new Date().toISOString().split('T')[0],
        remarks: txForm.remarks,
        cost: Number(txForm.cost) || 0,
        createdAt: new Date().toISOString(),
      };

      await add('inventoryTransactions', tx);

      // If issue to room, update item's location if requested
      if (txForm.transactionType === 'issue' && txForm.toLocation) {
        const updatedItem: InventoryItem = {
          ...selectedItemForTx,
          roomOrLocation: txForm.toLocation,
          updatedAt: new Date().toISOString(),
        };
        await update('inventoryItems', updatedItem);
        setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      }

      logAudit('Inventory Transaction', 'operations' as any, `${tx.transactionType.toUpperCase()} of ${tx.quantity} ${selectedItemForTx.name}`, tx.id);
      setTransactions((prev) => [tx, ...prev]);
      setIsTransactionModalOpen(false);
      setSelectedItemForTx(null);
    } catch (err) {
      console.error('Failed to record transaction:', err);
    }
  };

  // Category labels helper
  const getCategoryLabel = (cat: InventoryCategory) => {
    const map: Record<InventoryCategory, { en: string; bn: string; color: string }> = {
      furniture: { en: 'Furniture & Desks', bn: 'আসবাবপত্র ও বেঞ্চ', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
      computer_it: { en: 'IT & Digital Lab', bn: 'কম্পিউটার ও প্রযুক্তি', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
      science_lab: { en: 'Science Lab Equipment', bn: 'বিজ্ঞানাগার সরঞ্জাম', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
      electrical_electronics: { en: 'Electrical & AV', bn: 'বৈদ্যুতিক ও অডিও-ভিজ্যুয়াল', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
      sports_equipment: { en: 'Sports & Games', bn: 'ক্রীড়া সামগ্রী', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' },
      stationery: { en: 'Office Stationery', bn: 'দাপ্তরিক স্টেশনারি', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
      musical_cultural: { en: 'Cultural & Musical', bn: 'সাংস্কৃতিক ও বাদ্যযন্ত্র', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
      general: { en: 'General Campus Property', bn: 'সাধারণ সম্পদ', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    };
    return map[cat] || { en: cat, bn: cat, color: 'bg-slate-100 text-slate-700' };
  };

  // Filtered Assets
  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.bengaliName && item.bengaliName.includes(q)) ||
      item.itemCode.toLowerCase().includes(q) ||
      item.roomOrLocation.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesCondition = selectedCondition === 'all' || item.condition === selectedCondition;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  // KPI Calculations
  const totalValuation = items.reduce((acc, it) => acc + (it.totalValuation || 0), 0);
  const totalUnits = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
  const needsRepairCount = items.filter((it) => it.condition === 'needs_repair' || it.condition === 'damaged').length;
  const goodConditionCount = items.filter((it) => it.condition === 'good').length;

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-600" />
              <span>
                {language === 'bn' ? 'সম্পদ ও ইনভেন্টরি ব্যবস্থাপনা' : 'Inventory & Asset Management'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              Phase 12 • Campus Asset Register
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'বিজ্ঞানাগার, কম্পিউটার ল্যাব, শ্রেণিকক্ষের আসবাবপত্র, ক্রীড়া সামগ্রী ও বৈদ্যুতিক সরঞ্জামের স্টক ও মেরামত রেজিস্টার'
              : 'Classroom furniture, IT lab hardware, science apparatus, sports gear, store room tracking, and maintenance logs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন সম্পদ অন্তর্ভুক্তি' : 'Add New Asset'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Boxes className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মোট নিবন্ধিত সম্পদ' : 'Total Asset SKUs'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">{items.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{totalUnits} physical units registered</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মোট আর্থিক মূল্যায়ন' : 'Total Asset Valuation'}
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            ৳ {totalValuation.toLocaleString('en-BD')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Campus physical valuation</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'উত্তম কার্যক্ষম' : 'Good Condition'}
            </span>
          </div>
          <div className="text-xl font-bold text-teal-600">{goodConditionCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready & deployed</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Wrench className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {language === 'bn' ? 'মেরামত প্রয়োজন' : 'Needs Repair'}
            </span>
          </div>
          <div className="text-xl font-bold text-amber-600">{needsRepairCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pending maintenance</div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('assets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'assets'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Asset Inventory Register ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'transactions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Stock Movement & Maintenance Logs ({transactions.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. ASSET INVENTORY REGISTER */}
      {/* ======================================================== */}
      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search assets by name, code, room, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="furniture">Furniture</option>
                <option value="computer_it">IT & Computers</option>
                <option value="science_lab">Science Lab</option>
                <option value="electrical_electronics">Electrical & AV</option>
                <option value="sports_equipment">Sports Gear</option>
                <option value="stationery">Stationery</option>
              </select>

              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="all">All Conditions</option>
                <option value="good">Good Condition</option>
                <option value="fair">Fair / Used</option>
                <option value="needs_repair">Needs Repair</option>
                <option value="damaged">Damaged / Scrap</option>
              </select>
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Asset Code</th>
                    <th className="px-4 py-3">Item Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Current Location</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                    <th className="px-4 py-3">Total Value</th>
                    <th className="px-4 py-3">Condition</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredItems.map((item) => {
                    const catMeta = getCategoryLabel(item.category);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {item.itemCode}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          {item.bengaliName && (
                            <div className="text-[11px] text-slate-500 font-serif">
                              {item.bengaliName}
                            </div>
                          )}
                          {item.supplierOrVendor && (
                            <div className="text-[10px] text-slate-400">
                              Vendor: {item.supplierOrVendor}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${catMeta.color}`}>
                            {catMeta.en}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.roomOrLocation}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white">
                          {item.quantity} {item.unit}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div>৳ {item.totalValuation?.toLocaleString('en-BD')}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            @ ৳ {item.unitCost} / {item.unit}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.condition === 'good'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : item.condition === 'needs_repair'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : item.condition === 'damaged'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {item.condition === 'good' && <CheckCircle className="w-3 h-3" />}
                            {item.condition === 'needs_repair' && <Wrench className="w-3 h-3" />}
                            {item.condition === 'damaged' && <AlertTriangle className="w-3 h-3" />}
                            <span className="capitalize">{item.condition.replace('_', ' ')}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedItemForTx(item);
                                setTxForm({
                                  transactionType: 'issue',
                                  quantity: 1,
                                  fromLocation: item.roomOrLocation,
                                  toLocation: 'Classroom 9-B',
                                  handledBy: 'Store Keeper',
                                  remarks: '',
                                  cost: 0,
                                });
                                setIsTransactionModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-md cursor-pointer transition-colors"
                              title="Move / Repair Requisition"
                            >
                              Move/Log
                            </button>

                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setNewItem(item);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TRANSACTION & REPAIR LOGS */}
      {/* ======================================================== */}
      {activeSubTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Asset Requisition, Room Movements & Repair Log
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Asset Item</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3">From Location</th>
                  <th className="px-4 py-3">To Location</th>
                  <th className="px-4 py-3">Handled By</th>
                  <th className="px-4 py-3">Repair Cost</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {tx.itemName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {tx.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {tx.fromLocation || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                      {tx.toLocation || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {tx.handledBy}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {tx.cost ? `৳ ${tx.cost}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {tx.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT ASSET */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{editingItem ? 'Edit Asset Record' : 'Register New Campus Asset'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Asset Item Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. Biological Microscope"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    সম্পদের নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={newItem.bengaliName}
                    onChange={(e) => setNewItem({ ...newItem, bengaliName: e.target.value })}
                    placeholder="জীববিজ্ঞান অণুবীক্ষণ যন্ত্র"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-serif"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="furniture">Furniture & Desks</option>
                    <option value="computer_it">Computer & IT Hardware</option>
                    <option value="science_lab">Science Lab Equipment</option>
                    <option value="electrical_electronics">Electrical & AV Devices</option>
                    <option value="sports_equipment">Sports & Games</option>
                    <option value="stationery">Stationery</option>
                    <option value="musical_cultural">Musical / Cultural</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Room / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.roomOrLocation}
                    onChange={(e) => setNewItem({ ...newItem, roomOrLocation: e.target.value })}
                    placeholder="e.g. Physics Lab / Room 204"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Type
                  </label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="Pcs / Sets / Boxes"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit Cost (BDT ৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.unitCost}
                    onChange={(e) => setNewItem({ ...newItem, unitCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={newItem.condition}
                    onChange={(e) => setNewItem({ ...newItem, condition: e.target.value as ItemCondition })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair / Used</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="damaged">Damaged / Scrap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    value={newItem.supplierOrVendor}
                    onChange={(e) => setNewItem({ ...newItem, supplierOrVendor: e.target.value })}
                    placeholder="Vendor / Company name"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Update Asset' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MOVEMENT / REQUISITION TRANSACTION */}
      {/* ======================================================== */}
      {isTransactionModalOpen && selectedItemForTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record Stock Movement or Repair
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold truncate max-w-xs">
                  {selectedItemForTx.name} ({selectedItemForTx.itemCode})
                </p>
              </div>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Type
                </label>
                <select
                  value={txForm.transactionType}
                  onChange={(e) => setTxForm({ ...txForm, transactionType: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="issue">Issue to Room / Classroom</option>
                  <option value="repair">Send for Repair / Maintenance</option>
                  <option value="return">Return to Store Room</option>
                  <option value="write_off">Write-off / Disposed Scrap</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItemForTx.quantity}
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Servicing Cost (if repair)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={txForm.cost}
                    onChange={(e) => setTxForm({ ...txForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    From Location
                  </label>
                  <input
                    type="text"
                    value={txForm.fromLocation}
                    onChange={(e) => setTxForm({ ...txForm, fromLocation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    To Location / Room
                  </label>
                  <input
                    type="text"
                    value={txForm.toLocation}
                    onChange={(e) => setTxForm({ ...txForm, toLocation: e.target.value })}
                    placeholder="e.g. Science Lab 2"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Handled By / Staff Name
                </label>
                <input
                  type="text"
                  value={txForm.handledBy}
                  onChange={(e) => setTxForm({ ...txForm, handledBy: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={txForm.remarks}
                  onChange={(e) => setTxForm({ ...txForm, remarks: e.target.value })}
                  placeholder="Reason for movement or repair details"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Record Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
