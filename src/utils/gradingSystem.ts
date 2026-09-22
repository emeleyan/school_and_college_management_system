import { BoardGradeBand } from '../types';

/**
 * Official Ministry of Education & Secondary/Higher Secondary Education Board (BISE)
 * Uniform Grading System of Bangladesh
 */
export const BANGLADESH_BOARD_GRADING_SYSTEM: BoardGradeBand[] = [
  { minMarks: 80, maxMarks: 100, grade: 'A+', point: 5.0, remarks: 'Outstanding' },
  { minMarks: 70, maxMarks: 79, grade: 'A', point: 4.0, remarks: 'Excellent' },
  { minMarks: 60, maxMarks: 69, grade: 'A-', point: 3.5, remarks: 'Very Good' },
  { minMarks: 50, maxMarks: 59, grade: 'B', point: 3.0, remarks: 'Good' },
  { minMarks: 40, maxMarks: 49, grade: 'C', point: 2.0, remarks: 'Satisfactory' },
  { minMarks: 33, maxMarks: 39, grade: 'D', point: 1.0, remarks: 'Pass' },
  { minMarks: 0, maxMarks: 32, grade: 'F', point: 0.0, remarks: 'Fail' },
];

/**
 * Calculate Letter Grade and Grade Point from numerical marks (0 - 100 scale)
 */
export function calculateGradeAndPoint(marks: number, fullMarks = 100): { grade: string; point: number; remarks: string } {
  // Normalize to 100% scale if fullMarks is different (e.g. 50, 75, 200)
  const normalized = fullMarks === 100 ? marks : Math.round((marks / fullMarks) * 100);

  for (const band of BANGLADESH_BOARD_GRADING_SYSTEM) {
    if (normalized >= band.minMarks && normalized <= band.maxMarks) {
      return { grade: band.grade, point: band.point, remarks: band.remarks };
    }
  }

  return { grade: 'F', point: 0.0, remarks: 'Fail' };
}

/**
 * Check if a student passed individual components based on board rules:
 * Pass mark is 33% individually for CQ, MCQ, and Practical.
 */
export function checkSubjectPassStatus(params: {
  cq: number;
  mcq: number;
  practical: number;
  maxCq: number;
  maxMcq: number;
  maxPractical: number;
}): { isPassed: boolean; failReason?: string } {
  const { cq, mcq, practical, maxCq, maxMcq, maxPractical } = params;

  if (maxCq > 0) {
    const passCq = Math.ceil(maxCq * 0.33);
    if (cq < passCq) return { isPassed: false, failReason: `Failed CQ (min ${passCq})` };
  }

  if (maxMcq > 0) {
    const passMcq = Math.ceil(maxMcq * 0.33);
    if (mcq < passMcq) return { isPassed: false, failReason: `Failed MCQ (min ${passMcq})` };
  }

  if (maxPractical > 0) {
    const passPractical = Math.ceil(maxPractical * 0.33);
    if (practical < passPractical) return { isPassed: false, failReason: `Failed Practical (min ${passPractical})` };
  }

  return { isPassed: true };
}

/**
 * Calculate overall GPA from list of subject marks in accordance with Board 4th Subject Rule:
 * 1. If any compulsory or elective subject has Grade 'F' (point 0.0), overall GPA is 0.00 (F).
 * 2. 4th subject (optional) point contribution: (Point - 2.0). If <= 2.0, addition is 0.
 * 3. Total Points = Sum(General Subjects Points) + Math.max(0, FourthSubjectPoint - 2.0)
 * 4. Overall GPA = Total Points / Number of General Subjects (Excluding 4th subject count).
 * 5. Capped at 5.00 max.
 */
export function calculateOverallGPA(subjects: {
  grade: string;
  point: number;
  isOptional4th?: boolean;
}[]): {
  gpaWithout4th: number;
  gpaWith4th: number;
  finalGrade: string;
  isPassed: boolean;
  failedCount: number;
} {
  const generalSubjects = subjects.filter((s) => !s.isOptional4th);
  const fourthSubject = subjects.find((s) => s.isOptional4th);

  const failedSubjects = generalSubjects.filter((s) => s.point === 0.0 || s.grade === 'F');

  if (generalSubjects.length === 0) {
    return { gpaWithout4th: 0, gpaWith4th: 0, finalGrade: 'F', isPassed: false, failedCount: 0 };
  }

  const sumGeneralPoints = generalSubjects.reduce((acc, s) => acc + s.point, 0);
  const gpaWithout4thRaw = sumGeneralPoints / generalSubjects.length;
  const gpaWithout4th = Math.min(5.0, Number(gpaWithout4thRaw.toFixed(2)));

  // If student failed any compulsory/general subject, overall result is FAIL (0.00)
  if (failedSubjects.length > 0) {
    return {
      gpaWithout4th,
      gpaWith4th: 0.0,
      finalGrade: 'F',
      isPassed: false,
      failedCount: failedSubjects.length,
    };
  }

  // Calculate 4th subject addition: (point - 2), min 0, max 3
  let bonusPoint = 0;
  if (fourthSubject && fourthSubject.point > 2.0) {
    bonusPoint = fourthSubject.point - 2.0;
  }

  const gpaWith4thRaw = (sumGeneralPoints + bonusPoint) / generalSubjects.length;
  const gpaWith4th = Math.min(5.0, Number(gpaWith4thRaw.toFixed(2)));

  // Determine Letter Grade for final GPA
  let finalGrade = 'F';
  if (gpaWith4th >= 5.0) finalGrade = 'A+';
  else if (gpaWith4th >= 4.0) finalGrade = 'A';
  else if (gpaWith4th >= 3.5) finalGrade = 'A-';
  else if (gpaWith4th >= 3.0) finalGrade = 'B';
  else if (gpaWith4th >= 2.0) finalGrade = 'C';
  else if (gpaWith4th >= 1.0) finalGrade = 'D';
  else finalGrade = 'F';

  return {
    gpaWithout4th,
    gpaWith4th,
    finalGrade,
    isPassed: true,
    failedCount: 0,
  };
}
