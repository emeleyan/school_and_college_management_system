import React, { useState, useEffect } from 'react';
import {
  SchoolNotice,
  NoticeCategory,
  NoticePriority,
  NoticeAudience,
  InstituteHeadRole,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { SAMPLE_NOTICES } from '../operations/sampleOperationsData';
import { PRESET_DIGITAL_SIGNATURES, fileToBase64 } from '../../utils/imageUtils';
import {
  Bell,
  Pin,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Eye,
  Printer,
  X,
  Trash2,
  Edit,
  Filter,
  Download,
  Share2,
  Bookmark,
  Building,
  FileSignature,
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Upload,
  Sliders,
  RotateCcw,
} from 'lucide-react';

export const NoticeManagement: React.FC = () => {
  const { activeInstitute, language, logAudit } = useApp();

  // Database State
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [signatureFilter, setSignatureFilter] = useState<string>('all'); // 'all' | 'digital' | 'manual'

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<SchoolNotice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<SchoolNotice | null>(null);
  const noticeSignInputRef = React.useRef<HTMLInputElement>(null);
  const noticeTemplateInputRef = React.useRef<HTMLInputElement>(null);

  // Notice Letterhead Custom Design State
  const [showNoticeDesigner, setShowNoticeDesigner] = useState<boolean>(false);
  const [noticeCustomTemplateBg, setNoticeCustomTemplateBg] = useState<string>(() => {
    return localStorage.getItem('notice_custom_template_bg') || '';
  });
  const [noticeShowHeader, setNoticeShowHeader] = useState<boolean>(() => {
    const val = localStorage.getItem('notice_show_header');
    return val === null ? true : val === 'true';
  });
  const [noticeShowLogo, setNoticeShowLogo] = useState<boolean>(() => {
    const val = localStorage.getItem('notice_show_logo');
    return val === null ? true : val === 'true';
  });
  const [noticeShowWatermark, setNoticeShowWatermark] = useState<boolean>(() => {
    const val = localStorage.getItem('notice_show_watermark');
    return val === null ? true : val === 'true';
  });
  const [noticeShowSignature, setNoticeShowSignature] = useState<boolean>(() => {
    const val = localStorage.getItem('notice_show_signature');
    return val === null ? true : val === 'true';
  });

  const handleNoticeTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 1200, 1600);
      setNoticeCustomTemplateBg(base64);
      localStorage.setItem('notice_custom_template_bg', base64);
    } catch (err: any) {
      console.error('Failed to process notice template:', err);
    }
  };

  const handleNoticeSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 480, 160);
      setNoticeForm((prev) => ({ ...prev, digitalSignatureUrl: base64 }));
    } catch (err: any) {
      console.error('Failed to process custom signature:', err);
    }
  };

  // Compute default signer info based on active institute's configured head
  const defaultHeadRole: InstituteHeadRole =
    activeInstitute?.headRole ||
    (activeInstitute?.type === 'college' ? 'principal' : 'headmaster');

  const getDefaultSignerTitle = (role: InstituteHeadRole) => {
    switch (role) {
      case 'acting_principal':
        return { en: 'Acting Principal', bn: 'ভারপ্রাপ্ত অধ্যক্ষ' };
      case 'vice_principal':
        return { en: 'Vice-Principal', bn: 'উপাধ্যক্ষ' };
      case 'acting_headmaster':
        return { en: 'Acting Headmaster', bn: 'ভারপ্রাপ্ত প্রধান শিক্ষক' };
      case 'assistant_headmaster':
        return { en: 'Assistant Headmaster', bn: 'সহকারী প্রধান শিক্ষক' };
      case 'headmaster':
        return { en: 'Headmaster', bn: 'প্রধান শিক্ষক' };
      case 'principal':
      default:
        return { en: 'Principal', bn: 'অধ্যক্ষ' };
    }
  };

  const defaultSignerName =
    defaultHeadRole === 'acting_principal'
      ? activeInstitute?.actingPrincipalName || activeInstitute?.principalName || 'Prof. Dr. Rahman'
      : defaultHeadRole === 'vice_principal'
      ? activeInstitute?.vicePrincipalName || 'Vice-Principal'
      : activeInstitute?.principalName || 'Prof. Dr. Rahman';

  // Form State
  const [noticeForm, setNoticeForm] = useState<Partial<SchoolNotice>>({
    noticeNumber: '',
    title: '',
    bengaliTitle: '',
    category: 'academic',
    audience: 'all',
    content: '',
    contentBengali: '',
    priority: 'normal',
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    isPinned: false,
    signedBy: defaultSignerName,
    signerDesignation: `${getDefaultSignerTitle(defaultHeadRole).en} (${getDefaultSignerTitle(defaultHeadRole).bn})`,
    includeDigitalSignature: true, // Default optional toggle
    signatoryRole: defaultHeadRole,
    digitalSignatureUrl: activeInstitute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.principal,
    status: 'published',
  });

  // Load from IndexedDB with fallback seeding
  const loadData = async () => {
    setIsLoading(true);
    try {
      const noticeList = await getAll<SchoolNotice>('notices');
      if (!noticeList || noticeList.length === 0) {
        for (const n of SAMPLE_NOTICES) {
          await add('notices', n);
        }
        setNotices(SAMPLE_NOTICES);
      } else {
        setNotices(noticeList);
      }
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id]);

  // Open Add Modal with fresh defaults
  const handleOpenAddModal = () => {
    setEditingNotice(null);
    const refNo = `SCH/NOT/${new Date().getFullYear()}/${String(notices.length + 1).padStart(3, '0')}`;
    const titles = getDefaultSignerTitle(defaultHeadRole);

    setNoticeForm({
      noticeNumber: refNo,
      title: '',
      bengaliTitle: '',
      category: 'academic',
      audience: 'all',
      content: '',
      contentBengali: '',
      priority: 'normal',
      publishDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      isPinned: false,
      signedBy: defaultSignerName,
      signerDesignation: `${titles.en} / ${titles.bn}`,
      includeDigitalSignature: !!activeInstitute?.signatureUrl, // Default true if signature exists
      signatoryRole: defaultHeadRole,
      digitalSignatureUrl:
        activeInstitute?.signatureUrl ||
        (defaultHeadRole === 'acting_principal'
          ? PRESET_DIGITAL_SIGNATURES.actingPrincipal
          : PRESET_DIGITAL_SIGNATURES.principal),
      status: 'published',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (notice: SchoolNotice) => {
    setEditingNotice(notice);
    setNoticeForm({
      ...notice,
      includeDigitalSignature: notice.includeDigitalSignature ?? true,
      signatoryRole: notice.signatoryRole || defaultHeadRole,
      digitalSignatureUrl:
        notice.digitalSignatureUrl ||
        activeInstitute?.signatureUrl ||
        PRESET_DIGITAL_SIGNATURES.principal,
    });
    setIsAddModalOpen(true);
  };

  // Switch signatory authority in modal
  const handleSignatoryChange = (role: InstituteHeadRole) => {
    const titles = getDefaultSignerTitle(role);
    let signerName = activeInstitute?.principalName || 'Head of Institution';
    let signUrl = activeInstitute?.signatureUrl;

    if (role === 'acting_principal') {
      signerName =
        activeInstitute?.actingPrincipalName ||
        activeInstitute?.principalName ||
        'Acting Principal In-Charge';
      signUrl = activeInstitute?.actingSignatureUrl || activeInstitute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.actingPrincipal;
    } else if (role === 'vice_principal') {
      signerName =
        activeInstitute?.vicePrincipalName ||
        'Vice-Principal';
      signUrl = activeInstitute?.viceSignatureUrl || PRESET_DIGITAL_SIGNATURES.vicePrincipal;
    } else if (role === 'acting_headmaster') {
      signerName = activeInstitute?.actingPrincipalName || activeInstitute?.principalName || 'Acting Headmaster';
      signUrl = PRESET_DIGITAL_SIGNATURES.actingPrincipal;
    } else {
      signUrl = activeInstitute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.principal;
    }

    setNoticeForm((prev) => ({
      ...prev,
      signatoryRole: role,
      signedBy: signerName,
      signerDesignation: `${titles.en} / ${titles.bn}`,
      digitalSignatureUrl: signUrl,
    }));
  };

  // Handle Save Notice
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;

    try {
      if (editingNotice) {
        const updated: SchoolNotice = {
          ...editingNotice,
          ...(noticeForm as SchoolNotice),
          updatedAt: new Date().toISOString(),
        };
        await update('notices', updated);
        logAudit(
          'UPDATE_NOTICE',
          'notices',
          `Updated notice: ${updated.title} (Digital Sign: ${updated.includeDigitalSignature ? 'Yes' : 'Manual'})`,
          updated.id
        );
        setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const refNo =
          noticeForm.noticeNumber ||
          `SCH/NOT/${new Date().getFullYear()}/${String(notices.length + 1).padStart(3, '0')}`;

        const newNotice: SchoolNotice = {
          id: `not-${Date.now()}`,
          instituteId: activeInstitute?.id || 'inst-01',
          noticeNumber: refNo,
          title: noticeForm.title || '',
          bengaliTitle: noticeForm.bengaliTitle,
          category: (noticeForm.category as NoticeCategory) || 'academic',
          audience: (noticeForm.audience as NoticeAudience) || 'all',
          content: noticeForm.content || '',
          contentBengali: noticeForm.contentBengali,
          priority: (noticeForm.priority as NoticePriority) || 'normal',
          publishDate: noticeForm.publishDate || new Date().toISOString().split('T')[0],
          expiryDate: noticeForm.expiryDate,
          isPinned: !!noticeForm.isPinned,
          signedBy: noticeForm.signedBy || defaultSignerName,
          signerDesignation: noticeForm.signerDesignation || 'Head of Institution',
          includeDigitalSignature: !!noticeForm.includeDigitalSignature,
          digitalSignatureUrl: noticeForm.includeDigitalSignature
            ? noticeForm.digitalSignatureUrl || activeInstitute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.principal
            : undefined,
          signatoryRole: noticeForm.signatoryRole || defaultHeadRole,
          status: 'published',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await add('notices', newNotice);
        logAudit(
          'PUBLISH_NOTICE',
          'notices',
          `Published official notice: ${newNotice.title} (Digital Sign: ${newNotice.includeDigitalSignature ? 'Attached' : 'Manual Print'})`,
          newNotice.id
        );
        setNotices((prev) => [newNotice, ...prev]);
      }

      setIsAddModalOpen(false);
      setEditingNotice(null);
    } catch (err) {
      console.error('Failed to save notice:', err);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (notice: SchoolNotice) => {
    try {
      const updated: SchoolNotice = {
        ...notice,
        isPinned: !notice.isPinned,
        updatedAt: new Date().toISOString(),
      };
      await update('notices', updated);
      setNotices((prev) => prev.map((n) => (n.id === notice.id ? updated : n)));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Delete Notice
  const handleDeleteNotice = async (noticeId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice "${title}"?`)) return;
    try {
      await remove('notices', noticeId);
      logAudit('DELETE_NOTICE', 'notices', `Deleted notice: ${title}`, noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
  };

  // Filter Notices
  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.bengaliTitle && n.bengaliTitle.includes(searchQuery)) ||
      n.noticeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || n.category === selectedCategory;
    const matchesAudience = selectedAudience === 'all' || n.audience === selectedAudience;
    const matchesSignature =
      signatureFilter === 'all' ||
      (signatureFilter === 'digital' && n.includeDigitalSignature) ||
      (signatureFilter === 'manual' && !n.includeDigitalSignature);

    return matchesSearch && matchesCategory && matchesAudience && matchesSignature;
  });

  // Sort: Pinned first, then newest
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  // Stats
  const totalNotices = notices.length;
  const pinnedCount = notices.filter((n) => n.isPinned).length;
  const digitalSignCount = notices.filter((n) => n.includeDigitalSignature).length;
  const manualSignCount = totalNotices - digitalSignCount;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <span>{language === 'bn' ? 'নোটিশ বোর্ড ও সার্কুলার' : 'Official Notice Board'}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Phase 13 • Digital & Manual Signatures
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === 'bn'
              ? 'অফিসিয়াল বিজ্ঞপ্তি প্রকাশ করুন। প্রয়োজন অনুযায়ী ডিজিটাল স্বাক্ষর অথবা প্রিন্ট করে ম্যানুয়াল স্বাক্ষরের অপশন নির্বাচন করুন।'
              : 'Publish official circulars. Optionally attach digital verified signatures or generate clean spaces for manual physical signatures.'}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন নোটিশ পোস্ট করুন' : 'Post New Notice'}</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{totalNotices}</div>
            <div className="text-[11px] text-slate-500">Total Circulars</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
            <Pin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{pinnedCount}</div>
            <div className="text-[11px] text-slate-500">Pinned Announcements</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {digitalSignCount}
            </div>
            <div className="text-[11px] text-slate-500">Digitally Signed (ই-স্বাক্ষরিত)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {manualSignCount}
            </div>
            <div className="text-[11px] text-slate-500">Manual Physical Sign (ম্যানুয়াল)</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'bn' ? 'শিরোনাম বা স্মারক নং দিয়ে খুঁজুন...' : 'Search by title, ref no...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Signature Type Filter */}
          <select
            value={signatureFilter}
            onChange={(e) => setSignatureFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Signatures (ডিজিটাল ও ম্যানুয়াল)</option>
            <option value="digital">✍️ Digital Signature Only</option>
            <option value="manual">📝 Manual Signature Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic & Classes</option>
            <option value="examination">Examinations</option>
            <option value="holiday">Holiday & Vacation</option>
            <option value="sports_cultural">Sports & Cultural</option>
            <option value="fees_finance">Tuition & Accounts</option>
            <option value="urgent_special">Urgent / Special</option>
          </select>

          {/* Audience Filter */}
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Audiences</option>
            <option value="students">Students</option>
            <option value="teachers">Teachers</option>
            <option value="guardians">Guardians</option>
          </select>
        </div>
      </div>

      {/* Notice Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading notices...</div>
        ) : sortedNotices.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
            No notices found matching your filter criteria.
          </div>
        ) : (
          sortedNotices.map((notice) => {
            const isDigital = notice.includeDigitalSignature;

            return (
              <div
                key={notice.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-850 border transition-all duration-200 shadow-xs space-y-3 ${
                  notice.isPinned
                    ? 'border-amber-400 dark:border-amber-600/60 ring-1 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.isPinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </span>
                      )}

                      <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {notice.noticeNumber}
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
                        {notice.category}
                      </span>

                      {/* Digital vs Manual Signature Badge */}
                      {isDigital ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Digital Signature (ডিজিটাল স্বাক্ষর)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                          <PenTool className="w-3 h-3 text-slate-500" />
                          <span>Manual Physical Sign (ম্যানুয়াল স্বাক্ষর)</span>
                        </span>
                      )}

                      {notice.priority === 'urgent' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full">
                          Urgent Alert
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h3>
                    {notice.bengaliTitle && (
                      <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-serif">
                        {notice.bengaliTitle}
                      </h4>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePin(notice)}
                      title={notice.isPinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        notice.isPinned
                          ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950 dark:border-amber-800'
                          : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-600'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setViewingNotice(notice)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print Circular</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(notice)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Edit Notice"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteNotice(notice.id, notice.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-sans">
                  {notice.content}
                </p>

                {/* Footer metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Published: {notice.publishDate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audience: {notice.audience}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
                    <span>Signed by: <strong>{notice.signedBy}</strong> ({notice.signerDesignation})</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: VIEW & PRINT OFFICIAL NOTICE CIRCULAR */}
      {/* ======================================================== */}
      {viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          {/* Hidden file input for custom notice letterhead template upload */}
          <input
            type="file"
            ref={noticeTemplateInputRef}
            onChange={handleNoticeTemplateUpload}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />

          <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl max-w-2xl w-full space-y-6 border border-slate-300 my-auto relative overflow-hidden print:p-4 print:border-none print:shadow-none print:m-0 print:max-w-none print:w-full">
            {/* Custom Letterhead Background Image */}
            {noticeCustomTemplateBg && (
              <img
                src={noticeCustomTemplateBg}
                alt="Custom Letterhead Template"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
              />
            )}

            {/* Central Institutional Watermark */}
            {noticeShowWatermark && (
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none z-10">
                <div className="text-center font-serif">
                  <Building className="w-72 h-72 mx-auto text-slate-900" />
                  <div className="text-3xl font-black uppercase tracking-widest mt-2">
                    {activeInstitute?.name || 'INSTITUTION'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar (Top - Hidden on Print) */}
            <div className="relative z-20 flex items-center justify-between pb-3 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Official Institutional Circular
                </span>
                {viewingNotice.includeDigitalSignature && noticeShowSignature ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Digitally Certified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <PenTool className="w-3 h-3 text-amber-600" />
                    Manual Signature Ready
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeDesigner(!showNoticeDesigner)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    showNoticeDesigner
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Customize Letterhead & Template"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showNoticeDesigner ? 'Hide Settings' : 'Letterhead Design'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Circular</span>
                </button>
                <button
                  onClick={() => {
                    setViewingNotice(null);
                    setShowNoticeDesigner(false);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LETTERHEAD DESIGNER PANEL (Hidden on Print) */}
            {showNoticeDesigner && (
              <div className="relative z-30 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3 print:hidden">
                <div className="flex items-center justify-between font-bold text-slate-800 pb-2 border-b border-slate-200">
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <Sliders className="w-4 h-4" />
                    Notice Letterhead Customizer (লেটারহেড অপশন)
                  </span>
                  <button
                    onClick={() => setShowNoticeDesigner(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Upload custom background template */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[11px] text-slate-700 block">
                    Custom Letterhead Background (কাস্টম লেটারহেড প্যাড)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => noticeTemplateInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Letterhead Image</span>
                    </button>
                    {noticeCustomTemplateBg && (
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeCustomTemplateBg('');
                          localStorage.removeItem('notice_custom_template_bg');
                          if (noticeTemplateInputRef.current) noticeTemplateInputRef.current.value = '';
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                        title="Remove custom template"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {noticeCustomTemplateBg && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Custom letterhead template active
                    </span>
                  )}
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span>Show Header Text</span>
                    <input
                      type="checkbox"
                      checked={noticeShowHeader}
                      onChange={(e) => {
                        setNoticeShowHeader(e.target.checked);
                        localStorage.setItem('notice_show_header', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span>Show Institute Logo</span>
                    <input
                      type="checkbox"
                      checked={noticeShowLogo}
                      onChange={(e) => {
                        setNoticeShowLogo(e.target.checked);
                        localStorage.setItem('notice_show_logo', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span>Watermark (জলছাপ)</span>
                    <input
                      type="checkbox"
                      checked={noticeShowWatermark}
                      onChange={(e) => {
                        setNoticeShowWatermark(e.target.checked);
                        localStorage.setItem('notice_show_watermark', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 cursor-pointer">
                    <span>Signature / Seal</span>
                    <input
                      type="checkbox"
                      checked={noticeShowSignature}
                      onChange={(e) => {
                        setNoticeShowSignature(e.target.checked);
                        localStorage.setItem('notice_show_signature', String(e.target.checked));
                      }}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* OFFICIAL LETTERHEAD WITH LOGO */}
            {noticeShowHeader ? (
              <div className="relative z-20 text-center space-y-2 border-b-2 border-slate-900 pb-5">
                <div className="flex items-center justify-center gap-3">
                  {noticeShowLogo && activeInstitute?.logoUrl ? (
                    <img
                      src={activeInstitute.logoUrl}
                      alt="Institute Logo"
                      className="w-16 h-16 object-contain rounded-lg p-0.5 border border-slate-200 shadow-xs"
                    />
                  ) : noticeShowLogo ? (
                    <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                      <Building className="w-7 h-7 text-indigo-300" />
                    </div>
                  ) : null}

                  <div className="text-left">
                    <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight font-serif">
                      {activeInstitute?.name || 'Model School & College'}
                    </h2>
                    {activeInstitute?.bengaliName && (
                      <h3 className="text-sm font-bold text-slate-800 font-serif">
                        {activeInstitute.bengaliName}
                      </h3>
                    )}
                    <p className="text-[11px] text-slate-600 font-mono">
                      EIIN: {activeInstitute?.eiin || '134215'} • Code: {activeInstitute?.code || '5401'} • Board: {activeInstitute?.educationBoard || 'Dhaka'}
                    </p>
                  </div>
                </div>

                <div className="inline-block px-3 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-widest text-slate-800 border border-slate-200 mt-1">
                  Office of the Principal / Institutional Executive Board
                </div>
              </div>
            ) : (
              // If header is disabled for pre-printed letterhead paper, keep spacing
              <div className="h-12" />
            )}

            {/* MEMO & DATE ROW */}
            <div className="relative z-20 flex items-center justify-between text-xs font-mono text-slate-700 border-b border-slate-200 pb-2">
              <div>
                <strong>স্মারক নং / Ref No:</strong> {viewingNotice.noticeNumber}
              </div>
              <div>
                <strong>তারিখ / Date:</strong> {viewingNotice.publishDate}
              </div>
            </div>

            {/* NOTICE SUBJECT / TITLE */}
            <div className="relative z-20 space-y-1">
              <div className="text-sm font-bold text-slate-950 uppercase underline tracking-wide font-serif">
                বিষয়: {viewingNotice.bengaliTitle || viewingNotice.title}
              </div>
              {viewingNotice.bengaliTitle && (
                <div className="text-xs text-slate-700 italic">
                  Subject: {viewingNotice.title}
                </div>
              )}
            </div>

            {/* BODY TEXT */}
            <div className="relative z-20 space-y-3 text-xs leading-relaxed text-slate-800 font-serif text-justify">
              {viewingNotice.contentBengali && (
                <p className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200">
                  {viewingNotice.contentBengali}
                </p>
              )}
              <p className="font-sans text-slate-700 leading-relaxed">
                {viewingNotice.content}
              </p>
            </div>

            {/* SIGNATURE BLOCK */}
            {noticeShowSignature && (
              <div className="relative z-20 pt-8 flex justify-end">
                <div className="text-center w-56 space-y-1.5">
                  {viewingNotice.includeDigitalSignature ? (
                    // DIGITAL SIGNATURE ATTACHED
                    <div className="space-y-1">
                      <div className="h-16 flex items-end justify-center">
                        {viewingNotice.digitalSignatureUrl || activeInstitute?.signatureUrl ? (
                          <img
                            src={viewingNotice.digitalSignatureUrl || activeInstitute?.signatureUrl}
                            alt="Digital Signature"
                            className="max-h-14 max-w-full object-contain"
                          />
                        ) : (
                          <div className="font-serif italic text-xs text-indigo-900 font-bold border-b border-indigo-900 pb-1">
                            Digitally Authenticated
                          </div>
                        )}
                      </div>
                      <div className="border-t border-slate-400 pt-1">
                        <div className="font-bold text-xs text-slate-900">
                          {viewingNotice.signedBy}
                        </div>
                        <div className="text-[11px] text-slate-700 font-semibold">
                          {viewingNotice.signerDesignation}
                        </div>
                        <div className="text-[9px] text-emerald-700 font-mono uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Digitally Signed & Certified</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // MANUAL SIGNATURE GUIDELINE (FOR PRINTING & PHYSICAL SIGNING)
                    <div className="space-y-1">
                      <div className="h-14 flex items-end justify-center">
                        <span className="text-[10px] text-slate-400 italic">
                          (Space for Physical Signature & Seal)
                        </span>
                      </div>
                      <div className="border-t border-dashed border-slate-500 pt-1">
                        <div className="font-bold text-xs text-slate-900">
                          {viewingNotice.signedBy}
                        </div>
                        <div className="text-[11px] text-slate-700 font-semibold">
                          {viewingNotice.signerDesignation}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          স্বাক্ষর ও প্রাতিষ্ঠানিক সিলমোহর
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: POST / EDIT NOTICE WITH SIGNATURE SELECTION       */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full space-y-4 my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>{editingNotice ? 'Edit Official Circular' : 'Post Official Notice / Circular'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notice Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    placeholder="e.g. Schedule for Half-Yearly Exam"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    বিজ্ঞপ্তির শিরোনাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={noticeForm.bengaliTitle || ''}
                    onChange={(e) => setNoticeForm({ ...noticeForm, bengaliTitle: e.target.value })}
                    placeholder="অর্ধ-বার্ষিক পরীক্ষার সময়সূচি সংক্রান্ত"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={noticeForm.category}
                    onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="academic">Academic & Routine</option>
                    <option value="examination">Examinations</option>
                    <option value="holiday">Holiday & Vacation</option>
                    <option value="sports_cultural">Sports & Cultural</option>
                    <option value="fees_finance">Tuition & Accounts</option>
                    <option value="urgent_special">Urgent / Special</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={noticeForm.audience}
                    onChange={(e) => setNoticeForm({ ...noticeForm, audience: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="all">All (Students, Teachers, Parents)</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Teachers & Staff</option>
                    <option value="guardians">Parents / Guardians</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Special Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notice Content (English) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Details of the announcement, guidelines, instructions..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  বিজ্ঞপ্তির বিস্তারিত বিবরণ (বাংলা)
                </label>
                <textarea
                  rows={2}
                  value={noticeForm.contentBengali || ''}
                  onChange={(e) => setNoticeForm({ ...noticeForm, contentBengali: e.target.value })}
                  placeholder="সকল শিক্ষার্থী ও সম্মানিত অভিভাবকদের অবগতির জন্য জানানো যাচ্ছে যে..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-serif focus:outline-hidden"
                />
              </div>

              {/* ======================================================== */}
              {/* DIGITAL SIGNATURE VS MANUAL SIGNATURE OPTIONS (USER REQ) */}
              {/* ======================================================== */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Digital Signature Option (ডিজিটাল স্বাক্ষর অপশন)
                    </span>
                  </div>

                  {/* The User-Requested Optional Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeForm.includeDigitalSignature}
                      onChange={(e) =>
                        setNoticeForm({
                          ...noticeForm,
                          includeDigitalSignature: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500">
                  {noticeForm.includeDigitalSignature
                    ? '✓ ডিজিটাল স্বাক্ষর সক্রিয়: বিজ্ঞপ্তিতে অনুমোদিত প্রাতিষ্ঠানিক প্রধানের ডিজিটাল স্বাক্ষর এম্বেড করা থাকবে (অনলাইন ও পেপারলেস নোটিশের জন্য উপযুক্ত)।'
                    : '○ ম্যানুয়াল স্বাক্ষর নির্বাচন করা হয়েছে: নোটিশে প্রিন্ট করে হাতে কলমে স্বাক্ষর ও সিলমোহর দেওয়ার জন্য ফাঁকা স্থান রাখা হবে।'}
                </p>

                {/* Signatory Authority Selection & Preview when Digital Signature is ON */}
                {noticeForm.includeDigitalSignature ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Signatory Authority (স্বাক্ষরকারী পদবি)
                        </label>
                        <select
                          value={noticeForm.signatoryRole || defaultHeadRole}
                          onChange={(e) => handleSignatoryChange(e.target.value as InstituteHeadRole)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                        >
                          <option value="principal">
                            Principal (অধ্যক্ষ)
                          </option>
                          <option value="vice_principal">
                            Vice-Principal (উপাধ্যক্ষ — ২য় পজিশন)
                          </option>
                          <option value="acting_principal">
                            Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ)
                          </option>
                          <option value="headmaster">
                            Headmaster (প্রধান শিক্ষক)
                          </option>
                          <option value="acting_headmaster">
                            Acting Headmaster (ভারপ্রাপ্ত প্রধান শিক্ষক)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Signer Name (স্বাক্ষরকারী ব্যক্তির নাম)
                        </label>
                        <input
                          type="text"
                          value={noticeForm.signedBy || ''}
                          onChange={(e) => setNoticeForm({ ...noticeForm, signedBy: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Signature Preview & Preset Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-10 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1">
                          {noticeForm.digitalSignatureUrl ? (
                            <img
                              src={noticeForm.digitalSignatureUrl}
                              alt="Signature Preview"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">No Signature</span>
                          )}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Digital Signature Attached
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {noticeForm.signerDesignation}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="file"
                          ref={noticeSignInputRef}
                          onChange={handleNoticeSignUpload}
                          accept="image/png, image/jpeg, image/svg+xml"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => noticeSignInputRef.current?.click()}
                          className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                          title="Upload custom signature for this notice"
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const instSign =
                              noticeForm.signatoryRole === 'acting_principal'
                                ? activeInstitute?.actingSignatureUrl || activeInstitute?.signatureUrl
                                : noticeForm.signatoryRole === 'vice_principal'
                                ? activeInstitute?.viceSignatureUrl
                                : activeInstitute?.signatureUrl;

                            const fallbackPreset =
                              noticeForm.signatoryRole === 'acting_principal'
                                ? PRESET_DIGITAL_SIGNATURES.actingPrincipal
                                : noticeForm.signatoryRole === 'vice_principal'
                                ? PRESET_DIGITAL_SIGNATURES.vicePrincipal
                                : PRESET_DIGITAL_SIGNATURES.principal;

                            setNoticeForm({
                              ...noticeForm,
                              digitalSignatureUrl: instSign || fallbackPreset,
                            });
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium cursor-pointer"
                          title="Reset to Institute Profile Signature"
                        >
                          Institute Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const preset =
                              noticeForm.signatoryRole === 'acting_principal'
                                ? PRESET_DIGITAL_SIGNATURES.actingPrincipal
                                : noticeForm.signatoryRole === 'vice_principal'
                                ? PRESET_DIGITAL_SIGNATURES.vicePrincipal
                                : PRESET_DIGITAL_SIGNATURES.principal;
                            setNoticeForm({ ...noticeForm, digitalSignatureUrl: preset });
                          }}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium cursor-pointer"
                        >
                          Preset
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <PenTool className="w-4 h-4 shrink-0" />
                    <span>
                      প্রিন্ট করার পর হাতে স্বাক্ষরের জন্য নোটিশের নিচে পর্যাপ্ত স্থান রাখা হবে।
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={noticeForm.isPinned}
                  onChange={(e) => setNoticeForm({ ...noticeForm, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="isPinned" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Pin this circular to top of Notice Board (শীর্ষে পিন করুন)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingNotice ? 'Update Circular' : 'Publish Circular'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
