/**
 * Comprehensive Demo Data Generation, Purge & Live-Mode Engine
 * Allows populating rich realistic demo data across all ERP modules to test system features,
 * provides 1-Click clean-up/deletion, and locks all demo tools when the system is in LIVE mode.
 */

import { bulkPut, getAll, clearStore, remove, putItem, get } from '../db/indexedDB';
import { saveLocalSnapshot } from './backupService';
import { AppSettings } from '../types';

export interface DemoSeedResult {
  success: boolean;
  message: string;
  bengaliMessage: string;
  totalRecordsCreated: number;
  breakdown: Record<string, number>;
}

// 1. Check if Live Production Mode is active
export async function isSystemInLiveMode(): Promise<boolean> {
  try {
    const settings = await get<AppSettings>('settings', 'global');
    if (settings && settings.isLiveMode !== undefined) {
      return settings.isLiveMode;
    }
  } catch (e) {}

  return localStorage.getItem('erp_go_live_mode') === 'true';
}

// 2. Toggle Live Production Mode (Disables demo options when active)
export async function setSystemLiveMode(
  isLive: boolean,
  currentUser?: { id: string; username: string }
): Promise<{ success: boolean; isLiveMode: boolean; message: string }> {
  try {
    let settings = await get<AppSettings>('settings', 'global');
    if (!settings) {
      settings = {
        id: 'global',
        appName: 'School & College Management ERP',
        bengaliAppName: 'স্কুল ও কলেজ ম্যানেজমেন্ট ইআরপি',
        defaultLanguage: 'bn',
        theme: 'light',
        sessionTimeoutMinutes: 60,
        enableAutoBackup: true,
        autoBackupInterval: 'daily',
        autoBackupTime: '23:59',
        studentIdPrefixSchool: 'SCH',
        studentIdPrefixCollege: 'COL',
        receiptPrefix: 'RCP',
        certificatePrefix: 'CERT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    settings.isLiveMode = isLive;
    settings.updatedAt = new Date().toISOString();
    await putItem('settings', settings);

    localStorage.setItem('erp_go_live_mode', isLive ? 'true' : 'false');

    return {
      success: true,
      isLiveMode: isLive,
      message: isLive
        ? 'সিস্টেম সফলভাবে লাইভ মোডে (Production) নেওয়া হয়েছে। ডেমো ডাটা তৈরি করার অপশন নিষ্ক্রিয় করা হয়েছে।'
        : 'সিস্টেম টেস্টিং/ডেমো মোডে রয়েছে। ডেমো তথ্য ব্যবহারের সুযোগ উন্মুক্ত।',
    };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to update system mode');
  }
}

// 3. Seed Comprehensive Demo Data across all ERP Modules
export async function seedComprehensiveDemoData(
  activeInstituteId: string,
  academicYearId: string,
  onProgress?: (stage: string, pct: number) => void
): Promise<DemoSeedResult> {
  const isLive = await isSystemInLiveMode();
  if (isLive) {
    throw new Error(
      'সিস্টেম বর্তমানে লাইভ মোডে (Live Production) চলছে! বাস্তব ডাটার সুরক্ষার জন্য ডেমো ডাটা যোগ করা কঠোরভাবে নিষিদ্ধ।'
    );
  }

  onProgress?.('Initializing demo data structures...', 10);
  const now = new Date().toISOString();
  const todayStr = now.split('T')[0];
  const instId = activeInstituteId || 'inst_school_demo';
  const yearId = academicYearId || '2026';

  const breakdown: Record<string, number> = {};

  // 1. Classes & Sections
  onProgress?.('Generating academic classes and sections...', 20);
  const demoClasses = [
    { id: 'cls_demo_6', instituteId: instId, name: 'Class 6', bengaliName: 'ষষ্ঠ শ্রেণি', numericLevel: 6, hasGroups: false, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'cls_demo_7', instituteId: instId, name: 'Class 7', bengaliName: 'সপ্তম শ্রেণি', numericLevel: 7, hasGroups: false, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'cls_demo_8', instituteId: instId, name: 'Class 8', bengaliName: 'অষ্টম শ্রেণি', numericLevel: 8, hasGroups: false, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'cls_demo_9', instituteId: instId, name: 'Class 9', bengaliName: 'নবম শ্রেণি', numericLevel: 9, hasGroups: true, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'cls_demo_10', instituteId: instId, name: 'Class 10', bengaliName: 'দশম শ্রেণি', numericLevel: 10, hasGroups: true, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
  ];
  await bulkPut('classes', demoClasses);
  breakdown['classes'] = demoClasses.length;

  const demoSections = [
    { id: 'sec_demo_6a', classId: 'cls_demo_6', instituteId: instId, name: 'Section A', bengaliName: 'শাখা - ক (গোলাপ)', capacity: 40, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'sec_demo_6b', classId: 'cls_demo_6', instituteId: instId, name: 'Section B', bengaliName: 'শাখা - খ (শাপলা)', capacity: 40, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'sec_demo_9a', classId: 'cls_demo_9', instituteId: instId, name: 'Section A', bengaliName: 'শাখা - ক (বিজ্ঞান)', capacity: 45, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'sec_demo_10a', classId: 'cls_demo_10', instituteId: instId, name: 'Section A', bengaliName: 'শাখা - ক (মেঘনা)', capacity: 45, isDemo: true, status: 'active', createdAt: now, updatedAt: now },
  ];
  await bulkPut('sections', demoSections);
  breakdown['sections'] = demoSections.length;

  // 2. Groups, Shifts & Departments
  const demoGroups = [
    { id: 'grp_sci', instituteId: instId, name: 'Science', bengaliName: 'বিজ্ঞান', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'grp_hum', instituteId: instId, name: 'Humanities', bengaliName: 'মানবিক', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'grp_bus', instituteId: instId, name: 'Business Studies', bengaliName: 'ব্যবসায় শিক্ষা', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
  ];
  await bulkPut('groups', demoGroups);

  const demoShifts = [
    { id: 'shf_morn', instituteId: instId, name: 'Morning Shift', bengaliName: 'প্রভাতি শিফট', startTime: '07:30', endTime: '11:45', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'shf_day', instituteId: instId, name: 'Day Shift', bengaliName: 'দিবা শিফট', startTime: '12:00', endTime: '16:30', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
  ];
  await bulkPut('shifts', demoShifts);

  // 3. Subjects
  onProgress?.('Generating subjects and curriculum...', 35);
  const demoSubjects = [
    { id: 'sub_demo_ban', instituteId: instId, name: 'Bangla', bengaliName: 'বাংলা', code: 'BAN-101', type: 'mandatory', totalMarks: 100, passMarks: 33, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_demo_eng', instituteId: instId, name: 'English', bengaliName: 'ইংরেজি', code: 'ENG-102', type: 'mandatory', totalMarks: 100, passMarks: 33, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_demo_mth', instituteId: instId, name: 'Mathematics', bengaliName: 'সাধারণ গণিত', code: 'MTH-103', type: 'mandatory', totalMarks: 100, passMarks: 33, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_demo_sci', instituteId: instId, name: 'General Science', bengaliName: 'সাধারণ বিজ্ঞান', code: 'SCI-104', type: 'mandatory', totalMarks: 100, passMarks: 33, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'sub_demo_ict', instituteId: instId, name: 'ICT', bengaliName: 'তথ্য ও যোগাযোগ প্রযুক্তি', code: 'ICT-105', type: 'mandatory', totalMarks: 50, passMarks: 17, isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('subjects', demoSubjects);
  breakdown['subjects'] = demoSubjects.length;

  // 4. Students
  onProgress?.('Generating realistic student profiles...', 50);
  const demoStudentsList: any[] = [
    {
      id: 'stu_demo_01',
      instituteId: instId,
      academicYearId: yearId,
      studentId: 'SCH-2026-0001',
      firstName: 'Sadia',
      lastName: 'Rahman',
      bengaliName: 'সাদিয়া রহমান',
      rollNumber: 1,
      classId: 'cls_demo_6',
      sectionId: 'sec_demo_6a',
      gender: 'female',
      bloodGroup: 'A+',
      religion: 'Islam',
      dateOfBirth: '2014-03-15',
      phone: '01711223344',
      status: 'active',
      guardian: {
        fatherName: 'Md. Abdur Rahman',
        fatherNameBn: 'মোঃ আব্দুর রহমান',
        fatherPhone: '01711223344',
        fatherOccupation: 'Government Service',
        motherName: 'Salma Begum',
        motherNameBn: 'সালমা বেগম',
        motherPhone: '01811223344',
        motherOccupation: 'Homemaker',
        emergencyContactName: 'Md. Abdur Rahman',
        emergencyContactPhone: '01711223344',
        emergencyContactRelation: 'Father',
      },
      address: {
        presentAddress: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
        permanentAddress: 'House 12, Road 4, Sector 7, Uttara, Dhaka',
        district: 'Dhaka',
        upazila: 'Uttara',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu_demo_02',
      instituteId: instId,
      academicYearId: yearId,
      studentId: 'SCH-2026-0002',
      firstName: 'Abdullah',
      lastName: 'Al Noman',
      bengaliName: 'আব্দুল্লাহ আল নোমান',
      rollNumber: 2,
      classId: 'cls_demo_6',
      sectionId: 'sec_demo_6a',
      gender: 'male',
      bloodGroup: 'B+',
      religion: 'Islam',
      dateOfBirth: '2014-05-20',
      phone: '01819334455',
      status: 'active',
      guardian: {
        fatherName: 'Md. Nazrul Islam',
        fatherNameBn: 'মোঃ নজরুল ইসলাম',
        fatherPhone: '01819334455',
        fatherOccupation: 'Businessman',
        motherName: 'Farhana Parvin',
        motherNameBn: 'ফারহানা পারভীন',
        motherPhone: '01719334455',
        motherOccupation: 'Homemaker',
        emergencyContactName: 'Md. Nazrul Islam',
        emergencyContactPhone: '01819334455',
        emergencyContactRelation: 'Father',
      },
      address: {
        presentAddress: 'Plot 45, Mirpur-10, Dhaka',
        permanentAddress: 'Plot 45, Mirpur-10, Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu_demo_03',
      instituteId: instId,
      academicYearId: yearId,
      studentId: 'SCH-2026-0003',
      firstName: 'Fatima',
      lastName: 'Akter',
      bengaliName: 'ফাতিমা আক্তার',
      rollNumber: 3,
      classId: 'cls_demo_6',
      sectionId: 'sec_demo_6a',
      gender: 'female',
      bloodGroup: 'O+',
      religion: 'Islam',
      dateOfBirth: '2014-01-10',
      phone: '01912445566',
      status: 'active',
      guardian: {
        fatherName: 'Md. Rafiqul Hasan',
        fatherNameBn: 'মোঃ রফিকুল হাসান',
        fatherPhone: '01912445566',
        fatherOccupation: 'Engineer',
        motherName: 'Nasrin Akter',
        motherNameBn: 'নাসরিন আক্তার',
        motherPhone: '01712445566',
        motherOccupation: 'Teacher',
        emergencyContactName: 'Md. Rafiqul Hasan',
        emergencyContactPhone: '01912445566',
        emergencyContactRelation: 'Father',
      },
      address: {
        presentAddress: '12/A Dhanmondi R/A, Dhaka',
        permanentAddress: '12/A Dhanmondi R/A, Dhaka',
        district: 'Dhaka',
        upazila: 'Dhanmondi',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu_demo_04',
      instituteId: instId,
      academicYearId: yearId,
      studentId: 'SCH-2026-0004',
      firstName: 'Tanvir',
      lastName: 'Hossain',
      bengaliName: 'তানভীর হোসেন',
      rollNumber: 4,
      classId: 'cls_demo_6',
      sectionId: 'sec_demo_6b',
      gender: 'male',
      bloodGroup: 'AB+',
      religion: 'Islam',
      dateOfBirth: '2014-08-12',
      phone: '01615556677',
      status: 'active',
      guardian: {
        fatherName: 'Md. Monir Hossain',
        fatherNameBn: 'মোঃ মনির হোসেন',
        fatherPhone: '01615556677',
        fatherOccupation: 'Banker',
        motherName: 'Rasheda Khanom',
        motherNameBn: 'রাশেদা খানম',
        motherPhone: '01715556677',
        motherOccupation: 'Homemaker',
        emergencyContactName: 'Md. Monir Hossain',
        emergencyContactPhone: '01615556677',
        emergencyContactRelation: 'Father',
      },
      address: {
        presentAddress: '55 Green Road, Dhaka',
        permanentAddress: '55 Green Road, Dhaka',
        district: 'Dhaka',
        upazila: 'Tejgaon',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'stu_demo_05',
      instituteId: instId,
      academicYearId: yearId,
      studentId: 'SCH-2026-0005',
      firstName: 'Sumaiya',
      lastName: 'Islam',
      bengaliName: 'সুমাইয়া ইসলাম',
      rollNumber: 5,
      classId: 'cls_demo_6',
      sectionId: 'sec_demo_6b',
      gender: 'female',
      bloodGroup: 'A+',
      religion: 'Islam',
      dateOfBirth: '2014-02-28',
      phone: '01712667788',
      status: 'active',
      guardian: {
        fatherName: 'Md. Saiful Islam',
        fatherNameBn: 'মোঃ সাইফুল ইসলাম',
        fatherPhone: '01712667788',
        fatherOccupation: 'Advocate',
        motherName: 'Shahana Begum',
        motherNameBn: 'শাহানা বেগম',
        motherPhone: '01812667788',
        motherOccupation: 'Homemaker',
        emergencyContactName: 'Md. Saiful Islam',
        emergencyContactPhone: '01712667788',
        emergencyContactRelation: 'Father',
      },
      address: {
        presentAddress: 'Mohammadpur Housing, Dhaka',
        permanentAddress: 'Mohammadpur Housing, Dhaka',
        district: 'Dhaka',
        upazila: 'Mohammadpur',
      },
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await bulkPut('students', demoStudentsList);
  breakdown['students'] = demoStudentsList.length;

  // 5. Teachers & Staff
  onProgress?.('Generating teachers and faculty members...', 60);
  const demoTeachers: any[] = [
    {
      id: 'tch_demo_01',
      instituteId: instId,
      teacherId: 'TCH-001',
      firstName: 'Dr. Mahmudur',
      lastName: 'Rahman',
      bengaliName: 'ড. মাহমুদুর রহমান',
      fatherName: 'Md. Fazlur Rahman',
      fatherNameBn: 'মোঃ ফজলুর রহমান',
      motherName: 'Rabeya Khatun',
      motherNameBn: 'রাবেয়া খাতুন',
      employeeType: 'teacher',
      designation: 'Principal',
      bengaliDesignation: 'অধ্যক্ষ',
      departmentName: 'Science',
      phone: '01711001122',
      email: 'principal@school.edu.bd',
      presentAddress: 'Dhanmondi, Dhaka',
      employmentNature: 'permanent',
      joiningDate: '2015-01-01',
      gender: 'male',
      dateOfBirth: '1975-01-10',
      religion: 'Islam',
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tch_demo_02',
      instituteId: instId,
      teacherId: 'TCH-002',
      firstName: 'Nazmun',
      lastName: 'Nahar',
      bengaliName: 'নাজমুন নাহার',
      fatherName: 'Abul Kashem',
      fatherNameBn: 'আবুল কাশেম',
      motherName: 'Hosne Ara Begum',
      motherNameBn: 'হোসনে আরা বেগম',
      employeeType: 'teacher',
      designation: 'Vice Principal',
      bengaliDesignation: 'সহকারী প্রধান শিক্ষক',
      departmentName: 'Arts',
      phone: '01812112233',
      email: 'vice.principal@school.edu.bd',
      presentAddress: 'Uttara, Dhaka',
      employmentNature: 'permanent',
      joiningDate: '2017-06-01',
      gender: 'female',
      dateOfBirth: '1980-04-12',
      religion: 'Islam',
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tch_demo_03',
      instituteId: instId,
      teacherId: 'TCH-003',
      firstName: 'Md. Rafiqul',
      lastName: 'Islam',
      bengaliName: 'মোঃ রফিকুল ইসলাম',
      fatherName: 'Md. Nurul Islam',
      fatherNameBn: 'মোঃ নুরুল ইসলাম',
      motherName: 'Halima Khatun',
      motherNameBn: 'হালিমা খাতুন',
      employeeType: 'teacher',
      designation: 'Senior Teacher',
      bengaliDesignation: 'সিনিয়র শিক্ষক (গণিত)',
      departmentName: 'Science',
      phone: '01913223344',
      email: 'rafiqul@school.edu.bd',
      presentAddress: 'Mirpur, Dhaka',
      employmentNature: 'permanent',
      joiningDate: '2018-03-15',
      gender: 'male',
      dateOfBirth: '1983-09-20',
      religion: 'Islam',
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tch_demo_04',
      instituteId: instId,
      teacherId: 'TCH-004',
      firstName: 'Nasima',
      lastName: 'Khatun',
      bengaliName: 'নাসিমা খাতুন',
      fatherName: 'Abdul Malek',
      fatherNameBn: 'আব্দুল মালেক',
      motherName: 'Kulsum Begum',
      motherNameBn: 'কুলসুম বেগম',
      employeeType: 'teacher',
      designation: 'Assistant Teacher',
      bengaliDesignation: 'সহকারী শিক্ষক (বাংলা)',
      departmentName: 'Arts',
      phone: '01614334455',
      email: 'nasima@school.edu.bd',
      presentAddress: 'Mohammadpur, Dhaka',
      employmentNature: 'permanent',
      joiningDate: '2020-01-10',
      gender: 'female',
      dateOfBirth: '1988-11-05',
      religion: 'Islam',
      status: 'active',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await bulkPut('teachers', demoTeachers);
  breakdown['teachers'] = demoTeachers.length;

  // 6. Examinations & Marks
  onProgress?.('Generating examinations and grade marksheets...', 70);
  const demoExams = [
    { id: 'ex_demo_mid', instituteId: instId, academicYearId: yearId, title: 'First Term Examination 2026', bengaliTitle: 'প্রথম সাময়িক পরীক্ষা ২০২৬', term: '1st', startDate: '2026-04-10', endDate: '2026-04-25', status: 'completed', isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('exams', demoExams);

  const demoMarks = [
    { id: 'mrk_01_ban', examId: 'ex_demo_mid', studentId: 'stu_demo_01', subjectId: 'sub_demo_ban', fullMarks: 100, obtainedMarks: 88, grade: 'A+', gpa: 5.0, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'mrk_01_eng', examId: 'ex_demo_mid', studentId: 'stu_demo_01', subjectId: 'sub_demo_eng', fullMarks: 100, obtainedMarks: 82, grade: 'A+', gpa: 5.0, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'mrk_01_mth', examId: 'ex_demo_mid', studentId: 'stu_demo_01', subjectId: 'sub_demo_mth', fullMarks: 100, obtainedMarks: 95, grade: 'A+', gpa: 5.0, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'mrk_02_ban', examId: 'ex_demo_mid', studentId: 'stu_demo_02', subjectId: 'sub_demo_ban', fullMarks: 100, obtainedMarks: 76, grade: 'A', gpa: 4.0, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'mrk_02_eng', examId: 'ex_demo_mid', studentId: 'stu_demo_02', subjectId: 'sub_demo_eng', fullMarks: 100, obtainedMarks: 74, grade: 'A', gpa: 4.0, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'mrk_02_mth', examId: 'ex_demo_mid', studentId: 'stu_demo_02', subjectId: 'sub_demo_mth', fullMarks: 100, obtainedMarks: 89, grade: 'A+', gpa: 5.0, isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('marks', demoMarks);
  breakdown['marks'] = demoMarks.length;

  // 7. Fee Types, Charges, Payments & Receipts
  onProgress?.('Generating fee invoices and receipt transactions...', 80);
  const demoFeeTypes = [
    { id: 'ft_tuition', instituteId: instId, name: 'Monthly Tuition Fee', bengaliName: 'মাসিক বেতন', defaultAmount: 1500, frequency: 'monthly', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'ft_admission', instituteId: instId, name: 'Session Admission Fee', bengaliName: 'বার্ষিক ভর্তি ও সেশন ফি', defaultAmount: 3500, frequency: 'yearly', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'ft_exam', instituteId: instId, name: 'Exam Fee', bengaliName: 'পরীক্ষার ফি', defaultAmount: 800, frequency: 'term', isDemo: true, status: 'active', createdAt: now, updatedAt: now },
  ];
  await bulkPut('feeTypes', demoFeeTypes);

  const demoInvoices = [
    { id: 'inv_demo_01', instituteId: instId, academicYearId: yearId, studentId: 'stu_demo_01', studentName: 'Sadia Rahman', rollNumber: '01', classId: 'cls_demo_6', feeTypeId: 'ft_tuition', feeName: 'Monthly Tuition Fee - January 2026', totalAmount: 1500, paidAmount: 1500, dueAmount: 0, status: 'paid', month: 'January', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'inv_demo_02', instituteId: instId, academicYearId: yearId, studentId: 'stu_demo_02', studentName: 'Abdullah Al Noman', rollNumber: '02', classId: 'cls_demo_6', feeTypeId: 'ft_tuition', feeName: 'Monthly Tuition Fee - January 2026', totalAmount: 1500, paidAmount: 1000, dueAmount: 500, status: 'partial', month: 'January', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'inv_demo_03', instituteId: instId, academicYearId: yearId, studentId: 'stu_demo_03', studentName: 'Fatima Akter', rollNumber: '03', classId: 'cls_demo_6', feeTypeId: 'ft_tuition', feeName: 'Monthly Tuition Fee - January 2026', totalAmount: 1500, paidAmount: 0, dueAmount: 1500, status: 'unpaid', month: 'January', isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('feeCharges', demoInvoices);
  breakdown['feeCharges'] = demoInvoices.length;

  const demoPayments = [
    { id: 'pay_demo_01', invoiceId: 'inv_demo_01', receiptNumber: 'RCP-2026-000001', studentId: 'stu_demo_01', studentName: 'Sadia Rahman', amount: 1500, paymentMethod: 'cash', collectedBy: 'Admin', paymentDate: todayStr, isDemo: true, status: 'completed', createdAt: now, updatedAt: now },
    { id: 'pay_demo_02', invoiceId: 'inv_demo_02', receiptNumber: 'RCP-2026-000002', studentId: 'stu_demo_02', studentName: 'Abdullah Al Noman', amount: 1000, paymentMethod: 'bKash', transactionId: 'TRX9882736', collectedBy: 'Admin', paymentDate: todayStr, isDemo: true, status: 'completed', createdAt: now, updatedAt: now },
  ];
  await bulkPut('payments', demoPayments);
  await bulkPut('receipts', demoPayments);
  breakdown['payments'] = demoPayments.length;

  // 8. Incomes & Expenses
  const demoIncomes = [
    { id: 'inc_01', instituteId: instId, title: 'Student Tuition Collection (January)', bengaliTitle: 'মাসিক বেতন সংগ্রহ', category: 'Tuition Fee', amount: 2500, date: todayStr, paymentMethod: 'cash', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'inc_02', instituteId: instId, title: 'Alumni Development Donation', bengaliTitle: 'প্রাক্তন শিক্ষার্থী অনুদান', category: 'Donation', amount: 20000, date: todayStr, paymentMethod: 'bank', isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('incomes', demoIncomes);

  const demoExpenses = [
    { id: 'exp_01', instituteId: instId, title: 'Electricity Bill Payment', bengaliTitle: 'বিদ্যুৎ বিল পরিশোধ', category: 'Utility', amount: 4500, date: todayStr, paymentMethod: 'bank', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'exp_02', instituteId: instId, title: 'Office Stationery & Printing Papers', bengaliTitle: 'অফিস স্টেশনারি ও খাতা ক্রয়', category: 'Supplies', amount: 3200, date: todayStr, paymentMethod: 'cash', isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('expenses', demoExpenses);
  breakdown['accounts'] = demoIncomes.length + demoExpenses.length;

  // 9. Extra: Notices, Calendar, Library Books & Inventory
  onProgress?.('Generating notices, events and library records...', 90);
  const demoNotices = [
    { id: 'ntc_01', instituteId: instId, title: 'Annual Sports Competition & Cultural Week 2026', bengaliTitle: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ও সাংস্কৃতিক সপ্তাহ ২০২৬', content: 'সকল শিক্ষার্থী ও শিক্ষকদের জানানো যাচ্ছে যে আগামী ১০ই ফেব্রুয়ারি থেকে বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হবে।', category: 'Academic', publishDate: todayStr, isPublished: true, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'ntc_02', instituteId: instId, title: 'Eid-ul-Fitr Vacation Notice', bengaliTitle: 'পবিত্র ঈদুল ফিতর উপলক্ষ্যে ছুটি সংক্রান্ত বিজ্ঞপ্তি', content: 'পবিত্র ঈদুল ফিতর উপলক্ষ্যে বিদ্যালয় আগামী নির্দিষ্ট মেয়াদে ছুটি থাকবে।', category: 'Holiday', publishDate: todayStr, isPublished: true, isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('notices', demoNotices);

  const demoCalendar = [
    { id: 'cal_01', instituteId: instId, title: 'Annual Sports Day', bengaliTitle: 'বার্ষিক ক্রীড়া দিবস', startDate: `${todayStr}T09:00:00`, endDate: `${todayStr}T17:00:00`, eventType: 'sports', isDemo: true, createdAt: now },
  ];
  await bulkPut('calendarEvents', demoCalendar);

  const demoBooks = [
    { id: 'bk_01', instituteId: instId, title: 'Bangla Sahitya Kanika', bengaliTitle: 'বাংলা সাহিত্য কণিকা', author: 'NCTB', isbn: '978-984-01-0021', quantity: 25, availableCopies: 24, isDemo: true, createdAt: now, updatedAt: now },
    { id: 'bk_02', instituteId: instId, title: 'Higher Secondary Physics Vol 1', bengaliTitle: 'উচ্চ মাধ্যমিক পদার্থবিজ্ঞান ১ম পত্র', author: 'Dr. Shahjahan Tapan', isbn: '978-984-05-1122', quantity: 15, availableCopies: 14, isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('books', demoBooks);

  const demoInventory = [
    { id: 'inv_01', instituteId: instId, itemName: 'Classroom High-Low Benches', bengaliName: 'শ্রেণিকক্ষের হাই-লো বেঞ্চ', category: 'Furniture', quantity: 60, condition: 'Good', isDemo: true, createdAt: now, updatedAt: now },
    { id: 'inv_02', instituteId: instId, itemName: 'Interactive Smart Board & Projector', bengaliName: 'ইন্টারেক্টিভ মাল্টিমিডিয়া প্রজেক্টর', category: 'Electronics', quantity: 4, condition: 'Good', isDemo: true, createdAt: now, updatedAt: now },
  ];
  await bulkPut('inventoryItems', demoInventory);

  // Update Settings flag
  try {
    const settings = await get<AppSettings>('settings', 'global');
    if (settings) {
      settings.hasDemoData = true;
      settings.updatedAt = new Date().toISOString();
      await putItem('settings', settings);
    }
  } catch (e) {}

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  onProgress?.('Demo data seeding completed successfully!', 100);

  return {
    success: true,
    message: `Successfully generated ${total} demo records across all academic and operational modules.`,
    bengaliMessage: `সকল মডিউলে সফলভাবে মোট ${total}টি বাস্তবসম্মত ডেমো তথ্য তৈরি করা হয়েছে। আপনি এখন প্রতিটি ফিচার টেস্ট করতে পারেন।`,
    totalRecordsCreated: total,
    breakdown,
  };
}

// 4. 1-Click Complete Demo Data Purge / Delete
export async function purgeAllDemoData(
  onProgress?: (msg: string, pct: number) => void
): Promise<{ success: boolean; deletedCount: number; message: string; bengaliMessage: string }> {
  onProgress?.('Creating pre-purge emergency database snapshot...', 15);
  await saveLocalSnapshot(
    `Pre-Demo-Purge-${new Date().toISOString().split('T')[0]}`,
    'manual',
    'Automatic safeguard snapshot created immediately before 1-Click Demo Data Purge.'
  );

  const demoStoresToCheck = [
    'classes',
    'sections',
    'groups',
    'shifts',
    'subjects',
    'students',
    'studentEnrollments',
    'studentDocuments',
    'teachers',
    'teacherAttendance',
    'studentAttendance',
    'exams',
    'examSchedules',
    'marks',
    'results',
    'feeTypes',
    'feeStructures',
    'feeCharges',
    'payments',
    'receipts',
    'incomes',
    'expenses',
    'notices',
    'calendarEvents',
    'books',
    'bookIssues',
    'inventoryItems',
    'actionLogs',
  ];

  let deletedCount = 0;
  let storeIdx = 0;

  for (const storeName of demoStoresToCheck) {
    storeIdx++;
    onProgress?.(
      `Cleaning demo records from store: ${storeName}...`,
      Math.round(20 + (storeIdx / demoStoresToCheck.length) * 75)
    );

    try {
      const items = await getAll<any>(storeName as any);
      for (const item of items) {
        if (item.isDemo === true || (item.id && String(item.id).includes('_demo_'))) {
          await remove(storeName as any, item.id);
          deletedCount++;
        }
      }
    } catch (e) {
      console.warn(`Error scanning store ${storeName} for demo data:`, e);
    }
  }

  // Update Settings flag
  try {
    const settings = await get<AppSettings>('settings', 'global');
    if (settings) {
      settings.hasDemoData = false;
      settings.updatedAt = new Date().toISOString();
      await putItem('settings', settings);
    }
  } catch (e) {}

  onProgress?.('Demo data clean-up complete!', 100);

  return {
    success: true,
    deletedCount,
    message: `Cleaned ${deletedCount} demo records. All real master records and institutional configurations are preserved.`,
    bengaliMessage: `মোট ${deletedCount}টি ডেমো তথ্য ১-ক্লিকে সম্পূর্ণ মুছে ফেলা হয়েছে। আপনার আসল ডাটাবেস সম্পূর্ণ অক্ষুণ্ণ রয়েছে।`,
  };
}
