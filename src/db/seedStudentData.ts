import {
  Student,
  StudentEnrollment,
  AcademicClass,
  AcademicSection,
  Institute,
  AcademicYear,
  Gender,
  BloodGroup,
  Religion,
} from '../types';
import { update, getAll } from './indexedDB';

interface SampleStudentProfile {
  first: string;
  last: string;
  bn: string;
  gender: Gender;
  dob: string;
  blood: BloodGroup;
  religion: Religion;
  father: string;
  fatherPhone: string;
  fatherJob: string;
  mother: string;
  motherPhone: string;
  motherJob: string;
  presentAddr: string;
  district: string;
  upazila: string;
}

const SAMPLE_PROFILES: SampleStudentProfile[] = [
  {
    first: 'Sadia',
    last: 'Sultana',
    bn: 'সাদিয়া সুলতানা',
    gender: 'female',
    dob: '2011-04-15',
    blood: 'A+',
    religion: 'Islam',
    father: 'Md. Shahidul Islam',
    fatherPhone: '+8801711223344',
    fatherJob: 'Civil Engineer',
    mother: 'Nasreen Begum',
    motherPhone: '+8801811223344',
    motherJob: 'Homemaker',
    presentAddr: 'House 42, Road 11, Sector 4, Uttara',
    district: 'Dhaka',
    upazila: 'Uttara',
  },
  {
    first: 'Tanvir',
    last: 'Ahmed',
    bn: 'তানভীর আহমেদ',
    gender: 'male',
    dob: '2010-08-22',
    blood: 'B+',
    religion: 'Islam',
    father: 'Anwar Hossain',
    fatherPhone: '+8801722334455',
    fatherJob: 'Bank Manager',
    mother: 'Laila Arjumand',
    motherPhone: '+8801822334455',
    motherJob: 'Government Officer',
    presentAddr: 'Flat 4B, Green Road, Dhanmondi',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
  },
  {
    first: 'Nusrat',
    last: 'Jahan',
    bn: 'নুসরাত জাহান',
    gender: 'female',
    dob: '2011-11-03',
    blood: 'O+',
    religion: 'Islam',
    father: 'Mizanur Rahman',
    fatherPhone: '+8801733445566',
    fatherJob: 'Businessman',
    mother: 'Tahmina Akhter',
    motherPhone: '+8801833445566',
    motherJob: 'Teacher',
    presentAddr: 'Lane 5, Block C, Mirpur 2',
    district: 'Dhaka',
    upazila: 'Mirpur',
  },
  {
    first: 'Abdullah',
    last: 'Al Mamun',
    bn: 'আব্দুল্লাহ আল মামুন',
    gender: 'male',
    dob: '2010-01-19',
    blood: 'AB+',
    religion: 'Islam',
    father: 'Khondoker Mustafizur',
    fatherPhone: '+8801744556677',
    fatherJob: 'Architect',
    mother: 'Shirin Akter',
    motherPhone: '+8801844556677',
    motherJob: 'Homemaker',
    presentAddr: 'Plot 18, Road 7, Banani',
    district: 'Dhaka',
    upazila: 'Banani',
  },
  {
    first: 'Fariha',
    last: 'Tabassum',
    bn: 'ফারিহা তাবাসসুম',
    gender: 'female',
    dob: '2011-06-30',
    blood: 'O+',
    religion: 'Islam',
    father: 'Fazlul Haque',
    fatherPhone: '+8801755667788',
    fatherJob: 'Doctor',
    mother: 'Rownak Jahan',
    motherPhone: '+8801855667788',
    motherJob: 'Professor',
    presentAddr: 'House 8, Shantinagar',
    district: 'Dhaka',
    upazila: 'Paltan',
  },
  {
    first: 'Sourav',
    last: 'Chakraborty',
    bn: 'সৌরভ চক্রবর্তী',
    gender: 'male',
    dob: '2010-09-12',
    blood: 'B+',
    religion: 'Hinduism',
    father: 'Bikash Chakraborty',
    fatherPhone: '+8801766778899',
    fatherJob: 'Senior Accountant',
    mother: 'Poly Chakraborty',
    motherPhone: '+8801866778899',
    motherJob: 'School Teacher',
    presentAddr: 'Wari, Old Dhaka',
    district: 'Dhaka',
    upazila: 'Wari',
  },
  {
    first: 'Meherun',
    last: 'Nesa',
    bn: 'মেহেরুন নেসা',
    gender: 'female',
    dob: '2011-02-14',
    blood: 'A+',
    religion: 'Islam',
    father: 'Zahid Hasan',
    fatherPhone: '+8801777889900',
    fatherJob: 'Software Architect',
    mother: 'Ferdousi Begum',
    motherPhone: '+8801877889900',
    motherJob: 'Designer',
    presentAddr: 'Avenue 4, Bashundhara R/A',
    district: 'Dhaka',
    upazila: 'Vatara',
  },
  {
    first: 'Tahmidur',
    last: 'Rahman',
    bn: 'তাহমিদুর রহমান',
    gender: 'male',
    dob: '2010-05-27',
    blood: 'O-',
    religion: 'Islam',
    father: 'Dr. Mahfuzur Rahman',
    fatherPhone: '+8801788990011',
    fatherJob: 'Consultant Physician',
    mother: 'Dr. Shahana Parveen',
    motherPhone: '+8801888990011',
    motherJob: 'Gynecologist',
    presentAddr: 'Road 27, Gulshan 1',
    district: 'Dhaka',
    upazila: 'Gulshan',
  },
  {
    first: 'Priyanka',
    last: 'Das',
    bn: 'প্রিয়াঙ্কা দাস',
    gender: 'female',
    dob: '2011-03-09',
    blood: 'AB-',
    religion: 'Hinduism',
    father: 'Dipok Das',
    fatherPhone: '+8801799001122',
    fatherJob: 'Pharmacist',
    mother: 'Rina Das',
    motherPhone: '+8801899001122',
    motherJob: 'Banker',
    presentAddr: 'Lalbagh Road',
    district: 'Dhaka',
    upazila: 'Lalbagh',
  },
  {
    first: 'Ashfaq',
    last: 'Zaman',
    bn: 'আশফাক জামান',
    gender: 'male',
    dob: '2010-12-05',
    blood: 'B-',
    religion: 'Islam',
    father: 'Kamrul Zaman',
    fatherPhone: '+8801700112233',
    fatherJob: 'Customs Officer',
    mother: 'Farzana Yeasmin',
    motherPhone: '+8801800112233',
    motherJob: 'Homemaker',
    presentAddr: 'Sector 7, Uttara Model Town',
    district: 'Dhaka',
    upazila: 'Uttara',
  },
];

const BENGALI_NAME_MAP: Record<string, string> = {
  'Md. Shahidul Islam': 'মোঃ শহিদুল ইসলাম',
  'Anwar Hossain': 'আনোয়ার হোসেন',
  'Mizanur Rahman': 'মিজানুর রহমান',
  'Khondoker Mustafizur': 'খন্দকার মোস্তাফিজুর',
  'Dr. Aminul Haque': 'ডাঃ আমিনুল হক',
  'Mahfuzur Rahman': 'মাহফুজুর রহমান',
  'Kamrul Zaman': 'কামরুল জামান',
  'Nasreen Begum': 'নাসরিন বেগম',
  'Laila Arjumand': 'লায়লা আরজুমান্দ',
  'Tahmina Akhter': 'তাহমিনা আক্তার',
  'Shirin Akter': 'শিরিন আক্তার',
  'Shahana Parveen': 'শাহানা পারভীন',
  'Ruma Akhter': 'রুমা আক্তার',
  'Farzana Yeasmin': 'ফারজানা ইয়াসমিন',
};

const getBnName = (enName: string): string => BENGALI_NAME_MAP[enName] || enName;

export async function seedSampleStudents(
  institute: Institute,
  classes: AcademicClass[],
  sections: AcademicSection[],
  academicYear?: AcademicYear | null
): Promise<{ count: number }> {
  if (!classes.length || !sections.length) {
    throw new Error('Classes and Sections must exist before generating student roster.');
  }

  const instId = institute.id;
  const yearId = academicYear?.id || `year_${instId}_2026`;
  const prefix = institute.type === 'school' ? 'SCH' : 'COL';
  const yearNumber = academicYear?.yearName || '2026';

  let studentIndex = 1;
  const createdStudents: Student[] = [];

  for (const cls of classes) {
    const classSections = sections.filter((s) => s.classId === cls.id);
    if (!classSections.length) continue;

    for (const sec of classSections) {
      // Create 3 to 4 students per section
      const countForSec = 3;
      for (let i = 0; i < countForSec; i++) {
        const rollNum = i + 1;
        const profile = SAMPLE_PROFILES[(studentIndex - 1) % SAMPLE_PROFILES.length];
        const formattedId = `${prefix}-${yearNumber}-${String(studentIndex).padStart(4, '0')}`;
        const studentUniqueId = `std_${instId}_${cls.id}_${sec.id}_${rollNum}`;

        const student: Student = {
          id: studentUniqueId,
          studentId: formattedId,
          instituteId: instId,
          academicYearId: yearId,
          classId: cls.id,
          sectionId: sec.id,
          rollNumber: rollNum,
          firstName: profile.first,
          lastName: profile.last,
          bengaliName: profile.bn,
          gender: profile.gender,
          dateOfBirth: profile.dob,
          bloodGroup: profile.blood,
          religion: profile.religion,
          admissionDate: `${yearNumber}-01-10`,
          phone: profile.fatherPhone,
          email: `${profile.first.toLowerCase()}.${profile.last.toLowerCase()}@student.local`,
          address: {
            presentAddress: profile.presentAddr,
            permanentAddress: `${profile.presentAddr}, ${profile.upazila}, ${profile.district}`,
            district: profile.district,
            upazila: profile.upazila,
          },
          guardian: {
            fatherName: profile.father,
            fatherNameBn: getBnName(profile.father),
            fatherPhone: profile.fatherPhone,
            fatherOccupation: profile.fatherJob,
            motherName: profile.mother,
            motherNameBn: getBnName(profile.mother),
            motherPhone: profile.motherPhone,
            motherOccupation: profile.motherJob,
            emergencyContactName: profile.father,
            emergencyContactPhone: profile.fatherPhone,
            emergencyContactRelation: 'Father',
          },
          academicDetails: {
            previousSchool: 'Ideal Model School',
            previousGPA: '5.00',
            sscBoard: 'Dhaka',
            sscRoll: cls.numericLevel >= 11 ? `54${studentIndex}29` : undefined,
            sscRegistration: cls.numericLevel >= 11 ? `1910${studentIndex}44` : undefined,
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await update('students', student);

        // Enrollment record
        const enrollment: StudentEnrollment = {
          id: `enr_${student.id}_${yearId}`,
          studentId: student.id,
          instituteId: instId,
          academicYearId: yearId,
          classId: cls.id,
          sectionId: sec.id,
          rollNumber: rollNum,
          enrollmentDate: student.admissionDate,
          status: 'enrolled',
          createdAt: new Date().toISOString(),
        };
        await update('studentEnrollments', enrollment);

        createdStudents.push(student);
        studentIndex++;
      }
    }
  }

  return { count: createdStudents.length };
}
