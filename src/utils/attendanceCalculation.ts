/**
 * Attendance & Examination Eligibility Calculation Utilities
 * Standard Bangladesh Education Board & Ministry Regulations
 */

export type StudentEligibilityStatus = 'collegiate' | 'non_collegiate' | 'dis_collegiate';

export interface AttendanceCounts {
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount?: number;
}

export interface AttendanceMetrics {
  workingDays: number;
  attendedDays: number;
  rate: number;
  eligibility: StudentEligibilityStatus;
  eligibilityLabel: {
    en: string;
    bn: string;
  };
}

/**
 * Calculate attendance rate percentage
 * In standard academic rules, late attendance is counted as attended or weighted.
 */
export function calculateAttendanceRate(
  attendedDays: number,
  workingDays: number
): number {
  if (workingDays <= 0) return 0;
  if (attendedDays <= 0) return 0;
  const rate = (attendedDays / workingDays) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

/**
 * Determine examination eligibility according to Bangladesh Board regulations:
 * - Collegiate: >= 75%
 * - Non-Collegiate: 60% - 74.9% (fine required)
 * - Dis-Collegiate: < 60% (ineligible to sit for final/board exams)
 */
export function determineExamEligibility(rate: number): {
  status: StudentEligibilityStatus;
  label: { en: string; bn: string };
  isAllowedExam: boolean;
  requiresFine: boolean;
} {
  if (rate >= 75) {
    return {
      status: 'collegiate',
      label: { en: 'Collegiate (Eligible)', bn: 'কলেজিয়েট (অনুমোদিত)' },
      isAllowedExam: true,
      requiresFine: false,
    };
  }
  if (rate >= 60) {
    return {
      status: 'non_collegiate',
      label: { en: 'Non-Collegiate (Fine Required)', bn: 'নন-কলেজিয়েট (জরিমানা সাপেক্ষে)' },
      isAllowedExam: true,
      requiresFine: true,
    };
  }
  return {
    status: 'dis_collegiate',
    label: { en: 'Dis-Collegiate (Barred)', bn: 'ডিস-কলেজিয়েট (পরীক্ষায় অননুমোদিত)' },
    isAllowedExam: false,
    requiresFine: false,
  };
}

/**
 * Calculate full student metrics from raw counts
 */
export function calculateStudentAttendanceMetrics(
  counts: AttendanceCounts,
  customTotalDays?: number
): AttendanceMetrics {
  const { presentCount, lateCount, absentCount, excusedCount = 0 } = counts;
  const totalDays = customTotalDays !== undefined && customTotalDays > 0
    ? customTotalDays
    : Math.max(1, presentCount + lateCount + absentCount + excusedCount);

  const attendedDays = presentCount + lateCount;
  const rate = calculateAttendanceRate(attendedDays, totalDays);
  const eligibility = determineExamEligibility(rate);

  return {
    workingDays: totalDays,
    attendedDays,
    rate,
    eligibility: eligibility.status,
    eligibilityLabel: eligibility.label,
  };
}

/**
 * Calculate staff / teacher leave balance after deduction
 */
export function calculateLeaveBalance(
  allocatedDays: number,
  usedDays: number,
  pendingDays = 0
): {
  remainingDays: number;
  availableDays: number;
  isExceeded: boolean;
} {
  const remaining = Math.max(0, allocatedDays - usedDays);
  const available = Math.max(0, remaining - pendingDays);
  const isExceeded = (usedDays + pendingDays) > allocatedDays;

  return {
    remainingDays: remaining,
    availableDays: available,
    isExceeded,
  };
}
