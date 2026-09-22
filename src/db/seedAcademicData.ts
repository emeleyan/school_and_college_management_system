import {
  AcademicClass,
  AcademicSection,
  AcademicGroup,
  AcademicShift,
  AcademicDepartment,
  AcademicSubject,
  ClassRoutinePeriod,
  Institute,
  AcademicYear,
  SubjectType,
} from '../types';
import { add, update, getAll } from './indexedDB';

interface SubjectSeedItem {
  code: string;
  name: string;
  bengali: string;
  type: SubjectType;
  full: number;
  theory: number;
  mcq: number;
  prac: number;
  pass: number;
  hasPrac: boolean;
}

export async function seedStandardCurriculum(
  institute: Institute,
  academicYear?: AcademicYear | null
): Promise<{ classesCount: number; subjectsCount: number; sectionsCount: number }> {
  const instId = institute.id;
  const isSchool = institute.type === 'school';

  // 1. Shifts
  const defaultShifts: AcademicShift[] = [
    {
      id: `shift_${instId}_morning`,
      instituteId: instId,
      name: 'Morning Shift',
      bengaliName: 'প্রভাতী শিফট',
      startTime: '07:30 AM',
      endTime: '12:15 PM',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `shift_${instId}_day`,
      instituteId: instId,
      name: 'Day Shift',
      bengaliName: 'দিবা শিফট',
      startTime: '12:30 PM',
      endTime: '05:00 PM',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const s of defaultShifts) {
    await update('shifts', s);
  }

  // 2. Groups
  const defaultGroups: AcademicGroup[] = [
    {
      id: `group_${instId}_sci`,
      instituteId: instId,
      name: 'Science',
      bengaliName: 'বিজ্ঞান',
      code: 'SCI',
      description: 'Science Group (Physics, Chemistry, Math, Biology)',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `group_${instId}_bus`,
      instituteId: instId,
      name: 'Business Studies',
      bengaliName: 'ব্যবসায় শিক্ষা',
      code: 'BUS',
      description: 'Commerce and Business Studies Group',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `group_${instId}_hum`,
      instituteId: instId,
      name: 'Humanities',
      bengaliName: 'মানবিক',
      code: 'HUM',
      description: 'Arts & Humanities Group',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `group_${instId}_gen`,
      instituteId: instId,
      name: 'General',
      bengaliName: 'সাধারণ',
      code: 'GEN',
      description: 'Unified General Curriculum',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const g of defaultGroups) {
    await update('groups', g);
  }

  // 3. Departments
  const defaultDepartments: AcademicDepartment[] = [
    {
      id: `dept_${instId}_languages`,
      instituteId: instId,
      name: 'Department of Languages',
      bengaliName: 'ভাষা বিভাগ (বাংলা ও ইংরেজি)',
      code: 'LANG',
      headName: 'Dr. Rafiqul Islam',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `dept_${instId}_science`,
      instituteId: instId,
      name: 'Department of Natural Sciences',
      bengaliName: 'বিজ্ঞান বিভাগ',
      code: 'SCI',
      headName: 'Dr. Shahinur Rahman',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `dept_${instId}_math`,
      instituteId: instId,
      name: 'Department of Mathematics',
      bengaliName: 'গণিত বিভাগ',
      code: 'MATH',
      headName: 'Prof. Anisul Haque',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `dept_${instId}_commerce`,
      instituteId: instId,
      name: 'Department of Business Studies',
      bengaliName: 'ব্যবসায় শিক্ষা বিভাগ',
      code: 'BUSD',
      headName: 'Ms. Fahmida Sultana',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const d of defaultDepartments) {
    await update('departments', d);
  }

  // 4. Classes and Sections
  let createdClasses: AcademicClass[] = [];
  let createdSections: AcademicSection[] = [];
  let createdSubjects: AcademicSubject[] = [];

  if (isSchool) {
    // School: Class 6 to 10
    const schoolClassesData = [
      { name: 'Class 6', bengaliName: '৬ষ্ঠ শ্রেণি', level: 6, hasGroups: false },
      { name: 'Class 7', bengaliName: '৭ম শ্রেণি', level: 7, hasGroups: false },
      { name: 'Class 8', bengaliName: '৮ম শ্রেণি', level: 8, hasGroups: false },
      { name: 'Class 9', bengaliName: '৯ম শ্রেণি', level: 9, hasGroups: true },
      { name: 'Class 10', bengaliName: '১০ম শ্রেণি', level: 10, hasGroups: true },
    ];

    for (const c of schoolClassesData) {
      const classId = `class_${instId}_${c.level}`;
      const classObj: AcademicClass = {
        id: classId,
        instituteId: instId,
        name: c.name,
        bengaliName: c.bengaliName,
        numericLevel: c.level,
        hasGroups: c.hasGroups,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await update('classes', classObj);
      createdClasses.push(classObj);

      // Add 2 sections per class
      const secA: AcademicSection = {
        id: `sec_${classId}_a`,
        instituteId: instId,
        classId: classId,
        name: 'Section A (Padma)',
        bengaliName: 'শাখা ক (পদ্মা)',
        shiftId: defaultShifts[0]?.id || '',
        roomNumber: `Room 10${c.level - 5}`,
        capacity: 50,
        classTeacherName: 'Md. Kamrul Hasan',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const secB: AcademicSection = {
        id: `sec_${classId}_b`,
        instituteId: instId,
        classId: classId,
        name: 'Section B (Meghna)',
        bengaliName: 'শাখা খ (মেঘনা)',
        shiftId: defaultShifts[1].id,
        roomNumber: `Room 20${c.level - 5}`,
        capacity: 50,
        classTeacherName: 'Shamima Akter',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await update('sections', secA);
      await update('sections', secB);
      createdSections.push(secA, secB);

      // Core Subjects for school
      const schoolSubjectsList: SubjectSeedItem[] = [
        {
          code: '101',
          name: 'Bangla 1st Paper',
          bengali: 'বাংলা ১ম পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '102',
          name: 'Bangla 2nd Paper',
          bengali: 'বাংলা ২য় পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '107',
          name: 'English 1st Paper',
          bengali: 'ইংরেজি ১ম পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 100,
          mcq: 0,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '108',
          name: 'English 2nd Paper',
          bengali: 'ইংরেজি ২য় পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 100,
          mcq: 0,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '109',
          name: 'Mathematics',
          bengali: 'সাধারণ গণিত',
          type: 'compulsory' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '154',
          name: 'Information & Communication Tech (ICT)',
          bengali: 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)',
          type: 'compulsory' as const,
          full: 50,
          theory: 25,
          mcq: 25,
          prac: 0,
          pass: 17,
          hasPrac: false,
        },
      ];

      // If Class 9 or 10, add science/business electives
      if (c.hasGroups) {
        schoolSubjectsList.push(
          {
            code: '136',
            name: 'Physics',
            bengali: 'পদার্থবিজ্ঞান',
            type: 'elective' as const,
            full: 100,
            theory: 50,
            mcq: 25,
            prac: 25,
            pass: 33,
            hasPrac: true,
          },
          {
            code: '137',
            name: 'Chemistry',
            bengali: 'রসায়ন',
            type: 'elective' as const,
            full: 100,
            theory: 50,
            mcq: 25,
            prac: 25,
            pass: 33,
            hasPrac: true,
          },
          {
            code: '138',
            name: 'Biology',
            bengali: 'জীববিজ্ঞান',
            type: 'elective' as const,
            full: 100,
            theory: 50,
            mcq: 25,
            prac: 25,
            pass: 33,
            hasPrac: true,
          },
          {
            code: '126',
            name: 'Higher Mathematics',
            bengali: 'উচ্চতর গণিত',
            type: 'optional_4th' as const,
            full: 100,
            theory: 50,
            mcq: 25,
            prac: 25,
            pass: 33,
            hasPrac: true,
          },
          {
            code: '146',
            name: 'Accounting',
            bengali: 'হিসাববিজ্ঞান',
            type: 'elective' as const,
            full: 100,
            theory: 70,
            mcq: 30,
            prac: 0,
            pass: 33,
            hasPrac: false,
          }
        );
      } else {
        schoolSubjectsList.push({
          code: '127',
          name: 'General Science',
          bengali: 'সাধারণ বিজ্ঞান',
          type: 'compulsory' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        });
      }

      for (const subj of schoolSubjectsList) {
        const subjObj: AcademicSubject = {
          id: `subj_${classId}_${subj.code}`,
          instituteId: instId,
          classId: classId,
          name: subj.name,
          bengaliName: subj.bengali,
          code: subj.code,
          type: subj.type,
          fullMarks: subj.full,
          theoryMarks: subj.theory,
          mcqMarks: subj.mcq,
          practicalMarks: subj.prac,
          passMarks: subj.pass,
          hasPractical: subj.hasPrac,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await update('subjects', subjObj);
        createdSubjects.push(subjObj);
      }
    }
  } else {
    // College: Class 11 (HSC 1st Year) and Class 12 (HSC 2nd Year)
    const collegeClassesData = [
      { name: 'Class 11 (HSC 1st Year)', bengaliName: 'একাদশ শ্রেণি (এইচএসসি ১ম বর্ষ)', level: 11 },
      { name: 'Class 12 (HSC 2nd Year)', bengaliName: 'দ্বাদশ শ্রেণি (এইচএসসি ২য় বর্ষ)', level: 12 },
    ];

    for (const c of collegeClassesData) {
      const classId = `class_${instId}_${c.level}`;
      const classObj: AcademicClass = {
        id: classId,
        instituteId: instId,
        name: c.name,
        bengaliName: c.bengaliName,
        numericLevel: c.level,
        hasGroups: true,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await update('classes', classObj);
      createdClasses.push(classObj);

      // Sections for College
      const secSci: AcademicSection = {
        id: `sec_${classId}_sci`,
        instituteId: instId,
        classId: classId,
        name: 'Science Section (Newton)',
        bengaliName: 'বিজ্ঞান শাখা (নিউটন)',
        shiftId: defaultShifts[0]?.id || '',
        roomNumber: 'Science Hall 301',
        capacity: 80,
        classTeacherName: 'Dr. Shahinur Rahman',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const secBus: AcademicSection = {
        id: `sec_${classId}_bus`,
        instituteId: instId,
        classId: classId,
        name: 'Business Studies Section (Kotler)',
        bengaliName: 'ব্যবসায় শিক্ষা শাখা (কোটলার)',
        shiftId: (defaultShifts[1] || defaultShifts[0])?.id || '',
        roomNumber: 'Commerce Hall 204',
        capacity: 75,
        classTeacherName: 'Ms. Fahmida Sultana',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const secHum: AcademicSection = {
        id: `sec_${classId}_hum`,
        instituteId: instId,
        classId: classId,
        name: 'Humanities Section (Tagore)',
        bengaliName: 'মানবিক শাখা (রবীন্দ্রনাথ)',
        shiftId: defaultShifts[0]?.id || '',
        roomNumber: 'Arts Hall 105',
        capacity: 70,
        classTeacherName: 'Dr. Rafiqul Islam',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await update('sections', secSci);
      await update('sections', secBus);
      await update('sections', secHum);
      createdSections.push(secSci, secBus, secHum);

      // College Subjects
      const collegeSubjects: SubjectSeedItem[] = [
        {
          code: '101',
          name: 'Bangla',
          bengali: 'বাংলা ১ম ও ২য় পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '107',
          name: 'English',
          bengali: 'ইংরেজি ১ম ও ২য় পত্র',
          type: 'compulsory' as const,
          full: 100,
          theory: 100,
          mcq: 0,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '275',
          name: 'Information & Communication Tech (ICT)',
          bengali: 'তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)',
          type: 'compulsory' as const,
          full: 100,
          theory: 50,
          mcq: 25,
          prac: 25,
          pass: 33,
          hasPrac: true,
        },
        {
          code: '174',
          name: 'Physics',
          bengali: 'পদার্থবিজ্ঞান',
          type: 'elective' as const,
          full: 100,
          theory: 50,
          mcq: 25,
          prac: 25,
          pass: 33,
          hasPrac: true,
        },
        {
          code: '176',
          name: 'Chemistry',
          bengali: 'রসায়ন',
          type: 'elective' as const,
          full: 100,
          theory: 50,
          mcq: 25,
          prac: 25,
          pass: 33,
          hasPrac: true,
        },
        {
          code: '265',
          name: 'Higher Mathematics',
          bengali: 'উচ্চতর গণিত',
          type: 'elective' as const,
          full: 100,
          theory: 50,
          mcq: 25,
          prac: 25,
          pass: 33,
          hasPrac: true,
        },
        {
          code: '178',
          name: 'Biology',
          bengali: 'জীববিজ্ঞান',
          type: 'optional_4th' as const,
          full: 100,
          theory: 50,
          mcq: 25,
          prac: 25,
          pass: 33,
          hasPrac: true,
        },
        {
          code: '253',
          name: 'Accounting',
          bengali: 'হিসাববিজ্ঞান',
          type: 'elective' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '292',
          name: 'Finance, Banking & Insurance',
          bengali: 'ফিন্যান্স, ব্যাংকিং ও বীমা',
          type: 'elective' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
        {
          code: '109',
          name: 'Economics',
          bengali: 'অর্থনীতি',
          type: 'elective' as const,
          full: 100,
          theory: 70,
          mcq: 30,
          prac: 0,
          pass: 33,
          hasPrac: false,
        },
      ];

      for (const subj of collegeSubjects) {
        const subjObj: AcademicSubject = {
          id: `subj_${classId}_${subj.code}`,
          instituteId: instId,
          classId: classId,
          name: subj.name,
          bengaliName: subj.bengali,
          code: subj.code,
          type: subj.type,
          fullMarks: subj.full,
          theoryMarks: subj.theory,
          mcqMarks: subj.mcq,
          practicalMarks: subj.prac,
          passMarks: subj.pass,
          hasPractical: subj.hasPrac,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await update('subjects', subjObj);
        createdSubjects.push(subjObj);
      }
    }
  }

  // 5. Seed sample class routine periods if an academic year is provided
  if (academicYear && createdClasses.length > 0 && createdSections.length > 0 && createdSubjects.length > 0) {
    const targetClass = createdClasses[0];
    const targetSection = createdSections.find((s) => s.classId === targetClass.id) || createdSections[0];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'] as const;

    const periodsData = [
      { num: 1, start: '08:00 AM', end: '08:45 AM', subjIndex: 0, teacher: 'Dr. Rafiqul Islam' },
      { num: 2, start: '08:50 AM', end: '09:35 AM', subjIndex: 1, teacher: 'Shamima Akter' },
      { num: 3, start: '09:40 AM', end: '10:25 AM', subjIndex: 2, teacher: 'Md. Kamrul Hasan' },
      { num: 4, start: '10:45 AM', end: '11:30 AM', subjIndex: 3, teacher: 'Dr. Shahinur Rahman' },
      { num: 5, start: '11:35 AM', end: '12:20 PM', subjIndex: 4, teacher: 'Prof. Anisul Haque' },
    ];

    for (const day of days) {
      for (const p of periodsData) {
        const subj = createdSubjects[p.subjIndex % createdSubjects.length];
        const routineObj: ClassRoutinePeriod = {
          id: `routine_${targetSection.id}_${day}_${p.num}`,
          instituteId: instId,
          academicYearId: academicYear.id,
          classId: targetClass.id,
          sectionId: targetSection.id,
          dayOfWeek: day,
          periodNumber: p.num,
          startTime: p.start,
          endTime: p.end,
          subjectId: subj.id,
          subjectName: subj.name,
          teacherName: p.teacher,
          roomNumber: targetSection.roomNumber || 'Room 101',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await update('subjectAssignments', routineObj);
      }
    }
  }

  return {
    classesCount: createdClasses.length,
    subjectsCount: createdSubjects.length,
    sectionsCount: createdSections.length,
  };
}
