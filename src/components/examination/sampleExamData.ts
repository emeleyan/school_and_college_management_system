import {
  ExamTerm,
  ExamScheduleSlot,
  MarkEntryRecord,
  StudentResultSummary,
  QuestionBankItem,
} from '../../types';
import { calculateGradeAndPoint, calculateOverallGPA } from '../../utils/gradingSystem';

export function generateSampleExamData(
  instituteId: string,
  academicYearId: string,
  students: any[],
  classes: any[],
  sections: any[],
  subjects: any[]
) {
  const currentYear = '2026';

  // 1. Exam Terms
  const examTerms: ExamTerm[] = [
    {
      id: `exam-term-1-${instituteId}`,
      instituteId,
      academicYearId,
      name: 'Half Yearly Examination 2026',
      bengaliName: 'অর্ধ-বার্ষিক পরীক্ষা ২০২৬',
      termType: 'half_yearly',
      startDate: `${currentYear}-06-10`,
      endDate: `${currentYear}-06-25`,
      status: 'published',
      weightPercentage: 50,
      description: 'First comprehensive mid-term evaluation covering 50% syllabus.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `exam-term-2-${instituteId}`,
      instituteId,
      academicYearId,
      name: 'Annual / Final Examination 2026',
      bengaliName: 'বার্ষিক পরীক্ষা ২০২৬',
      termType: 'final',
      startDate: `${currentYear}-11-20`,
      endDate: `${currentYear}-12-08`,
      status: 'upcoming',
      weightPercentage: 50,
      description: 'Annual comprehensive evaluation determining class promotion.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `exam-term-3-${instituteId}`,
      instituteId,
      academicYearId,
      name: 'Pre-Test Examination (SSC/HSC Candidate)',
      bengaliName: 'প্রাক-নির্বাচনী পরীক্ষা',
      termType: 'pre_test',
      startDate: `${currentYear}-08-15`,
      endDate: `${currentYear}-08-28`,
      status: 'upcoming',
      weightPercentage: 100,
      description: 'Board candidate screening exam.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const targetTerm = examTerms[0];
  const targetClass = classes[0];
  const classSubjects = subjects.filter((s) => s.classId === targetClass?.id || !s.classId).slice(0, 6);

  // 2. Schedules
  const examSchedules: ExamScheduleSlot[] = classSubjects.map((sub, idx) => {
    const examDay = String(10 + idx * 2).padStart(2, '0');
    return {
      id: `exam-slot-${idx}-${targetTerm.id}`,
      examTermId: targetTerm.id,
      instituteId,
      academicYearId,
      classId: targetClass?.id || 'class-01',
      className: targetClass?.name || 'Class 10',
      subjectId: sub.id,
      subjectName: sub.name,
      subjectCode: sub.code || `SUB-${101 + idx}`,
      examDate: `${currentYear}-06-${examDay}`,
      startTime: '10:00',
      endTime: '13:00',
      roomNumber: `Room 20${(idx % 3) + 1}`,
      fullMarks: sub.fullMarks || 100,
      theoryMarks: sub.theoryMarks || (sub.hasPractical ? 50 : 70),
      mcqMarks: sub.mcqMarks || 30,
      practicalMarks: sub.practicalMarks || (sub.hasPractical ? 25 : 0),
      createdAt: new Date().toISOString(),
    };
  });

  // 3. Mark Records for students
  const markRecords: MarkEntryRecord[] = [];
  const targetStudents = students.filter((s) => s.instituteId === instituteId).slice(0, 10);

  targetStudents.forEach((student) => {
    const studentName = `${student.firstName} ${student.lastName}`;
    classSubjects.forEach((sub, subIdx) => {
      const is4th = subIdx === classSubjects.length - 1; // Mark last subject as 4th optional
      // Generate realistic scores based on student roll
      const basePerformance = Math.max(45, 92 - student.rollNumber * 4);
      const cqMax = sub.hasPractical ? 50 : 70;
      const mcqMax = 30;
      const pracMax = sub.hasPractical ? 20 : 0;

      const cqMarks = Math.min(cqMax, Math.round((basePerformance * cqMax) / 100) + (subIdx % 4) - 2);
      const mcqMarks = Math.min(mcqMax, Math.round((basePerformance * mcqMax) / 100) + (subIdx % 3) - 1);
      const practicalMarks = pracMax > 0 ? Math.min(pracMax, pracMax - 1) : 0;
      const totalMarks = cqMarks + mcqMarks + practicalMarks;

      const { grade, point } = calculateGradeAndPoint(totalMarks, 100);

      markRecords.push({
        id: `mark-${student.id}-${sub.id}-${targetTerm.id}`,
        instituteId,
        academicYearId,
        examTermId: targetTerm.id,
        classId: targetClass?.id || student.classId,
        className: targetClass?.name || 'Class 10',
        sectionId: student.sectionId || 'sec-01',
        sectionName: 'A',
        studentId: student.id,
        studentName,
        rollNumber: student.rollNumber,
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code || `SUB-${101 + subIdx}`,
        isOptionalSubject: is4th,
        cqMarks,
        mcqMarks,
        practicalMarks,
        totalMarks,
        grade,
        point,
        isPassed: grade !== 'F',
        enteredBy: 'Examiner Panel',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  // 4. Results Summary
  const resultsSummary: StudentResultSummary[] = targetStudents.map((student) => {
    const studentName = `${student.firstName} ${student.lastName}`;
    const studentMarks = markRecords.filter((m) => m.studentId === student.id);
    const totalMarksObtained = studentMarks.reduce((acc, m) => acc + m.totalMarks, 0);
    const maxPossibleMarks = studentMarks.length * 100;
    const percentage = maxPossibleMarks > 0 ? Number(((totalMarksObtained / maxPossibleMarks) * 100).toFixed(1)) : 0;

    const gpaInfo = calculateOverallGPA(
      studentMarks.map((m) => ({
        grade: m.grade,
        point: m.point,
        isOptional4th: m.isOptionalSubject,
      }))
    );

    return {
      id: `res-${student.id}-${targetTerm.id}`,
      instituteId,
      academicYearId,
      examTermId: targetTerm.id,
      classId: targetClass?.id || student.classId,
      className: targetClass?.name || 'Class 10',
      sectionId: student.sectionId || 'sec-01',
      sectionName: 'A',
      studentId: student.id,
      studentName,
      rollNumber: student.rollNumber,
      totalMarksObtained,
      maxPossibleMarks,
      percentage,
      gpaWithout4th: gpaInfo.gpaWithout4th,
      gpaWith4th: gpaInfo.gpaWith4th,
      finalGrade: gpaInfo.finalGrade,
      meritRankClass: student.rollNumber,
      meritRankSection: student.rollNumber,
      isPassedAll: gpaInfo.isPassed,
      failedSubjectCount: gpaInfo.failedCount,
      passedSubjectCount: studentMarks.length - gpaInfo.failedCount,
      generatedAt: new Date().toISOString(),
    };
  });

  // Sort by merit rank (highest GPA, then highest total marks)
  resultsSummary.sort((a, b) => {
    if (b.gpaWith4th !== a.gpaWith4th) return b.gpaWith4th - a.gpaWith4th;
    return b.totalMarksObtained - a.totalMarksObtained;
  });

  resultsSummary.forEach((r, idx) => {
    r.meritRankClass = idx + 1;
    r.meritRankSection = idx + 1;
  });

  // 5. Sample Question Bank
  const sampleQuestionBank: QuestionBankItem[] = [
    {
      id: 'qb-1',
      instituteId,
      classId: targetClass?.id || 'class-01',
      className: targetClass?.name || 'Class 10',
      subjectId: classSubjects[0]?.id || 'sub-01',
      subjectName: classSubjects[0]?.name || 'Bangla 1st Paper',
      chapter: 'Chapter 1: Shuvashini',
      questionType: 'creative',
      difficulty: 'medium',
      stemOrQuestion:
        'রহিমা খাতুন বাক ও শ্রবণপ্রতিবন্ধী একটি মেয়ে। গ্রামের মানুষের অবহেলা ও উপহাস সত্ত্বেও তার মা তাকে পরম মমতায় বড় করে তোলেন এবং নিজের যোগ্যতায় স্বাবলম্বী করার চেষ্টা করেন।',
      subQuestions: [
        { label: 'ক', mark: 1, text: 'সুভার পুরো নাম কী ছিল?' },
        { label: 'খ', mark: 2, text: '"সুভার চোখ দুটো যেন কথা বলে"—ব্যাখ্যা করো।' },
        { label: 'গ', mark: 3, text: 'উদ্দীপকের রহিমা খাতুনের জীবনের সাথে পাঠ্যপুস্তকের সুভার সাদৃশ্য তুলে ধরো।' },
        { label: 'ঘ', mark: 4, text: 'উদ্দীপক ও গল্পের মূল চেতনার আলোকে বিশেষ চাহিদাসম্পন্ন শিশুদের প্রতি সমাজের দৃষ্টিভঙ্গি মূল্যায়ন করো।' },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'qb-2',
      instituteId,
      classId: targetClass?.id || 'class-01',
      className: targetClass?.name || 'Class 10',
      subjectId: classSubjects[1]?.id || 'sub-02',
      subjectName: classSubjects[1]?.name || 'General Mathematics',
      chapter: 'Chapter 3: Algebraic Expressions',
      questionType: 'mcq',
      difficulty: 'easy',
      stemOrQuestion: 'যদি x + 1/x = 4 হয়, তবে x² + 1/x² এর মান কত?',
      mcqOptions: [
        { id: 'opt1', text: '14', isCorrect: true },
        { id: 'opt2', text: '16', isCorrect: false },
        { id: 'opt3', text: '18', isCorrect: false },
        { id: 'opt4', text: '12', isCorrect: false },
      ],
      explanation: 'x² + 1/x² = (x + 1/x)² - 2 = (4)² - 2 = 16 - 2 = 14',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    examTerms,
    examSchedules,
    markRecords,
    resultsSummary,
    sampleQuestionBank,
  };
}
