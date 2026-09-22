import React, { useState } from 'react';
import { Student, AcademicClass, AcademicSection, Institute, StudentDocument } from '../../types';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  Heart,
  Shield,
  Printer,
  Edit2,
  Clock,
  BookOpen,
  Award,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  PenTool,
  FileCheck,
  Users,
} from 'lucide-react';
import { DocumentViewerModal } from './DocumentViewerModal';

interface StudentProfileModalProps {
  student: Student;
  classes: AcademicClass[];
  sections: AcademicSection[];
  institute: Institute | null;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  classes,
  sections,
  institute,
  onClose,
  onEdit,
}) => {
  const currentClass = classes.find((c) => c.id === student.classId);
  const currentSection = sections.find((s) => s.id === student.sectionId);

  const [viewerState, setViewerState] = useState<{
    open: boolean;
    title: string;
    doc?: StudentDocument | null;
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

  const openDocViewer = (title: string, doc?: StudentDocument | null, imageUrl?: string | null) => {
    setViewerState({
      open: true,
      title,
      doc,
      imageUrl,
    });
  };

  const totalDocs = 6;
  let uploadedCount = 0;
  if (student.photoUrl) uploadedCount++;
  if (student.birthCertificateDoc) uploadedCount++;
  if (student.studentSignatureUrl) uploadedCount++;
  if (student.parentPhotoUrl) uploadedCount++;
  if (student.parentNidDoc) uploadedCount++;
  if (student.parentSignatureUrl) uploadedCount++;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Modal Topbar (hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Student Bio-Data &amp; Academic Profile
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(student)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Profile</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Printable Official Header */}
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-5 space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {institute?.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {institute?.bengaliName} • EIIN: {institute?.eiin || 'N/A'} • {institute?.address}
            </p>
            <div className="inline-block px-3 py-0.5 mt-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Official Student Registration Profile
            </div>
          </div>

          {/* Student Hero Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={`${student.firstName} ${student.lastName}`}
                  onClick={() => openDocViewer("Student's Photo", null, student.photoUrl)}
                  className="w-20 h-20 rounded-xl object-cover shadow-xs shrink-0 border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-900 cursor-pointer hover:opacity-90 transition-opacity"
                  title="Click to view full image"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-bold text-xl shadow-xs shrink-0 border-2 border-white dark:border-slate-700">
                  <span>{(student.firstName || 'S').charAt(0)}</span>
                  <span>{(student.lastName || '').charAt(0)}</span>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {student.firstName} {student.lastName}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      student.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {student.bengaliName}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ID: {student.studentId}
                  </span>
                  <span>•</span>
                  <span>
                    Roll: <strong className="text-slate-800 dark:text-slate-200">{student.rollNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Gender: <strong className="capitalize text-slate-800 dark:text-slate-200">{student.gender}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex sm:flex-col items-end gap-2 text-xs">
              <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Enrolled Class</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {currentClass?.name || 'Class N/A'}
                </div>
              </div>
              <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-right">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Section</div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {currentSection?.name || 'Section N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Data Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* 1. Personal Information */}
            <div className="space-y-3 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <User className="w-4 h-4 text-blue-500" />
                <span>Personal Details</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date of Birth</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.dateOfBirth || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Blood Group</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{student.bloodGroup || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Religion</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.religion || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Admission Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.admissionDate || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Email</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{student.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 2. Guardian Details */}
            <div className="space-y-3 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Guardian &amp; Parents Information</span>
              </h4>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Father's Name / পিতার নাম</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {student.guardian?.fatherName || 'N/A'}
                    {student.guardian?.fatherNameBn && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 ml-2">
                        ({student.guardian.fatherNameBn})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {student.guardian?.fatherOccupation || 'Guardian'} • {student.guardian?.fatherPhone || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mother's Name / মাতার নাম</span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {student.guardian?.motherName || 'N/A'}
                    {student.guardian?.motherNameBn && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 ml-2">
                        ({student.guardian.motherNameBn})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {student.guardian?.motherOccupation || 'Homemaker'} • {student.guardian?.motherPhone || 'N/A'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Contact</span>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {student.guardian?.emergencyContactName || student.guardian?.fatherName || 'N/A'} ({student.guardian?.emergencyContactRelation || 'Guardian'})
                    </span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      {student.guardian?.emergencyContactPhone || student.guardian?.fatherPhone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Address Details */}
            <div className="space-y-3 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Address &amp; Location</span>
              </h4>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Present Address</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {student.address?.presentAddress || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Permanent Address</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {student.address?.permanentAddress || student.address?.presentAddress || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">District</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {student.address?.district || 'Dhaka'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Upazila / Thana</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {student.address?.upazila || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Academic History */}
            <div className="space-y-3 bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                <Award className="w-4 h-4 text-purple-500" />
                <span>Academic Record &amp; Prior Credentials</span>
              </h4>
              <div className="space-y-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Previous Institution</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {student.academicDetails?.previousSchool || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Prior GPA</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {student.academicDetails?.previousGPA || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Board</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {student.academicDetails?.sscBoard || 'Dhaka'}
                    </span>
                  </div>
                </div>
                {student.academicDetails?.sscRoll && (
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">SSC Roll</span>
                      <span>{student.academicDetails.sscRoll}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registration</span>
                      <span>{student.academicDetails.sscRegistration}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Attached Documents & Media Section */}
          <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Attached Documents &amp; Media (সংযুক্ত কাগজপত্র ও ছবি)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    uploadedCount === totalDocs
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {uploadedCount} of {totalDocs} Uploaded
                </span>
                {onEdit && uploadedCount < totalDocs && (
                  <button
                    onClick={() => onEdit(student)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Upload Missing</span>
                  </button>
                )}
              </div>
            </div>

            {uploadedCount < totalDocs && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Some documents/photos are not yet uploaded. You can update or complete the student bio-data at any time.
                  </span>
                </div>
              </div>
            )}

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {/* 1. Student Photo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Student's Photo
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.photoUrl
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.photoUrl ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">শিক্ষার্থীর ছবি</span>
                </div>

                {student.photoUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img
                      src={student.photoUrl}
                      alt="Student"
                      className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => openDocViewer("Student's Photo", null, student.photoUrl)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* 2. Birth Certificate */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Birth Certificate
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.birthCertificateDoc
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.birthCertificateDoc ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">জন্ম সনদ (ছবি/PDF)</span>
                </div>

                {student.birthCertificateDoc ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300 text-[11px] max-w-[100px]">
                        {student.birthCertificateDoc.name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        openDocViewer("Student's Birth Certificate", student.birthCertificateDoc)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No certificate attached
                  </div>
                )}
              </div>

              {/* 3. Student Signature */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Student's Signature
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.studentSignatureUrl
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.studentSignatureUrl ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">শিক্ষার্থীর স্বাক্ষর</span>
                </div>

                {student.studentSignatureUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img
                      src={student.studentSignatureUrl}
                      alt="Student Signature"
                      className="h-8 max-w-[90px] object-contain border border-slate-200 dark:border-slate-700 rounded bg-white p-1"
                    />
                    <button
                      onClick={() =>
                        openDocViewer("Student's Signature", null, student.studentSignatureUrl)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No signature uploaded
                  </div>
                )}
              </div>

              {/* 4. Parents Photo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Parents / Guardian Photo
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.parentPhotoUrl
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.parentPhotoUrl ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">অভিভাবকের ছবি</span>
                </div>

                {student.parentPhotoUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img
                      src={student.parentPhotoUrl}
                      alt="Parent"
                      className="w-10 h-10 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() =>
                        openDocViewer("Parents / Guardian Photo", null, student.parentPhotoUrl)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* 5. Parents NID */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Parents / Guardian NID
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.parentNidDoc
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.parentNidDoc ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">জাতীয় পরিচয়পত্র (NID)</span>
                </div>

                {student.parentNidDoc ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300 text-[11px] max-w-[100px]">
                        {student.parentNidDoc.name}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        openDocViewer("Parents / Guardian NID", student.parentNidDoc)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No NID document attached
                  </div>
                )}
              </div>

              {/* 6. Parents Signature */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Parents Signature
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        student.parentSignatureUrl
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {student.parentSignatureUrl ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mb-2">অভিভাবকের স্বাক্ষর</span>
                </div>

                {student.parentSignatureUrl ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <img
                      src={student.parentSignatureUrl}
                      alt="Parent Signature"
                      className="h-8 max-w-[90px] object-contain border border-slate-200 dark:border-slate-700 rounded bg-white p-1"
                    />
                    <button
                      onClick={() =>
                        openDocViewer("Parents Signature", null, student.parentSignatureUrl)
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-2 bg-slate-100 dark:bg-slate-800/40 rounded border border-dashed border-slate-200 dark:border-slate-700">
                    No signature uploaded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Printable Official Signatures (visible on print) */}
          <div className="hidden print:grid grid-cols-3 gap-8 pt-16 text-center text-xs">
            <div className="border-t border-slate-800 pt-2 font-semibold text-slate-700">
              Prepared By / Assistant
            </div>
            <div className="border-t border-slate-800 pt-2 font-semibold text-slate-700">
              Class Teacher Signature
            </div>
            <div className="border-t border-slate-800 pt-2 font-semibold text-slate-700">
              Principal / Headmaster Signature
            </div>
          </div>
        </div>
      </div>

      {/* Full Document / Photo Viewer */}
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
