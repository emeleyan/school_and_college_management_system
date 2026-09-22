import React, { useState, useEffect } from 'react';
import {
  Student,
  Teacher,
  Institute,
  AcademicYear,
  IdCardOrientation,
  IdCardTheme,
  ViewTab,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { getAll, add, update } from '../../db/indexedDB';
import { CardData, SingleIdCardView, IdCardCustomConfig } from './SingleIdCardView';
import { BatchIdCardPrintModal } from './BatchIdCardPrintModal';
import { DEFAULT_ID_TEMPLATES, SAMPLE_ISSUED_ID_CARDS } from '../certificates/sampleCertificatesData';
import { fileToBase64 } from '../../utils/imageUtils';
import {
  IdCard as IdIcon,
  Users,
  GraduationCap,
  Briefcase,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  Search,
  FileBadge,
  Eye,
  RotateCw,
  Droplet,
  Sparkles,
  Layers,
  Palette,
  CheckCircle,
  AlertTriangle,
  QrCode,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  SlidersHorizontal,
  Settings2,
} from 'lucide-react';

export const IdCardManagement: React.FC = () => {
  const { activeInstitute, activeAcademicYear, language, logAudit, setActiveTab } = useApp();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'teachers' | 'designer' | 'registry'>('students');

  // Loaded database data
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Selection (Students)
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Filters & Selection (Teachers)
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [selectedEmployeeType, setSelectedEmployeeType] = useState<string>('all');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<string>>(new Set());

  // Designer Settings
  const [orientation, setOrientation] = useState<IdCardOrientation>('portrait');
  const [theme, setTheme] = useState<IdCardTheme>('classic_blue');
  const [designerShowBack, setDesignerShowBack] = useState<boolean>(false);
  const [showBloodGroup, setShowBloodGroup] = useState<boolean>(true);
  const [showQr, setShowQr] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showBengaliName, setShowBengaliName] = useState<boolean>(true);
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [showValidUntil, setShowValidUntil] = useState<boolean>(true);
  const [showSignature, setShowSignature] = useState<boolean>(true);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [showCardTitle, setShowCardTitle] = useState<boolean>(true);
  const [cardTitleText, setCardTitleText] = useState<string>('STUDENT IDENTITY CARD');
  const [customFrontBg, setCustomFrontBg] = useState<string>('');
  const [customBackBg, setCustomBackBg] = useState<string>('');

  const frontBgInputRef = React.useRef<HTMLInputElement>(null);
  const backBgInputRef = React.useRef<HTMLInputElement>(null);

  const handleFrontBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 800, 1200);
      setCustomFrontBg(base64);
    } catch (err) {
      console.error('Failed to upload custom front background:', err);
    }
  };

  const handleBackBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 800, 1200);
      setCustomBackBg(base64);
    } catch (err) {
      console.error('Failed to upload custom back background:', err);
    }
  };

  const activeCustomConfig: IdCardCustomConfig = {
    showLogo,
    showHeader,
    showBengaliName,
    showBloodGroup,
    showQrCode: showQr,
    showBarcode,
    showPhone,
    showValidUntil,
    showSignature,
    showWatermark,
    showCardTitle,
    cardTitleText,
    customFrontBg: customFrontBg || undefined,
    customBackBg: customBackBg || undefined,
  };

  // Preview & Batch Modals
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [previewSideBack, setPreviewSideBack] = useState<boolean>(false);
  const [batchPrintCards, setBatchPrintCards] = useState<CardData[] | null>(null);

  // Load students & teachers from IndexedDB
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuList, teachList] = await Promise.all([
        getAll<Student>('students'),
        getAll<Teacher>('teachers'),
      ]);
      setStudents(stuList || []);
      setTeachers(teachList || []);
    } catch (err) {
      console.error('Failed to load data for ID cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeInstitute?.id, activeAcademicYear?.id]);

  // Convert Student to CardData
  const mapStudentToCard = (st: Student): CardData => {
    return {
      id: st.id,
      type: 'student',
      name: `${st.firstName} ${st.lastName}`.trim(),
      bengaliName: st.bengaliName,
      roleOrClass: `Class ${st.classId || '10'}`,
      rollOrIndex: `Roll: ${String(st.rollNumber || 1).padStart(2, '0')}`,
      idNumber: st.studentId || `STU-${st.rollNumber}`,
      bloodGroup: st.bloodGroup || 'O+',
      phone: st.phone || st.guardian?.emergencyContactPhone,
      validUntil: '2026-12-31',
      photoUrl: st.photoUrl,
      qrPayload: `STU:${st.studentId}|${st.firstName} ${st.lastName}|Class:${st.classId}|Roll:${st.rollNumber}|EIIN:${activeInstitute?.eiin || '134215'}`,
      barcodePayload: st.studentId?.replace(/[^A-Z0-9]/gi, '') || `2026${st.rollNumber}`,
    };
  };

  // Convert Teacher to CardData
  const mapTeacherToCard = (tc: Teacher): CardData => {
    return {
      id: tc.id,
      type: 'teacher',
      name: `${tc.firstName} ${tc.lastName}`.trim(),
      bengaliName: tc.bengaliName,
      roleOrClass: tc.designation || (tc.employeeType === 'teacher' ? 'Assistant Teacher' : 'Staff Member'),
      rollOrIndex: tc.indexNumber ? `Index: ${tc.indexNumber}` : `ID: ${tc.teacherId}`,
      idNumber: tc.teacherId || `FAC-${tc.id.substring(0, 5)}`,
      bloodGroup: tc.bloodGroup || 'A+',
      phone: tc.phone,
      validUntil: '2027-12-31',
      photoUrl: tc.photoUrl,
      qrPayload: `FAC:${tc.teacherId}|${tc.firstName} ${tc.lastName}|${tc.designation}|EIIN:${activeInstitute?.eiin || '134215'}`,
      barcodePayload: tc.teacherId?.replace(/[^A-Z0-9]/gi, '') || `FAC${tc.id.substring(0, 4)}`,
    };
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchesSearch =
      !q ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      (s.bengaliName && s.bengaliName.includes(q)) ||
      String(s.rollNumber).includes(q) ||
      s.studentId?.toLowerCase().includes(q);

    const matchesClass = selectedClass === 'all' || s.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    const q = teacherSearch.toLowerCase();
    const matchesSearch =
      !q ||
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
      (t.bengaliName && t.bengaliName.includes(q)) ||
      t.teacherId?.toLowerCase().includes(q) ||
      t.designation?.toLowerCase().includes(q);

    const matchesType = selectedEmployeeType === 'all' || t.employeeType === selectedEmployeeType;
    return matchesSearch && matchesType;
  });

  // Toggle selection
  const toggleStudentSelection = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

  const selectAllFilteredStudents = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleTeacherSelection = (id: string) => {
    const next = new Set(selectedTeacherIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTeacherIds(next);
  };

  const selectAllFilteredTeachers = () => {
    if (selectedTeacherIds.size === filteredTeachers.length && filteredTeachers.length > 0) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(filteredTeachers.map((t) => t.id)));
    }
  };

  // Launch Batch Print
  const handleBatchPrintStudents = () => {
    const targetStudents =
      selectedStudentIds.size > 0
        ? students.filter((s) => selectedStudentIds.has(s.id))
        : filteredStudents;

    const cards = targetStudents.map(mapStudentToCard);
    setBatchPrintCards(cards);
  };

  const handleBatchPrintTeachers = () => {
    const targetTeachers =
      selectedTeacherIds.size > 0
        ? teachers.filter((t) => selectedTeacherIds.has(t.id))
        : filteredTeachers;

    const cards = targetTeachers.map(mapTeacherToCard);
    setBatchPrintCards(cards);
  };

  // Sample card for designer tab
  const sampleCardForDesigner: CardData = {
    id: 'sample-01',
    type: 'student',
    name: 'Tanvir Ahmed',
    bengaliName: 'তানভীর আহমেদ',
    roleOrClass: 'Class 10 (Science)',
    rollOrIndex: 'Roll: 03',
    idNumber: 'STU-2026-0042',
    bloodGroup: showBloodGroup ? 'B+' : undefined,
    phone: '01712-345678',
    validUntil: '2026-12-31',
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <IdIcon className="w-6 h-6 text-purple-600" />
              <span>
                {language === 'bn' ? 'স্মার্ট আইডি কার্ড ব্যবস্থাপনা' : 'Smart ID Card Management'}
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
              Phase 11 • CR80 PVC Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'bn'
              ? 'শিক্ষার্থী ও শিক্ষকদের জন্য কিউআর কোড এবং বারকোডযুক্ত প্রমিত প্লাস্টিক আইডি কার্ড তৈরি ও A4 শিট বাল্ক প্রিন্টিং'
              : 'Design, issue, and batch-print QR and Barcode enabled PVC identification cards for students, teachers, and staff'}
          </p>
        </div>

        {/* Action button to switch to Certificates */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('certificates' as ViewTab)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <FileBadge className="w-4 h-4 text-blue-600" />
            <span>Certificates Hub</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('students')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'students'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student ID Cards ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'teachers'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Faculty & Staff IDs ({teachers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('designer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'designer'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Template & Designer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('registry')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'registry'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Issued Registry</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. STUDENT ID CARDS SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 flex-1">
              {/* Select All Checkbox */}
              <button
                type="button"
                onClick={selectAllFilteredStudents}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {selectedStudentIds.size > 0 && selectedStudentIds.size === filteredStudents.length ? (
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {selectedStudentIds.size > 0
                    ? `Selected (${selectedStudentIds.size})`
                    : 'Select All'}
                </span>
              </button>

              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search students by name, roll, or student ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Batch Print Button */}
              <button
                onClick={handleBatchPrintStudents}
                disabled={filteredStudents.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Print A4 Batch Sheet ({selectedStudentIds.size > 0 ? selectedStudentIds.size : filteredStudents.length})
                </span>
              </button>
            </div>
          </div>

          {/* Student ID Grid / Cards List */}
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No students enrolled or found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Enrolled students in the Student Management module will appear here for ID card printing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStudents.map((st) => {
                const isSelected = selectedStudentIds.has(st.id);
                const card = mapStudentToCard(st);

                return (
                  <div
                    key={st.id}
                    className={`bg-white dark:bg-slate-850 rounded-xl border transition-all p-3 flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Card Item Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleStudentSelection(st.id)}
                          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-purple-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-mono font-bold text-[10px] text-slate-900 dark:text-white">
                            {st.studentId || `Roll: ${st.rollNumber}`}
                          </span>
                        </button>

                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                          Class {st.classId || '10'}
                        </span>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center gap-3 py-3">
                        <div className="w-12 h-14 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                          {st.photoUrl ? (
                            <img
                              src={st.photoUrl}
                              alt={st.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (st.firstName || 'S').charAt(0)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {st.firstName} {st.lastName}
                          </h4>
                          {st.bengaliName && (
                            <p className="text-[11px] text-slate-500 font-serif truncate">
                              {st.bengaliName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            <span>Roll: <strong>{st.rollNumber}</strong></span>
                            {st.bloodGroup && (
                              <span className="text-red-600 font-bold flex items-center gap-0.5">
                                <Droplet className="w-2.5 h-2.5 fill-current" />
                                {st.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setPreviewCard(card);
                          setPreviewSideBack(false);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setBatchPrintCards([card]);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Print Single Card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. FACULTY & STAFF ID CARDS SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-4">
          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={selectAllFilteredTeachers}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {selectedTeacherIds.size > 0 && selectedTeacherIds.size === filteredTeachers.length ? (
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>
                  {selectedTeacherIds.size > 0
                    ? `Selected (${selectedTeacherIds.size})`
                    : 'Select All'}
                </span>
              </button>

              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search faculty by name, ID, or designation..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedEmployeeType}
                onChange={(e) => setSelectedEmployeeType(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="all">All Personnel</option>
                <option value="teacher">Teachers / Faculty</option>
                <option value="staff">Staff Members</option>
              </select>

              <button
                onClick={handleBatchPrintTeachers}
                disabled={filteredTeachers.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  Print A4 Batch Sheet ({selectedTeacherIds.size > 0 ? selectedTeacherIds.size : filteredTeachers.length})
                </span>
              </button>
            </div>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No faculty or staff found
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Faculty members registered in Phase 4 (Teachers) will appear here for ID card issuance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTeachers.map((tc) => {
                const isSelected = selectedTeacherIds.has(tc.id);
                const card = mapTeacherToCard(tc);

                return (
                  <div
                    key={tc.id}
                    className={`bg-white dark:bg-slate-850 rounded-xl border transition-all p-3 flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-500/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => toggleTeacherSelection(tc.id)}
                          className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-purple-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-mono font-bold text-[10px] text-slate-900 dark:text-white">
                            {tc.teacherId}
                          </span>
                        </button>

                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {tc.employeeType === 'teacher' ? 'Faculty' : 'Staff'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 py-3">
                        <div className="w-12 h-14 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                          {tc.photoUrl ? (
                            <img
                              src={tc.photoUrl}
                              alt={tc.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (tc.firstName || 'T').charAt(0)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tc.firstName} {tc.lastName}
                          </h4>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
                            {tc.designation || 'Teacher'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                            {tc.indexNumber && (
                              <span className="font-mono">MPO: {tc.indexNumber}</span>
                            )}
                            {tc.bloodGroup && (
                              <span className="text-red-600 font-bold flex items-center gap-0.5">
                                <Droplet className="w-2.5 h-2.5 fill-current" />
                                {tc.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setPreviewCard(card);
                          setPreviewSideBack(false);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Card</span>
                      </button>

                      <button
                        onClick={() => {
                          setBatchPrintCards([card]);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Print Card"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TEMPLATE & DESIGNER SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'designer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>ID Card Layout & Visual Style</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize colors, orientation, and card features for the institution's ID cards.
              </p>
            </div>

            {/* Theme Colors */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Color Theme / রঙের থিম
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'classic_blue', name: 'Classic Blue', bn: 'ক্লাসিক ব্লু', color: 'bg-blue-800' },
                  { id: 'emerald_green', name: 'Emerald Green', bn: 'পান্না সবুজ', color: 'bg-emerald-800' },
                  { id: 'royal_maroon', name: 'Royal Maroon', bn: 'রাজকীয় মেরুন', color: 'bg-rose-900' },
                  { id: 'modern_slate', name: 'Modern Slate', bn: 'মডার্ন স্লেট', color: 'bg-slate-900' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id as IdCardTheme)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      theme === th.id
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${th.color} shrink-0 shadow-xs`} />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {th.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-serif">{th.bn}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Card Orientation / বিন্যাস
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    orientation === 'portrait'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 font-bold text-purple-900 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">Portrait (লম্বালম্বি)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">CR80 Standard (54mm × 86mm)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    orientation === 'landscape'
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 font-bold text-purple-900 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">Landscape (আড়াআড়ি)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Horizontal Badge (86mm × 54mm)</div>
                </button>
              </div>
            </div>

            {/* Custom Design Template Upload Section */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {language === 'bn' ? 'কাস্টম ডিজাইন টেমপ্লেট' : 'Custom Design Template'}
                </label>
                {(customFrontBg || customBackBg) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFrontBg('');
                      setCustomBackBg('');
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={frontBgInputRef}
                  onChange={handleFrontBgUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => frontBgInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                    customFrontBg
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{customFrontBg ? 'Front Design Uploaded ✓' : 'Upload Front Template'}</span>
                </button>

                <input
                  type="file"
                  ref={backBgInputRef}
                  onChange={handleBackBgUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => backBgInputRef.current?.click()}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                    customBackBg
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{customBackBg ? 'Back Design Uploaded ✓' : 'Upload Back Template'}</span>
                </button>
              </div>
            </div>

            {/* Custom Card Title Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === 'bn' ? 'কার্ডের শিরোনাম / টাইটেল' : 'Card Title Text'}
              </label>
              <input
                type="text"
                value={cardTitleText}
                onChange={(e) => setCardTitleText(e.target.value)}
                placeholder="STUDENT IDENTITY CARD"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {language === 'bn' ? 'আইডি কার্ডের উপাদান ও তথ্য নির্বাচন' : 'Card Information Toggles'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 dark:text-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Institute Logo (লোগো)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Institute Header (নাম/EIIN)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBengaliName}
                    onChange={(e) => setShowBengaliName(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Bengali Name (বাংলা নাম)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBloodGroup}
                    onChange={(e) => setShowBloodGroup(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Blood Group (রক্তের গ্রুপ)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showPhone}
                    onChange={(e) => setShowPhone(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Phone Number (ফোন নম্বর)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showValidUntil}
                    onChange={(e) => setShowValidUntil(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Expiry Date (মেয়াদকাল)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>QR Code (ডিজিটাল কিউআর)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBarcode}
                    onChange={(e) => setShowBarcode(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Barcode (বারকোড)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSignature}
                    onChange={(e) => setShowSignature(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Principal Signature (স্বাক্ষর)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Watermark Logo (ওয়াটারমার্ক)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Interactive Live Card Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between w-full max-w-sm mb-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Live Card Mockup ({designerShowBack ? 'Back Side' : 'Front Side'})
              </span>
              <button
                type="button"
                onClick={() => setDesignerShowBack(!designerShowBack)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip Side ({designerShowBack ? 'View Front' : 'View Back'})</span>
              </button>
            </div>

            {/* The Actual Rendered Card */}
            <div className="p-4 bg-white/50 dark:bg-slate-800/40 rounded-2xl backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 shadow-xl">
              <SingleIdCardView
                card={sampleCardForDesigner}
                institute={activeInstitute}
                orientation={orientation}
                theme={theme}
                showBack={designerShowBack}
                config={activeCustomConfig}
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ISSUED REGISTRY SUB-TAB */}
      {/* ======================================================== */}
      {activeSubTab === 'registry' && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Authorized Issued Cards Registry
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tracking numbers, valid dates, and digital QR signatures for campus access & security
              </p>
            </div>
            <button
              onClick={() => {
                const sampleCards = SAMPLE_ISSUED_ID_CARDS.map((c) => ({
                  id: c.id,
                  type: c.cardType,
                  name: c.fullName,
                  bengaliName: c.bengaliName,
                  roleOrClass: c.roleOrClass,
                  rollOrIndex: c.rollOrIndex,
                  idNumber: c.idNumber,
                  bloodGroup: c.bloodGroup,
                  phone: c.emergencyPhone,
                  validUntil: c.validUntil,
                  qrPayload: c.qrCodeData,
                  barcodePayload: c.barcodeData,
                }));
                setBatchPrintCards(sampleCards);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sample Batch</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Card Serial</th>
                  <th className="px-4 py-3">Person Name</th>
                  <th className="px-4 py-3">Type / Category</th>
                  <th className="px-4 py-3">Class / Role</th>
                  <th className="px-4 py-3">Blood Group</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {SAMPLE_ISSUED_ID_CARDS.map((card) => (
                  <tr
                    key={card.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      {card.idNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {card.fullName}
                      {card.bengaliName && (
                        <span className="text-slate-500 font-serif ml-1">
                          ({card.bengaliName})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize font-medium text-slate-600 dark:text-slate-400">
                      {card.cardType}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {card.roleOrClass}
                    </td>
                    <td className="px-4 py-3">
                      {card.bloodGroup && (
                        <span className="text-red-600 font-bold flex items-center gap-0.5">
                          <Droplet className="w-3 h-3 fill-current" />
                          {card.bloodGroup}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {card.validUntil}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setPreviewCard({
                            id: card.id,
                            type: card.cardType,
                            name: card.fullName,
                            bengaliName: card.bengaliName,
                            roleOrClass: card.roleOrClass,
                            rollOrIndex: card.rollOrIndex,
                            idNumber: card.idNumber,
                            bloodGroup: card.bloodGroup,
                            phone: card.emergencyPhone,
                            validUntil: card.validUntil,
                            qrPayload: card.qrCodeData,
                            barcodePayload: card.barcodeData,
                          });
                          setPreviewSideBack(false);
                        }}
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 transition-colors cursor-pointer"
                        title="View Card"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SINGLE CARD PREVIEW MODAL */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center space-y-4 max-w-md w-full">
            <div className="flex items-center justify-between w-full">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ID Card Preview ({previewSideBack ? 'Back' : 'Front'})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewSideBack(!previewSideBack)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Flip</span>
                </button>
                <button
                  onClick={() => setPreviewCard(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <SingleIdCardView
                card={previewCard}
                institute={activeInstitute}
                orientation={orientation}
                theme={theme}
                showBack={previewSideBack}
                config={activeCustomConfig}
              />
            </div>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => {
                  const toPrint = [previewCard];
                  setPreviewCard(null);
                  setBatchPrintCards(toPrint);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print This Card</span>
              </button>
              <button
                onClick={() => setPreviewCard(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH PRINT SHEET MODAL */}
      {batchPrintCards && (
        <BatchIdCardPrintModal
          cards={batchPrintCards}
          institute={activeInstitute}
          defaultOrientation={orientation}
          defaultTheme={theme}
          config={activeCustomConfig}
          onClose={() => setBatchPrintCards(null)}
        />
      )}
    </div>
  );
};
