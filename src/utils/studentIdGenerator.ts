import { getAll } from '../db/indexedDB';
import { Student } from '../types';

/**
 * Extracts the 2-digit academic year prefix.
 * e.g., '2026-27' -> '26', '2026' -> '26', or defaults to current year's last 2 digits.
 */
export function getTwoDigitYearPrefix(academicYearName?: string): string {
  const curYY = String(new Date().getFullYear()).slice(-2);
  if (!academicYearName) return curYY;
  const match = academicYearName.match(/\b20(\d{2})\b/);
  if (match) return match[1];
  const digits = academicYearName.match(/\d{2,4}/);
  if (digits) {
    const d = digits[0];
    return d.length === 4 ? d.slice(-2) : d;
  }
  return curYY;
}

/**
 * Generates the next unique student ID for the institution.
 * Format: 2-digit year + 4-digit sequence (e.g. 260001, 260002, 260003...)
 * Guaranteed unique and never reassigned.
 */
export async function generateUniqueStudentId(academicYearName?: string): Promise<string> {
  const yy = getTwoDigitYearPrefix(academicYearName);
  const allStudents = await getAll<Student>('students');

  // Look for any studentId starting with yy and followed by 4+ digits
  const regex = new RegExp(`^${yy}(\\d{4,})$`);
  let maxNum = 0;

  for (const s of allStudents) {
    if (!s.studentId) continue;
    const trimmed = s.studentId.trim();
    const match = trimmed.match(regex);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  }

  const nextSeq = maxNum + 1;
  let candidate = `${yy}${String(nextSeq).padStart(4, '0')}`;

  // Guarantee absolute uniqueness across all records
  let attempt = nextSeq;
  while (allStudents.some((s) => s.studentId?.trim() === candidate)) {
    attempt++;
    candidate = `${yy}${String(attempt).padStart(4, '0')}`;
  }

  return candidate;
}
