import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Teacher,
  Institute,
  AcademicYear,
  AcademicClass,
  AcademicSection,
  AcademicSubject,
  SubjectTeacherAssignment,
} from '../../types';
import { getAll, add, update, remove } from '../../db/indexedDB';
import {
  Users,
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  CreditCard,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { TeacherFormModal } from './TeacherFormModal';
import { TeacherProfileModal } from './TeacherProfileModal';
import { TeacherIdCardModal } from './TeacherIdCardModal';
import { TeacherAssignmentsView } from './TeacherAssignmentsView';
import { generateSampleTeachers } from './sampleTeachers';

export const TeacherManagement: React.FC = () => {
  const {
    activeInstitute: currentInstitute,
    institutes,
    activeAcademicYear: currentAcademicYear,
    logAudit,
    currentUser,
  } = useApp();

  // Data states
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [assignments, setAssignments] = useState<SubjectTeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'departments'>('roster');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'teacher' | 'staff'>('all');
  const [filterNature, setFilterNature] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<Teacher | null>(null);
  const [selectedTeacherForProfile, setSelectedTeacherForProfile] = useState<Teacher | null>(null);
  const [selectedTeacherForIdCard, setSelectedTeacherForIdCard] = useState<Teacher | null>(null);

  // Load all data
  const loadData = async () => {
    if (!currentInstitute) return;
    setLoading(true);
    try {
      const allTeachers = await getAll<Teacher>('teachers');
      const instTeachers = allTeachers.filter((t) => t.instituteId === currentInstitute.id);
      setTeachers(instTeachers);

      const allCls = await getAll<AcademicClass>('classes');
      setClasses(allCls.filter((c) => c.instituteId === currentInstitute.id));

      const allSec = await getAll<AcademicSection>('sections');
      setSections(allSec.filter((s) => s.instituteId === currentInstitute.id));

      const allSub = await getAll<AcademicSubject>('subjects');
      setSubjects(allSub.filter((sb) => sb.instituteId === currentInstitute.id));

      const allAssignments = await getAll<SubjectTeacherAssignment>('teacherAssignments');
      setAssignments(allAssignments.filter((a) => a.instituteId === currentInstitute.id));
    } catch (err) {
      console.error('Failed to load teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentInstitute?.id, currentAcademicYear?.id]);

  // Handle Save (Add or Update)
  const handleSaveTeacher = async (teacherData: Partial<Teacher>) => {
    if (!currentInstitute) return;

    if (selectedTeacherForEdit) {
      // Update
      const updated: Teacher = {
        ...selectedTeacherForEdit,
        ...teacherData,
        updatedAt: new Date().toISOString(),
      } as Teacher;

      await update('teachers', updated);
      await logAudit(
        'teacher_updated',
        'teachers',
        updated.id,
        `Updated teacher record: ${updated.firstName} ${updated.lastName} (${updated.teacherId})`
      );
    } else {
      // Create new
      const newTeacher: Teacher = {
        id: 'tch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        ...teacherData,
        instituteId: currentInstitute.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Teacher;

      await add('teachers', newTeacher);
      await logAudit(
        'teacher_created',
        'teachers',
        newTeacher.id,
        `Registered new ${newTeacher.employeeType}: ${newTeacher.firstName} ${newTeacher.lastName} (${newTeacher.teacherId})`
      );
    }

    await loadData();
    setShowFormModal(false);
    setSelectedTeacherForEdit(null);
  };

  // Handle Delete
  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (
      !confirm(
        `Are you sure you want to remove ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})?`
      )
    ) {
      return;
    }

    try {
      await remove('teachers', teacher.id);
      await logAudit(
        'teacher_deleted',
        'teachers',
        teacher.id,
        `Removed employee: ${teacher.firstName} ${teacher.lastName} (${teacher.teacherId})`
      );
      await loadData();
    } catch (err) {
      console.error('Error removing teacher:', err);
    }
  };

  // Seed sample data for testing
  const handleSeedSampleData = async () => {
    if (!currentInstitute) return;
    try {
      const schoolInst = institutes.find((i) => i.type === 'school') || currentInstitute;
      const collegeInst = institutes.find((i) => i.type === 'college') || currentInstitute;

      const sampleData = generateSampleTeachers(schoolInst.id, collegeInst.id);
      for (const t of sampleData) {
        await add('teachers', t);
      }

      await logAudit(
        'teachers_seeded',
        'teachers',
        currentInstitute.id,
        `Seeded ${sampleData.length} sample faculty and staff records`
      );
      await loadData();
    } catch (err) {
      console.error('Error seeding teachers:', err);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (teachers.length === 0) return;
    const headers = [
      'Employee ID',
      'Name',
      'Bengali Name',
      'Type',
      'Designation',
      'Department',
      'Employment Nature',
      'MPO Index',
      'Phone',
      'Email',
      'Joining Date',
      'Basic Salary',
      'Status',
    ];

    const rows = filteredTeachers.map((t) => [
      t.teacherId,
      `"${t.firstName} ${t.lastName}"`,
      `"${t.bengaliName || ''}"`,
      t.employeeType,
      `"${t.designation}"`,
      `"${t.departmentName || ''}"`,
      t.employmentNature,
      t.indexNumber || '',
      t.phone,
      t.email || '',
      t.joiningDate,
      t.basicSalary || '',
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `teachers_staff_${currentInstitute?.code || 'erp'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Department List for Filter
  const departments = Array.from(
    new Set(teachers.map((t) => t.departmentName).filter(Boolean))
  ) as string[];

  // Filtered list
  const filteredTeachers = teachers.filter((t) => {
    if (filterType !== 'all' && t.employeeType !== filterType) return false;
    if (filterNature !== 'all' && t.employmentNature !== filterNature) return false;
    if (filterDepartment !== 'all' && t.departmentName !== filterDepartment) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const bengali = (t.bengaliName || '').toLowerCase();
      const idStr = t.teacherId.toLowerCase();
      const phoneStr = t.phone.toLowerCase();
      const indexStr = (t.indexNumber || '').toLowerCase();
      const desig = t.designation.toLowerCase();
      const father = (t.fatherName || '').toLowerCase();
      const fatherBn = (t.fatherNameBn || '').toLowerCase();
      const mother = (t.motherName || '').toLowerCase();
      const motherBn = (t.motherNameBn || '').toLowerCase();

      return (
        fullName.includes(q) ||
        bengali.includes(q) ||
        idStr.includes(q) ||
        phoneStr.includes(q) ||
        indexStr.includes(q) ||
        desig.includes(q) ||
        father.includes(q) ||
        fatherBn.includes(q) ||
        mother.includes(q) ||
        motherBn.includes(q)
      );
    }
    return true;
  });

  // KPI Metrics
  const totalFaculty = teachers.filter((t) => t.employeeType === 'teacher').length;
  const totalStaff = teachers.filter((t) => t.employeeType === 'staff').length;
  const totalMPO = teachers.filter((t) => t.employmentNature === 'mpo').length;
  const totalActive = teachers.filter((t) => t.status === 'active').length;

  if (!currentInstitute) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please select an active Institute from the header.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Phase 4
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500 capitalize">
              {currentInstitute.name} ({currentInstitute.type})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Faculty &amp; Staff Management (শিক্ষক ও কর্মী ব্যবস্থাপনা)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage teacher profiles, service records, MPO index, class teachers &amp; subject workloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {teachers.length === 0 && (
            <button
              onClick={handleSeedSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load Demo Faculty</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedTeacherForEdit(null);
              setShowFormModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teacher / Staff</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Faculty / Teachers
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{totalFaculty}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Support Staff
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{totalStaff}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              MPO Index Holders
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{totalMPO}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Active On-Duty
            </p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{totalActive}</h3>
          </div>
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty &amp; Staff Roster (কর্মকর্তা-কর্মচারী তালিকা)</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Class Teachers &amp; Workload (শ্রেণি শিক্ষক ও পাঠদান)</span>
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'departments'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Departments Summary</span>
          </button>
        </div>

        {activeTab === 'roster' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={teachers.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-40"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              title="Print List"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: ROSTER & DIRECTORY */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, Bengali name, ID, mobile, MPO index, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Employee Types</option>
                <option value="teacher">Faculty / Teachers Only</option>
                <option value="staff">Staff Only</option>
              </select>

              <select
                value={filterNature}
                onChange={(e) => setFilterNature(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Employment Natures</option>
                <option value="permanent">Permanent</option>
                <option value="mpo">MPO (এমপিও)</option>
                <option value="non_mpo">Non-MPO</option>
                <option value="contractual">Contractual</option>
                <option value="part_time">Part-Time</option>
              </select>

              {departments.length > 0 && (
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="transferred">Transferred</option>
                <option value="resigned">Resigned</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {filteredTeachers.length} of {teachers.length} employees
            </span>
            {filteredTeachers.length !== teachers.length && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterNature('all');
                  setFilterDepartment('all');
                  setFilterStatus('all');
                }}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Roster View - GRID OR TABLE */}
          {filteredTeachers.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No Faculty or Staff Found
              </p>
              <p className="text-xs mt-1">
                {teachers.length === 0
                  ? 'Click "Add Teacher / Staff" or "Load Demo Faculty" to populate the institutional directory.'
                  : 'Try adjusting your search criteria or filter options.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Photo Avatar */}
                    {teacher.photoUrl ? (
                      <img
                        src={teacher.photoUrl}
                        alt={teacher.firstName}
                        onClick={() => setSelectedTeacherForProfile(teacher)}
                        className="w-14 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                        title="View Bio-Data"
                      />
                    ) : (
                      <div
                        onClick={() => setSelectedTeacherForProfile(teacher)}
                        className="w-14 h-16 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-bold text-sm shrink-0 shadow-xs cursor-pointer"
                        title="View Bio-Data"
                      >
                        <span>{(teacher.firstName || 'T').charAt(0)}</span>
                        <span>{(teacher.lastName || '').charAt(0)}</span>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {teacher.teacherId}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            teacher.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {teacher.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedTeacherForProfile(teacher)}
                        className="font-bold text-sm text-slate-900 dark:text-white truncate hover:text-blue-600 cursor-pointer"
                      >
                        {teacher.firstName} {teacher.lastName}
                      </h3>

                      {teacher.bengaliName && (
                        <p className="text-[11px] text-slate-500 truncate font-medium">
                          {teacher.bengaliName}
                        </p>
                      )}

                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate mt-0.5">
                        {teacher.designation}
                      </p>
                    </div>
                  </div>

                  {/* Attributes Details */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {teacher.departmentName || 'General'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Employment:</span>
                      <span className="capitalize font-medium text-slate-800 dark:text-slate-200">
                        {teacher.employmentNature.replace('_', ' ')}
                      </span>
                    </div>

                    {teacher.indexNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">MPO Index:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {teacher.indexNumber}
                        </span>
                      </div>
                    )}

                    {(teacher.fatherName || teacher.fatherNameBn) && (
                      <div className="flex justify-between items-start text-[11px]">
                        <span className="text-slate-400">Father / পিতা:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]">
                          {teacher.fatherName || ''}
                          {teacher.fatherNameBn && ` (${teacher.fatherNameBn})`}
                        </span>
                      </div>
                    )}

                    {(teacher.motherName || teacher.motherNameBn) && (
                      <div className="flex justify-between items-start text-[11px]">
                        <span className="text-slate-400">Mother / মাতা:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[170px]">
                          {teacher.motherName || ''}
                          {teacher.motherNameBn && ` (${teacher.motherNameBn})`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-slate-400">Mobile:</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {teacher.phone}
                      </span>
                    </div>
                  </div>

                  {/* Quick Card Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTeacherForProfile(teacher)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold cursor-pointer"
                        title="View Official Bio-Data Sheet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => setSelectedTeacherForIdCard(teacher)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold cursor-pointer"
                        title="Print ID Card"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>ID Card</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedTeacherForEdit(teacher);
                          setShowFormModal(true);
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md cursor-pointer"
                        title="Edit Teacher"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Designation</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">MPO Index</th>
                      <th className="px-4 py-3">Nature</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {teacher.photoUrl ? (
                              <img
                                src={teacher.photoUrl}
                                alt={teacher.firstName}
                                className="w-8 h-9 rounded-lg object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                {(teacher.firstName || 'T').charAt(0)}
                              </div>
                            )}
                            <div>
                              <div
                                onClick={() => setSelectedTeacherForProfile(teacher)}
                                className="font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer"
                              >
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              {teacher.bengaliName && (
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {teacher.bengaliName}
                                </div>
                              )}
                              <div className="text-[10px] text-slate-400 font-mono">
                                {teacher.teacherId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {teacher.employeeType}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          {teacher.designation}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {teacher.departmentName || 'General'}
                        </td>

                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {teacher.indexNumber || '—'}
                        </td>

                        <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-400">
                          {teacher.employmentNature.replace('_', ' ')}
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                          {teacher.phone}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              teacher.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {teacher.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedTeacherForProfile(teacher)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-md cursor-pointer"
                              title="View Bio-Data"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedTeacherForIdCard(teacher)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-md cursor-pointer"
                              title="ID Card"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedTeacherForEdit(teacher);
                                setShowFormModal(true);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-md cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteTeacher(teacher)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-md cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASS TEACHER & SUBJECT TEACHING ASSIGNMENTS */}
      {activeTab === 'assignments' && currentAcademicYear && (
        <TeacherAssignmentsView
          institute={currentInstitute}
          academicYear={currentAcademicYear}
          teachers={teachers}
          classes={classes}
          sections={sections}
          subjects={subjects}
          assignments={assignments}
          onRefresh={loadData}
        />
      )}

      {/* TAB 3: DEPARTMENTS BREAKDOWN */}
      {activeTab === 'departments' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Department &amp; Designation Summary
            </h3>
            <p className="text-xs text-slate-500">
              Distribution of academic faculty and non-academic staff across departments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {departments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No departments recorded yet.</p>
            ) : (
              departments.map((dept) => {
                const deptMembers = teachers.filter((t) => t.departmentName === dept);
                const facultyInDept = deptMembers.filter((t) => t.employeeType === 'teacher');
                const staffInDept = deptMembers.filter((t) => t.employeeType === 'staff');

                return (
                  <div
                    key={dept}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{dept}</h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {deptMembers.length} Members
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Teachers / Faculty:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {facultyInDept.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Administrative Staff:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {staffInDept.length}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-semibold text-slate-500 mb-1">Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {deptMembers.map((m) => (
                          <span
                            key={m.id}
                            onClick={() => setSelectedTeacherForProfile(m)}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer"
                          >
                            {m.firstName} {m.lastName} ({m.designation})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Add / Edit Teacher */}
      {showFormModal && (
        <TeacherFormModal
          initialTeacher={selectedTeacherForEdit}
          institute={currentInstitute}
          existingCount={teachers.length}
          onSave={handleSaveTeacher}
          onClose={() => {
            setShowFormModal(false);
            setSelectedTeacherForEdit(null);
          }}
        />
      )}

      {/* MODAL 2: Profile & Bio-Data Viewer */}
      {selectedTeacherForProfile && (
        <TeacherProfileModal
          teacher={selectedTeacherForProfile}
          institute={currentInstitute}
          assignments={assignments.filter((a) => a.teacherId === selectedTeacherForProfile.id)}
          classTeacherSections={sections.filter(
            (s) => s.classTeacherId === selectedTeacherForProfile.id
          )}
          onClose={() => setSelectedTeacherForProfile(null)}
          onEdit={(t) => {
            setSelectedTeacherForProfile(null);
            setSelectedTeacherForEdit(t);
            setShowFormModal(true);
          }}
          onViewIdCard={(t) => {
            setSelectedTeacherForProfile(null);
            setSelectedTeacherForIdCard(t);
          }}
        />
      )}

      {/* MODAL 3: ID Card Slip */}
      {selectedTeacherForIdCard && (
        <TeacherIdCardModal
          teacher={selectedTeacherForIdCard}
          institute={currentInstitute}
          onClose={() => setSelectedTeacherForIdCard(null)}
        />
      )}
    </div>
  );
};
