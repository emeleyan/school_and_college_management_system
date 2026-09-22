import React, { useState, useMemo } from 'react';
import {
  Student,
  AcademicClass,
  AcademicSection,
  AcademicGroup,
  Institute,
  AcademicYear,
  Gender,
  StudentStatus,
} from '../../types';
import { remove, update } from '../../db/indexedDB';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  TrendingUp,
  UserCheck,
  Users,
  LayoutGrid,
  List,
  Sparkles,
  RefreshCw,
  Phone,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { StudentProfileModal } from './StudentProfileModal';
import { StudentIdCardSlipModal } from './StudentIdCardSlipModal';
import { StudentPromotionModal } from './StudentPromotionModal';
import { StudentCustomExportModal } from './StudentCustomExportModal';
import { seedSampleStudents } from '../../db/seedStudentData';

interface StudentRosterViewProps {
  students: Student[];
  classes: AcademicClass[];
  sections: AcademicSection[];
  groups: AcademicGroup[];
  onAddNew: () => void;
  onEditStudent: (student: Student) => void;
  onRefresh: () => Promise<void>;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  students,
  classes,
  sections,
  groups,
  onAddNew,
  onEditStudent,
  onRefresh,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, language, t, hasPermission } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [viewingProfileStudent, setViewingProfileStudent] = useState<Student | null>(null);
  const [viewingIdSlipStudent, setViewingIdSlipStudent] = useState<Student | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showCustomExportModal, setShowCustomExportModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Available sections for chosen class
  const classSections = useMemo(() => {
    if (selectedClassId === 'all') return sections;
    return sections.filter((s) => s.classId === selectedClassId);
  }, [selectedClassId, sections]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
      // Section filter
      if (selectedSectionId !== 'all' && s.sectionId !== selectedSectionId) return false;
      // Status filter
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      // Gender filter
      if (selectedGender !== 'all' && s.gender !== selectedGender) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const fullName = `${s.firstName || ''} ${s.lastName || ''} ${(s as any).name || ''}`.trim().toLowerCase();
        const bn = (s.bengaliName || '').toLowerCase();
        const stdId = (s.studentId || '').toLowerCase();
        const roll = String(s.rollNumber || '');
        const father = (s.guardian?.fatherName || (s as any).fatherName || '').toLowerCase();
        const fatherBn = (s.guardian?.fatherNameBn || (s as any).fatherNameBn || '').toLowerCase();
        const mother = (s.guardian?.motherName || (s as any).motherName || '').toLowerCase();
        const motherBn = (s.guardian?.motherNameBn || (s as any).motherNameBn || '').toLowerCase();
        const phone = s.guardian?.fatherPhone || s.phone || s.guardian?.emergencyContactPhone || '';
        const match =
          fullName.includes(q) ||
          bn.includes(q) ||
          stdId.includes(q) ||
          roll.includes(q) ||
          father.includes(q) ||
          fatherBn.includes(q) ||
          mother.includes(q) ||
          motherBn.includes(q) ||
          phone.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [students, selectedClassId, selectedSectionId, selectedStatus, selectedGender, searchTerm]);

  // Stats calculation
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === 'active').length;
  const maleCount = students.filter((s) => s.gender === 'male' && s.status === 'active').length;
  const femaleCount = students.filter((s) => s.gender === 'female' && s.status === 'active').length;

  const handleDelete = async (student: Student) => {
    const confirm = window.confirm(
      `Are you sure you want to delete the student record for "${student.firstName} ${student.lastName}" (Roll: ${student.rollNumber})?`
    );
    if (!confirm) return;

    try {
      await remove('students', student.id);
      await logAudit(
        'DELETE_STUDENT',
        'students',
        `Deleted student record: ${student.firstName} ${student.lastName} (ID: ${student.studentId})`,
        student.id
      );
      setStatusMsg({
        type: 'success',
        text: `Student "${student.firstName} ${student.lastName}" deleted successfully.`,
      });
      await onRefresh();
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to delete student.' });
    }
  };

  const handleQuickSeed = async () => {
    if (!activeInstitute) return;
    if (!classes.length || !sections.length) {
      alert('Please create or seed Classes and Sections in Phase 2 before seeding students.');
      return;
    }

    const confirm = window.confirm(
      `Generate sample student roster for ${activeInstitute.name}? This will populate 15+ student records across current classes.`
    );
    if (!confirm) return;

    setIsSeeding(true);
    try {
      const result = await seedSampleStudents(activeInstitute, classes, sections, activeAcademicYear);
      await logAudit(
        'SEED_STUDENTS',
        'students',
        `Auto-seeded ${result.count} sample students into ${activeInstitute.name}`,
        undefined
      );
      setStatusMsg({
        type: 'success',
        text: `Successfully created ${result.count} sample students with Bengali/English bio-data!`,
      });
      await onRefresh();
    } catch (err: any) {
      console.error('Error seeding students:', err);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to seed sample students.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleExportCSV = () => {
    if (!filteredStudents.length) {
      alert('No student records to export.');
      return;
    }

    const headers = [
      'Student ID',
      'Roll',
      'First Name',
      'Last Name',
      'Bengali Name',
      'Class',
      'Section',
      'Gender',
      'Blood Group',
      'Father Name (EN)',
      'Father Name (BN)',
      'Mother Name (EN)',
      'Mother Name (BN)',
      'Emergency Phone',
      'Status',
    ];

    const rows = filteredStudents.map((s) => {
      const clsName = classes.find((c) => c.id === s.classId)?.name || '';
      const secName = sections.find((sec) => sec.id === s.sectionId)?.name || '';
      const fatherEn = s.guardian?.fatherName || (s as any).fatherName || '';
      const fatherBn = s.guardian?.fatherNameBn || (s as any).fatherNameBn || '';
      const motherEn = s.guardian?.motherName || (s as any).motherName || '';
      const motherBn = s.guardian?.motherNameBn || (s as any).motherNameBn || '';
      const phone = s.guardian?.emergencyContactPhone || s.phone || s.guardian?.fatherPhone || '';
      return [
        `"${s.studentId}"`,
        s.rollNumber,
        `"${s.firstName || ''}"`,
        `"${s.lastName || ''}"`,
        `"${s.bengaliName || ''}"`,
        `"${clsName}"`,
        `"${secName}"`,
        s.gender,
        s.bloodGroup || '',
        `"${fatherEn}"`,
        `"${fatherBn}"`,
        `"${motherEn}"`,
        `"${motherBn}"`,
        `"${phone}"`,
        s.status,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Student_Directory_${activeInstitute?.name || 'ERP'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all classes</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Active Students</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Regular academic status</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Male Students</span>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
              {activeCount ? Math.round((maleCount / activeCount) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {maleCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Boys enrolled</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Female Students</span>
            <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400">
              {activeCount ? Math.round((femaleCount / activeCount) * 100) : 0}%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {femaleCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Girls enrolled</div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters & Action Buttons */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, student ID, guardian phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {students.length === 0 && hasPermission('students', 'add') && (
              <button
                onClick={handleQuickSeed}
                disabled={isSeeding}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Populate 15+ demo student profiles"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'Seeding...' : 'Seed Sample Students'}</span>
              </button>
            )}

            {hasPermission('students', 'edit') && (
              <button
                onClick={() => setShowPromotionModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>Promote / Transfer</span>
              </button>
            )}

            {hasPermission('students', 'export') && (
              <button
                onClick={() => setShowCustomExportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                title="Choose custom fields, filters, and export to Excel or PDF (A4/Legal)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Custom Export (Excel / PDF)</span>
              </button>
            )}

            {hasPermission('students', 'export') && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Quick CSV</span>
              </button>
            )}

            {hasPermission('students', 'print') && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}

            {hasPermission('students', 'add') && (
              <button
                onClick={onAddNew}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Admission</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns & View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('all');
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Section:</span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Sections</option>
                {classSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active (নিয়মিত)</option>
                <option value="graduated">Graduated</option>
                <option value="transferred">Transferred</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Gender:</span>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                <option value="all">All Genders</option>
                <option value="male">Male (ছাত্র)</option>
                <option value="female">Female (ছাত্রী)</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Directory Content */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Student Records Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || selectedClassId !== 'all'
                ? 'No students matched your search criteria or class filters.'
                : 'Your student roster is currently empty. You can register a student or load realistic sample students to get started.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleQuickSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Sample Students</span>
            </button>
            <button
              onClick={onAddNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Admit First Student</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Data Table View */
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-center w-14">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">ID &amp; Class</th>
                  <th className="px-4 py-3">Gender / Blood</th>
                  <th className="px-4 py-3">Guardian Contact</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredStudents.map((std) => {
                  const studentClass = classes.find((c) => c.id === std.classId);
                  const studentSec = sections.find((s) => s.id === std.sectionId);
                  const fullName = (std.firstName || std.lastName)
                    ? `${std.firstName || ''} ${std.lastName || ''}`.trim()
                    : ((std as any).name || 'Student');
                  const bnName = std.bengaliName || (std as any).nameBn || '';
                  const initial = (std.firstName || bnName || 'S').charAt(0);
                  const fatherNameEn = std.guardian?.fatherName || (std as any).fatherName || '';
                  const fatherNameBn = std.guardian?.fatherNameBn || (std as any).fatherNameBn || '';
                  const motherNameEn = std.guardian?.motherName || (std as any).motherName || '';
                  const motherNameBn = std.guardian?.motherNameBn || (std as any).motherNameBn || '';
                  const contactPhone = std.guardian?.emergencyContactPhone || std.guardian?.fatherPhone || std.phone || '';

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      {/* Roll */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {std.rollNumber}
                      </td>

                      {/* Name & Bengali */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center">
                            {std.photoUrl ? (
                              <img
                                src={std.photoUrl}
                                alt={fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-blue-600 dark:text-blue-300 text-xs">
                                {initial}
                              </span>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() => setViewingProfileStudent(std)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer"
                            >
                              {fullName}
                            </button>
                            {bnName && (
                              <div className="text-[11px] text-slate-500 font-medium">
                                {bnName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID & Class */}
                      <td className="px-4 py-3">
                        <div className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                          {std.studentId}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 font-medium">
                          {studentClass?.name || 'Class N/A'} • {studentSec?.name || 'Sec N/A'}
                        </div>
                      </td>

                      {/* Gender & Blood */}
                      <td className="px-4 py-3">
                        <div className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                          {std.gender}
                        </div>
                        {std.bloodGroup && (
                          <span className="inline-block px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-sm font-bold text-[10px] mt-0.5">
                            {std.bloodGroup}
                          </span>
                        )}
                      </td>

                      {/* Guardian (Father & Mother) */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200 font-medium text-xs">
                          <span className="text-slate-400 text-[10px] block">FATHER / পিতা:</span>
                          <span>{fatherNameEn || 'N/A'}</span>
                          {fatherNameBn && (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1">
                              ({fatherNameBn})
                            </span>
                          )}
                        </div>
                        {(motherNameEn || motherNameBn) && (
                          <div className="text-slate-700 dark:text-slate-300 text-[11px] mt-0.5">
                            <span className="text-slate-400 text-[10px] block">MOTHER / মাতা:</span>
                            <span>{motherNameEn || 'N/A'}</span>
                            {motherNameBn && (
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1">
                                ({motherNameBn})
                              </span>
                            )}
                          </div>
                        )}
                        {contactPhone && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{contactPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            std.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {std.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingProfileStudent(std)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors cursor-pointer"
                            title="View Bio-Data Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingIdSlipStudent(std)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors cursor-pointer"
                            title="Print ID Card Slip"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          {hasPermission('students', 'edit') && (
                            <button
                              onClick={() => onEditStudent(std)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md transition-colors cursor-pointer"
                              title="Edit Student Info"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('students', 'delete') && (
                            <button
                              onClick={() => handleDelete(std)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer"
                              title="Delete Student"
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
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((std) => {
            const studentClass = classes.find((c) => c.id === std.classId);
            const studentSec = sections.find((s) => s.id === std.sectionId);
            const fullName = (std.firstName || std.lastName)
              ? `${std.firstName || ''} ${std.lastName || ''}`.trim()
              : ((std as any).name || 'Student');
            const bnName = std.bengaliName || (std as any).nameBn || '';
            const initial1 = (std.firstName || bnName || 'S').charAt(0);
            const initial2 = (std.lastName || '').charAt(0);
            const fatherNameEn = std.guardian?.fatherName || (std as any).fatherName || '';
            const fatherNameBn = std.guardian?.fatherNameBn || (std as any).fatherNameBn || '';
            const motherNameEn = std.guardian?.motherName || (std as any).motherName || '';
            const motherNameBn = std.guardian?.motherNameBn || (std as any).motherNameBn || '';
            const contactPhone = std.guardian?.emergencyContactPhone || std.guardian?.fatherPhone || std.phone || '';

            return (
              <div
                key={std.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shadow-xs shrink-0 border border-slate-200 dark:border-slate-700 bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {std.photoUrl ? (
                        <img
                          src={std.photoUrl}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {initial1}
                          {initial2}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {fullName}
                      </h4>
                      {bnName && (
                        <div className="text-xs text-slate-500 font-medium">
                          {bnName}
                        </div>
                      )}
                      <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                        {std.studentId}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      std.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {std.status}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Class &amp; Section:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {studentClass?.name || 'Class'} • {studentSec?.name || 'Section'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Roll Number:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      #{std.rollNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400">Father / পিতা:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                      {fatherNameEn || 'N/A'}
                      {fatherNameBn && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ({fatherNameBn})
                        </span>
                      )}
                    </span>
                  </div>
                  {(motherNameEn || motherNameBn) && (
                    <div className="flex justify-between items-start">
                      <span className="text-slate-400">Mother / মাতা:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                        {motherNameEn || 'N/A'}
                        {motherNameBn && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            ({motherNameBn})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {contactPhone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 capitalize">
                    {std.gender} {std.bloodGroup ? `• ${std.bloodGroup}` : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingProfileStudent(std)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
                      title="Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewingIdSlipStudent(std)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                      title="ID Slip"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    {hasPermission('students', 'edit') && (
                      <button
                        onClick={() => onEditStudent(std)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission('students', 'delete') && (
                      <button
                        onClick={() => handleDelete(std)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {viewingProfileStudent && (
        <StudentProfileModal
          student={viewingProfileStudent}
          classes={classes}
          sections={sections}
          institute={activeInstitute}
          onClose={() => setViewingProfileStudent(null)}
          onEdit={(s) => {
            setViewingProfileStudent(null);
            onEditStudent(s);
          }}
        />
      )}

      {viewingIdSlipStudent && (
        <StudentIdCardSlipModal
          student={viewingIdSlipStudent}
          classes={classes}
          sections={sections}
          institute={activeInstitute}
          onClose={() => setViewingIdSlipStudent(null)}
        />
      )}

      {showPromotionModal && (
        <StudentPromotionModal
          students={students}
          classes={classes}
          sections={sections}
          academicYears={[]}
          onClose={() => setShowPromotionModal(false)}
          onSuccess={async () => {
            setShowPromotionModal(false);
            setStatusMsg({
              type: 'success',
              text: 'Student batch promotion / section transfer completed successfully.',
            });
            await onRefresh();
          }}
        />
      )}

      {showCustomExportModal && (
        <StudentCustomExportModal
          isOpen={showCustomExportModal}
          onClose={() => setShowCustomExportModal(false)}
          students={students}
          classes={classes}
          sections={sections}
          groups={groups}
          currentlyFilteredStudents={filteredStudents}
        />
      )}
    </div>
  );
};
