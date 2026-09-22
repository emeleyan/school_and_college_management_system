import { StudentAttendanceRecord, TeacherAttendanceRecord, LeaveApplication, BiometricPunchLog, Student, Teacher } from '../../types';
import { getAll, putItem } from '../../db/indexedDB';

export async function seedAttendanceData(instituteId: string, classId?: string, sectionId?: string) {
  try {
    const [allStudents, allTeachers] = await Promise.all([
      getAll<Student>('students'),
      getAll<Teacher>('teachers'),
    ]);

    const instStudents = allStudents.filter(s => s.instituteId === instituteId);
    const instTeachers = allTeachers.filter(t => t.instituteId === instituteId);

    if (instStudents.length === 0 && instTeachers.length === 0) return;

    const { studentAttendanceRecords, teacherAttendanceRecords, sampleLeaves, samplePunches } =
      generateSampleAttendance(instituteId, 'ay-current', instStudents, instTeachers);

    for (const rec of studentAttendanceRecords) {
      await putItem('studentAttendance', rec);
    }
    for (const rec of teacherAttendanceRecords) {
      await putItem('teacherAttendance', rec);
    }
    for (const rec of sampleLeaves) {
      await putItem('leaveApplications', rec);
    }
    for (const rec of samplePunches) {
      await putItem('biometricLogs', rec as any);
    }
  } catch (err) {
    console.warn('Error seeding attendance:', err);
  }
}

export function generateSampleAttendance(
  instituteId: string,
  academicYearId: string,
  students: Student[],
  teachers: Teacher[]
) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Past 7 days dates
  const pastDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // Skip Fridays (weekday 5 in JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    if (d.getDay() !== 5) {
      pastDates.push(d.toISOString().split('T')[0]);
    }
  }

  const studentAttendanceRecords: StudentAttendanceRecord[] = [];
  const teacherAttendanceRecords: TeacherAttendanceRecord[] = [];

  // Generate for students
  students.forEach((student, sIndex) => {
    pastDates.forEach((d, dIndex) => {
      // Deterministic realistic attendance simulation:
      // Most students present (90%), some absent or late
      let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
      let entryTime = '08:15';
      let remarks = '';

      const seed = (sIndex * 13 + dIndex * 7) % 100;
      if (seed < 8) {
        status = 'absent';
        entryTime = '';
        remarks = seed % 2 === 0 ? 'Fever / Sickness' : 'Family urgent work';
      } else if (seed < 14) {
        status = 'late';
        entryTime = '08:42';
        remarks = 'Traffic jam at Bus Stand';
      } else if (seed === 95) {
        status = 'excused';
        entryTime = '';
        remarks = 'Pre-sanctioned medical leave';
      }

      const studentFullName = `${student.firstName} ${student.lastName}`;
      studentAttendanceRecords.push({
        id: `att-stu-${student.id}-${d}`,
        instituteId,
        academicYearId,
        studentId: student.id,
        studentName: studentFullName,
        rollNumber: student.rollNumber,
        classId: student.classId,
        className: (student as any).className || 'Class',
        sectionId: student.sectionId,
        sectionName: (student as any).sectionName || 'A',
        date: d,
        status,
        entryTime: status === 'present' || status === 'late' ? entryTime : undefined,
        remarks: remarks || undefined,
        smsSent: status === 'absent',
        smsSentAt: status === 'absent' ? `${d}T09:30:00.000Z` : undefined,
        markedBy: 'Class Teacher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });

  // Generate for teachers
  teachers.forEach((teacher, tIndex) => {
    pastDates.forEach((d, dIndex) => {
      let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
      let inTime = '08:20';
      let outTime = '16:15';
      let lateMinutes = 0;
      let remarks = '';

      const seed = (tIndex * 17 + dIndex * 11) % 100;
      if (seed < 5) {
        status = 'absent';
        inTime = '';
        outTime = '';
        remarks = 'Uninformed leave';
      } else if (seed < 12) {
        status = 'late';
        inTime = '09:12';
        outTime = '16:30';
        lateMinutes = 22;
        remarks = 'Commute delay';
      } else if (seed === 90) {
        status = 'excused';
        inTime = '';
        outTime = '';
        remarks = 'Casual Leave (CL)';
      }

      const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
      teacherAttendanceRecords.push({
        id: `att-tch-${teacher.id}-${d}`,
        instituteId,
        teacherId: teacher.id,
        teacherName: teacherFullName,
        employeeId: teacher.teacherId,
        designation: teacher.designation,
        departmentName: teacher.departmentName,
        date: d,
        status,
        inTime: inTime || undefined,
        outTime: outTime || undefined,
        lateMinutes: lateMinutes > 0 ? lateMinutes : undefined,
        punchMethod: 'biometric',
        remarks: remarks || undefined,
        markedBy: 'Head of Institution',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });

  // Sample Leave Applications
  const sampleLeaves: LeaveApplication[] = [
    {
      id: 'leave-app-01',
      instituteId,
      applicantType: 'teacher',
      applicantId: teachers[0]?.id || 'tch-01',
      applicantName: teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : 'Md. Rafiqul Islam',
      identifier: teachers[0]?.teacherId || 'FAC-SCH-1001',
      groupOrDesignation: teachers[0]?.designation || 'Senior Teacher (Mathematics)',
      leaveType: 'casual',
      startDate: dateStr,
      endDate: dateStr,
      totalDays: 1,
      reason: 'Urgent family work at ancestral home in Comilla.',
      emergencyContact: '01711223344',
      status: 'approved',
      reviewedBy: 'Principal',
      reviewRemarks: 'Granted with full pay.',
      appliedAt: new Date(Date.now() - 86400000).toISOString(),
      reviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'leave-app-02',
      instituteId,
      applicantType: 'student',
      applicantId: students[0]?.id || 'stu-01',
      applicantName: students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'Hasibul Hasan',
      identifier: String(students[0]?.rollNumber || 1),
      groupOrDesignation: `${(students[0] as any)?.className || 'Class 10'} (${(students[0] as any)?.sectionName || 'A'})`,
      leaveType: 'medical',
      startDate: dateStr,
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      totalDays: 3,
      reason: 'Severe viral fever and physician recommended 3 days bed rest.',
      emergencyContact: '01819998877',
      status: 'approved',
      reviewedBy: 'Class Teacher',
      reviewRemarks: 'Medical certificate verified.',
      appliedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'leave-app-03',
      instituteId,
      applicantType: 'staff',
      applicantId: 'stf-02',
      applicantName: 'Abdul Karim',
      identifier: 'STF-SCH-2001',
      groupOrDesignation: 'Senior Accountant',
      leaveType: 'earned',
      startDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 9).toISOString().split('T')[0],
      totalDays: 5,
      reason: 'Son admission into engineering university.',
      emergencyContact: '01912345678',
      status: 'pending',
      appliedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Sample Biometric Punch Logs
  const samplePunches: BiometricPunchLog[] = [
    {
      id: 'punch-01',
      instituteId,
      deviceId: 'DEV-GATE-01',
      deviceName: 'Main Gate Fingerprint ZKTeco F22',
      userType: 'teacher',
      userId: teachers[0]?.id,
      userIdentifier: teachers[0]?.teacherId || 'FAC-SCH-1001',
      userName: teachers[0] ? `${teachers[0].firstName} ${teachers[0].lastName}` : 'Md. Rafiqul Islam',
      timestamp: `${dateStr}T08:18:22.000Z`,
      timeStr: '08:18:22 AM',
      dateStr,
      punchType: 'in',
      verificationMode: 'fingerprint',
      status: 'synced',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'punch-02',
      instituteId,
      deviceId: 'DEV-GATE-01',
      deviceName: 'Main Gate Fingerprint ZKTeco F22',
      userType: 'student',
      userId: students[0]?.id,
      userIdentifier: students[0]?.studentId || 'STU-2026-001',
      userName: students[0] ? `${students[0].firstName} ${students[0].lastName}` : 'Hasibul Hasan',
      timestamp: `${dateStr}T08:22:15.000Z`,
      timeStr: '08:22:15 AM',
      dateStr,
      punchType: 'in',
      verificationMode: 'rfid',
      status: 'synced',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'punch-03',
      instituteId,
      deviceId: 'DEV-FAC-02',
      deviceName: 'Faculty Lounge Facial Terminal',
      userType: 'teacher',
      userId: teachers[1]?.id,
      userIdentifier: teachers[1]?.teacherId || 'FAC-SCH-1002',
      userName: teachers[1] ? `${teachers[1].firstName} ${teachers[1].lastName}` : 'Nasrin Akhter',
      timestamp: `${dateStr}T08:25:40.000Z`,
      timeStr: '08:25:40 AM',
      dateStr,
      punchType: 'in',
      verificationMode: 'facial',
      status: 'synced',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    studentAttendanceRecords,
    teacherAttendanceRecords,
    sampleLeaves,
    samplePunches,
  };
}
