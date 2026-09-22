import React, { useState } from 'react';
import {
  Teacher,
  Institute,
  TeacherEmploymentNature,
  Gender,
  BloodGroup,
  Religion,
  EducationalQualification,
  TeacherDocument,
} from '../../types';
import {
  X,
  User,
  Briefcase,
  GraduationCap,
  Phone,
  FileText,
  Save,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Camera,
  PenTool,
} from 'lucide-react';
import { FileUploadCard } from '../students/FileUploadCard';

interface TeacherFormModalProps {
  initialTeacher?: Teacher | null;
  institute: Institute;
  onSave: (teacherData: Partial<Teacher>) => Promise<void>;
  onClose: () => void;
  existingCount: number;
}

export const TeacherFormModal: React.FC<TeacherFormModalProps> = ({
  initialTeacher,
  institute,
  onSave,
  onClose,
  existingCount,
}) => {
  const isEdit = Boolean(initialTeacher);
  const prefix = institute.type === 'school' ? 'SCH' : 'COL';

  // Form State
  const [employeeType, setEmployeeType] = useState<'teacher' | 'staff'>(
    initialTeacher?.employeeType || 'teacher'
  );
  const [teacherId, setTeacherId] = useState(
    initialTeacher?.teacherId ||
      `${employeeType === 'teacher' ? 'FAC' : 'STF'}-${prefix}-${String(
        existingCount + 1001
      ).padStart(4, '0')}`
  );
  const [indexNumber, setIndexNumber] = useState(initialTeacher?.indexNumber || '');

  // Personal Info
  const [firstName, setFirstName] = useState(initialTeacher?.firstName || '');
  const [lastName, setLastName] = useState(initialTeacher?.lastName || '');
  const [bengaliName, setBengaliName] = useState(initialTeacher?.bengaliName || '');
  const [gender, setGender] = useState<Gender>(initialTeacher?.gender || 'male');
  const [dateOfBirth, setDateOfBirth] = useState(initialTeacher?.dateOfBirth || '1985-01-01');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(
    initialTeacher?.bloodGroup || 'A+'
  );
  const [religion, setReligion] = useState<Religion>(initialTeacher?.religion || 'Islam');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'other'>(
    initialTeacher?.maritalStatus || 'married'
  );
  const [nationalId, setNationalId] = useState(initialTeacher?.nationalId || '');
  const [fatherName, setFatherName] = useState(initialTeacher?.fatherName || '');
  const [fatherNameBn, setFatherNameBn] = useState(initialTeacher?.fatherNameBn || '');
  const [motherName, setMotherName] = useState(initialTeacher?.motherName || '');
  const [motherNameBn, setMotherNameBn] = useState(initialTeacher?.motherNameBn || '');

  // Contact Info
  const [phone, setPhone] = useState(initialTeacher?.phone || '');
  const [email, setEmail] = useState(initialTeacher?.email || '');
  const [emergencyPhone, setEmergencyPhone] = useState(
    initialTeacher?.emergencyContactPhone || ''
  );
  const [presentAddress, setPresentAddress] = useState(
    initialTeacher?.presentAddress || ''
  );
  const [permanentAddress, setPermanentAddress] = useState(
    initialTeacher?.permanentAddress || ''
  );

  // Employment Details
  const [designation, setDesignation] = useState(
    initialTeacher?.designation || (employeeType === 'teacher' ? 'Assistant Teacher' : 'Office Assistant')
  );
  const [bengaliDesignation, setBengaliDesignation] = useState(
    initialTeacher?.bengaliDesignation || ''
  );
  const [departmentName, setDepartmentName] = useState(
    initialTeacher?.departmentName || (employeeType === 'teacher' ? 'General' : 'Administration')
  );
  const [employmentNature, setEmploymentNature] = useState<TeacherEmploymentNature>(
    initialTeacher?.employmentNature || 'permanent'
  );
  const [joiningDate, setJoiningDate] = useState(
    initialTeacher?.joiningDate || new Date().toISOString().split('T')[0]
  );
  const [experienceYears, setExperienceYears] = useState<number>(
    initialTeacher?.experienceYears || 0
  );
  const [salaryGrade, setSalaryGrade] = useState(initialTeacher?.salaryGrade || 'Grade 10');
  const [basicSalary, setBasicSalary] = useState<number>(
    initialTeacher?.basicSalary || 22000
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initialTeacher?.bankAccountNumber || ''
  );
  const [bankName, setBankName] = useState(initialTeacher?.bankName || 'Sonali Bank PLC');
  const [specialization, setSpecialization] = useState(initialTeacher?.specialization || '');
  const [status, setStatus] = useState(initialTeacher?.status || 'active');

  // Qualifications
  const [qualifications, setQualifications] = useState<EducationalQualification[]>(
    initialTeacher?.qualifications || [
      {
        id: 'q_' + Date.now(),
        degreeTitle: 'Honours / Degree',
        majorSubject: 'Subject',
        instituteOrUniversity: 'University / Board',
        passingYear: '2010',
        resultOrGpa: 'First Class',
      },
    ]
  );

  // Documents & Media
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialTeacher?.photoUrl || null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(
    initialTeacher?.signatureUrl || null
  );
  const [nidDocument, setNidDocument] = useState<TeacherDocument | null>(
    initialTeacher?.nidDocument || null
  );
  const [appointmentDoc, setAppointmentDoc] = useState<TeacherDocument | null>(
    initialTeacher?.appointmentLetterDoc || null
  );

  const [activeTab, setActiveTab] = useState<'general' | 'qualifications' | 'documents'>(
    'general'
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle employee type toggle
  const handleTypeChange = (newType: 'teacher' | 'staff') => {
    setEmployeeType(newType);
    if (!isEdit) {
      setTeacherId(
        `${newType === 'teacher' ? 'FAC' : 'STF'}-${prefix}-${String(
          existingCount + 1001
        ).padStart(4, '0')}`
      );
      if (newType === 'teacher') {
        setDesignation('Assistant Teacher');
        setDepartmentName('General');
      } else {
        setDesignation('Office Assistant');
        setDepartmentName('Administration');
      }
    }
  };

  const handleAddQualification = () => {
    setQualifications((prev) => [
      ...prev,
      {
        id: 'q_' + Date.now() + Math.random(),
        degreeTitle: '',
        majorSubject: '',
        instituteOrUniversity: '',
        passingYear: '',
        resultOrGpa: '',
      },
    ]);
  };

  const handleUpdateQualification = (
    index: number,
    field: keyof EducationalQualification,
    val: string
  ) => {
    setQualifications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveQualification = (index: number) => {
    setQualifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please provide both First Name and Last Name.');
      setActiveTab('general');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please provide a valid Mobile Phone Number.');
      setActiveTab('general');
      return;
    }

    setLoading(true);
    try {
      const teacherData: Partial<Teacher> = {
        instituteId: institute.id,
        teacherId: teacherId.trim(),
        employeeType,
        indexNumber: indexNumber.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bengaliName: bengaliName.trim() || undefined,
        gender,
        dateOfBirth,
        bloodGroup: (bloodGroup as BloodGroup) || undefined,
        religion,
        maritalStatus,
        nationalId: nationalId.trim() || undefined,
        fatherName: fatherName.trim() || undefined,
        fatherNameBn: fatherNameBn.trim() || undefined,
        motherName: motherName.trim() || undefined,
        motherNameBn: motherNameBn.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergencyContactPhone: emergencyPhone.trim() || undefined,
        presentAddress: presentAddress.trim(),
        permanentAddress: permanentAddress.trim() || undefined,
        designation: designation.trim(),
        bengaliDesignation: bengaliDesignation.trim() || undefined,
        departmentName: departmentName.trim(),
        employmentNature,
        joiningDate,
        experienceYears: Number(experienceYears) || 0,
        salaryGrade: salaryGrade.trim() || undefined,
        basicSalary: Number(basicSalary) || 0,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankName: bankName.trim() || undefined,
        specialization: specialization.trim() || undefined,
        status: status as any,
        qualifications: qualifications.filter((q) => q.degreeTitle.trim()),
        photoUrl: photoUrl || undefined,
        signatureUrl: signatureUrl || undefined,
        nidDocument: nidDocument || undefined,
        appointmentLetterDoc: appointmentDoc || undefined,
        updatedAt: new Date().toISOString(),
      };

      if (!isEdit) {
        teacherData.createdAt = new Date().toISOString();
      }

      await onSave(teacherData);
      onClose();
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      setErrorMessage(err.message || 'Failed to save teacher information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Faculty / Staff Profile' : 'Add New Faculty or Staff'}
              </h3>
              <p className="text-xs text-slate-500">
                {institute.name} • {institute.type === 'school' ? 'School' : 'College'} Context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. General &amp; Employment Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qualifications')}
            className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'qualifications'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Educational Qualifications</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 border-b-2 font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Photos &amp; Documents</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL & EMPLOYMENT */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Employee Type Selector */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select Employee Category (কর্মী ধরন) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('teacher')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      employeeType === 'teacher'
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-white text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm">Academic Faculty / Teacher</div>
                      <div className="text-xs text-slate-500 font-normal">
                        শিক্ষক / প্রভাষক / অধ্যক্ষ
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('staff')}
                    className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      employeeType === 'staff'
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-bold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-white text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-sm">Administrative &amp; Support Staff</div>
                      <div className="text-xs text-slate-500 font-normal">
                        কর্মকর্তা-কর্মচারী / হিসাবরক্ষক
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Employment Identity */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Employment Details (চাকরির বিবরণ)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Employee ID *
                    </label>
                    <input
                      type="text"
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      MPO / Govt Index No. (if any)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10239485"
                      value={indexNumber}
                      onChange={(e) => setIndexNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Employment Nature *
                    </label>
                    <select
                      value={employmentNature}
                      onChange={(e) => setEmploymentNature(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white capitalize font-medium"
                    >
                      <option value="permanent">Permanent (স্থায়ী)</option>
                      <option value="mpo">MPO (এমপিওভুক্ত)</option>
                      <option value="non_mpo">Non-MPO (নন-এমপিও)</option>
                      <option value="contractual">Contractual (চুক্তিভিত্তিক)</option>
                      <option value="part_time">Part-Time (খণ্ডকালীন)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation (English) *
                    </label>
                    <input
                      type="text"
                      placeholder={employeeType === 'teacher' ? 'Senior Teacher' : 'Accountant'}
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Designation (Bengali / পদবী)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: সিনিয়র শিক্ষক, প্রভাষক"
                      value={bengaliDesignation}
                      onChange={(e) => setBengaliDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Discipline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Science, Mathematics, English"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Joining Date *
                    </label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Total Experience (Years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pay Scale / Grade
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 9, Grade 10"
                      value={salaryGrade}
                      onChange={(e) => setSalaryGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Basic Salary (BDT ৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={basicSalary}
                      onChange={(e) => setBasicSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 20501234567890"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Personal Bio-Data (ব্যক্তিগত তথ্য)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Rafiqul"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Islam"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Bengali Full Name (বাংলায় নাম)
                    </label>
                    <input
                      type="text"
                      placeholder="মো: রফিকুল ইসলাম"
                      value={bengaliName}
                      onChange={(e) => setBengaliName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white capitalize"
                    >
                      <option value="male">Male (পুরুষ)</option>
                      <option value="female">Female (মহিলা)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-rose-600"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Religion
                    </label>
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value as Religion)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="Islam">Islam (ইসলাম)</option>
                      <option value="Hinduism">Hinduism (হিন্দু)</option>
                      <option value="Buddhism">Buddhism (বৌদ্ধ)</option>
                      <option value="Christianity">Christianity (খ্রিস্টান)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Marital Status
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white capitalize"
                    >
                      <option value="married">Married (বিবাহিত)</option>
                      <option value="single">Single (অবিবাহিত)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      National ID (NID No.)
                    </label>
                    <input
                      type="text"
                      placeholder="10 or 17 digit NID"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Father's Name (English)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Shahidul Islam"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      পিতার নাম (বাংলা)
                    </label>
                    <input
                      type="text"
                      placeholder="মো: শহিদুল ইসলাম"
                      value={fatherNameBn}
                      onChange={(e) => setFatherNameBn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mother's Name (English)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nasreen Begum"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      মাতার নাম (বাংলা)
                    </label>
                    <input
                      type="text"
                      placeholder="নাসরিন বেগম"
                      value={motherNameBn}
                      onChange={(e) => setMotherNameBn(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  <span>Contact &amp; Address (যোগাযোগ ও ঠিকানা)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="teacher@institution.edu.bd"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Emergency Contact Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Emergency contact"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Present Address (বর্তমান ঠিকানা) *
                    </label>
                    <input
                      type="text"
                      placeholder="House, Road, Area, Thana/Upazila, District"
                      value={presentAddress}
                      onChange={(e) => setPresentAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Permanent Address (স্থায়ী ঠিকানা)
                    </label>
                    <input
                      type="text"
                      placeholder="Village, Post, Thana/Upazila, District"
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUALIFICATIONS */}
          {activeTab === 'qualifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Academic Degrees &amp; Professional Certifications
                  </h4>
                  <p className="text-xs text-slate-500">
                    Add degrees such as SSC, HSC, Honours, Masters, B.Ed, M.Ed, Ph.D
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQualification}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              <div className="space-y-3">
                {qualifications.map((q, index) => (
                  <div
                    key={q.id || index}
                    className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative group"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Degree / Exam Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. M.Sc, B.Ed, Honours"
                          value={q.degreeTitle}
                          onChange={(e) =>
                            handleUpdateQualification(index, 'degreeTitle', e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Major Subject
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mathematics, English"
                          value={q.majorSubject || ''}
                          onChange={(e) =>
                            handleUpdateQualification(index, 'majorSubject', e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Board / University
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dhaka University"
                          value={q.instituteOrUniversity}
                          onChange={(e) =>
                            handleUpdateQualification(
                              index,
                              'instituteOrUniversity',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Passing Year
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2012"
                          value={q.passingYear}
                          onChange={(e) =>
                            handleUpdateQualification(index, 'passingYear', e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-center"
                        />
                      </div>

                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Result / GPA
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1st Class, 3.80"
                            value={q.resultOrGpa}
                            onChange={(e) =>
                              handleUpdateQualification(index, 'resultOrGpa', e.target.value)
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(index)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Remove degree"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS & PHOTOS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  <strong>Optional Uploads:</strong> You can register the employee right away and
                  upload or update photos and documents later at any time.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Passport Photo */}
                <FileUploadCard
                  id="teacher-photo-upload"
                  label="Teacher / Staff Photo (পাসপোর্ট ছবি)"
                  bengaliLabel="পাসপোর্ট সাইজ রঙিন ছবি (JPG / PNG)"
                  accept="image/*"
                  icon={Camera}
                  existingPreviewUrl={photoUrl}
                  onFileSelected={(_file, dataUrl) => setPhotoUrl(dataUrl)}
                  onClear={() => setPhotoUrl(null)}
                />

                {/* 2. Digital Signature */}
                <FileUploadCard
                  id="teacher-signature-upload"
                  label="Digital Signature (ডিজিটাল স্বাক্ষর)"
                  bengaliLabel="কর্মচারী বা শিক্ষকের স্বাক্ষর (JPG / PNG)"
                  accept="image/*"
                  icon={PenTool}
                  existingPreviewUrl={signatureUrl}
                  onFileSelected={(_file, dataUrl) => setSignatureUrl(dataUrl)}
                  onClear={() => setSignatureUrl(null)}
                />

                {/* 3. NID Document */}
                <FileUploadCard
                  id="teacher-nid-upload"
                  label="National ID Document (জাতীয় পরিচয়পত্র)"
                  bengaliLabel="NID এর ছবি বা PDF কপি"
                  accept="image/*,.pdf,application/pdf"
                  icon={FileText}
                  existingDoc={nidDocument}
                  onFileSelected={(file, dataUrl) =>
                    setNidDocument({
                      name: file.name,
                      type: file.type || 'image/jpeg',
                      size: file.size,
                      dataUrl,
                      uploadedAt: new Date().toISOString(),
                    })
                  }
                  onClear={() => setNidDocument(null)}
                />

                {/* 4. Appointment Letter / Certificate */}
                <FileUploadCard
                  id="teacher-joining-upload"
                  label="Appointment / Joining Letter"
                  bengaliLabel="নিয়োগপত্র / প্রত্যয়নপত্র (ছবি বা PDF)"
                  accept="image/*,.pdf,application/pdf"
                  icon={FileText}
                  existingDoc={appointmentDoc}
                  onFileSelected={(file, dataUrl) =>
                    setAppointmentDoc({
                      name: file.name,
                      type: file.type || 'image/jpeg',
                      size: file.size,
                      dataUrl,
                      uploadedAt: new Date().toISOString(),
                    })
                  }
                  onClear={() => setAppointmentDoc(null)}
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {activeTab !== 'documents' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'general' ? 'qualifications' : 'documents')
                  }
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Next Step →
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Employee'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
