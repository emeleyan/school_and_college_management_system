/**
 * Core Types for School & College Management ERP (Phase 1 Foundation)
 */

export type InstituteType = 'school' | 'college';

export type InstituteHeadRole =
  | 'principal'
  | 'vice_principal'
  | 'acting_principal'
  | 'headmaster'
  | 'assistant_headmaster'
  | 'acting_headmaster';

export interface InstituteSignatory {
  id: string;
  role: InstituteHeadRole;
  name: string;
  bengaliName?: string;
  title: string;
  bengaliTitle?: string;
  signatureUrl?: string;
  isDefault?: boolean;
}

export interface Institute {
  id: string;
  type: InstituteType;
  name: string;
  bengaliName: string;
  code: string;
  eiin: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  establishedYear: string;
  principalName: string;
  // Phase 13: Logo, Institutional Head Hierarchy & Digital Signatures
  logoUrl?: string;
  headRole?: InstituteHeadRole;
  headTitle?: string;
  headTitleBengali?: string;
  vicePrincipalName?: string;
  actingPrincipalName?: string;
  signatureUrl?: string; // Digital signature of primary in-charge head
  viceSignatureUrl?: string; // Digital signature of Vice-Principal
  actingSignatureUrl?: string; // Digital signature of Acting Principal
  educationBoard?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  instituteId: string; // Belongs to specific institute or 'both'
  yearName: string; // e.g., '2026'
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PermissionAction =
  | 'view'
  | 'add'
  | 'edit'
  | 'delete'
  | 'print'
  | 'export'
  | 'import'
  | 'approve'
  | 'manage_settings';

export type ERPModule =
  | 'dashboard'
  | 'institute'
  | 'students'
  | 'teachers'
  | 'academic'
  | 'attendance'
  | 'examination'
  | 'fees'
  | 'accounts'
  | 'library'
  | 'inventory'
  | 'transport'
  | 'certificates'
  | 'idcards'
  | 'notices'
  | 'calendar'
  | 'reports'
  | 'users'
  | 'settings'
  | 'backup'
  | 'audit';

export interface Role {
  id: string;
  name: string;
  bengaliName: string;
  description: string;
  isSystem: boolean;
  permissions: Record<ERPModule, PermissionAction[]>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  bengaliName?: string;
  email?: string;
  mobile?: string;
  roleId: string;
  instituteAccess: 'all' | string[]; // 'all' or array of institute IDs
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  userRole?: string;
  action: string;
  module: ERPModule | 'auth' | 'setup' | 'system';
  recordId?: string;
  instituteId?: string;
  details: string;
  timestamp: string;
}

export interface AppSettings {
  id: string; // 'global'
  appName: string;
  bengaliAppName: string;
  defaultLanguage: 'en' | 'bn';
  theme: 'light' | 'dark';
  sessionTimeoutMinutes: number;
  enableAutoBackup: boolean;
  autoBackupInterval: 'daily' | 'weekly';
  autoBackupTime?: string; // default '23:59' (11:59 PM)
  lastAutoBackupDate?: string;
  isLiveMode?: boolean; // true = Live Production Mode (Demo features locked), false = Testing/Demo Mode
  hasDemoData?: boolean;
  studentIdPrefixSchool: string;
  studentIdPrefixCollege: string;
  receiptPrefix: string;
  certificatePrefix: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Phase 2: Academic Management Types
 */
export interface AcademicClass {
  id: string;
  instituteId: string;
  name: string;
  bengaliName: string;
  numericLevel: number;
  hasGroups: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type ClassItem = AcademicClass;

export interface AcademicSection {
  id: string;
  instituteId: string;
  classId: string;
  name: string;
  bengaliName: string;
  shiftId?: string;
  roomNumber?: string;
  capacity: number;
  classTeacherId?: string;
  classTeacherName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type SectionItem = AcademicSection;

export interface AcademicGroup {
  id: string;
  instituteId: string;
  name: string;
  bengaliName: string;
  code: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicShift {
  id: string;
  instituteId: string;
  name: string;
  bengaliName: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AcademicDepartment {
  id: string;
  instituteId: string;
  name: string;
  bengaliName: string;
  code: string;
  headName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type SubjectType = 'compulsory' | 'elective' | 'optional_4th';

export interface AcademicSubject {
  id: string;
  instituteId: string;
  classId: string;
  groupId?: string;
  name: string;
  bengaliName: string;
  code: string;
  type: SubjectType;
  fullMarks: number;
  theoryMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  passMarks: number;
  hasPractical: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type SubjectItem = AcademicSubject;

export interface MasterSubject {
  id: string;
  instituteId: string;
  name: string;
  bengaliName: string;
  code: string;
  type: SubjectType;
  defaultType?: string;
  category?: string;
  fullMarks: number;
  theoryMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  passMarks: number;
  hasPractical: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ClassSyllabusItem {
  id: string;
  instituteId: string;
  academicYearId?: string;
  classId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  termType: '1st_term' | 'half_yearly' | 'final' | 'pre_test' | 'test' | 'model_test' | string;
  termName: string;
  chapters: string; // e.g., "Chapters 1-4, 7"
  topics: string; // Comprehensive topics description
  marksDistribution?: string; // CQ: 70, MCQ: 30
  referenceBooks?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Saturday';

export interface ClassRoutinePeriod {
  id: string;
  instituteId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherName?: string;
  roomNumber?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 3: STUDENT MANAGEMENT TYPES
// ==========================================

export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
export type Religion = 'Islam' | 'Hinduism' | 'Buddhism' | 'Christianity' | 'Other';
export type StudentStatus = 'active' | 'graduated' | 'transferred' | 'suspended';

export interface StudentGuardian {
  fatherName: string;
  fatherNameBn?: string;
  fatherPhone?: string;
  fatherOccupation?: string;
  motherName: string;
  motherNameBn?: string;
  motherPhone?: string;
  motherOccupation?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
}

export interface StudentAddress {
  presentAddress: string;
  permanentAddress: string;
  district?: string;
  upazila?: string;
}

export interface StudentAcademicDetails {
  previousSchool?: string;
  previousGPA?: string;
  sscBoard?: string;
  sscRoll?: string;
  sscRegistration?: string;
  fourthSubjectId?: string;
  selectedSubjectIds?: string[];
}

export interface StudentDocument {
  name: string;
  type: string; // e.g. 'application/pdf', 'image/jpeg', 'image/png', 'image/webp'
  size: number; // in bytes
  dataUrl: string; // base64 data URL
  uploadedAt: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. SCH-2026-0001
  instituteId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string;
  rollNumber: number;
  firstName: string;
  lastName: string;
  bengaliName: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup?: BloodGroup;
  religion?: Religion;
  photoUrl?: string;
  studentSignatureUrl?: string;
  birthCertificateDoc?: StudentDocument;
  parentPhotoUrl?: string;
  parentNidDoc?: StudentDocument;
  parentSignatureUrl?: string;
  admissionDate: string;
  phone?: string;
  email?: string;
  address: StudentAddress;
  guardian: StudentGuardian;
  academicDetails?: StudentAcademicDetails;
  shift?: string;
  // Sibling relationship mapping & school fee concession policy
  siblingGroupKey?: string;
  siblingStudentIds?: string[]; // Array of other linked sibling student IDs (or student UUIDs)
  isSiblingFeePayer?: boolean; // true if this student is the designated paying sibling; false if secondary sibling (free monthly fee)
  siblingNotes?: string;
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  instituteId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  groupId?: string;
  rollNumber: number;
  promotedFromEnrollmentId?: string;
  enrollmentDate: string;
  status: 'enrolled' | 'promoted' | 'repeated' | 'transferred';
  createdAt: string;
}

// ==========================================
// PHASE 4: TEACHER & STAFF MANAGEMENT TYPES
// ==========================================

export type TeacherEmploymentNature =
  | 'permanent'
  | 'contractual'
  | 'part_time'
  | 'mpo'
  | 'non_mpo';

export type TeacherStatus =
  | 'active'
  | 'on_leave'
  | 'transferred'
  | 'resigned'
  | 'retired';

export interface EducationalQualification {
  id: string;
  degreeTitle: string; // e.g. SSC, HSC, B.Sc (Hons), M.Sc, B.Ed, M.Ed, Ph.D
  majorSubject?: string; // e.g. Mathematics, Physics, English, Bangla
  instituteOrUniversity: string; // e.g. University of Dhaka, Rajshahi Board
  passingYear: string;
  resultOrGpa: string; // e.g. 1st Class, 3.80, GPA 5.00
}

export interface TeacherDocument {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface Teacher {
  id: string;
  instituteId: string;
  teacherId: string; // e.g. FAC-SCH-0001, STF-SCH-0002
  employeeType: 'teacher' | 'staff';
  indexNumber?: string; // MPO Index Number

  // Personal Info
  firstName: string;
  lastName: string;
  bengaliName?: string;
  fatherName?: string;
  fatherNameBn?: string;
  motherName?: string;
  motherNameBn?: string;
  gender: Gender;
  dateOfBirth: string;
  bloodGroup?: BloodGroup;
  religion: Religion;
  maritalStatus?: 'single' | 'married' | 'other';
  nationalId?: string; // NID Number

  // Contact Info
  phone: string;
  email?: string;
  emergencyContactPhone?: string;
  presentAddress: string;
  permanentAddress?: string;

  // Employment Details
  designation: string; // Principal, Senior Teacher, Assistant Teacher, Lecturer, Accountant, etc.
  bengaliDesignation?: string;
  departmentId?: string;
  departmentName?: string;
  employmentNature: TeacherEmploymentNature;
  joiningDate: string;
  experienceYears?: number;
  salaryGrade?: string;
  basicSalary?: number;
  bankAccountNumber?: string;
  bankName?: string;

  // Qualifications & Specialization
  qualifications: EducationalQualification[];
  specialization?: string;

  // Media & Attached Documents
  photoUrl?: string;
  signatureUrl?: string;
  nidDocument?: TeacherDocument;
  educationalDoc?: TeacherDocument;
  appointmentLetterDoc?: TeacherDocument;

  // Status & Link
  status: TeacherStatus;
  userId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectTeacherAssignment {
  id: string;
  instituteId: string;
  academicYearId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  subjectId: string;
  subjectName: string;
  periodsPerWeek?: number;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// Phase 5: Attendance & Leave Management Types
// ----------------------------------------------------

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'excused';

export interface StudentAttendanceRecord {
  id: string;
  instituteId: string;
  academicYearId: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  entryTime?: string; // e.g. "08:15"
  exitTime?: string;
  subjectId?: string; // Optional for subject-wise period attendance
  subjectName?: string;
  periodNo?: number;
  remarks?: string;
  smsSent?: boolean;
  smsSentAt?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherAttendanceRecord {
  id: string;
  instituteId: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  designation: string;
  departmentName?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  inTime?: string; // e.g. "08:25"
  outTime?: string; // e.g. "16:10"
  lateMinutes?: number;
  punchMethod?: 'manual' | 'biometric' | 'rfid' | 'qr';
  remarks?: string;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'casual' | 'medical' | 'maternity' | 'earned' | 'duty' | 'special' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveApplication {
  id: string;
  instituteId: string;
  academicYearId?: string;
  applicantType: 'student' | 'teacher' | 'staff';
  applicantId: string;
  applicantName: string;
  identifier: string; // Roll number or Employee ID
  groupOrDesignation: string; // e.g. Class 10 (A) or Senior Teacher
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  emergencyContact?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewRemarks?: string;
  appliedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BiometricPunchLog {
  id: string;
  instituteId: string;
  deviceId: string;
  deviceName: string;
  userType: 'student' | 'teacher' | 'staff';
  userIdentifier: string; // Employee ID or Student ID
  userName: string;
  userId?: string;
  timestamp: string; // Full ISO timestamp
  timeStr: string; // HH:mm:ss
  dateStr: string; // YYYY-MM-DD
  punchType: 'in' | 'out';
  verificationMode: 'fingerprint' | 'facial' | 'rfid' | 'manual';
  status: 'synced' | 'pending';
  createdAt: string;
}

export interface SMSAlertLog {
  id: string;
  instituteId: string;
  date: string;
  recipientPhone: string;
  recipientName: string;
  studentName: string;
  rollNumber: number;
  className: string;
  sectionName: string;
  message: string;
  status: 'sent' | 'queued' | 'failed';
  sentAt: string;
}

// ----------------------------------------------------
// Phase 6: Examination & Result Management Types
// ----------------------------------------------------

export type ExamTermType = 'half_yearly' | 'final' | 'pre_test' | 'test' | 'model_test' | 'class_test';

export interface ExamTerm {
  id: string;
  instituteId: string;
  academicYearId: string;
  name: string; // e.g., "1st Term / Half Yearly Examination"
  bengaliName: string; // e.g., "অর্ধ-বার্ষিক পরীক্ষা"
  termType: ExamTermType;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'published';
  weightPercentage: number; // e.g. 50% or 100%
  description?: string;
  classIds?: string[]; // Classes eligible for this exam (empty or undefined means all classes)
  createdAt: string;
  updatedAt: string;
}

export interface ExamScheduleSlot {
  id: string;
  examTermId: string;
  instituteId: string;
  academicYearId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. 10:00)
  endTime: string; // HH:mm (e.g. 13:00)
  roomNumber?: string;
  fullMarks: number;
  theoryMarks: number;
  mcqMarks: number;
  practicalMarks: number;
  createdAt: string;
}

export interface BoardGradeBand {
  minMarks: number;
  maxMarks: number;
  grade: string; // A+, A, A-, B, C, D, F
  point: number; // 5.0, 4.0, 3.5, 3.0, 2.0, 1.0, 0.0
  remarks: string; // Outstanding, Excellent, Very Good, Good, Satisfactory, Pass, Fail
}

export interface MarkEntryRecord {
  id: string; // Unique per student-subject-exam
  instituteId: string;
  academicYearId: string;
  examTermId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  isOptionalSubject?: boolean; // 4th subject for secondary / higher secondary
  cqMarks: number; // Creative / Written / Theory
  mcqMarks: number; // Objective / MCQ
  practicalMarks: number; // Practical / Lab
  totalMarks: number;
  grade: string; // A+, A, etc.
  point: number; // 5.0, etc.
  isPassed: boolean;
  remarks?: string;
  enteredBy?: string;
  updatedAt: string;
}

export interface StudentResultSummary {
  id: string;
  instituteId: string;
  academicYearId: string;
  examTermId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  totalMarksObtained: number;
  maxPossibleMarks: number;
  percentage: number;
  gpaWithout4th: number;
  gpaWith4th: number; // With 4th subject bonus points (point - 2, max +3.0 capped at 5.00)
  finalGrade: string;
  meritRankClass: number;
  meritRankSection: number;
  isPassedAll: boolean;
  failedSubjectCount: number;
  passedSubjectCount: number;
  generatedAt: string;
}

export interface QuestionBankItem {
  id: string;
  instituteId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  chapter: string;
  questionType: 'creative' | 'mcq' | 'short_answer';
  difficulty: 'easy' | 'medium' | 'hard';
  stemOrQuestion: string; // Uddipak or question text
  subQuestions?: { mark: number; label: string; text: string }[]; // For creative (a, b, c, d - 1, 2, 3, 4 marks)
  mcqOptions?: { id: string; text: string; isCorrect: boolean }[];
  explanation?: string;
  createdAt: string;
}

export interface QuestionPaperGenerated {
  id: string;
  instituteId: string;
  title: string;
  instituteName: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  examTime: string;
  fullMarks: number;
  instructions: string;
  questions: QuestionBankItem[];
  createdAt: string;
}

// ----------------------------------------------------
// Phase 7: Fee Management & Student Billing Types
// ----------------------------------------------------

export type FeeFrequency = 'monthly' | 'termly' | 'annually' | 'one_time';

export interface FeeHeadItem {
  id: string;
  instituteId: string;
  name: string; // e.g. Monthly Tuition Fee
  bengaliName: string; // e.g. মাসিক বেতন
  code: string; // e.g. TUITION
  frequency: FeeFrequency;
  description?: string;
  isMandatory: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface FeeStructureItem {
  id: string;
  instituteId: string;
  academicYearId: string;
  classId: string;
  className: string;
  groupId?: string; // Science, Arts, Commerce or undefined
  feeHeadId: string;
  feeHeadName: string;
  amount: number; // in BDT (৳)
  dueDateDayOfMonth?: number; // e.g. 10th
  lateFineAmount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'waived';

export interface FeeInvoiceItemDetail {
  feeHeadId: string;
  feeHeadName: string;
  amount: number;
  waiverDiscount: number;
  netAmount: number;
}

export interface StudentFeeInvoice {
  id: string; // INV-2026-XXXX
  invoiceNumber: string;
  instituteId: string;
  academicYearId: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  month: string; // e.g. "January 2026", "February 2026"
  billingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  items: FeeInvoiceItemDetail[];
  totalAmount: number;
  totalWaiver: number;
  payableAmount: number;
  paidAmount: number;
  dueAmount: number;
  lateFine: number;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank_challan' | 'pos';

export interface FeePaymentRecord {
  id: string; // PAY-XXXX
  receiptNumber: string; // MR-2026-XXXX
  instituteId: string;
  academicYearId: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  classId: string;
  className: string;
  sectionName: string;
  invoiceId?: string;
  monthCovered: string;
  paidAmount: number;
  lateFinePaid: number;
  totalCollected: number;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  remarks?: string;
  collectedBy: string;
  paymentDate: string;
  createdAt: string;
}

export interface StudentFeeWaiver {
  id: string;
  instituteId: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  className: string;
  category: 'merit' | 'poor_fund' | 'sibling' | 'teacher_ward' | 'special';
  percentage: number; // 0 to 100%
  fixedAmount?: number;
  remarks: string;
  approvedBy: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ==========================================
// PHASE 8: ACCOUNTS & FINANCE TYPES
// ==========================================

export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';

export interface AccountHead {
  id: string;
  instituteId: string;
  code: string;
  name: string;
  nameBn: string;
  type: AccountType;
  category: string;
  openingBalance: number;
  currentBalance: number;
  isSystem?: boolean;
  status: 'active' | 'inactive';
}

export type BankAccountType = 'savings' | 'current' | 'sndt' | 'fdr' | 'cash';

export interface BankAccountItem {
  id: string;
  instituteId: string;
  bankName: string;
  bankNameBn: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  accountType: BankAccountType;
  openingBalance: number;
  currentBalance: number;
  status: 'active' | 'inactive';
  note?: string;
}

export type VoucherType = 'debit' | 'credit' | 'journal' | 'contra';
export type FinancialPaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'bkash' | 'nagad';

export interface FinancialVoucher {
  id: string;
  instituteId: string;
  academicYearId: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  accountHeadId: string;
  accountHeadName: string;
  accountHeadCode?: string;
  amount: number;
  paymentMethod: FinancialPaymentMethod;
  bankAccountId?: string;
  bankAccountName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  payeeRecipient: string;
  description: string;
  approvedBy: string;
  preparedBy: string;
  checkedBy?: string;
  status: 'posted' | 'draft' | 'cancelled';
  createdAt: string;
}

export interface StaffPayrollItem {
  id: string;
  instituteId: string;
  academicYearId: string;
  month: string;
  teacherId: string;
  teacherName: string;
  teacherPhone?: string;
  designation: string;
  bengaliDesignation?: string;
  mpoType: 'mpo' | 'non_mpo';
  bankAccountNumber?: string;
  bankName?: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  specialAllowance: number;
  festivalBonus: number;
  grossSalary: number;
  providentFundDeduction: number;
  welfareDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paymentDate?: string;
  paymentMethod?: FinancialPaymentMethod;
  voucherId?: string;
  remarks?: string;
}

// ==========================================
// PHASE 11: CERTIFICATES & ID CARDS TYPES
// ==========================================

export type CertificateCategory = 'official_academic' | 'achievement' | 'activities';

export type CertificateType =
  // A. Official/Academic (1 to 10)
  | 'admission_certificate' // 1. Admission Certificate
  | 'bonafide_certificate' // 2. Bonafide Student Certificate
  | 'bonafide' // legacy alias for Bonafide
  | 'study_certificate' // 3. Study Certificate
  | 'promotion_certificate' // 4. Promotion Certificate
  | 'result_certificate' // 5. Result Certificate
  | 'character_certificate' // 6. Character Certificate
  | 'testimonial' // 7. Testimonial
  | 'transfer_certificate' // 8. Transfer Certificate
  | 'school_leaving_certificate' // 9. School Leaving Certificate
  | 'course_completion' // 10. Course Completion Certificate
  | 'course_completion_certificate'

  // B. Achievement (11 to 16)
  | 'academic_excellence' // 11. Academic Excellence
  | 'merit' // 12. Merit
  | 'appreciation' // legacy alias for Merit / Appreciation
  | 'best_student' // 13. Best Student
  | 'best_attendance' // 14. Best Attendance
  | 'most_improved_student' // 15. Most Improved Student
  | 'special_achievement' // 16. Special Achievement

  // C. Activities (17 to 28)
  | 'sports' // 17. Sports
  | 'cultural' // 18. Cultural
  | 'debate' // 19. Debate
  | 'quiz' // 20. Quiz
  | 'science_fair' // 21. Science Fair
  | 'olympiad' // 22. Olympiad
  | 'art_drawing' // 23. Art/Drawing
  | 'essay_writing' // 24. Essay/Writing
  | 'leadership' // 25. Leadership
  | 'volunteer' // 26. Volunteer
  | 'participation' // 27. Participation
  | 'winner_champion'; // 28. Winner/Champion

export type CertificateStatus = 'draft' | 'issued' | 'revoked';

export interface CertificateRecord {
  id: string;
  certificateNumber: string; // e.g. TC-2026-0001, TST-2026-0001, BNF-2026-0001
  certificateType: CertificateType;
  category?: CertificateCategory;
  instituteId: string;
  academicYearId: string;
  studentId: string;
  studentName: string;
  studentBengaliName?: string;
  fatherName: string;
  motherName: string;
  rollNumber: number;
  className: string;
  sectionName: string;
  groupName?: string;
  session: string; // e.g. 2025-2026
  dateOfBirth?: string;
  issueDate: string;
  status: CertificateStatus;

  // Specific fields based on category & type:
  admissionDate?: string;
  admissionNumber?: string;
  promotedToClass?: string;
  reasonForLeaving?: string; // For TC & School Leaving Certificate
  conductAndCharacter?: string; // Character / Conduct assessment
  duesClearedUntil?: string; // Clearance of fees / dues
  highestClassPassed?: string; // Passed class / Grade
  examResultOrGpa?: string; // GPA / Result
  boardRoll?: string; // Board exam roll
  boardReg?: string; // Board registration number
  boardName?: string; // Board name
  eventOrMeritTitle?: string; // Event, competition, or merit title
  eventOrCompetitionName?: string;
  positionOrRank?: string; // 1st Place, Champion, Runner-up, Gold Medal, etc.
  achievementDetails?: string; // Specific details of honor
  activityType?: string;
  customRemarks?: string;

  issuedBy: string; // User or Headmaster title
  verificationCode: string; // QR code / hash verification string
  createdAt: string;
  updatedAt: string;
}

export type IdCardType = 'student' | 'teacher';
export type IdCardOrientation = 'portrait' | 'landscape';
export type IdCardTheme = 'classic_blue' | 'emerald_green' | 'royal_maroon' | 'modern_slate';

export interface IdCardTemplateConfig {
  id: string;
  name: string;
  type: IdCardType;
  orientation: IdCardOrientation;
  theme: IdCardTheme;
  showBloodGroup: boolean;
  showEmergencyPhone: boolean;
  showAddress: boolean;
  showQrCode: boolean;
  showBarcode: boolean;
  showValidUntil: boolean;
  validUntilDate: string;
  backSideNoticeBn: string;
  backSideNoticeEn: string;
  // Enhanced customizable fields
  showBengaliName?: boolean;
  showPhoto?: boolean;
  showRollOrIndex?: boolean;
  showIdNumber?: boolean;
  showClassOrDesignation?: boolean;
  showSectionOrDept?: boolean;
  showGroup?: boolean;
  showFatherName?: boolean;
  showMotherName?: boolean;
  showDateOfBirth?: boolean;
  showLogo?: boolean;
  showPrincipalSignature?: boolean;
  customCardTitle?: string;
  customSubtitle?: string;
  customBacksideTitle?: string;
  customBacksideRules?: string[];
  customBacksideReturnText?: string;
  customBackgroundUrl?: string;
  customBackBackgroundUrl?: string;
  primaryColor?: string;
  textColor?: string;
}

export type DocumentTemplateType = 'id_card' | 'marksheet' | 'notice_letterhead' | 'certificate';

export interface DocumentCustomTemplate {
  id: string;
  instituteId: string;
  type: DocumentTemplateType;
  name: string;
  description?: string;
  backgroundUrl?: string; // base64 or URL for background template
  headerPadUrl?: string; // base64 or URL for letterhead pad
  paperSize?: 'A4' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  layoutStyle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  showInstituteHeader?: boolean; // false if printing on pre-printed school pad/letterhead
  showInstituteLogo?: boolean; // false to hide logo on prints
  showWatermark?: boolean; // true to render watermark
  watermarkType?: 'logo' | 'seal' | 'text' | 'none';
  watermarkOpacity?: number; // e.g. 0.05, 0.08, 0.12
  borderStyle?: 'ornate' | 'classic_double' | 'minimal' | 'none';
  contentTopMarginMm?: number; // Space left at top for physical pre-printed pad
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedIdCardRecord {
  id: string;
  cardType: IdCardType;
  instituteId: string;
  academicYearId: string;
  personId: string; // Student ID or Teacher ID
  idNumber: string; // Printed card number
  fullName: string;
  bengaliName?: string;
  photoUrl?: string;
  roleOrClass: string; // e.g. "Class 10 (Science)" or "Senior Teacher (Mathematics)"
  rollOrIndex?: string; // Roll 05 or MPO Index 102934
  bloodGroup?: string;
  emergencyPhone?: string;
  issueDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'lost' | 'reissued';
  qrCodeData: string;
  barcodeData: string;
  createdAt: string;
}

// ==========================================
// PHASE 12: CAMPUS OPERATIONS & RESOURCE MANAGEMENT
// ==========================================

// 1. Library Management Types
export type BookCategory =
  | 'textbook'
  | 'literature'
  | 'science'
  | 'mathematics'
  | 'history_social'
  | 'religion_moral'
  | 'reference'
  | 'journal_magazine'
  | 'general';

export interface BookItem {
  id: string;
  instituteId: string;
  accessionNumber: string; // e.g. ACC-2026-0104
  isbn?: string;
  title: string;
  bengaliTitle?: string;
  author: string;
  publisher?: string;
  edition?: string;
  category: BookCategory;
  shelfLocation: string; // e.g. Shelf A-3, Rack 2
  totalCopies: number;
  availableCopies: number;
  price?: number;
  language: 'bn' | 'en' | 'ar' | 'other';
  status: 'available' | 'out_of_stock' | 'reserved';
  createdAt: string;
  updatedAt: string;
}

export type BorrowerType = 'student' | 'teacher';
export type BookIssueStatus = 'issued' | 'returned' | 'overdue' | 'lost';

export interface BookIssueRecord {
  id: string;
  instituteId: string;
  academicYearId: string;
  bookId: string;
  bookTitle: string;
  accessionNumber: string;
  borrowerType: BorrowerType;
  borrowerId: string; // Student ID or Teacher ID
  borrowerName: string;
  borrowerRollOrDesignation?: string;
  borrowerClass?: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD
  status: BookIssueStatus;
  finePerDay: number; // e.g. 2 BDT/day
  overdueDays?: number;
  fineAmount?: number;
  finePaid?: boolean;
  notes?: string;
  issuedBy: string;
  createdAt: string;
}

// 2. Inventory & Assets Types
export type InventoryCategory =
  | 'furniture'
  | 'computer_it'
  | 'science_lab'
  | 'electrical_electronics'
  | 'sports_equipment'
  | 'stationery'
  | 'musical_cultural'
  | 'general';

export type ItemCondition = 'good' | 'fair' | 'needs_repair' | 'damaged' | 'disposed';

export interface InventoryItem {
  id: string;
  instituteId: string;
  itemCode: string; // e.g. INV-FURN-001
  name: string;
  bengaliName?: string;
  category: InventoryCategory;
  roomOrLocation: string; // e.g. Physics Lab, Computer Lab 1, Classroom 10-A
  quantity: number;
  unit: string; // Pcs, Sets, Boxes, Units
  unitCost: number; // BDT
  totalValuation: number;
  purchaseDate: string;
  supplierOrVendor?: string;
  condition: ItemCondition;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  instituteId: string;
  itemId: string;
  itemName: string;
  transactionType: 'purchase' | 'issue' | 'return' | 'repair' | 'write_off';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  handledBy: string;
  date: string;
  remarks?: string;
  cost?: number;
  createdAt: string;
}

// 3. Transport & Fleet Types
export type VehicleType = 'bus' | 'minibus' | 'microbus' | 'van';
export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

export interface VehicleItem {
  id: string;
  instituteId: string;
  registrationNumber: string; // e.g. ঢাকা মেট্রো-চ ১১-৯৮৭৬
  vehicleType: VehicleType;
  capacity: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber?: string;
  helperName?: string;
  helperPhone?: string;
  fitnessExpiryDate?: string;
  taxTokenExpiryDate?: string;
  routeId?: string;
  routeName?: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TransportStoppage {
  id: string;
  name: string;
  bengaliName?: string;
  pickupTime: string; // e.g. 07:15 AM
  dropTime: string; // e.g. 02:30 PM
  monthlyFare: number; // BDT
}

export interface TransportRoute {
  id: string;
  instituteId: string;
  routeName: string;
  bengaliRouteName?: string;
  startPoint: string;
  destination: string;
  vehicleId?: string;
  vehicleReg?: string;
  driverName?: string;
  driverPhone?: string;
  stoppages: TransportStoppage[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TransportAssignment {
  id: string;
  instituteId: string;
  academicYearId: string;
  studentId: string;
  studentName: string;
  className: string;
  rollNumber: number;
  routeId: string;
  routeName: string;
  stoppageId: string;
  stoppageName: string;
  monthlyFee: number;
  assignedDate: string;
  status: 'active' | 'cancelled';
  createdAt: string;
}

// 4. Notice Board & Announcements Types
export type NoticeCategory =
  | 'academic'
  | 'examination'
  | 'holiday'
  | 'admission'
  | 'sports_cultural'
  | 'fees_finance'
  | 'urgent_special'
  | 'general';

export type NoticeAudience = 'all' | 'students' | 'teachers' | 'guardians' | 'class_specific';
export type NoticePriority = 'urgent' | 'high' | 'normal';

export interface SchoolNotice {
  id: string;
  instituteId: string;
  noticeNumber: string; // Ref No: SCH/NOT/2026/042
  title: string;
  bengaliTitle?: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  targetClassId?: string;
  targetClassName?: string;
  content: string;
  contentBengali?: string;
  priority: NoticePriority;
  publishDate: string;
  expiryDate?: string;
  isPinned: boolean;
  signedBy: string; // Headmaster / Principal / Committee
  signerDesignation: string;
  // Phase 13: Digital Signature vs Manual Signature Option
  includeDigitalSignature?: boolean; // If true, embed digital signature image; if false, provide manual signature space
  digitalSignatureUrl?: string; // Digital signature image data URL or preset
  signatoryRole?: InstituteHeadRole | string; // e.g. 'principal' | 'vice_principal' | 'acting_principal'
  status: 'published' | 'draft' | 'archived';
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

// 5. Academic Calendar & Events Types
export type CalendarEventType =
  | 'government_holiday'
  | 'academic_exam'
  | 'vacation'
  | 'cultural_event'
  | 'sports_competition'
  | 'meeting_ptm'
  | 'national_observance'
  | 'general';

export interface CalendarEventItem {
  id: string;
  instituteId: string;
  academicYearId: string;
  title: string;
  bengaliTitle?: string;
  eventType: CalendarEventType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number;
  isGovernmentHoliday: boolean;
  description?: string;
  targetAudience?: 'all' | 'students' | 'teachers' | 'guardians';
  colorTag?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// PHASE 14: BACKUP & RESTORE TYPES
// ==========================================

export interface BackupMetadata {
  backupId: string;
  formatVersion: '1.0';
  appVersion: string;
  createdAt: string;
  createdBy: {
    userId: string;
    username: string;
  };
  instituteInfo?: {
    id: string;
    name: string;
    bengaliName?: string;
    eiin: string;
    code: string;
    type: string;
  };
  academicYear?: {
    id: string;
    yearName: string;
  };
  scope: 'full' | 'selective';
  selectedModules?: string[];
  totalStores: number;
  totalRecords: number;
  checksum: string;
  systemNotes?: string;
}

export interface BackupPackage {
  format: 'SchoolCollegeERP_Backup_v1';
  metadata: BackupMetadata;
  data: Record<string, any[]>;
}

export interface LocalSnapshot {
  id: string;
  name: string;
  type: 'manual' | 'pre_restore' | 'auto_scheduled';
  createdAt: string;
  createdBy: string;
  recordCount: number;
  storeCount: number;
  sizeBytes: number;
  notes?: string;
  data?: Record<string, any[]>;
}

export type ViewTab =
  | 'dashboard'
  | 'institute'
  | 'academic_years'
  | 'users'
  | 'settings'
  | 'audit_logs'
  // Future phases placeholders:
  | 'academic'
  | 'students'
  | 'teachers'
  | 'attendance'
  | 'examination'
  | 'fees'
  | 'quick-fees'
  | 'accounts'
  | 'library'
  | 'inventory'
  | 'transport'
  | 'certificates'
  | 'idcards'
  | 'notices'
  | 'calendar'
  | 'reports'
  | 'backup'
  | 'version_updater'
  | 'action_undo'
  | 'ai_chat';

/**
 * Granular Specific Action Undo & Reversal Types
 * Allows undoing a specific operation (e.g. erroneous fee collection, accidental edit)
 * without wiping or impacting subsequent work performed by other users.
 */
export type ReversibleActionType =
  | 'FEE_PAYMENT'
  | 'STUDENT_CREATE'
  | 'STUDENT_UPDATE'
  | 'STUDENT_DELETE'
  | 'MARKS_ENTRY'
  | 'ATTENDANCE_RECORD'
  | 'INCOME_EXPENSE'
  | 'INVENTORY_TRANSACTION'
  | 'BOOK_ISSUE'
  | 'CERTIFICATE_ISSUE'
  | 'GENERIC_RECORD';

export interface ActionLogEntry {
  id: string; // e.g. 'act_1789664000123'
  timestamp: string;
  module: ERPModule;
  actionType: ReversibleActionType;
  title: string;
  bengaliTitle: string;
  details: string;
  targetStore: string;
  targetId: string;
  targetIdentifier?: string; // e.g. 'RCP-2026-0001', 'STU-1002', 'Karim Ullah'
  userId: string;
  username: string;
  instituteId?: string;
  academicYearId?: string;
  canUndo: boolean;
  isUndone: boolean;
  undoneAt?: string;
  undoneBy?: string;
  undoneReason?: string;
  // Reversal snapshot payload
  reversalData: {
    store: string;
    previousState?: any; // State before this action (null if was CREATE)
    currentState?: any; // State applied in this action
    feeMeta?: {
      paymentId?: string;
      receiptId?: string;
      feeChargeId?: string;
      studentId?: string;
      studentName?: string;
      receiptNumber?: string;
      amountReversed: number;
      previousPaidAmount?: number;
      previousDueAmount?: number;
      previousPaymentStatus?: string;
    };
    marksMeta?: {
      studentId?: string;
      subjectId?: string;
      examId?: string;
      previousMarks?: number;
    };
  };
}
