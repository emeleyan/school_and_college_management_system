import { describe, it, expect } from 'vitest';
import {
  calculateAttendanceRate,
  determineExamEligibility,
  calculateStudentAttendanceMetrics,
  calculateLeaveBalance,
} from '../attendanceCalculation';

describe('Attendance & Examination Eligibility Calculations', () => {
  describe('calculateAttendanceRate', () => {
    it('calculates percentage accurately', () => {
      expect(calculateAttendanceRate(80, 100)).toBe(80);
      expect(calculateAttendanceRate(45, 60)).toBe(75);
      expect(calculateAttendanceRate(37, 50)).toBe(74);
    });

    it('caps maximum at 100%', () => {
      expect(calculateAttendanceRate(105, 100)).toBe(100);
    });

    it('handles zero or negative working days safely without division by zero', () => {
      expect(calculateAttendanceRate(10, 0)).toBe(0);
      expect(calculateAttendanceRate(0, 0)).toBe(0);
      expect(calculateAttendanceRate(5, -10)).toBe(0);
    });
  });

  describe('determineExamEligibility', () => {
    it('categorizes >= 75% as Collegiate with exam permission', () => {
      const res = determineExamEligibility(75);
      expect(res.status).toBe('collegiate');
      expect(res.isAllowedExam).toBe(true);
      expect(res.requiresFine).toBe(false);

      const res90 = determineExamEligibility(92.5);
      expect(res90.status).toBe('collegiate');
      expect(res90.isAllowedExam).toBe(true);
    });

    it('categorizes 60% to 74.9% as Non-Collegiate requiring fine', () => {
      const res74 = determineExamEligibility(74.9);
      expect(res74.status).toBe('non_collegiate');
      expect(res74.isAllowedExam).toBe(true);
      expect(res74.requiresFine).toBe(true);

      const res60 = determineExamEligibility(60);
      expect(res60.status).toBe('non_collegiate');
      expect(res60.isAllowedExam).toBe(true);
      expect(res60.requiresFine).toBe(true);
    });

    it('categorizes < 60% as Dis-Collegiate barred from exam', () => {
      const res59 = determineExamEligibility(59.9);
      expect(res59.status).toBe('dis_collegiate');
      expect(res59.isAllowedExam).toBe(false);
      expect(res59.requiresFine).toBe(false);

      const res0 = determineExamEligibility(0);
      expect(res0.status).toBe('dis_collegiate');
      expect(res0.isAllowedExam).toBe(false);
    });
  });

  describe('calculateStudentAttendanceMetrics', () => {
    it('aggregates counts and calculates status accurately', () => {
      const metrics = calculateStudentAttendanceMetrics({
        presentCount: 70,
        lateCount: 8,
        absentCount: 20,
        excusedCount: 2,
      });

      // Total days = 70 + 8 + 20 + 2 = 100
      // Attended = 70 + 8 = 78 (78%)
      expect(metrics.workingDays).toBe(100);
      expect(metrics.attendedDays).toBe(78);
      expect(metrics.rate).toBe(78);
      expect(metrics.eligibility).toBe('collegiate');
    });

    it('respects custom institutional total working days', () => {
      const metrics = calculateStudentAttendanceMetrics(
        {
          presentCount: 40,
          lateCount: 5,
          absentCount: 5,
        },
        100 // Out of 100 total institutional days
      );

      expect(metrics.workingDays).toBe(100);
      expect(metrics.attendedDays).toBe(45);
      expect(metrics.rate).toBe(45);
      expect(metrics.eligibility).toBe('dis_collegiate');
    });
  });

  describe('calculateLeaveBalance', () => {
    it('computes remaining and available leave balances', () => {
      const balance = calculateLeaveBalance(20, 5, 2);
      expect(balance.remainingDays).toBe(15);
      expect(balance.availableDays).toBe(13);
      expect(balance.isExceeded).toBe(false);
    });

    it('flags exceeded leave balances when requests exceed allocation', () => {
      const balance = calculateLeaveBalance(10, 8, 4);
      expect(balance.remainingDays).toBe(2);
      expect(balance.availableDays).toBe(0);
      expect(balance.isExceeded).toBe(true);
    });
  });
});
