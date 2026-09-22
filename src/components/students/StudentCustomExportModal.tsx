import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Users,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  Student,
  AcademicClass,
  AcademicSection,
  AcademicGroup,
  Institute,
  AcademicYear,
} from '../../types';
import { exportToExcel, printOrSavePdf, PaperSize, PageOrientation } from '../../utils/exportUtils';
import { useApp } from '../../context/AppContext';

export interface StudentCustomExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  classes: AcademicClass[];
  sections: AcademicSection[];
  groups: AcademicGroup[];
  currentlyFilteredStudents?: Student[];
}

interface ExportFieldDef {
  key: string;
  labelEn: string;
  labelBn: string;
  category: 'basic' | 'academic' | 'guardian' | 'address';
  getValue: (s: Student, ctx: { classes: AcademicClass[]; sections: AcademicSection[]; groups: AcademicGroup[] }) => string | number;
}

const AVAILABLE_FIELDS: ExportFieldDef[] = [
  // Basic
  {
    key: 'rollNumber',
    labelEn: 'Roll Number',
    labelBn: 'রোল নম্বর',
    category: 'basic',
    getValue: (s) => s.rollNumber,
  },
  {
    key: 'studentId',
    labelEn: 'Student ID',
    labelBn: 'শিক্ষার্থী আইডি',
    category: 'basic',
    getValue: (s) => s.studentId,
  },
  {
    key: 'fullName',
    labelEn: 'Full Name (English)',
    labelBn: 'নাম (ইংরেজি)',
    category: 'basic',
    getValue: (s) => `${s.firstName} ${s.lastName}`.trim(),
  },
  {
    key: 'bengaliName',
    labelEn: 'Bengali Name',
    labelBn: 'নাম (বাংলা)',
    category: 'basic',
    getValue: (s) => s.bengaliName || '',
  },
  {
    key: 'gender',
    labelEn: 'Gender',
    labelBn: 'লিঙ্গ',
    category: 'basic',
    getValue: (s) => (s.gender === 'male' ? 'Male' : s.gender === 'female' ? 'Female' : 'Other'),
  },
  {
    key: 'dateOfBirth',
    labelEn: 'Date of Birth',
    labelBn: 'জন্ম তারিখ',
    category: 'basic',
    getValue: (s) => s.dateOfBirth || '',
  },
  {
    key: 'bloodGroup',
    labelEn: 'Blood Group',
    labelBn: 'রক্তের গ্রুপ',
    category: 'basic',
    getValue: (s) => s.bloodGroup || '',
  },
  {
    key: 'religion',
    labelEn: 'Religion',
    labelBn: 'ধর্ম',
    category: 'basic',
    getValue: (s) => s.religion || '',
  },

  // Academic
  {
    key: 'className',
    labelEn: 'Class',
    labelBn: 'শ্রেণি',
    category: 'academic',
    getValue: (s, ctx) => ctx.classes.find((c) => c.id === s.classId)?.name || s.classId,
  },
  {
    key: 'sectionName',
    labelEn: 'Section',
    labelBn: 'শাখা',
    category: 'academic',
    getValue: (s, ctx) => ctx.sections.find((sec) => sec.id === s.sectionId)?.name || s.sectionId,
  },
  {
    key: 'groupName',
    labelEn: 'Group / Department',
    labelBn: 'বিভাগ / গ্রুপ',
    category: 'academic',
    getValue: (s, ctx) => (s.groupId ? ctx.groups.find((g) => g.id === s.groupId)?.name || s.groupId : '-'),
  },
  {
    key: 'shift',
    labelEn: 'Shift',
    labelBn: 'শিফট',
    category: 'academic',
    getValue: (s) => s.shift || 'Morning',
  },
  {
    key: 'admissionDate',
    labelEn: 'Admission Date',
    labelBn: 'ভর্তির তারিখ',
    category: 'academic',
    getValue: (s) => s.admissionDate || '',
  },
  {
    key: 'status',
    labelEn: 'Enrollment Status',
    labelBn: 'অবস্থা',
    category: 'academic',
    getValue: (s) => s.status.toUpperCase(),
  },

  // Guardian
  {
    key: 'fatherName',
    labelEn: "Father's Name",
    labelBn: 'পিতার নাম',
    category: 'guardian',
    getValue: (s) => s.guardian?.fatherName || '',
  },
  {
    key: 'fatherPhone',
    labelEn: "Father's Mobile",
    labelBn: 'পিতার মোবাইল',
    category: 'guardian',
    getValue: (s) => s.guardian?.fatherPhone || '',
  },
  {
    key: 'fatherOccupation',
    labelEn: "Father's Occupation",
    labelBn: 'পিতার পেশা',
    category: 'guardian',
    getValue: (s) => s.guardian?.fatherOccupation || '',
  },
  {
    key: 'motherName',
    labelEn: "Mother's Name",
    labelBn: 'মাতার নাম',
    category: 'guardian',
    getValue: (s) => s.guardian?.motherName || '',
  },
  {
    key: 'motherPhone',
    labelEn: "Mother's Mobile",
    labelBn: 'মাতার মোবাইল',
    category: 'guardian',
    getValue: (s) => s.guardian?.motherPhone || '',
  },
  {
    key: 'emergencyContact',
    labelEn: 'Emergency Contact & Phone',
    labelBn: 'জরুরি যোগাযোগ',
    category: 'guardian',
    getValue: (s) =>
      s.guardian?.emergencyContactPhone
        ? `${s.guardian.emergencyContactName} (${s.guardian.emergencyContactPhone})`
        : '',
  },

  // Address
  {
    key: 'presentAddress',
    labelEn: 'Present Address',
    labelBn: 'বর্তমান ঠিকানা',
    category: 'address',
    getValue: (s) => s.address?.presentAddress || '',
  },
  {
    key: 'permanentAddress',
    labelEn: 'Permanent Address',
    labelBn: 'স্থায়ী ঠিকানা',
    category: 'address',
    getValue: (s) => s.address?.permanentAddress || '',
  },
  {
    key: 'district',
    labelEn: 'District',
    labelBn: 'জেলা',
    category: 'address',
    getValue: (s) => s.address?.district || '',
  },
  {
    key: 'upazila',
    labelEn: 'Upazila / Thana',
    labelBn: 'উপজেলা / থানা',
    category: 'address',
    getValue: (s) => s.address?.upazila || '',
  },
];

export const StudentCustomExportModal: React.FC<StudentCustomExportModalProps> = ({
  isOpen,
  onClose,
  students,
  classes,
  sections,
  groups,
  currentlyFilteredStudents,
}) => {
  const { activeInstitute, activeAcademicYear, language } = useApp();

  // Scope State
  const [scope, setScope] = useState<'all' | 'class' | 'section' | 'filtered'>(
    currentlyFilteredStudents && currentlyFilteredStudents.length !== students.length
      ? 'filtered'
      : 'all'
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

  // Selected Field Keys (Defaults to core fields)
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<string[]>([
    'rollNumber',
    'studentId',
    'fullName',
    'bengaliName',
    'gender',
    'className',
    'sectionName',
    'fatherName',
    'fatherPhone',
  ]);

  // Output format & Paper Setup (A4 vs Legal)
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [customTitle, setCustomTitle] = useState('Student Roster & Information Report');

  // Filter students based on chosen scope
  const targetStudents = useMemo(() => {
    if (scope === 'filtered' && currentlyFilteredStudents) {
      return currentlyFilteredStudents;
    }
    if (scope === 'all') {
      return students;
    }
    if (scope === 'class') {
      return students.filter((s) => s.classId === selectedClassId);
    }
    if (scope === 'section') {
      return students.filter(
        (s) =>
          s.classId === selectedClassId &&
          (selectedSectionId === 'all' || s.sectionId === selectedSectionId)
      );
    }
    return students;
  }, [scope, currentlyFilteredStudents, students, selectedClassId, selectedSectionId]);

  if (!isOpen) return null;

  // Toggle single field
  const toggleField = (key: string) => {
    setSelectedFieldKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Presets
  const applyPreset = (preset: 'all' | 'attendance' | 'guardian' | 'biodata' | 'clear') => {
    if (preset === 'all') {
      setSelectedFieldKeys(AVAILABLE_FIELDS.map((f) => f.key));
    } else if (preset === 'attendance') {
      setSelectedFieldKeys(['rollNumber', 'studentId', 'fullName', 'bengaliName', 'className', 'sectionName', 'gender']);
    } else if (preset === 'guardian') {
      setSelectedFieldKeys([
        'rollNumber',
        'fullName',
        'className',
        'sectionName',
        'fatherName',
        'fatherPhone',
        'motherName',
        'motherPhone',
        'emergencyContact',
        'presentAddress',
      ]);
    } else if (preset === 'biodata') {
      setSelectedFieldKeys([
        'rollNumber',
        'studentId',
        'fullName',
        'bengaliName',
        'gender',
        'dateOfBirth',
        'bloodGroup',
        'religion',
        'className',
        'sectionName',
        'groupName',
        'fatherName',
        'fatherPhone',
        'motherName',
        'presentAddress',
        'permanentAddress',
      ]);
    } else if (preset === 'clear') {
      setSelectedFieldKeys([]);
    }
  };

  const handleExecuteExport = () => {
    if (selectedFieldKeys.length === 0) {
      alert('Please select at least one field to export.');
      return;
    }

    const selectedDefs = AVAILABLE_FIELDS.filter((f) => selectedFieldKeys.includes(f.key));
    const headers = selectedDefs.map((f) => (language === 'bn' ? `${f.labelBn} (${f.labelEn})` : f.labelEn));

    const rows = targetStudents.map((s) => {
      return selectedDefs.map((def) => def.getValue(s, { classes, sections, groups }));
    });

    const targetClassName =
      scope === 'class' || scope === 'section'
        ? classes.find((c) => c.id === selectedClassId)?.name || 'Class'
        : 'All_Classes';

    if (exportFormat === 'excel') {
      const filename = `students_export_${targetClassName}_${activeAcademicYear?.yearName || '2026'}`;
      exportToExcel(filename, headers, rows);
    } else {
      printOrSavePdf({
        title: customTitle,
        subtitle: `${targetClassName} • Total Students: ${targetStudents.length}`,
        instituteName: activeInstitute?.name || 'School & College Management System',
        instituteEiin: activeInstitute?.eiin,
        headers,
        rows,
        paperSize,
        orientation,
        metaDetails: [
          { label: 'Scope', value: scope.toUpperCase() },
          { label: 'Academic Session', value: activeAcademicYear?.yearName || '2025-26' },
        ],
      });
    }

    onClose();
  };

  const categories = [
    { key: 'basic', titleEn: 'Basic Information', titleBn: 'মৌলিক তথ্য' },
    { key: 'academic', titleEn: 'Academic Placement', titleBn: 'শিক্ষাবর্ষ ও শ্রেণি' },
    { key: 'guardian', titleEn: 'Guardian & Family', titleBn: 'অভিভাবক ও পরিবার' },
    { key: 'address', titleEn: 'Address Details', titleBn: 'ঠিকানা বিবরণ' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Custom Student Information Export
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose custom fields, filters, and export as Excel or PDF (A4/Legal)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Scope Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Step 1: Choose Export Scope (শিক্ষার্থী ফিল্টার বা পরিধি)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-2 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Entire Institution ({students.length})
              </button>

              <button
                type="button"
                onClick={() => setScope('class')}
                className={`px-3 py-2 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                  scope === 'class'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                By Specific Class
              </button>

              <button
                type="button"
                onClick={() => setScope('section')}
                className={`px-3 py-2 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                  scope === 'section'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                By Class &amp; Section
              </button>

              {currentlyFilteredStudents && (
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`px-3 py-2 rounded-lg border font-semibold text-center transition-all cursor-pointer ${
                    scope === 'filtered'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Current Filter ({currentlyFilteredStudents.length})
                </button>
              )}
            </div>

            {/* Sub dropdowns for class/section */}
            {(scope === 'class' || scope === 'section') && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Class:</span>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.bengaliName})
                      </option>
                    ))}
                  </select>
                </div>

                {scope === 'section' && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Section:</span>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="all">All Sections</option>
                      {sections
                        .filter((sec) => sec.classId === selectedClassId)
                        .map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="text-slate-500 font-medium ml-auto">
                  Matched Students: <span className="font-bold text-blue-600">{targetStudents.length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Field Selection */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span>Step 2: Select Columns to Include ({selectedFieldKeys.length} selected)</span>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('attendance')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Attendance Sheet
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('guardian')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Guardian Directory
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('biodata')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Bio-Data List
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('clear')}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Categorized Checkbox Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const catFields = AVAILABLE_FIELDS.filter((f) => f.category === cat.key);
                return (
                  <div
                    key={cat.key}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2"
                  >
                    <div className="font-bold text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span>{language === 'bn' ? cat.titleBn : cat.titleEn}</span>
                      <span className="text-[10px] text-slate-400">
                        {catFields.filter((f) => selectedFieldKeys.includes(f.key)).length}/
                        {catFields.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {catFields.map((field) => {
                        const isChecked = selectedFieldKeys.includes(field.key);
                        return (
                          <label
                            key={field.key}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleField(field.key)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{field.labelEn}</span>
                            <span className="text-[10px] text-slate-400 ml-auto">{field.labelBn}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Format & PDF Page Setup (A4 vs Legal) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500" />
              <span>Step 3: Export Format &amp; Page Setup (A4 / Legal)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Format selection */}
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Format (২ ধরনের এক্সপোর্ট):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                      exportFormat === 'excel'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>1. Excel (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                      exportFormat === 'pdf'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>2. PDF Document</span>
                  </button>
                </div>
              </div>

              {/* Page setup for PDF */}
              {exportFormat === 'pdf' ? (
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Page Size (কাগজের সাইজ):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaperSize('A4')}
                      className={`px-3 py-2 rounded-lg border font-bold cursor-pointer transition-all ${
                        paperSize === 'A4'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      A4 (210×297 mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperSize('Legal')}
                      className={`px-3 py-2 rounded-lg border font-bold cursor-pointer transition-all ${
                        paperSize === 'Legal'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Legal (8.5×14 in)
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Excel Compatibility:
                  </label>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Pre-configured with UTF-8 BOM encoding so Bengali and English characters display cleanly in Microsoft Excel.
                  </div>
                </div>
              )}
            </div>

            {exportFormat === 'pdf' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Page Orientation:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                        orientation === 'portrait'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                      }`}
                    >
                      Portrait (লম্বালম্বি)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                        orientation === 'landscape'
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700'
                      }`}
                    >
                      Landscape (আড়াআড়ি)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Document Title:
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Exporting <span className="font-bold text-blue-600">{targetStudents.length}</span> students with{' '}
            <span className="font-bold text-blue-600">{selectedFieldKeys.length}</span> fields.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                exportFormat === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {exportFormat === 'excel' ? (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Excel File</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF ({paperSize})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
