import React, { useState, useEffect } from 'react';
import { CertificateRecord, CertificateType, CertificateCategory, Student, ViewTab } from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update, remove } from '../../db/indexedDB';
import { SAMPLE_CERTIFICATES } from './sampleCertificatesData';
import { CertificatePrintView } from './CertificatePrintView';
import { NewCertificateModal } from './NewCertificateModal';
import { CertificateVerificationModal } from './CertificateVerificationModal';
import { DocumentVerificationCertificateModal } from './DocumentVerificationCertificateModal';
import {
  CERTIFICATE_CATEGORIES,
  CERTIFICATE_CATALOG,
  getCertificateDefinition,
} from './certificateDefinitions';
import {
  FileBadge,
  Plus,
  Search,
  Printer,
  ShieldCheck,
  FileCheck,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Award,
  IdCard as IdIcon,
  Trash2,
  Trophy,
  Medal,
  GraduationCap,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { MasterCertificateTemplateModal } from './MasterCertificateTemplateModal';

export const CertificateManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit, setActiveTab } = useApp();

  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isMasterTemplateModalOpen, setIsMasterTemplateModalOpen] = useState<boolean>(false);
  const [selectedForPrint, setSelectedForPrint] = useState<CertificateRecord | null>(null);
  const [selectedForVerificationReport, setSelectedForVerificationReport] = useState<CertificateRecord | null>(null);

  // Persistent Template & Typography Registry State
  const [registryVersion, setRegistryVersion] = useState<number>(0);
  const currentTemplateStyle = localStorage.getItem('cert_master_template_style') || 'classic_gold';
  const currentFontsJson = localStorage.getItem('cert_default_fonts');
  let currentFontConfig: any = null;
  try {
    if (currentFontsJson) currentFontConfig = JSON.parse(currentFontsJson);
  } catch (e) {}

  const templateStyleLabels: Record<string, string> = {
    classic_gold: 'Classic Ivory & Royal Gold',
    royal_navy: 'Royal Navy Executive',
    emerald_distinction: 'Emerald Distinction & Merit',
    crimson_prestigious: 'Prestigious Crimson Crest',
    minimalist_modern: 'Minimalist Clean Architectural',
    custom_letterhead: 'Custom Institutional Letterhead',
  };

  // Load Certificates and Students from IndexedDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [certList, studentList] = await Promise.all([
        getAll<CertificateRecord>('certificates'),
        getAll<Student>('students'),
      ]);

      if (certList && certList.length > 0) {
        setCertificates(certList);
      } else {
        // Auto-seed sample certificates for instant demonstration
        for (const c of SAMPLE_CERTIFICATES) {
          await add('certificates', c);
        }
        setCertificates(SAMPLE_CERTIFICATES);
      }

      setStudents(studentList || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id, activeAcademicYear?.id]);

  // Save new certificate
  const handleSaveCertificate = async (newCert: CertificateRecord) => {
    await add('certificates', newCert);
    await logAudit(
      'create',
      'certificates',
      `Issued English Certificate ${newCert.certificateNumber} (${newCert.certificateType}) for ${newCert.studentName}`,
      newCert.id
    );
    await loadData();
    setSelectedForPrint(newCert);
  };

  // Revoke certificate
  const handleToggleStatus = async (cert: CertificateRecord) => {
    const newStatus = cert.status === 'revoked' ? 'issued' : 'revoked';
    const updated = { ...cert, status: newStatus as any, updatedAt: new Date().toISOString() };
    await update('certificates', updated);
    await logAudit(
      'update',
      'certificates',
      `${newStatus === 'revoked' ? 'Revoked' : 'Reactivated'} Certificate #${cert.certificateNumber}`,
      cert.id
    );
    await loadData();
  };

  // Delete certificate
  const handleDeleteCertificate = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${number}?`)) return;
    await remove('certificates', id);
    await logAudit('delete', 'certificates', `Deleted Certificate #${number}`, id);
    await loadData();
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(certificates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates_registry_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to determine category of any certificate record
  const getCertCategory = (cert: CertificateRecord): CertificateCategory => {
    if (cert.category) return cert.category;
    const def = getCertificateDefinition(cert.certificateType);
    return def.category;
  };

  // Filtered List
  const filteredCertificates = certificates.filter((c) => {
    const certDef = getCertificateDefinition(c.certificateType);
    const certCat = getCertCategory(c);

    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.certificateNumber.toLowerCase().includes(q) ||
      c.studentName.toLowerCase().includes(q) ||
      (c.studentBengaliName && c.studentBengaliName.includes(q)) ||
      String(c.rollNumber).includes(q) ||
      c.className.toLowerCase().includes(q) ||
      c.verificationCode.toLowerCase().includes(q) ||
      certDef.title.toLowerCase().includes(q);

    // Category filter
    const matchesCategory = filterCategory === 'all' || certCat === filterCategory;

    // Type filter
    const matchesType = filterType === 'all' || c.certificateType === filterType;

    // Status filter
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // KPI Metrics by Category
  const totalIssued = certificates.filter((c) => c.status === 'issued').length;
  const countCategoryA = certificates.filter(
    (c) => getCertCategory(c) === 'official_academic'
  ).length;
  const countCategoryB = certificates.filter((c) => getCertCategory(c) === 'achievement').length;
  const countCategoryC = certificates.filter((c) => getCertCategory(c) === 'activities').length;

  return (
    <div className="space-y-6">
      {/* TOP HEADER & ROUTE TOGGLE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileBadge className="w-6 h-6 text-blue-600" />
              <span>Student Certificate Registry (28 Types)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
              English Formats • Board Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official English certificates across 3 key divisions: Official/Academic (10), Achievement (6), and Activities (12) with instant digital verification
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to ID Cards view */}
          <button
            onClick={() => setActiveTab('idcards' as ViewTab)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Switch to ID Cards Module"
          >
            <IdIcon className="w-4 h-4 text-purple-600" />
            <span>ID Cards Hub</span>
          </button>

          {/* Master Certificate Template & Typography Settings */}
          <button
            onClick={() => setIsMasterTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Configure master certificate template design and section fonts applied to all certificates"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Master Template &amp; Fonts</span>
          </button>

          {/* Verification Portal */}
          <button
            onClick={() => setIsVerifyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verify Document</span>
          </button>

          {/* Issue New Certificate */}
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS FOR 3 CATEGORIES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Issued</span>
            <span className="text-[10px] font-bold text-emerald-600 font-mono">28 Templates</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {certificates.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {totalIssued} Verified &amp; Active
          </div>
        </div>

        {/* Category A Card */}
        <div
          onClick={() => setFilterCategory(filterCategory === 'official_academic' ? 'all' : 'official_academic')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
            filterCategory === 'official_academic'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 dark:bg-blue-950/40'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-blue-300'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
            <span>A. Official / Academic</span>
            <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md">
              10 Types
            </span>
          </div>
          <div className="text-2xl font-black text-blue-950 dark:text-blue-200 mt-1">
            {countCategoryA}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Admission, TC, Testimonial, Bonafide
          </div>
        </div>

        {/* Category B Card */}
        <div
          onClick={() => setFilterCategory(filterCategory === 'achievement' ? 'all' : 'achievement')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
            filterCategory === 'achievement'
              ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 dark:bg-amber-950/40'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>B. Achievement</span>
            <span className="text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-md">
              6 Types
            </span>
          </div>
          <div className="text-2xl font-black text-amber-950 dark:text-amber-200 mt-1">
            {countCategoryB}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Excellence, Merit, Best Student, Attendance
          </div>
        </div>

        {/* Category C Card */}
        <div
          onClick={() => setFilterCategory(filterCategory === 'activities' ? 'all' : 'activities')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
            filterCategory === 'activities'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40'
              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
            <span>C. Activities</span>
            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-md">
              12 Types
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-950 dark:text-emerald-200 mt-1">
            {countCategoryC}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sports, Debate, Science Fair, Winner
          </div>
        </div>
      </div>

      {/* PERSISTENT MASTER TEMPLATE & FONT REGISTRY BANNER */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-white to-blue-50 dark:from-slate-850 dark:via-indigo-950/20 dark:to-slate-850 border border-indigo-200 dark:border-indigo-800/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs mt-0.5">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Master Certificate Template &amp; Typography Registry
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                Global Auto-Propagation
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Define certificate frame layout, borders, and section-wise fonts once in this registry. All 28 certificate templates dynamically inherit these exact styling rules, completely removing the need to edit individual certificates.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Active Layout: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{templateStyleLabels[currentTemplateStyle] || currentTemplateStyle}</span>
              </span>
              <span>•</span>
              <span>
                Fonts: <span className="font-mono text-slate-700 dark:text-slate-300">{currentFontConfig?.titleFont || 'Cinzel Decorative'} (Title), {currentFontConfig?.studentNameFont || 'Playfair Display'} (Name), {currentFontConfig?.bodyFont || 'EB Garamond'} (Body)</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMasterTemplateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Configure Template Registry</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, serial (e.g. ADM-2026), or certificate title..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterType('all');
            }}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          >
            <option value="all">All Categories (28 Templates)</option>
            <option value="official_academic">Category A: Official/Academic (10)</option>
            <option value="achievement">Category B: Achievement (6)</option>
            <option value="activities">Category C: Activities (12)</option>
          </select>

          {/* Specific Certificate Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="all">All Certificate Types</option>
            {CERTIFICATE_CATALOG.filter(
              (c) => filterCategory === 'all' || c.category === filterCategory
            ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.number}. {c.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="issued">Valid &amp; Issued</option>
            <option value="revoked">Revoked / Inactive</option>
          </select>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Export Registry as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* CERTIFICATES REGISTRY TABLE */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Student Certificates Registry ({filteredCertificates.length})
            </h3>
            {filterCategory !== 'all' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-medium">
                Filtered: {filterCategory === 'official_academic' ? 'Category A' : filterCategory === 'achievement' ? 'Category B' : 'Category C'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Click printer icon to view &amp; print full official English certificate
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Serial No</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Certificate Title</th>
                <th className="px-4 py-3">Student Name (English)</th>
                <th className="px-4 py-3">Class &amp; Roll</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <FileBadge className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No certificates matched your criteria
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Issue Certificate" above to generate a new certificate.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isRevoked = cert.status === 'revoked';
                  const certDef = getCertificateDefinition(cert.certificateType);
                  const certCat = getCertCategory(cert);

                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {cert.certificateNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {certCat === 'official_academic' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Cat A • Academic
                          </span>
                        )}
                        {certCat === 'achievement' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Cat B • Achievement
                          </span>
                        )}
                        {certCat === 'activities' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Cat C • Activities
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {certDef.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {cert.eventOrCompetitionName || cert.eventOrMeritTitle || certDef.subtitle}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {cert.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Guardian: {cert.fatherName}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {cert.className}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Roll: {cert.rollNumber} {cert.sectionName ? `• ${cert.sectionName}` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                      </td>

                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            <AlertCircle className="w-3 h-3" />
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            Valid
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Generate Official Verification Certificate */}
                          <button
                            onClick={() => setSelectedForVerificationReport(cert)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                            title="Generate Official Verification Certificate Report"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedForPrint(cert)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                            title="View &amp; Print English Certificate"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(cert)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-semibold ${
                              isRevoked
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30'
                            }`}
                            title={isRevoked ? 'Reactivate Certificate' : 'Revoke Certificate'}
                          >
                            {isRevoked ? 'Restore' : 'Revoke'}
                          </button>

                          <button
                            onClick={() => handleDeleteCertificate(cert.id, cert.certificateNumber)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete Record"
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

      {/* NEW CERTIFICATE MODAL */}
      {isNewModalOpen && (
        <NewCertificateModal
          students={students}
          institute={activeInstitute}
          academicYear={activeAcademicYear}
          existingCount={certificates.length}
          onSave={handleSaveCertificate}
          onClose={() => setIsNewModalOpen(false)}
        />
      )}

      {/* DIGITAL VERIFICATION MODAL */}
      {isVerifyModalOpen && (
        <CertificateVerificationModal
          certificates={certificates}
          institute={activeInstitute}
          onClose={() => setIsVerifyModalOpen(false)}
          onViewPrint={(cert) => {
            setIsVerifyModalOpen(false);
            setSelectedForPrint(cert);
          }}
        />
      )}

      {/* MASTER CERTIFICATE TEMPLATE & TYPOGRAPHY MODAL */}
      <MasterCertificateTemplateModal
        isOpen={isMasterTemplateModalOpen}
        onClose={() => setIsMasterTemplateModalOpen(false)}
        onSaved={() => {
          setRegistryVersion((v) => v + 1);
          loadData();
        }}
      />

      {/* AUTO-GENERATED VERIFICATION CERTIFICATE MODAL */}
      {selectedForVerificationReport && (
        <DocumentVerificationCertificateModal
          isOpen={!!selectedForVerificationReport}
          onClose={() => setSelectedForVerificationReport(null)}
          status="verified"
          record={selectedForVerificationReport}
          queriedNumberOrCode={selectedForVerificationReport.certificateNumber}
          queriedPayload={selectedForVerificationReport.certificateNumber}
          institute={activeInstitute}
        />
      )}

      {/* PRINT CANVAS PREVIEW */}
      {selectedForPrint && (
        <CertificatePrintView
          certificate={selectedForPrint}
          institute={activeInstitute}
          academicYear={activeAcademicYear}
          onClose={() => setSelectedForPrint(null)}
        />
      )}
    </div>
  );
};
