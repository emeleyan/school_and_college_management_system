import React, { useState } from 'react';
import { Teacher, Institute, SubjectTeacherAssignment, AcademicSection } from '../../types';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Printer,
  Edit2,
  CreditCard,
  Building2,
  Clock,
  Eye,
  CheckCircle2,
  Layers,
  BookOpen,
  DollarSign,
} from 'lucide-react';
import { DocumentViewerModal } from '../students/DocumentViewerModal';

interface TeacherProfileModalProps {
  teacher: Teacher;
  institute?: Institute | null;
  assignments?: SubjectTeacherAssignment[];
  classTeacherSections?: AcademicSection[];
  onClose: () => void;
  onEdit?: (teacher: Teacher) => void;
  onViewIdCard?: (teacher: Teacher) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  teacher,
  institute,
  assignments = [],
  classTeacherSections = [],
  onClose,
  onEdit,
  onViewIdCard,
}) => {
  const [viewerState, setViewerState] = useState<{
    open: boolean;
    title: string;
    doc?: any;
    imageUrl?: string | null;
  }>({
    open: false,
    title: '',
    doc: null,
    imageUrl: null,
  });

  const handlePrint = () => {
    window.print();
  };

  const openDocViewer = (title: string, doc?: any, imageUrl?: string | null) => {
    setViewerState({
      open: true,
      title,
      doc,
      imageUrl,
    });
  };

  const isTeacher = teacher.employeeType === 'teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden my-8">
        {/* Printable Official Header (Visible on print only) */}
        <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6 p-6">
          <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
            {institute?.name || 'Academic Institution'}
          </h1>
          {institute?.bengaliName && (
            <h2 className="text-sm font-semibold text-slate-700">{institute.bengaliName}</h2>
          )}
          <p className="text-xs text-slate-600 mt-1">
            {institute?.address} • EIIN: {institute?.eiin || 'N/A'} • Phone: {institute?.phone || 'N/A'}
          </p>
          <div className="inline-block mt-3 px-4 py-1 border border-slate-800 rounded-full font-bold text-xs uppercase tracking-widest text-slate-800">
            {isTeacher ? 'Faculty Bio-Data & Service Record' : 'Staff Bio-Data & Service Record'}
          </div>
        </div>

        {/* Modal Top Action Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isTeacher ? 'Faculty / Teacher Bio-Data' : 'Staff Bio-Data'}
              </h3>
              <p className="text-xs text-slate-500">ID: {teacher.teacherId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onViewIdCard && (
              <button
                onClick={() => onViewIdCard(teacher)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>ID Card</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bio-Data</span>
            </button>

            {onEdit && (
              <button
                onClick={() => onEdit(teacher)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
          {/* Hero Profile Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {teacher.photoUrl ? (
                <img
                  src={teacher.photoUrl}
                  alt={teacher.firstName}
                  onClick={() => openDocViewer('Passport Photo', null, teacher.photoUrl)}
                  className="w-20 h-24 rounded-xl object-cover shadow-xs shrink-0 border-2 border-white dark:border-slate-700 cursor-pointer hover:opacity-95 transition-opacity"
                  title="Click to view full image"
                />
              ) : (
                <div className="w-20 h-24 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-bold text-xl shadow-xs shrink-0 border-2 border-white dark:border-slate-700">
                  <span>{(teacher.firstName || 'T').charAt(0)}</span>
                  <span>{(teacher.lastName || '').charAt(0)}</span>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {teacher.firstName} {teacher.lastName}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {teacher.employeeType === 'teacher' ? 'Faculty' : 'Staff'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      teacher.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {teacher.status.replace('_', ' ')}
                  </span>
                </div>

                {teacher.bengaliName && (
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {teacher.bengaliName}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {teacher.designation}
                  </span>
                  {teacher.bengaliDesignation && (
                    <span>({teacher.bengaliDesignation})</span>
                  )}
                  <span>•</span>
                  <span>{teacher.departmentName || 'General'}</span>
                  {teacher.indexNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] text-slate-800 dark:text-slate-200 font-bold">
                        MPO Index: {teacher.indexNumber}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Nature: </span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold">
                  {teacher.employmentNature.replace('_', ' ')}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Joining: </span>
                <span>{teacher.joiningDate}</span>
              </div>
              {teacher.experienceYears !== undefined && (
                <div className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Experience: </span>
                  <span>{teacher.experienceYears} Years</span>
                </div>
              )}
            </div>
          </div>

          {/* Grid of Sections: 1. Personal, 2. Employment, 3. Contact & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Personal Details */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Personal Information (ব্যক্তিগত তথ্য)
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">FATHER'S NAME / পিতার নাম</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.fatherName || 'N/A'}
                    {teacher.fatherNameBn && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1.5 font-medium">
                        ({teacher.fatherNameBn})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">MOTHER'S NAME / মাতার নাম</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.motherName || 'N/A'}
                    {teacher.motherNameBn && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1.5 font-medium">
                        ({teacher.motherNameBn})
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">GENDER</span>
                  <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.gender}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">DATE OF BIRTH</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.dateOfBirth}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">BLOOD GROUP</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {teacher.bloodGroup || 'Not Specified'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">RELIGION</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.religion}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">MARITAL STATUS</span>
                  <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.maritalStatus || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">NATIONAL ID (NID)</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.nationalId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Employment & Payroll */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Employment &amp; Salary (কর্মসংস্থান ও বেতন)
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-y-2 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">DESIGNATION</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {teacher.designation}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">DEPARTMENT</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.departmentName || 'General'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">PAY SCALE / GRADE</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.salaryGrade || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">BASIC SALARY</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {teacher.basicSalary ? `৳ ${teacher.basicSalary.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">BANK ACCOUNT</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.bankAccountNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">BANK NAME</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {teacher.bankName || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Contact Details */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <Phone className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Contact Details (যোগাযোগ)
                </h4>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {teacher.phone}
                  </span>
                  <span className="text-[10px] text-slate-400">(Primary Mobile)</span>
                </div>
                {teacher.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {teacher.email}
                    </span>
                  </div>
                )}
                {teacher.emergencyContactPhone && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">Emergency: </span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {teacher.emergencyContactPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Residential Address */}
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Address (বর্তমান ও স্থায়ী ঠিকানা)
                </h4>
              </div>
              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-400 block text-[10px]">PRESENT ADDRESS</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    {teacher.presentAddress}
                  </p>
                </div>
                {teacher.permanentAddress && (
                  <div>
                    <span className="font-medium text-slate-400 block text-[10px]">PERMANENT ADDRESS</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">
                      {teacher.permanentAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Educational Qualifications Table */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-slate-900 dark:text-white">
                Educational Qualifications (শিক্ষাগত যোগ্যতা)
              </h4>
            </div>

            {teacher.qualifications && teacher.qualifications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2">Degree / Certificate</th>
                      <th className="px-3 py-2">Major / Subject</th>
                      <th className="px-3 py-2">Board / University</th>
                      <th className="px-3 py-2 text-center">Passing Year</th>
                      <th className="px-3 py-2 text-center">Result / GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {teacher.qualifications.map((q, idx) => (
                      <tr key={q.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                          {q.degreeTitle}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {q.majorSubject || '—'}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {q.instituteOrUniversity}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-300 font-mono">
                          {q.passingYear}
                        </td>
                        <td className="px-3 py-2 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          {q.resultOrGpa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No qualifications added yet.</p>
            )}
          </div>

          {/* Assigned Classes & Teaching Responsibilities */}
          {isTeacher && (
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Teaching Workload &amp; Responsibilities (পাঠদান ও দায়িত্ব)
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {assignments.length} Subject Assignments
                </span>
              </div>

              {/* Class Teacher Duties */}
              {classTeacherSections.length > 0 && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center gap-3 text-xs">
                  <Award className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-300">
                      Designated Class Teacher (শ্রেণি শিক্ষক):{' '}
                    </span>
                    <span className="text-blue-800 dark:text-blue-400">
                      {classTeacherSections.map((s) => s.name).join(', ')}
                    </span>
                  </div>
                </div>
              )}

              {/* Subject Teaching Table */}
              {assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-2">Class</th>
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2">Subject Name</th>
                        <th className="px-3 py-2 text-center">Periods / Week</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                            {a.className}
                          </td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                            {a.sectionName || 'All Sections'}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                            {a.subjectName}
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {a.periodsPerWeek || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No specific subject teaching assignments recorded yet for this session.
                </p>
              )}
            </div>
          )}

          {/* Attached Documents & Signature */}
          <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900 dark:text-white">
                Attached Documents &amp; Signature (সংযুক্ত প্রমাণপত্র ও স্বাক্ষর)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Digital Signature */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Digital Signature (স্বাক্ষর)
                  </span>
                  <span className="text-[10px] text-slate-400 block mb-2">
                    Official authorization sign
                  </span>
                </div>
                {teacher.signatureUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img
                      src={teacher.signatureUrl}
                      alt="Signature"
                      className="h-8 max-w-[100px] object-contain bg-white rounded p-0.5 border border-slate-200"
                    />
                    <button
                      onClick={() => openDocViewer('Digital Signature', null, teacher.signatureUrl)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 text-[11px]">
                    No signature attached
                  </div>
                )}
              </div>

              {/* NID Document */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    National ID (NID কার্ড)
                  </span>
                  <span className="text-[10px] text-slate-400 block mb-2">
                    Verified citizen document
                  </span>
                </div>
                {teacher.nidDocument ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="truncate text-slate-700 dark:text-slate-300 max-w-[100px] text-[11px]">
                      {teacher.nidDocument.name}
                    </span>
                    <button
                      onClick={() => openDocViewer('National ID Document', teacher.nidDocument)}
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded font-medium cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 text-[11px]">
                    No NID copy attached
                  </div>
                )}
              </div>

              {/* Certificate / Appointment Letter */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Joining / Appointment Letter
                  </span>
                  <span className="text-[10px] text-slate-400 block mb-2">
                    নিয়োগপত্র / প্রত্যয়নপত্র
                  </span>
                </div>
                {teacher.appointmentLetterDoc ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="truncate text-slate-700 dark:text-slate-300 max-w-[100px] text-[11px]">
                      {teacher.appointmentLetterDoc.name}
                    </span>
                    <button
                      onClick={() =>
                        openDocViewer('Appointment Letter', teacher.appointmentLetterDoc)
                      }
                      className="px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded font-medium cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 text-[11px]">
                    No appointment letter
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Printable Official Signatures (visible on print) */}
          <div className="hidden print:grid grid-cols-2 gap-16 pt-20 text-center text-xs">
            <div className="border-t border-slate-800 pt-2 font-semibold text-slate-800">
              Employee's Signature &amp; Date
            </div>
            <div className="border-t border-slate-800 pt-2 font-semibold text-slate-800">
              Principal / Head of Institution
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 print:hidden">
          <div className="text-xs text-slate-400">
            Registered on {new Date(teacher.createdAt).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Document / Media Full Viewer Modal */}
      {viewerState.open && (
        <DocumentViewerModal
          title={viewerState.title}
          doc={viewerState.doc}
          imageUrl={viewerState.imageUrl}
          onClose={() =>
            setViewerState({
              open: false,
              title: '',
              doc: null,
              imageUrl: null,
            })
          }
        />
      )}
    </div>
  );
};
