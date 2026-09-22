import { describe, it, expect } from 'vitest';
import {
  calculateGradeAndPoint,
  checkSubjectPassStatus,
  calculateOverallGPA,
  BANGLADESH_BOARD_GRADING_SYSTEM,
} from '../gradingSystem';

describe('Bangladesh Board Grading System Utilities', () => {
  describe('calculateGradeAndPoint', () => {
    it('returns A+ (5.00) for marks 80 to 100', () => {
      expect(calculateGradeAndPoint(100)).toEqual({ grade: 'A+', point: 5.0, remarks: 'Outstanding' });
      expect(calculateGradeAndPoint(85)).toEqual({ grade: 'A+', point: 5.0, remarks: 'Outstanding' });
      expect(calculateGradeAndPoint(80)).toEqual({ grade: 'A+', point: 5.0, remarks: 'Outstanding' });
    });

    it('returns A (4.00) for marks 70 to 79', () => {
      expect(calculateGradeAndPoint(79)).toEqual({ grade: 'A', point: 4.0, remarks: 'Excellent' });
      expect(calculateGradeAndPoint(70)).toEqual({ grade: 'A', point: 4.0, remarks: 'Excellent' });
    });

    it('returns A- (3.50) for marks 60 to 69', () => {
      expect(calculateGradeAndPoint(69)).toEqual({ grade: 'A-', point: 3.5, remarks: 'Very Good' });
      expect(calculateGradeAndPoint(60)).toEqual({ grade: 'A-', point: 3.5, remarks: 'Very Good' });
    });

    it('returns B (3.00) for marks 50 to 59', () => {
      expect(calculateGradeAndPoint(55)).toEqual({ grade: 'B', point: 3.0, remarks: 'Good' });
      expect(calculateGradeAndPoint(50)).toEqual({ grade: 'B', point: 3.0, remarks: 'Good' });
    });

    it('returns C (2.00) for marks 40 to 49', () => {
      expect(calculateGradeAndPoint(45)).toEqual({ grade: 'C', point: 2.0, remarks: 'Satisfactory' });
      expect(calculateGradeAndPoint(40)).toEqual({ grade: 'C', point: 2.0, remarks: 'Satisfactory' });
    });

    it('returns D (1.00) for marks 33 to 39', () => {
      expect(calculateGradeAndPoint(39)).toEqual({ grade: 'D', point: 1.0, remarks: 'Pass' });
      expect(calculateGradeAndPoint(33)).toEqual({ grade: 'D', point: 1.0, remarks: 'Pass' });
    });

    it('returns F (0.00) for marks below 33', () => {
      expect(calculateGradeAndPoint(32)).toEqual({ grade: 'F', point: 0.0, remarks: 'Fail' });
      expect(calculateGradeAndPoint(0)).toEqual({ grade: 'F', point: 0.0, remarks: 'Fail' });
    });

    it('normalizes custom full marks (e.g. 50 or 75 marks exams)', () => {
      // 40 out of 50 = 80% -> A+ (5.00)
      expect(calculateGradeAndPoint(40, 50).grade).toBe('A+');
      // 15 out of 50 = 30% -> F (0.00)
      expect(calculateGradeAndPoint(15, 50).grade).toBe('F');
    });
  });

  describe('checkSubjectPassStatus', () => {
    it('passes if all CQ, MCQ, and Practical are >= 33%', () => {
      const res = checkSubjectPassStatus({
        cq: 35,
        maxCq: 70, // 50%
        mcq: 15,
        maxMcq: 30, // 50%
        practical: 0,
        maxPractical: 0,
      });
      expect(res.isPassed).toBe(true);
    });

    it('fails if student fails MCQ even if CQ is high', () => {
      const res = checkSubjectPassStatus({
        cq: 60,
        maxCq: 70,
        mcq: 5,
        maxMcq: 30, // 5/30 is < 33% (min 10)
        practical: 0,
        maxPractical: 0,
      });
      expect(res.isPassed).toBe(false);
      expect(res.failReason).toContain('Failed MCQ');
    });
  });

  describe('calculateOverallGPA with 4th Subject Rule', () => {
    it('calculates perfect GPA 5.00 when all subjects are A+', () => {
      const subjects = [
        { grade: 'A+', point: 5.0 },
        { grade: 'A+', point: 5.0 },
        { grade: 'A+', point: 5.0 },
        { grade: 'A+', point: 5.0 },
        { grade: 'A+', point: 5.0, isOptional4th: true },
      ];

      const res = calculateOverallGPA(subjects);
      expect(res.isPassed).toBe(true);
      expect(res.gpaWith4th).toBe(5.0);
      expect(res.finalGrade).toBe('A+');
    });

    it('fails overall GPA (0.00 / F) if any general subject has F (0.00)', () => {
      const subjects = [
        { grade: 'A+', point: 5.0 },
        { grade: 'A+', point: 5.0 },
        { grade: 'A', point: 4.0 },
        { grade: 'F', point: 0.0 }, // Failed subject
        { grade: 'A+', point: 5.0, isOptional4th: true },
      ];

      const res = calculateOverallGPA(subjects);
      expect(res.isPassed).toBe(false);
      expect(res.gpaWith4th).toBe(0.0);
      expect(res.finalGrade).toBe('F');
      expect(res.failedCount).toBe(1);
    });

    it('applies 4th subject bonus points (point - 2.0) above threshold', () => {
      // 4 general subjects each with GPA 4.00 (Sum = 16.0)
      // 4th subject has 5.00 (Bonus = 5.00 - 2.00 = 3.00)
      // Total points = 16.0 + 3.0 = 19.0
      // GPA with 4th = 19.0 / 4 = 4.75
      const subjects = [
        { grade: 'A', point: 4.0 },
        { grade: 'A', point: 4.0 },
        { grade: 'A', point: 4.0 },
        { grade: 'A', point: 4.0 },
        { grade: 'A+', point: 5.0, isOptional4th: true },
      ];

      const res = calculateOverallGPA(subjects);
      expect(res.isPassed).toBe(true);
      expect(res.gpaWithout4th).toBe(4.0);
      expect(res.gpaWith4th).toBe(4.75);
      expect(res.finalGrade).toBe('A');
    });

    it('does not add bonus if 4th subject point is <= 2.00', () => {
      const subjects = [
        { grade: 'A', point: 4.0 },
        { grade: 'A', point: 4.0 },
        { grade: 'C', point: 2.0, isOptional4th: true }, // point <= 2.0
      ];

      const res = calculateOverallGPA(subjects);
      expect(res.isPassed).toBe(true);
      expect(res.gpaWithout4th).toBe(4.0);
      expect(res.gpaWith4th).toBe(4.0);
    });

    it('caps GPA at 5.00 maximum even with 4th subject bonus', () => {
      const subjects = [
        { grade: 'A+', point: 5.0 },
        { grade: 'A', point: 4.9 },
        { grade: 'A+', point: 5.0, isOptional4th: true },
      ];

      const res = calculateOverallGPA(subjects);
      expect(res.gpaWith4th).toBeLessThanOrEqual(5.0);
    });
  });
});
