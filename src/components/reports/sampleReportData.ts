export interface StudentStrengthRow {
  className: string;
  sectionName: string;
  boys: number;
  girls: number;
  other: number;
  total: number;
  muslim: number;
  hindu: number;
  christian: number;
  buddhist: number;
}

export interface StudentAdmissionRow {
  studentId: string;
  admissionNo: string;
  name: string;
  bengaliName: string;
  className: string;
  sectionName: string;
  roll: number;
  gender: 'male' | 'female' | 'other';
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
  admissionDate: string;
  quota: string;
}

export interface AttendanceSummaryRow {
  className: string;
  sectionName: string;
  totalEnrolled: number;
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  attendanceRate: number; // percentage e.g. 92.5
}

export interface LowAttendanceAlertRow {
  studentId: string;
  admissionNo: string;
  name: string;
  className: string;
  sectionName: string;
  roll: number;
  workingDays: number;
  attendedDays: number;
  percentage: number;
  guardianPhone: string;
  status: 'Critical (<60%)' | 'Warning (60-74%)';
}

export interface ExamSummaryRow {
  examName: string;
  className: string;
  totalAppeared: number;
  passed: number;
  failed: number;
  passRate: number;
  gpa5Count: number; // A+
  gpa4Count: number; // A
  gpa35Count: number; // A-
  gpa3Count: number; // B
  gpa2Count: number; // C
  gpa1Count: number; // D
}

export interface MeritListRow {
  rank: number;
  roll: number;
  studentId: string;
  name: string;
  bengaliName: string;
  className: string;
  sectionName: string;
  totalMarks: number;
  gpa: number;
  grade: string;
}

export interface FeeCollectionRow {
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  className: string;
  roll: number;
  feeHead: string;
  paymentMethod: string;
  amount: number;
  collector: string;
}

export interface DueFeeRow {
  studentId: string;
  admissionNo: string;
  name: string;
  className: string;
  sectionName: string;
  roll: number;
  guardianName: string;
  guardianPhone: string;
  dueMonths: string;
  totalDues: number;
  lastPaymentDate: string;
}

export interface IncomeExpenseStatementRow {
  accountCode: string;
  headName: string;
  bengaliHeadName: string;
  category: 'income' | 'expense';
  budgetAmount: number;
  actualAmount: number;
  variance: number;
}

export interface BanbeisCensusData {
  eiin: string;
  instituteType: string;
  management: string; // MPO / Non-MPO / Private
  totalStudents: number;
  femaleStudents: number;
  femaleStudentPercentage: number;
  totalTeachers: number;
  femaleTeachers: number;
  mpoTeachers: number;
  nonMpoTeachers: number;
  teacherStudentRatio: string;
  totalClassrooms: number;
  multimediaClassrooms: number;
  computerLabCount: number;
  scienceLabCount: number;
  libraryBookCount: number;
  electricityConnection: boolean;
  internetFacility: boolean;
  drinkingWaterSource: string;
  separateWashroomForGirls: boolean;
  solarPanelInstalled: boolean;
}

export const SAMPLE_STUDENT_STRENGTH: StudentStrengthRow[] = [
  { className: 'Class 6', sectionName: 'A (Padma)', boys: 28, girls: 24, other: 0, total: 52, muslim: 46, hindu: 5, christian: 1, buddhist: 0 },
  { className: 'Class 6', sectionName: 'B (Meghna)', boys: 26, girls: 25, other: 0, total: 51, muslim: 45, hindu: 5, christian: 0, buddhist: 1 },
  { className: 'Class 7', sectionName: 'A (Jamuna)', boys: 25, girls: 27, other: 0, total: 52, muslim: 47, hindu: 4, christian: 1, buddhist: 0 },
  { className: 'Class 7', sectionName: 'B (Karnaphuli)', boys: 27, girls: 23, other: 0, total: 50, muslim: 44, hindu: 6, christian: 0, buddhist: 0 },
  { className: 'Class 8', sectionName: 'A (Surma)', boys: 24, girls: 26, other: 0, total: 50, muslim: 43, hindu: 6, christian: 1, buddhist: 0 },
  { className: 'Class 8', sectionName: 'B (Teesta)', boys: 26, girls: 24, other: 0, total: 50, muslim: 45, hindu: 4, christian: 1, buddhist: 0 },
  { className: 'Class 9', sectionName: 'Science', boys: 22, girls: 28, other: 0, total: 50, muslim: 44, hindu: 5, christian: 1, buddhist: 0 },
  { className: 'Class 9', sectionName: 'Humanities', boys: 20, girls: 25, other: 0, total: 45, muslim: 40, hindu: 4, christian: 1, buddhist: 0 },
  { className: 'Class 9', sectionName: 'Business Studies', boys: 24, girls: 21, other: 0, total: 45, muslim: 39, hindu: 6, christian: 0, buddhist: 0 },
  { className: 'Class 10', sectionName: 'Science', boys: 23, girls: 27, other: 0, total: 50, muslim: 45, hindu: 4, christian: 1, buddhist: 0 },
  { className: 'Class 10', sectionName: 'Humanities', boys: 19, girls: 23, other: 0, total: 42, muslim: 38, hindu: 4, christian: 0, buddhist: 0 },
  { className: 'Class 10', sectionName: 'Business Studies', boys: 22, girls: 20, other: 0, total: 42, muslim: 37, hindu: 5, christian: 0, buddhist: 0 },
  { className: 'Class 11', sectionName: 'Science (College)', boys: 32, girls: 38, other: 0, total: 70, muslim: 62, hindu: 7, christian: 1, buddhist: 0 },
  { className: 'Class 11', sectionName: 'Humanities (College)', boys: 28, girls: 37, other: 0, total: 65, muslim: 58, hindu: 6, christian: 1, buddhist: 0 },
  { className: 'Class 11', sectionName: 'Business Studies (College)', boys: 35, girls: 30, other: 0, total: 65, muslim: 57, hindu: 7, christian: 1, buddhist: 0 },
  { className: 'Class 12', sectionName: 'Science (College)', boys: 30, girls: 36, other: 0, total: 66, muslim: 59, hindu: 6, christian: 1, buddhist: 0 },
  { className: 'Class 12', sectionName: 'Humanities (College)', boys: 26, girls: 34, other: 0, total: 60, muslim: 54, hindu: 5, christian: 1, buddhist: 0 },
  { className: 'Class 12', sectionName: 'Business Studies (College)', boys: 33, girls: 27, other: 0, total: 60, muslim: 53, hindu: 6, christian: 1, buddhist: 0 },
];

export const SAMPLE_STUDENT_ADMISSIONS: StudentAdmissionRow[] = [
  { studentId: 'STD-2026-001', admissionNo: 'ADM-0101', name: 'Sadia Sultana', bengaliName: 'সাদিয়া সুলতানা', className: 'Class 10', sectionName: 'Science', roll: 1, gender: 'female', bloodGroup: 'A+', guardianName: 'Md. Shahidul Islam', guardianPhone: '+8801711223344', admissionDate: '2023-01-05', quota: 'General' },
  { studentId: 'STD-2026-002', admissionNo: 'ADM-0102', name: 'Tanvir Ahmed', bengaliName: 'তানভীর আহমেদ', className: 'Class 10', sectionName: 'Science', roll: 2, gender: 'male', bloodGroup: 'B+', guardianName: 'Md. Rafiqul Islam', guardianPhone: '+8801819334455', admissionDate: '2023-01-06', quota: 'General' },
  { studentId: 'STD-2026-003', admissionNo: 'ADM-0103', name: 'Fariha Jannat', bengaliName: 'ফারিহা জান্নাত', className: 'Class 10', sectionName: 'Science', roll: 3, gender: 'female', bloodGroup: 'O+', guardianName: 'Enamul Haque', guardianPhone: '+8801912445566', admissionDate: '2023-01-07', quota: 'Freedom Fighter' },
  { studentId: 'STD-2026-004', admissionNo: 'ADM-0104', name: 'Mahir Faisal', bengaliName: 'মাহির ফয়সাল', className: 'Class 10', sectionName: 'Science', roll: 4, gender: 'male', bloodGroup: 'AB+', guardianName: 'Nazrul Islam', guardianPhone: '+8801715556677', admissionDate: '2023-01-08', quota: 'General' },
  { studentId: 'STD-2026-005', admissionNo: 'ADM-0105', name: 'Nusrat Jahan', bengaliName: 'নুসরাত জাহান', className: 'Class 9', sectionName: 'Humanities', roll: 1, gender: 'female', bloodGroup: 'A+', guardianName: 'Motiur Rahman', guardianPhone: '+8801611667788', admissionDate: '2024-01-10', quota: 'General' },
  { studentId: 'STD-2026-006', admissionNo: 'ADM-0106', name: 'Arif Hasan', bengaliName: 'আরিফ হাসান', className: 'Class 9', sectionName: 'Business Studies', roll: 1, gender: 'male', bloodGroup: 'O-', guardianName: 'Abul Kalam', guardianPhone: '+8801722778899', admissionDate: '2024-01-11', quota: 'General' },
  { studentId: 'STD-2026-007', admissionNo: 'ADM-0107', name: 'Priya Das', bengaliName: 'প্রিয়া দাস', className: 'Class 8', sectionName: 'A (Surma)', roll: 1, gender: 'female', bloodGroup: 'B+', guardianName: 'Sunil Das', guardianPhone: '+8801833889900', admissionDate: '2025-01-05', quota: 'General' },
  { studentId: 'STD-2026-008', admissionNo: 'ADM-0108', name: 'Rashedul Karim', bengaliName: 'রাশেদুল করিম', className: 'Class 11', sectionName: 'Science (College)', roll: 1, gender: 'male', bloodGroup: 'A+', guardianName: 'Karim Ullah', guardianPhone: '+8801944990011', admissionDate: '2025-07-15', quota: 'General' },
  { studentId: 'STD-2026-009', admissionNo: 'ADM-0109', name: 'Tasnim Akter', bengaliName: 'তাসনিম আক্তার', className: 'Class 11', sectionName: 'Humanities (College)', roll: 1, gender: 'female', bloodGroup: 'AB-', guardianName: 'Md. Delwar Hossain', guardianPhone: '+8801755001122', admissionDate: '2025-07-16', quota: 'Special Needs' },
  { studentId: 'STD-2026-010', admissionNo: 'ADM-0110', name: 'Samiur Rahman', bengaliName: 'সামিউর রহমান', className: 'Class 12', sectionName: 'Business Studies (College)', roll: 1, gender: 'male', bloodGroup: 'O+', guardianName: 'Habibur Rahman', guardianPhone: '+8801866112233', admissionDate: '2024-07-10', quota: 'Tribal / Ethnic' },
];

export const SAMPLE_ATTENDANCE_SUMMARY: AttendanceSummaryRow[] = [
  { className: 'Class 6', sectionName: 'A (Padma)', totalEnrolled: 52, present: 49, absent: 2, late: 1, onLeave: 0, attendanceRate: 94.2 },
  { className: 'Class 6', sectionName: 'B (Meghna)', totalEnrolled: 51, present: 47, absent: 3, late: 1, onLeave: 0, attendanceRate: 92.2 },
  { className: 'Class 7', sectionName: 'A (Jamuna)', totalEnrolled: 52, present: 48, absent: 2, late: 2, onLeave: 0, attendanceRate: 92.3 },
  { className: 'Class 7', sectionName: 'B (Karnaphuli)', totalEnrolled: 50, present: 46, absent: 3, late: 1, onLeave: 0, attendanceRate: 92.0 },
  { className: 'Class 8', sectionName: 'A (Surma)', totalEnrolled: 50, present: 47, absent: 2, late: 1, onLeave: 0, attendanceRate: 94.0 },
  { className: 'Class 8', sectionName: 'B (Teesta)', totalEnrolled: 50, present: 45, absent: 4, late: 1, onLeave: 0, attendanceRate: 90.0 },
  { className: 'Class 9', sectionName: 'Science', totalEnrolled: 50, present: 48, absent: 1, late: 1, onLeave: 0, attendanceRate: 96.0 },
  { className: 'Class 9', sectionName: 'Humanities', totalEnrolled: 45, present: 40, absent: 4, late: 1, onLeave: 0, attendanceRate: 88.9 },
  { className: 'Class 9', sectionName: 'Business Studies', totalEnrolled: 45, present: 41, absent: 3, late: 1, onLeave: 0, attendanceRate: 91.1 },
  { className: 'Class 10', sectionName: 'Science', totalEnrolled: 50, present: 49, absent: 1, late: 0, onLeave: 0, attendanceRate: 98.0 },
  { className: 'Class 10', sectionName: 'Humanities', totalEnrolled: 42, present: 38, absent: 3, late: 1, onLeave: 0, attendanceRate: 90.5 },
  { className: 'Class 10', sectionName: 'Business Studies', totalEnrolled: 42, present: 39, absent: 2, late: 1, onLeave: 0, attendanceRate: 92.9 },
  { className: 'Class 11', sectionName: 'Science (College)', totalEnrolled: 70, present: 66, absent: 3, late: 1, onLeave: 0, attendanceRate: 94.3 },
  { className: 'Class 11', sectionName: 'Humanities (College)', totalEnrolled: 65, present: 59, absent: 4, late: 2, onLeave: 0, attendanceRate: 90.8 },
  { className: 'Class 12', sectionName: 'Science (College)', totalEnrolled: 66, present: 63, absent: 2, late: 1, onLeave: 0, attendanceRate: 95.5 },
];

export const SAMPLE_LOW_ATTENDANCE: LowAttendanceAlertRow[] = [
  { studentId: 'STD-2026-045', admissionNo: 'ADM-0145', name: 'Mehedi Hasan Niloy', className: 'Class 9', sectionName: 'Humanities', roll: 23, workingDays: 65, attendedDays: 38, percentage: 58.5, guardianPhone: '+8801712998877', status: 'Critical (<60%)' },
  { studentId: 'STD-2026-072', admissionNo: 'ADM-0172', name: 'Zubair Hossain', className: 'Class 8', sectionName: 'B (Teesta)', roll: 31, workingDays: 65, attendedDays: 36, percentage: 55.4, guardianPhone: '+8801823776655', status: 'Critical (<60%)' },
  { studentId: 'STD-2026-088', admissionNo: 'ADM-0188', name: 'Rimi Akter', className: 'Class 7', sectionName: 'B (Karnaphuli)', roll: 28, workingDays: 65, attendedDays: 44, percentage: 67.7, guardianPhone: '+8801934665544', status: 'Warning (60-74%)' },
  { studentId: 'STD-2026-104', admissionNo: 'ADM-0204', name: 'Kazi Farhan', className: 'Class 11', sectionName: 'Humanities (College)', roll: 42, workingDays: 60, attendedDays: 41, percentage: 68.3, guardianPhone: '+8801745554433', status: 'Warning (60-74%)' },
  { studentId: 'STD-2026-119', admissionNo: 'ADM-0219', name: 'Shakil Ahmed', className: 'Class 10', sectionName: 'Business Studies', roll: 34, workingDays: 65, attendedDays: 46, percentage: 70.8, guardianPhone: '+8801856443322', status: 'Warning (60-74%)' },
];

export const SAMPLE_EXAM_SUMMARIES: ExamSummaryRow[] = [
  { examName: 'Half Yearly Examination 2026', className: 'Class 10 (Science)', totalAppeared: 50, passed: 49, failed: 1, passRate: 98.0, gpa5Count: 21, gpa4Count: 18, gpa35Count: 7, gpa3Count: 3, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'Half Yearly Examination 2026', className: 'Class 10 (Humanities)', totalAppeared: 42, passed: 39, failed: 3, passRate: 92.9, gpa5Count: 6, gpa4Count: 16, gpa35Count: 11, gpa3Count: 6, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'Half Yearly Examination 2026', className: 'Class 10 (Business Studies)', totalAppeared: 42, passed: 40, failed: 2, passRate: 95.2, gpa5Count: 8, gpa4Count: 19, gpa35Count: 9, gpa3Count: 4, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'Half Yearly Examination 2026', className: 'Class 9 (Science)', totalAppeared: 50, passed: 48, failed: 2, passRate: 96.0, gpa5Count: 18, gpa4Count: 17, gpa35Count: 9, gpa3Count: 4, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'Half Yearly Examination 2026', className: 'Class 8 (All Sections)', totalAppeared: 100, passed: 94, failed: 6, passRate: 94.0, gpa5Count: 26, gpa4Count: 38, gpa35Count: 20, gpa3Count: 10, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'First Term Examination 2026', className: 'Class 11 Science (College)', totalAppeared: 70, passed: 68, failed: 2, passRate: 97.1, gpa5Count: 28, gpa4Count: 24, gpa35Count: 12, gpa3Count: 4, gpa2Count: 0, gpa1Count: 0 },
  { examName: 'First Term Examination 2026', className: 'Class 12 Science (College)', totalAppeared: 66, passed: 65, failed: 1, passRate: 98.5, gpa5Count: 31, gpa4Count: 22, gpa35Count: 9, gpa3Count: 3, gpa2Count: 0, gpa1Count: 0 },
];

export const SAMPLE_MERIT_LIST: MeritListRow[] = [
  { rank: 1, roll: 1, studentId: 'STD-2026-001', name: 'Sadia Sultana', bengaliName: 'সাদিয়া সুলতানা', className: 'Class 10', sectionName: 'Science', totalMarks: 768, gpa: 5.0, grade: 'A+' },
  { rank: 2, roll: 3, studentId: 'STD-2026-003', name: 'Fariha Jannat', bengaliName: 'ফারিহা জান্নাত', className: 'Class 10', sectionName: 'Science', totalMarks: 752, gpa: 5.0, grade: 'A+' },
  { rank: 3, roll: 2, studentId: 'STD-2026-002', name: 'Tanvir Ahmed', bengaliName: 'তানভীর আহমেদ', className: 'Class 10', sectionName: 'Science', totalMarks: 746, gpa: 5.0, grade: 'A+' },
  { rank: 4, roll: 4, studentId: 'STD-2026-004', name: 'Mahir Faisal', bengaliName: 'মাহির ফয়সাল', className: 'Class 10', sectionName: 'Science', totalMarks: 739, gpa: 5.0, grade: 'A+' },
  { rank: 5, roll: 6, studentId: 'STD-2026-008', name: 'Nafis Imtiaz', bengaliName: 'নাফিস ইমতিয়াজ', className: 'Class 10', sectionName: 'Science', totalMarks: 728, gpa: 5.0, grade: 'A+' },
  { rank: 6, roll: 5, studentId: 'STD-2026-007', name: 'Sumaiya Akter', bengaliName: 'সুমাইয়া আক্তার', className: 'Class 10', sectionName: 'Science', totalMarks: 715, gpa: 4.88, grade: 'A' },
  { rank: 7, roll: 8, studentId: 'STD-2026-011', name: 'Tahmid Hasan', bengaliName: 'তাহমিদ হাসান', className: 'Class 10', sectionName: 'Science', totalMarks: 704, gpa: 4.75, grade: 'A' },
  { rank: 8, roll: 7, studentId: 'STD-2026-010', name: 'Sabrina Islam', bengaliName: 'সাবরিনা ইসলাম', className: 'Class 10', sectionName: 'Science', totalMarks: 698, gpa: 4.63, grade: 'A' },
  { rank: 9, roll: 9, studentId: 'STD-2026-012', name: 'Raihan Kabir', bengaliName: 'রায়হান কবির', className: 'Class 10', sectionName: 'Science', totalMarks: 689, gpa: 4.5, grade: 'A' },
  { rank: 10, roll: 10, studentId: 'STD-2026-014', name: 'Muntaha Hossain', bengaliName: 'মুনতাহা হোসেন', className: 'Class 10', sectionName: 'Science', totalMarks: 681, gpa: 4.38, grade: 'A' },
];

export const SAMPLE_FEE_COLLECTIONS: FeeCollectionRow[] = [
  { receiptNo: 'RCP-2026-0482', date: '2026-09-12', studentId: 'STD-2026-001', studentName: 'Sadia Sultana', className: 'Class 10', roll: 1, feeHead: 'Monthly Tuition (Sep 2026)', paymentMethod: 'bKash Merchant', amount: 1500, collector: 'Auto Online Gateway' },
  { receiptNo: 'RCP-2026-0481', date: '2026-09-12', studentId: 'STD-2026-002', studentName: 'Tanvir Ahmed', className: 'Class 10', roll: 2, feeHead: 'Monthly Tuition & Lab Fee', paymentMethod: 'Cash Counter', amount: 1850, collector: 'Mr. Rafiq (Accountant)' },
  { receiptNo: 'RCP-2026-0480', date: '2026-09-11', studentId: 'STD-2026-003', studentName: 'Fariha Jannat', className: 'Class 10', roll: 3, feeHead: 'Half Yearly Examination Fee', paymentMethod: 'Nagad Gateway', amount: 1200, collector: 'Auto Online Gateway' },
  { receiptNo: 'RCP-2026-0479', date: '2026-09-11', studentId: 'STD-2026-008', studentName: 'Rashedul Karim', className: 'Class 11 Science', roll: 1, feeHead: 'College Session Fee & Tuition', paymentMethod: 'Bank Transfer (Sonali)', amount: 4500, collector: 'Bank API Sync' },
  { receiptNo: 'RCP-2026-0478', date: '2026-09-10', studentId: 'STD-2026-006', studentName: 'Arif Hasan', className: 'Class 9 B.Studies', roll: 1, feeHead: 'Monthly Tuition & Transport', paymentMethod: 'Cash Counter', amount: 2200, collector: 'Mr. Rafiq (Accountant)' },
  { receiptNo: 'RCP-2026-0477', date: '2026-09-10', studentId: 'STD-2026-007', studentName: 'Priya Das', className: 'Class 8', roll: 1, feeHead: 'Monthly Tuition', paymentMethod: 'Cash Counter', amount: 1200, collector: 'Mr. Rafiq (Accountant)' },
  { receiptNo: 'RCP-2026-0476', date: '2026-09-09', studentId: 'STD-2026-004', studentName: 'Mahir Faisal', className: 'Class 10', roll: 4, feeHead: 'Monthly Tuition & ICT Fee', paymentMethod: 'Rocket Pay', amount: 1650, collector: 'Auto Online Gateway' },
];

export const SAMPLE_DUE_FEES: DueFeeRow[] = [
  { studentId: 'STD-2026-045', admissionNo: 'ADM-0145', name: 'Mehedi Hasan Niloy', className: 'Class 9 (Humanities)', sectionName: 'A', roll: 23, guardianName: 'Md. Delwar Hossain', guardianPhone: '+8801712998877', dueMonths: 'July, Aug, Sep 2026 (3 Mos)', totalDues: 3600, lastPaymentDate: '2026-06-15' },
  { studentId: 'STD-2026-072', admissionNo: 'ADM-0172', name: 'Zubair Hossain', className: 'Class 8 (Teesta)', sectionName: 'B', roll: 31, guardianName: 'Md. Anisur Rahman', guardianPhone: '+8801823776655', dueMonths: 'Aug, Sep 2026 (2 Mos)', totalDues: 2400, lastPaymentDate: '2026-07-20' },
  { studentId: 'STD-2026-099', admissionNo: 'ADM-0199', name: 'Sajid Al Mamun', className: 'Class 10 (B.Studies)', sectionName: 'A', roll: 29, guardianName: 'Al Mamun Kazi', guardianPhone: '+8801934554433', dueMonths: 'Exam Fee + Sep Tuition', totalDues: 2700, lastPaymentDate: '2026-08-10' },
  { studentId: 'STD-2026-104', admissionNo: 'ADM-0204', name: 'Kazi Farhan', className: 'Class 11 Humanities', sectionName: 'College', roll: 42, guardianName: 'Kazi Masud Rana', guardianPhone: '+8801745554433', dueMonths: 'College Tuition (2 Mos)', totalDues: 5000, lastPaymentDate: '2026-07-12' },
  { studentId: 'STD-2026-118', admissionNo: 'ADM-0218', name: 'Jannatul Ferdous', className: 'Class 7 (Karnaphuli)', sectionName: 'B', roll: 35, guardianName: 'Golam Mostafa', guardianPhone: '+8801856332211', dueMonths: 'Sep Tuition', totalDues: 1200, lastPaymentDate: '2026-08-25' },
];

export const SAMPLE_INCOME_EXPENSE: IncomeExpenseStatementRow[] = [
  // Income
  { accountCode: 'INC-101', headName: 'Student Monthly Tuition Fees', bengaliHeadName: 'শিক্ষার্থীদের মাসিক বেতন', category: 'income', budgetAmount: 1800000, actualAmount: 1745000, variance: -55000 },
  { accountCode: 'INC-102', headName: 'Admission & Session Development Fee', bengaliHeadName: 'ভর্তি ও সেশন ফি', category: 'income', budgetAmount: 850000, actualAmount: 880000, variance: 30000 },
  { accountCode: 'INC-103', headName: 'Term Examination Fees', bengaliHeadName: 'টার্ম ও সাময়িক পরীক্ষা ফি', category: 'income', budgetAmount: 450000, actualAmount: 462000, variance: 12000 },
  { accountCode: 'INC-104', headName: 'Government MPO Subvention', bengaliHeadName: 'সরকারি এমপিও অনুদান (শিক্ষক বেতন)', category: 'income', budgetAmount: 2200000, actualAmount: 2200000, variance: 0 },
  { accountCode: 'INC-105', headName: 'Transport & Bus Commuter Fees', bengaliHeadName: 'পরিবহন ও বাস ভাড়া ফি', category: 'income', budgetAmount: 180000, actualAmount: 172000, variance: -8000 },
  { accountCode: 'INC-106', headName: 'Donations & Miscellaneous Receipts', bengaliHeadName: 'অনুদান ও বিবিধ প্রাপ্তি', category: 'income', budgetAmount: 60000, actualAmount: 75000, variance: 15000 },
  // Expenses
  { accountCode: 'EXP-201', headName: 'Staff & Faculty Salary Disbursement', bengaliHeadName: 'শিক্ষক-কর্মচারী বেতন ও ভাতা', category: 'expense', budgetAmount: 3200000, actualAmount: 3180000, variance: -20000 },
  { accountCode: 'EXP-202', headName: 'Campus Utilities (Electricity, Internet, Water)', bengaliHeadName: 'বিদ্যুৎ, ইন্টারনেট ও পানি বিল', category: 'expense', budgetAmount: 120000, actualAmount: 114500, variance: -5500 },
  { accountCode: 'EXP-203', headName: 'Exam Paper Printing & Stationeries', bengaliHeadName: 'প্রশ্নপত্র মুদ্রণ ও স্টেশনারি', category: 'expense', budgetAmount: 150000, actualAmount: 142000, variance: -8000 },
  { accountCode: 'EXP-204', headName: 'Science Lab & ICT Lab Maintenance', bengaliHeadName: 'কম্পিউটার ও বিজ্ঞান ল্যাব রক্ষণাবেক্ষণ', category: 'expense', budgetAmount: 80000, actualAmount: 68500, variance: -11500 },
  { accountCode: 'EXP-205', headName: 'Library Books & Newspaper Subscriptions', bengaliHeadName: 'লাইব্রেরি বই ও সাময়িকী ক্রয়', category: 'expense', budgetAmount: 40000, actualAmount: 38000, variance: -2000 },
  { accountCode: 'EXP-206', headName: 'Vehicle Fuel & Transport Maintenance', bengaliHeadName: 'বাসের জ্বালানি ও মেরামত খরচ', category: 'expense', budgetAmount: 110000, actualAmount: 118000, variance: 8000 },
  { accountCode: 'EXP-207', headName: 'Annual Sports, Cultural & National Days', bengaliHeadName: 'বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান', category: 'expense', budgetAmount: 160000, actualAmount: 155000, variance: -5000 },
];

export function getSampleBanbeisData(eiin: string, type: 'school' | 'college' | 'both'): BanbeisCensusData {
  const isCollege = type === 'college' || type === 'both';
  return {
    eiin: eiin || '108452',
    instituteType: isCollege ? 'Higher Secondary / Degree College' : 'Secondary School (Co-education)',
    management: 'MPO Enlisted (Govt. Subsidized)',
    totalStudents: isCollege ? 1240 : 880,
    femaleStudents: isCollege ? 680 : 475,
    femaleStudentPercentage: isCollege ? 54.8 : 54.0,
    totalTeachers: isCollege ? 42 : 28,
    femaleTeachers: isCollege ? 18 : 12,
    mpoTeachers: isCollege ? 34 : 24,
    nonMpoTeachers: isCollege ? 8 : 4,
    teacherStudentRatio: isCollege ? '1:30' : '1:31',
    totalClassrooms: isCollege ? 32 : 24,
    multimediaClassrooms: isCollege ? 12 : 8,
    computerLabCount: 2,
    scienceLabCount: isCollege ? 4 : 3,
    libraryBookCount: 3850,
    electricityConnection: true,
    internetFacility: true,
    drinkingWaterSource: 'Deep Tube-well with Reverse Osmosis Filter',
    separateWashroomForGirls: true,
    solarPanelInstalled: true,
  };
}
