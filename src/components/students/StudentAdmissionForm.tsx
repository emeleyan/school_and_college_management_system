import React, { useState, useEffect } from 'react';
import {
  Student,
  StudentEnrollment,
  AcademicClass,
  AcademicSection,
  AcademicGroup,
  Institute,
  AcademicYear,
  Gender,
  BloodGroup,
  Religion,
  StudentStatus,
  StudentDocument,
} from '../../types';
import { add, update, getAll } from '../../db/indexedDB';
import { useApp } from '../../context/AppContext';
import {
  UserPlus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  FileText,
  Camera,
  FileCheck,
  Info,
  PenTool,
  Link2,
  Lock,
  Search,
  Gift,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { FileUploadCard } from './FileUploadCard';
import { generateUniqueStudentId, getTwoDigitYearPrefix } from '../../utils/studentIdGenerator';

interface StudentAdmissionFormProps {
  classes: AcademicClass[];
  sections: AcademicSection[];
  groups: AcademicGroup[];
  editingStudent?: Student | null;
  onSuccess: (savedStudent: Student) => void;
  onCancel?: () => void;
}

export const StudentAdmissionForm: React.FC<StudentAdmissionFormProps> = ({
  classes,
  sections,
  groups,
  editingStudent,
  onSuccess,
  onCancel,
}) => {
  const { activeInstitute, activeAcademicYear, logAudit, language, t } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bengaliName: '',
    gender: 'male' as Gender,
    dateOfBirth: '2011-01-01',
    bloodGroup: 'A+' as BloodGroup,
    religion: 'Islam' as Religion,
    phone: '',
    email: '',
    // Enrollment
    classId: classes[0]?.id || '',
    sectionId: '',
    groupId: '',
    rollNumber: '1',
    admissionDate: new Date().toISOString().split('T')[0],
    status: 'active' as StudentStatus,
    studentId: '',
    // Guardian
    fatherName: '',
    fatherNameBn: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherName: '',
    motherNameBn: '',
    motherPhone: '',
    motherOccupation: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Father',
    // Address
    presentAddress: '',
    permanentAddress: '',
    district: 'Dhaka',
    upazila: '',
    // Academic Details
    previousSchool: '',
    previousGPA: '',
    sscBoard: 'Dhaka',
    sscRoll: '',
    sscRegistration: '',
  });

  const [filteredSections, setFilteredSections] = useState<AcademicSection[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sibling Relationship Mapping state
  const [allInstituteStudents, setAllInstituteStudents] = useState<Student[]>([]);
  const [selectedSiblingIds, setSelectedSiblingIds] = useState<string[]>([]);
  const [isSiblingFeePayer, setIsSiblingFeePayer] = useState<boolean>(true);
  const [siblingNotes, setSiblingNotes] = useState<string>('');
  const [siblingSearchQuery, setSiblingSearchQuery] = useState<string>('');

  // Optional Documents & Media state
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [studentSignatureUrl, setStudentSignatureUrl] = useState<string | undefined>(undefined);
  const [birthCertificateDoc, setBirthCertificateDoc] = useState<StudentDocument | undefined>(undefined);
  const [parentPhotoUrl, setParentPhotoUrl] = useState<string | undefined>(undefined);
  const [parentNidDoc, setParentNidDoc] = useState<StudentDocument | undefined>(undefined);
  const [parentSignatureUrl, setParentSignatureUrl] = useState<string | undefined>(undefined);

  // Fetch all students for sibling mapping and auto-detection
  useEffect(() => {
    const fetchStudents = async () => {
      if (activeInstitute) {
        const all = await getAll<Student>('students');
        setAllInstituteStudents(all.filter((s) => s.instituteId === activeInstitute.id));
      }
    };
    fetchStudents();
  }, [activeInstitute]);

  // Initialize or populate form
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        bengaliName: editingStudent.bengaliName,
        gender: editingStudent.gender,
        dateOfBirth: editingStudent.dateOfBirth,
        bloodGroup: editingStudent.bloodGroup || 'A+',
        religion: editingStudent.religion || 'Islam',
        phone: editingStudent.phone || '',
        email: editingStudent.email || '',
        classId: editingStudent.classId,
        sectionId: editingStudent.sectionId,
        groupId: editingStudent.groupId || '',
        rollNumber: String(editingStudent.rollNumber),
        admissionDate: editingStudent.admissionDate,
        status: editingStudent.status,
        studentId: editingStudent.studentId,
        fatherName: editingStudent.guardian?.fatherName || '',
        fatherNameBn: editingStudent.guardian?.fatherNameBn || '',
        fatherPhone: editingStudent.guardian?.fatherPhone || '',
        fatherOccupation: editingStudent.guardian?.fatherOccupation || '',
        motherName: editingStudent.guardian?.motherName || '',
        motherNameBn: editingStudent.guardian?.motherNameBn || '',
        motherPhone: editingStudent.guardian?.motherPhone || '',
        motherOccupation: editingStudent.guardian?.motherOccupation || '',
        emergencyContactName: editingStudent.guardian?.emergencyContactName || '',
        emergencyContactPhone: editingStudent.guardian?.emergencyContactPhone || '',
        emergencyContactRelation: editingStudent.guardian?.emergencyContactRelation || 'Father',
        presentAddress: editingStudent.address?.presentAddress || '',
        permanentAddress: editingStudent.address?.permanentAddress || '',
        district: editingStudent.address?.district || 'Dhaka',
        upazila: editingStudent.address?.upazila || '',
        previousSchool: editingStudent.academicDetails?.previousSchool || '',
        previousGPA: editingStudent.academicDetails?.previousGPA || '',
        sscBoard: editingStudent.academicDetails?.sscBoard || 'Dhaka',
        sscRoll: editingStudent.academicDetails?.sscRoll || '',
        sscRegistration: editingStudent.academicDetails?.sscRegistration || '',
      });

      // Populate siblings
      setSelectedSiblingIds(editingStudent.siblingStudentIds || []);
      setIsSiblingFeePayer(editingStudent.isSiblingFeePayer !== false);
      setSiblingNotes(editingStudent.siblingNotes || '');

      // Populate documents & media if they exist
      setPhotoUrl(editingStudent.photoUrl);
      setStudentSignatureUrl(editingStudent.studentSignatureUrl);
      setBirthCertificateDoc(editingStudent.birthCertificateDoc);
      setParentPhotoUrl(editingStudent.parentPhotoUrl);
      setParentNidDoc(editingStudent.parentNidDoc);
      setParentSignatureUrl(editingStudent.parentSignatureUrl);
    } else {
      generateAutoStudentId();
      setSelectedSiblingIds([]);
      setIsSiblingFeePayer(true);
      setSiblingNotes('');
      setPhotoUrl(undefined);
      setStudentSignatureUrl(undefined);
      setBirthCertificateDoc(undefined);
      setParentPhotoUrl(undefined);
      setParentNidDoc(undefined);
      setParentSignatureUrl(undefined);
    }
  }, [editingStudent]);

  // Update filtered sections when classId changes
  useEffect(() => {
    if (!formData.classId) {
      setFilteredSections([]);
      return;
    }
    const secs = sections.filter((s) => s.classId === formData.classId);
    setFilteredSections(secs);

    if (!editingStudent) {
      if (secs.length > 0 && (!formData.sectionId || !secs.some((s) => s.id === formData.sectionId))) {
        setFormData((prev) => ({ ...prev, sectionId: secs[0]?.id || '' }));
        if (secs[0]?.id) calculateNextRoll(formData.classId, secs[0].id);
      }
    }
  }, [formData.classId, sections]);

  // Calculate next roll number automatically
  const calculateNextRoll = async (classId: string, sectionId: string) => {
    try {
      const allStudents = await getAll<Student>('students');
      const instStudents = allStudents.filter(
        (s) =>
          s.instituteId === activeInstitute?.id &&
          s.classId === classId &&
          s.sectionId === sectionId &&
          s.status === 'active'
      );
      if (instStudents.length > 0) {
        const maxRoll = Math.max(...instStudents.map((s) => s.rollNumber || 0));
        setFormData((prev) => ({ ...prev, rollNumber: String(maxRoll + 1) }));
      } else {
        setFormData((prev) => ({ ...prev, rollNumber: '1' }));
      }
    } catch {
      setFormData((prev) => ({ ...prev, rollNumber: '1' }));
    }
  };

  // Generate formatted student ID starting with current year (e.g. '26' for 2026 -> 260001, 260002)
  const generateAutoStudentId = async () => {
    if (!activeInstitute) return;
    try {
      const nextId = await generateUniqueStudentId(activeAcademicYear?.yearName);
      setFormData((prev) => ({ ...prev, studentId: nextId }));
    } catch {
      const yy = getTwoDigitYearPrefix(activeAcademicYear?.yearName);
      setFormData((prev) => ({ ...prev, studentId: `${yy}0001` }));
    }
  };

  const handleClassChange = (newClassId: string) => {
    setFormData((prev) => ({ ...prev, classId: newClassId }));
    const secs = sections.filter((s) => s.classId === newClassId);
    if (secs.length > 0 && secs[0]?.id) {
      setFormData((prev) => ({ ...prev, sectionId: secs[0].id }));
      calculateNextRoll(newClassId, secs[0].id);
    } else {
      setFormData((prev) => ({ ...prev, sectionId: '' }));
    }
  };

  const handleSectionChange = (newSecId: string) => {
    setFormData((prev) => ({ ...prev, sectionId: newSecId }));
    calculateNextRoll(formData.classId, newSecId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitute) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validations
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMsg('Both First Name and Last Name are required.');
      return;
    }
    if (!formData.classId) {
      setErrorMsg('Please select a class for enrollment.');
      return;
    }
    if (!formData.sectionId) {
      setErrorMsg('Please select a section for enrollment.');
      return;
    }
    if (!formData.rollNumber || Number(formData.rollNumber) <= 0) {
      setErrorMsg('Please enter a valid positive Roll Number.');
      return;
    }
    if (!formData.fatherName.trim()) {
      setErrorMsg("Father's Name is required for guardian registration.");
      return;
    }
    if (!formData.emergencyContactPhone.trim()) {
      setErrorMsg('Emergency contact phone number is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const yearId = activeAcademicYear?.id || `year_${activeInstitute.id}_2026`;
      const roll = Number(formData.rollNumber);

      // Check unique roll number in same class & section
      const allStudents = await getAll<Student>('students');
      const conflict = allStudents.find(
        (s) =>
          s.instituteId === activeInstitute.id &&
          s.classId === formData.classId &&
          s.sectionId === formData.sectionId &&
          s.rollNumber === roll &&
          (!editingStudent || s.id !== editingStudent.id) &&
          s.status === 'active'
      );

      if (conflict) {
        setErrorMsg(
          `Roll number ${roll} is already assigned to ${conflict.firstName} ${conflict.lastName} in this section. Please assign a different roll number.`
        );
        setIsSubmitting(false);
        return;
      }

      // Determine permanent unique student ID
      let finalStudentId = formData.studentId.trim();
      if (!editingStudent) {
        // Enforce uniqueness across all students in database
        const exists = allStudents.some(
          (s) => s.studentId && s.studentId.trim().toLowerCase() === finalStudentId.toLowerCase()
        );
        if (exists || !finalStudentId) {
          finalStudentId = await generateUniqueStudentId(activeAcademicYear?.yearName);
        }
      } else {
        // ID is permanent for student tenure
        finalStudentId = editingStudent.studentId;
      }

      if (editingStudent) {
        const updated: Student = {
          ...editingStudent,
          studentId: finalStudentId,
          classId: formData.classId,
          sectionId: formData.sectionId,
          groupId: formData.groupId || undefined,
          rollNumber: roll,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          bengaliName: formData.bengaliName.trim() || `${formData.firstName} ${formData.lastName}`,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup,
          religion: formData.religion,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          admissionDate: formData.admissionDate,
          status: formData.status,
          address: {
            presentAddress: formData.presentAddress.trim(),
            permanentAddress: formData.permanentAddress.trim() || formData.presentAddress.trim(),
            district: formData.district.trim(),
            upazila: formData.upazila.trim() || undefined,
          },
          guardian: {
            fatherName: formData.fatherName.trim(),
            fatherNameBn: formData.fatherNameBn.trim() || undefined,
            fatherPhone: formData.fatherPhone.trim() || undefined,
            fatherOccupation: formData.fatherOccupation.trim() || undefined,
            motherName: formData.motherName.trim(),
            motherNameBn: formData.motherNameBn.trim() || undefined,
            motherPhone: formData.motherPhone.trim() || undefined,
            motherOccupation: formData.motherOccupation.trim() || undefined,
            emergencyContactName:
              formData.emergencyContactName.trim() || formData.fatherName.trim(),
            emergencyContactPhone: formData.emergencyContactPhone.trim(),
            emergencyContactRelation: formData.emergencyContactRelation.trim() || 'Father',
          },
          academicDetails: {
            previousSchool: formData.previousSchool.trim() || undefined,
            previousGPA: formData.previousGPA.trim() || undefined,
            sscBoard: formData.sscBoard.trim() || undefined,
            sscRoll: formData.sscRoll.trim() || undefined,
            sscRegistration: formData.sscRegistration.trim() || undefined,
          },
          // Sibling Relationship & Fee Policy
          siblingStudentIds: selectedSiblingIds,
          isSiblingFeePayer: isSiblingFeePayer,
          siblingNotes: siblingNotes.trim() || undefined,
          photoUrl: photoUrl || undefined,
          studentSignatureUrl: studentSignatureUrl || undefined,
          birthCertificateDoc: birthCertificateDoc || undefined,
          parentPhotoUrl: parentPhotoUrl || undefined,
          parentNidDoc: parentNidDoc || undefined,
          parentSignatureUrl: parentSignatureUrl || undefined,
          updatedAt: new Date().toISOString(),
        };

        await update('students', updated);

        // Synchronize linked siblings' siblingStudentIds
        for (const sibId of selectedSiblingIds) {
          const target = allStudents.find((s) => s.studentId === sibId || s.id === sibId);
          if (target && target.id !== updated.id) {
            const existingList = target.siblingStudentIds || [];
            if (!existingList.includes(updated.studentId)) {
              await update('students', {
                ...target,
                siblingStudentIds: [...existingList, updated.studentId],
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        await logAudit(
          'UPDATE_STUDENT',
          'students',
          `Updated student bio-data: ${updated.firstName} ${updated.lastName} (ID: ${updated.studentId})`,
          updated.id
        );

        setSuccessMsg(`Student "${updated.firstName} ${updated.lastName}" updated successfully.`);
        onSuccess(updated);
      } else {
        const studentUniqueId = `std_${activeInstitute.id}_${Date.now()}`;
        const newStudent: Student = {
          id: studentUniqueId,
          studentId: finalStudentId,
          instituteId: activeInstitute.id,
          academicYearId: yearId,
          classId: formData.classId,
          sectionId: formData.sectionId,
          groupId: formData.groupId || undefined,
          rollNumber: roll,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          bengaliName: formData.bengaliName.trim() || `${formData.firstName} ${formData.lastName}`,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup,
          religion: formData.religion,
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          admissionDate: formData.admissionDate,
          status: formData.status,
          address: {
            presentAddress: formData.presentAddress.trim(),
            permanentAddress: formData.permanentAddress.trim() || formData.presentAddress.trim(),
            district: formData.district.trim(),
            upazila: formData.upazila.trim() || undefined,
          },
          guardian: {
            fatherName: formData.fatherName.trim(),
            fatherNameBn: formData.fatherNameBn.trim() || undefined,
            fatherPhone: formData.fatherPhone.trim() || undefined,
            fatherOccupation: formData.fatherOccupation.trim() || undefined,
            motherName: formData.motherName.trim(),
            motherNameBn: formData.motherNameBn.trim() || undefined,
            motherPhone: formData.motherPhone.trim() || undefined,
            motherOccupation: formData.motherOccupation.trim() || undefined,
            emergencyContactName:
              formData.emergencyContactName.trim() || formData.fatherName.trim(),
            emergencyContactPhone: formData.emergencyContactPhone.trim(),
            emergencyContactRelation: formData.emergencyContactRelation.trim() || 'Father',
          },
          academicDetails: {
            previousSchool: formData.previousSchool.trim() || undefined,
            previousGPA: formData.previousGPA.trim() || undefined,
            sscBoard: formData.sscBoard.trim() || undefined,
            sscRoll: formData.sscRoll.trim() || undefined,
            sscRegistration: formData.sscRegistration.trim() || undefined,
          },
          // Sibling Relationship & Fee Policy
          siblingStudentIds: selectedSiblingIds,
          isSiblingFeePayer: isSiblingFeePayer,
          siblingNotes: siblingNotes.trim() || undefined,
          photoUrl: photoUrl || undefined,
          studentSignatureUrl: studentSignatureUrl || undefined,
          birthCertificateDoc: birthCertificateDoc || undefined,
          parentPhotoUrl: parentPhotoUrl || undefined,
          parentNidDoc: parentNidDoc || undefined,
          parentSignatureUrl: parentSignatureUrl || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await add('students', newStudent);

        // Synchronize linked siblings' siblingStudentIds
        for (const sibId of selectedSiblingIds) {
          const target = allStudents.find((s) => s.studentId === sibId || s.id === sibId);
          if (target && target.id !== newStudent.id) {
            const existingList = target.siblingStudentIds || [];
            if (!existingList.includes(newStudent.studentId)) {
              await update('students', {
                ...target,
                siblingStudentIds: [...existingList, newStudent.studentId],
                updatedAt: new Date().toISOString(),
              });
            }
          }
        }

        // Add enrollment record
        const enrollment: StudentEnrollment = {
          id: `enr_${newStudent.id}_${yearId}`,
          studentId: newStudent.id,
          instituteId: activeInstitute.id,
          academicYearId: yearId,
          classId: newStudent.classId,
          sectionId: newStudent.sectionId,
          groupId: newStudent.groupId,
          rollNumber: newStudent.rollNumber,
          enrollmentDate: newStudent.admissionDate,
          status: 'enrolled',
          createdAt: new Date().toISOString(),
        };
        await add('studentEnrollments', enrollment);

        await logAudit(
          'ENROLL_STUDENT',
          'students',
          `Admitted new student: ${newStudent.firstName} ${newStudent.lastName} (ID: ${newStudent.studentId}, Roll: ${newStudent.rollNumber})`,
          newStudent.id
        );

        setSuccessMsg(
          `Student "${newStudent.firstName} ${newStudent.lastName}" successfully registered with ID ${newStudent.studentId}.`
        );
        onSuccess(newStudent);
      }
    } catch (err: any) {
      console.error('Error admitting student:', err);
      setErrorMsg(err.message || 'Failed to save student record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. Academic Enrollment Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Academic Enrollment &amp; Class Placement</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Active Year: {activeAcademicYear?.yearName || '2026'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Enrollment Class *
            </label>
            <select
              value={formData.classId}
              onChange={(e) => handleClassChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.bengaliName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assigned Section *
            </label>
            <select
              value={formData.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="">Select Section</option>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.bengaliName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Roll Number *
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={formData.rollNumber}
              onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Stream / Group
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="">General / None</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.bengaliName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Admission Date
            </label>
            <input
              type="date"
              value={formData.admissionDate}
              onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Student ID (ইউনিক আইডি)</span>
              {editingStudent ? (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" /> Permanent
                </span>
              ) : (
                <button
                  type="button"
                  onClick={generateAutoStudentId}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" /> Re-generate
                </button>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.studentId}
                readOnly={!!editingStudent}
                onChange={(e) => {
                  if (!editingStudent) {
                    setFormData({ ...formData, studentId: e.target.value.trim() });
                  }
                }}
                placeholder="e.g. 260001"
                className={`w-full px-3 py-2 ${
                  editingStudent
                    ? 'bg-slate-100 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                } border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-hidden`}
              />
              {editingStudent && (
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {editingStudent
                ? 'ভর্তির শুরু থেকে শিক্ষার্থীর একটিই স্থায়ী আইডি থাকে।'
                : 'চলতি বছরের শেষ ২ সংখ্যা (যেমন ২৬) দিয়ে শুরু হওয়া আজীবন অপরিবর্তনযোগ্য ইউনিক আইডি।'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="active">Active (নিয়মিত)</option>
              <option value="graduated">Graduated (উত্তীর্ণ)</option>
              <option value="transferred">Transferred (ছাড়পত্রপ্রাপ্ত)</option>
              <option value="suspended">Suspended (স্থগিত)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Personal Information Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Student Bio-Data &amp; Identity</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              First Name (English) *
            </label>
            <input
              type="text"
              placeholder="e.g. Tanvir"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Last Name (English) *
            </label>
            <input
              type="text"
              placeholder="e.g. Ahmed"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name in Bengali (বাংলা নাম)
            </label>
            <input
              type="text"
              placeholder="যেমন: তানভীর আহমেদ"
              value={formData.bengaliName}
              onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="male">Male (ছাত্র)</option>
              <option value="female">Female (ছাত্রী)</option>
              <option value="other">Other (অন্যান্য)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Blood Group
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Religion
            </label>
            <select
              value={formData.religion}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value as Religion })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="Islam">Islam</option>
              <option value="Hinduism">Hinduism</option>
              <option value="Buddhism">Buddhism</option>
              <option value="Christianity">Christianity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Mobile (Optional)
            </label>
            <input
              type="text"
              placeholder="+8801..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student Email (Optional)
            </label>
            <input
              type="email"
              placeholder="student@school.local"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 3. Guardian Details */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Parents &amp; Guardian Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Father's Name (English) *
            </label>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
              required
              placeholder="e.g. Md. Shahidul Islam"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              পিতার নাম (বাংলা)
            </label>
            <input
              type="text"
              value={formData.fatherNameBn}
              onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
              placeholder="উদাঃ মোঃ শহিদুল ইসলাম"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Father's Mobile
            </label>
            <input
              type="text"
              placeholder="+8801..."
              value={formData.fatherPhone}
              onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Father's Occupation
            </label>
            <input
              type="text"
              placeholder="e.g. Businessman"
              value={formData.fatherOccupation}
              onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mother's Name (English)
            </label>
            <input
              type="text"
              value={formData.motherName}
              onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
              placeholder="e.g. Nasreen Begum"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              মাতার নাম (বাংলা)
            </label>
            <input
              type="text"
              value={formData.motherNameBn}
              onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
              placeholder="উদাঃ নাসরিন বেগম"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mother's Mobile
            </label>
            <input
              type="text"
              placeholder="+8801..."
              value={formData.motherPhone}
              onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mother's Occupation
            </label>
            <input
              type="text"
              placeholder="e.g. Teacher"
              value={formData.motherOccupation}
              onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div className="sm:col-span-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  placeholder="Primary contact"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Contact Phone *
                </label>
                <input
                  type="text"
                  placeholder="+8801..."
                  value={formData.emergencyContactPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relation to Student
                </label>
                <input
                  type="text"
                  value={formData.emergencyContactRelation}
                  onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Sibling Relationship Mapping & Fee Waiver Policy */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
            <HeartHandshake className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Sibling Mapping &amp; Fee Policy (সহোদর ভাই/বোন ও ফি মওকুফ সুবিধা)</span>
          </h3>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            স্কুল নীতি: ১ জন ফি প্রদানকারী, বাকিরা সম্পূর্ণ ফ্রি
          </span>
        </div>

        {/* Policy Explanatory Notice */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-300">
              বিদ্যালয়ের সহোদর ফি নীতিমালা (Sibling Discount Rule):
            </p>
            <p>
              একই পিতা-মাতার একাধিক সন্তান অত্র প্রতিষ্ঠানে ভর্তি থাকলে যেকোনো <strong>১ জনের</strong> মাসিক বেতন দিতে হবে এবং অন্য সকল ভাই/বোনের মাসিক বেতন <strong>সম্পূর্ণ ফ্রি (১০০% মওকুফ)</strong> হবে। নিচে অন্যান্য ভাই/বোনদের লিঙ্ক করুন এবং কাকে ফি প্রদানকারী রাখবেন তা নির্ধারণ করুন।
            </p>
          </div>
        </div>

        {/* Auto-detected Family Suggestions */}
        {(() => {
          const fatherTrimmed = formData.fatherName.trim().toLowerCase();
          const phoneTrimmed = formData.emergencyContactPhone.trim();
          const detected = allInstituteStudents.filter((st) => {
            if (editingStudent && st.id === editingStudent.id) return false;
            if (selectedSiblingIds.includes(st.studentId) || selectedSiblingIds.includes(st.id)) return false;
            const sameFather = fatherTrimmed.length > 2 && st.guardian?.fatherName?.trim().toLowerCase() === fatherTrimmed;
            const samePhone = phoneTrimmed.length > 5 && (
              st.guardian?.emergencyContactPhone === phoneTrimmed ||
              st.guardian?.fatherPhone === phoneTrimmed
            );
            return sameFather || samePhone;
          });

          if (detected.length === 0) return null;

          return (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>অভিভাবকের নামের ভিত্তিতে সম্ভাব্য সহোদর শিক্ষার্থী পাওয়া গেছে ({detected.length} জন):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detected.map((st) => {
                  const stClass = classes.find((c) => c.id === st.classId);
                  return (
                    <div
                      key={st.id}
                      className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {st.firstName} {st.lastName} ({st.bengaliName || ''})
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: <span className="font-bold text-blue-600 dark:text-blue-400">{st.studentId}</span> • শ্রেণি: {stClass?.name || 'Class'} • রোল: {st.rollNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSiblingIds((prev) => [...prev, st.studentId])}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Link2 className="w-3 h-3" /> যুক্ত করুন
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Sibling Search & Manual Link */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            অন্যান্য ভাই/বোন খুঁজুন ও যুক্ত করুন (Student ID বা নাম দিয়ে)
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর আইডি (যেমন 260001), নাম অথবা মোবাইল লিখে সার্চ করুন..."
              value={siblingSearchQuery}
              onChange={(e) => setSiblingSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          {siblingSearchQuery.trim().length > 0 && (
            <div className="max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/90 rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              {allInstituteStudents
                .filter((st) => {
                  if (editingStudent && st.id === editingStudent.id) return false;
                  if (selectedSiblingIds.includes(st.studentId) || selectedSiblingIds.includes(st.id)) return false;
                  const q = siblingSearchQuery.toLowerCase();
                  return (
                    st.studentId.toLowerCase().includes(q) ||
                    st.firstName.toLowerCase().includes(q) ||
                    st.lastName.toLowerCase().includes(q) ||
                    (st.bengaliName && st.bengaliName.includes(q)) ||
                    (st.guardian?.fatherPhone && st.guardian.fatherPhone.includes(q))
                  );
                })
                .slice(0, 6)
                .map((st) => {
                  const stClass = classes.find((c) => c.id === st.classId);
                  return (
                    <div
                      key={st.id}
                      className="p-2 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {st.firstName} {st.lastName}
                        </span>
                        <span className="ml-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {st.studentId}
                        </span>
                        <span className="ml-2 text-slate-500 dark:text-slate-400">
                          ({stClass?.name || 'Class'}, Roll {st.rollNumber})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSiblingIds((prev) => [...prev, st.studentId]);
                          setSiblingSearchQuery('');
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" /> যুক্ত করুন
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Currently Linked Siblings List */}
        {selectedSiblingIds.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              সংযুক্ত সহোদর ভাই/বোন ({selectedSiblingIds.length} জন):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedSiblingIds.map((sibId) => {
                const sib = allInstituteStudents.find(
                  (s) => s.studentId === sibId || s.id === sibId
                );
                const sibClass = sib ? classes.find((c) => c.id === sib.classId) : undefined;
                return (
                  <div
                    key={sibId}
                    className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                        {sib?.firstName?.[0] || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {sib ? `${sib.firstName} ${sib.lastName}` : sibId}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: <span className="font-semibold text-blue-600">{sib?.studentId || sibId}</span> • {sibClass?.name || 'Class'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSiblingIds((prev) => prev.filter((id) => id !== sibId))
                      }
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors text-xs"
                      title="Remove sibling link"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            এখনও কোনো সহোদর ভাই/বোন যুক্ত করা হয়নি। যদি পরিবারে অন্য ভাই/বোন না থাকে তবে এটি খালি রাখুন।
          </p>
        )}

        {/* Fee Payer Designation for This Student */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-3">
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            এই শিক্ষার্থীর ফি নীতি নির্ধারণ (Monthly Fee Status for this Student)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                isSiblingFeePayer
                  ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="isSiblingFeePayer"
                checked={isSiblingFeePayer}
                onChange={() => setIsSiblingFeePayer(true)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>প্রধান ফি প্রদানকারী (Primary Fee Payer)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  এই শিক্ষার্থীর নিয়মিত মাসিক টিউশন ফি প্রযোজ্য হবে।
                </p>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                !isSiblingFeePayer
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="isSiblingFeePayer"
                checked={!isSiblingFeePayer}
                onChange={() => setIsSiblingFeePayer(false)}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সহোদর সুবিধা: মাসিক বেতন সম্পূর্ণ ফ্রি (১০০% মওকুফ)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  অন্য ভাই/বোন ফি প্রদানকারী বিধায় এই শিক্ষার্থীর মাসিক বেতন ৳০ হবে।
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              সহোদর সম্পর্ক বিবরণী (ঐচ্ছিক মন্তব্য)
            </label>
            <input
              type="text"
              placeholder="যেমন: বড় ভাই রাফি (Class 9, ID: 260002) ফি প্রদানকারী"
              value={siblingNotes}
              onChange={(e) => setSiblingNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 5. Address Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
          <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Address &amp; Geographic Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Present Address *
            </label>
            <textarea
              rows={2}
              value={formData.presentAddress}
              onChange={(e) => setFormData({ ...formData, presentAddress: e.target.value })}
              placeholder="House, Road, Block, Area"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Permanent Address
            </label>
            <textarea
              rows={2}
              value={formData.permanentAddress}
              onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
              placeholder="Leave empty if same as present"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              District (জেলা)
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Upazila / Thana (উপজেলা / থানা)
            </label>
            <input
              type="text"
              value={formData.upazila}
              onChange={(e) => setFormData({ ...formData, upazila: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* 5. Documents & Media Attachments (Completely Optional) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              5. Documents &amp; Media Attachments
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Optional / ঐচ্ছিক
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Upload now or submit later anytime
          </span>
        </div>

        {/* Informational Callout Notice */}
        <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 rounded-xl flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
          <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Flexible Document Submission / নমনীয় কাগজপত্র জমা
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This photo and file upload section is <strong>entirely optional</strong>. You can admit the student right away without any documents, and easily upload student &amp; parent photos, birth certificates, and NID cards later whenever available via <strong>Edit Student</strong>.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              এই ছবি ও ডকুমেন্টস আপলোড সম্পূর্ণ ঐচ্ছিক। আপনি চাইলে এখনই শিক্ষার্থী ভর্তি সম্পন্ন করতে পারেন এবং পরবর্তীতে যেকোনো সময় ছবি ও ফাইল যুক্ত করতে পারবেন।
            </p>
          </div>
        </div>

        {/* Group A: Student Documents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span>Student Credentials &amp; Identity (শিক্ষার্থীর কাগজপত্র ও ছবি)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Student Photo */}
            <FileUploadCard
              id="student-photo-upload"
              label="Student's Photo"
              bengaliLabel="শিক্ষার্থীর ছবি (পাসপোর্ট সাইজ)"
              accept="image/*"
              allowPdf={false}
              value={photoUrl}
              onChange={(val) => setPhotoUrl(val ? val.dataUrl : undefined)}
              helperText="Passport photo (JPG, PNG - Max 4MB)"
            />

            {/* 2. Student Birth Certificate */}
            <FileUploadCard
              id="student-birth-cert-upload"
              label="Student's Birth Certificate"
              bengaliLabel="শিক্ষার্থীর জন্ম নিবন্ধন সনদ"
              accept="image/*,application/pdf"
              allowPdf={true}
              value={birthCertificateDoc}
              onChange={(val) =>
                setBirthCertificateDoc(
                  val
                    ? {
                        name: val.name,
                        type: val.type,
                        size: val.size,
                        dataUrl: val.dataUrl,
                        uploadedAt: new Date().toISOString(),
                      }
                    : undefined
                )
              }
              helperText="Photo or PDF document (Max 4.5MB)"
            />

            {/* 3. Student Signature */}
            <FileUploadCard
              id="student-signature-upload"
              label="Student's Signature"
              bengaliLabel="শিক্ষার্থীর স্বাক্ষর"
              accept="image/*"
              allowPdf={false}
              isSignature={true}
              value={studentSignatureUrl}
              onChange={(val) => setStudentSignatureUrl(val ? val.dataUrl : undefined)}
              helperText="Signature image (JPG, PNG - Max 2MB)"
            />
          </div>
        </div>

        {/* Group B: Parents / Guardian Documents */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Parents / Guardian Credentials (অভিভাবকের কাগজপত্র ও ছবি)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 4. Parents Photo */}
            <FileUploadCard
              id="parent-photo-upload"
              label="Parents / Guardian Photo"
              bengaliLabel="পিতা/মাতা/অভিভাবকের ছবি"
              accept="image/*"
              allowPdf={false}
              value={parentPhotoUrl}
              onChange={(val) => setParentPhotoUrl(val ? val.dataUrl : undefined)}
              helperText="Guardian photo (JPG, PNG - Max 4MB)"
            />

            {/* 5. Parents NID */}
            <FileUploadCard
              id="parent-nid-upload"
              label="Parents / Guardian NID"
              bengaliLabel="অভিভাবকের জাতীয় পরিচয়পত্র (NID)"
              accept="image/*,application/pdf"
              allowPdf={true}
              value={parentNidDoc}
              onChange={(val) =>
                setParentNidDoc(
                  val
                    ? {
                        name: val.name,
                        type: val.type,
                        size: val.size,
                        dataUrl: val.dataUrl,
                        uploadedAt: new Date().toISOString(),
                      }
                    : undefined
                )
              }
              helperText="NID Photo or PDF document (Max 4.5MB)"
            />

            {/* 6. Parents Signature */}
            <FileUploadCard
              id="parent-signature-upload"
              label="Parents / Guardian Signature"
              bengaliLabel="পিতা/মাতা/অভিভাবকের স্বাক্ষর"
              accept="image/*"
              allowPdf={false}
              isSignature={true}
              value={parentSignatureUrl}
              onChange={(val) => setParentSignatureUrl(val ? val.dataUrl : undefined)}
              helperText="Signature image (JPG, PNG - Max 2MB)"
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{editingStudent ? 'Update Student Record' : 'Register & Admit Student'}</span>
        </button>
      </div>
    </form>
  );
};
