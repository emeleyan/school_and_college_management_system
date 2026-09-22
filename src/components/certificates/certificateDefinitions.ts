import { CertificateType, CertificateCategory, Institute } from '../../types';

export interface CertificateDefinition {
  id: CertificateType;
  category: CertificateCategory;
  number: number; // 1 to 28
  title: string;
  subtitle: string;
  prefix: string;
  description: string;
  badgeColor: string;
  defaultWording: string;
  iconName?: string;
  recommendedFields?: string[];
}

export interface CategoryGroup {
  id: CertificateCategory;
  code: 'A' | 'B' | 'C';
  title: string;
  bengaliTitle: string;
  description: string;
  badgeStyle: string;
  count: number;
}

export const CERTIFICATE_CATEGORIES: CategoryGroup[] = [
  {
    id: 'official_academic',
    code: 'A',
    title: 'Official / Academic',
    bengaliTitle: 'অফিসিয়াল ও একাডেমিক সনদ',
    description: 'Statutory institutional certificates, admission, promotion, conduct, and transfer documents',
    badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    count: 10,
  },
  {
    id: 'achievement',
    code: 'B',
    title: 'Achievement',
    bengaliTitle: 'কৃতিত্ব ও বিশেষ সম্মাননা',
    description: 'Academic honors, merit distinctions, attendance awards, and student recognitions',
    badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    count: 6,
  },
  {
    id: 'activities',
    code: 'C',
    title: 'Activities',
    bengaliTitle: 'সহ-পাঠ্যক্রম ও সহশিক্ষা কার্যক্রম',
    description: 'Sports, cultural, olympiad, debate, leadership, and competition winner certificates',
    badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    count: 12,
  },
];

export const CERTIFICATE_CATALOG: CertificateDefinition[] = [
  // ==========================================
  // CATEGORY A: OFFICIAL / ACADEMIC (1 to 10)
  // ==========================================
  {
    id: 'admission_certificate',
    category: 'official_academic',
    number: 1,
    title: 'Admission Certificate',
    subtitle: 'Official Certificate of Student Enrolment',
    prefix: 'ADM',
    description: 'Certifies official admission and registration in the institution.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    defaultWording:
      'This is to certify that {studentName}, Son/Daughter of {fatherName} and {motherName}, has been officially admitted to {className}, Section {sectionName}, for the Academic Session {session}. All admission formalities, documentation, and prerequisite verification have been satisfactorily completed.',
    recommendedFields: ['admissionDate', 'admissionNumber', 'session'],
  },
  {
    id: 'bonafide_certificate',
    category: 'official_academic',
    number: 2,
    title: 'Bonafide Student Certificate',
    subtitle: 'To Whom It May Concern',
    prefix: 'BNF',
    description: 'Certifies that the student is a genuine, currently enrolled student of this institution.',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
    defaultWording:
      'This is to certify that {studentName}, Son/Daughter of {fatherName} and {motherName}, is a bonafide regular student of this institution currently studying in {className}, Section {sectionName}, Roll No. {rollNumber}, during the academic session {session}. To the best of our knowledge, he/she bears an exemplary moral character.',
    recommendedFields: ['session', 'conductAndCharacter'],
  },
  {
    id: 'study_certificate',
    category: 'official_academic',
    number: 3,
    title: 'Study Certificate',
    subtitle: 'Academic Continuation Certificate',
    prefix: 'STC',
    description: 'Confirms continuous course of study for passports, scholarships, or concessions.',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300',
    defaultWording:
      'This is to certify that {studentName}, bearing Student ID {studentId} and Roll No. {rollNumber}, is actively studying in {className} of this institution under the approved national curriculum. This certificate is issued upon request for official educational record and stipend purposes.',
    recommendedFields: ['session', 'conductAndCharacter'],
  },
  {
    id: 'promotion_certificate',
    category: 'official_academic',
    number: 4,
    title: 'Promotion Certificate',
    subtitle: 'Annual Academic Elevation Certificate',
    prefix: 'PMC',
    description: 'Certifies successful academic advancement to the next higher grade/class.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
    defaultWording:
      'This is to certify that {studentName}, Roll No. {rollNumber}, has satisfactorily passed the Annual Evaluation / Examination of {className} and has been duly promoted to {promotedToClass} for the upcoming academic session with credit.',
    recommendedFields: ['examResultOrGpa', 'promotedToClass'],
  },
  {
    id: 'result_certificate',
    category: 'official_academic',
    number: 5,
    title: 'Result Certificate',
    subtitle: 'Statement of Academic Standing & Marks',
    prefix: 'RSC',
    description: 'Official certification of final grade, GPA, and academic score achievement.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
    defaultWording:
      'This is to officially certify that {studentName}, Son/Daughter of {fatherName} and {motherName}, appeared in the {className} Final Examination and attained a cumulative grade of {examResultOrGpa}. The institutional record indicates diligent performance.',
    recommendedFields: ['examResultOrGpa', 'boardRoll', 'boardReg'],
  },
  {
    id: 'character_certificate',
    category: 'official_academic',
    number: 6,
    title: 'Character Certificate',
    subtitle: 'Certificate of Conduct & Moral Integrity',
    prefix: 'CHC',
    description: 'Attests to the student’s moral behavior, obedience, discipline, and integrity.',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-300',
    defaultWording:
      'This is to certify that {studentName}, bearing Roll No. {rollNumber} of {className}, has maintained an outstanding moral character, disciplined demeanor, and courteous conduct throughout his/her tenure at this institution. He/She has never engaged in any activity detrimental to the discipline of the institution.',
    recommendedFields: ['conductAndCharacter'],
  },
  {
    id: 'testimonial',
    category: 'official_academic',
    number: 7,
    title: 'Testimonial',
    subtitle: 'Academic & Moral Conduct Testimonial',
    prefix: 'TST',
    description: 'Comprehensive graduation credential for SSC/HSC Board candidates and outgoing scholars.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    defaultWording:
      'This is to certify that {studentName}, Son/Daughter of {fatherName} and {motherName}, was a dedicated student of this institution in {className}, Group {groupName}. He/She appeared at the public examination under the Board of Intermediate and Secondary Education, securing {examResultOrGpa}. His/Her conduct and character have been exemplary. We wish him/her brilliant future success.',
    recommendedFields: ['boardRoll', 'boardReg', 'boardName', 'examResultOrGpa', 'conductAndCharacter'],
  },
  {
    id: 'transfer_certificate',
    category: 'official_academic',
    number: 8,
    title: 'Transfer Certificate',
    subtitle: 'Official College / School Leaving Release (TC)',
    prefix: 'TC',
    description: 'Official transfer release document allowing admission into another educational institute.',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    defaultWording:
      'This is to certify that {studentName}, Roll No. {rollNumber} of {className}, has been granted this Transfer Certificate upon guardian application due to {reasonForLeaving}. All institutional tuition fees and dues have been fully settled up to {duesClearedUntil}. He/She leaves the institution in good standing.',
    recommendedFields: ['reasonForLeaving', 'duesClearedUntil', 'highestClassPassed', 'conductAndCharacter'],
  },
  {
    id: 'school_leaving_certificate',
    category: 'official_academic',
    number: 9,
    title: 'School Leaving Certificate',
    subtitle: 'Institutional Release Document',
    prefix: 'SLC',
    description: 'Permanent departure credential confirming completion or withdrawal from school.',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300',
    defaultWording:
      'This is to certify that {studentName} has formally left this school following {reasonForLeaving}. During his/her academic career in {className}, his/her general conduct was {conductAndCharacter}. All library books, sports gear, and school properties have been returned in order.',
    recommendedFields: ['reasonForLeaving', 'duesClearedUntil', 'conductAndCharacter'],
  },
  {
    id: 'course_completion',
    category: 'official_academic',
    number: 10,
    title: 'Course Completion Certificate',
    subtitle: 'Curriculum & Program Completion Award',
    prefix: 'CCC',
    description: 'Recognizes completion of prescribed institutional syllabi and curriculum requirements.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    defaultWording:
      'This is to certify that {studentName} has successfully completed all academic prerequisites, coursework, practical requirements, and comprehensive evaluations prescribed for the {className} program with distinction.',
    recommendedFields: ['examResultOrGpa', 'session'],
  },

  // ==========================================
  // CATEGORY B: ACHIEVEMENT (11 to 16)
  // ==========================================
  {
    id: 'academic_excellence',
    category: 'achievement',
    number: 11,
    title: 'Academic Excellence Award',
    subtitle: 'In Recognition of Supreme Scholastic Performance',
    prefix: 'CAE',
    description: 'Conferred upon top-ranking students for highest academic marks and grades.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    defaultWording:
      'This Certificate of Academic Excellence is proudly presented to {studentName}, Roll No. {rollNumber} of {className}, in recognition of exceptional scholarly brilliance, unparalleled dedication, and achieving top scholastic honors ({examResultOrGpa}) in the Academic Session {session}.',
    recommendedFields: ['examResultOrGpa', 'positionOrRank', 'session'],
  },
  {
    id: 'merit',
    category: 'achievement',
    number: 12,
    title: 'Certificate of Merit',
    subtitle: 'Distinguished Scholastic Merit Recognition',
    prefix: 'MER',
    description: 'Awarded for noteworthy intellect, consistent diligence, and high marks.',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
    defaultWording:
      'This Certificate of Merit is proudly conferred upon {studentName}, in honorable appreciation of outstanding academic merit and intellectual dedication demonstrated in {className} during the Academic Year {session}.',
    recommendedFields: ['positionOrRank', 'examResultOrGpa'],
  },
  {
    id: 'best_student',
    category: 'achievement',
    number: 13,
    title: 'Best Student Award',
    subtitle: 'Student of the Year / All-Round Distinction',
    prefix: 'BST',
    description: 'The highest annual all-round honor combining academics, manners, and activities.',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
    defaultWording:
      'This prestigious Best Student Award is bestowed upon {studentName} for demonstrating all-round supremacy in scholarship, leadership, moral character, and active contribution to institutional life throughout {session}.',
    recommendedFields: ['session', 'achievementDetails'],
  },
  {
    id: 'best_attendance',
    category: 'achievement',
    number: 14,
    title: 'Best Attendance Certificate',
    subtitle: 'Punctuality & Perfect Presence Honor',
    prefix: 'BAT',
    description: 'Honors 100% or superlative class attendance, punctuality, and commitment.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    defaultWording:
      'This Certificate of Punctuality and Perfect Attendance is awarded to {studentName}, Roll No. {rollNumber} of {className}, for maintaining flawless attendance and unwavering dedication to class learning during the Academic Year {session}.',
    recommendedFields: ['session', 'achievementDetails'],
  },
  {
    id: 'most_improved_student',
    category: 'achievement',
    number: 15,
    title: 'Most Improved Student Certificate',
    subtitle: 'Progress, Perseverance & Growth Award',
    prefix: 'MIS',
    description: 'Recognizes significant personal determination, upward academic leap, and effort.',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
    defaultWording:
      'This Certificate of Commendation is awarded to {studentName} in heartfelt recognition of remarkable perseverance, praiseworthy academic ascent, and inspiring self-improvement shown in {className}.',
    recommendedFields: ['session', 'achievementDetails'],
  },
  {
    id: 'special_achievement',
    category: 'achievement',
    number: 16,
    title: 'Special Achievement Certificate',
    subtitle: 'Honoring Exceptional Feats & Milestones',
    prefix: 'SAC',
    description: 'Recognizes extraordinary individual triumphs, innovations, and contributions.',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
    defaultWording:
      'This Special Achievement Award is proudly conferred upon {studentName} for distinguished attainment and extraordinary merit in {eventOrMeritTitle}, bringing immense honor and pride to our institution.',
    recommendedFields: ['eventOrMeritTitle', 'achievementDetails'],
  },

  // ==========================================
  // CATEGORY C: ACTIVITIES (17 to 28)
  // ==========================================
  {
    id: 'sports',
    category: 'activities',
    number: 17,
    title: 'Certificate of Sports Excellence',
    subtitle: 'Athletics & Sportsmanship Award',
    prefix: 'SPT',
    description: 'Awarded for athletic prowess, tournament victories, and sportsmanship.',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
    defaultWording:
      'This Certificate of Sports Excellence is proudly awarded to {studentName}, of {className}, for securing {positionOrRank} in {eventOrCompetitionName} at the Annual Sports Meet / Inter-School Championship.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'cultural',
    category: 'activities',
    number: 18,
    title: 'Cultural Activities Certificate',
    subtitle: 'Music, Drama & Cultural Performance Award',
    prefix: 'CLT',
    description: 'Honors talents in singing, music, recitation, drama, and performing arts.',
    badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300',
    defaultWording:
      'This Certificate is awarded to {studentName} in enthusiastic recognition of creative talent and artistic performance in {eventOrCompetitionName}, securing {positionOrRank} during the Annual Cultural Festival.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'debate',
    category: 'activities',
    number: 19,
    title: 'Debate Competition Certificate',
    subtitle: 'Oratory & Intellectual Argumentation Award',
    prefix: 'DBT',
    description: 'Recognizes debating skills, articulation, analytical prowess, and public speaking.',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
    defaultWording:
      'This Certificate of Oratory Excellence is conferred upon {studentName} for exceptional debating proficiency, rational argumentation, and achieving {positionOrRank} in the Inter-School Debate Tournament.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'quiz',
    category: 'activities',
    number: 20,
    title: 'Quiz Competition Certificate',
    subtitle: 'General Knowledge & Intellect Honor',
    prefix: 'QIZ',
    description: 'Awarded for general knowledge, quick recall, and brain-bowl quiz supremacy.',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
    defaultWording:
      'This Certificate is proudly presented to {studentName} for demonstrating sharp intellect, vast general knowledge, and securing {positionOrRank} in the Annual Inter-House Quiz Competition.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'science_fair',
    category: 'activities',
    number: 21,
    title: 'Science Fair Certificate',
    subtitle: 'Scientific Innovation & Project Award',
    prefix: 'SCF',
    description: 'Recognizes young researchers, inventive science models, and technology prototypes.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    defaultWording:
      'This Certificate of Scientific Innovation is presented to {studentName} for exhibiting outstanding creativity, scientific research, and securing {positionOrRank} in the Science & Technology Fair {session}.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'olympiad',
    category: 'activities',
    number: 22,
    title: 'Olympiad Certificate',
    subtitle: 'Math / Physics / Language Olympiad Honor',
    prefix: 'OLY',
    description: 'Conferred upon Olympiad medalists and high-scoring analytical minds.',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
    defaultWording:
      'This prestigious Olympiad Award is bestowed upon {studentName} for stellar problem-solving capabilities, securing {positionOrRank} in the National / Regional {eventOrCompetitionName}.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'art_drawing',
    category: 'activities',
    number: 23,
    title: 'Art & Drawing Certificate',
    subtitle: 'Fine Arts, Sketching & Creative Painting',
    prefix: 'ART',
    description: 'Honors visual art mastery, fine arts, painting, and graphic illustration.',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300',
    defaultWording:
      'This Certificate of Artistic Distinction is awarded to {studentName} for imaginative composition, color harmony, and winning {positionOrRank} in the Annual Art & Drawing Exhibition.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'essay_writing',
    category: 'activities',
    number: 24,
    title: 'Essay Writing Certificate',
    subtitle: 'Literary Expression & Creative Writing',
    prefix: 'ESW',
    description: 'Recognizes eloquence, creative literature, and thoughtful essay composition.',
    badgeColor: 'bg-lime-100 text-lime-800 dark:bg-lime-900/60 dark:text-lime-300',
    defaultWording:
      'This Certificate of Literary Excellence is presented to {studentName} for lucid expression, scholarly depth, and winning {positionOrRank} in the Essay & Composition Competition.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank'],
  },
  {
    id: 'leadership',
    category: 'activities',
    number: 25,
    title: 'Student Leadership Certificate',
    subtitle: 'Prefect, Captain & Student Council Honor',
    prefix: 'LDR',
    description: 'Honors school prefects, house captains, scouts, and student council leaders.',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
    defaultWording:
      'This Certificate of Commendable Leadership is presented to {studentName} for dedicated service as {eventOrMeritTitle}, exhibiting impeccable discipline, peer mentorship, and team leadership.',
    recommendedFields: ['eventOrMeritTitle', 'achievementDetails'],
  },
  {
    id: 'volunteer',
    category: 'activities',
    number: 26,
    title: 'Volunteer Service Certificate',
    subtitle: 'Social Responsibility & Community Service',
    prefix: 'VOL',
    description: 'Recognizes community welfare, blood donation camps, relief, and Red Crescent drives.',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
    defaultWording:
      'This Certificate of Appreciation is awarded to {studentName} for selfless volunteer service, humanitarian spirit, and impactful civic contributions during the {eventOrCompetitionName}.',
    recommendedFields: ['eventOrCompetitionName', 'achievementDetails'],
  },
  {
    id: 'participation',
    category: 'activities',
    number: 27,
    title: 'Certificate of Participation',
    subtitle: 'Commending Active Engagement & Effort',
    prefix: 'PTC',
    description: 'Awarded to all active participants in competitions, workshops, and exhibitions.',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    defaultWording:
      'This Certificate is awarded to {studentName} in sincere recognition of active participation, keen enthusiasm, and valuable contribution in {eventOrCompetitionName} held on {issueDate}.',
    recommendedFields: ['eventOrCompetitionName'],
  },
  {
    id: 'winner_champion',
    category: 'activities',
    number: 28,
    title: 'Winner / Champion Certificate',
    subtitle: 'Championship Trophy & Victory Honors',
    prefix: 'WNR',
    description: 'Conferred upon champions, first-place winners, and tournament title holders.',
    badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/70 dark:text-amber-200',
    defaultWording:
      'This Championship Certificate is proudly bestowed upon {studentName} for displaying extraordinary talent, valor, and reigning supreme as the CHAMPION in {eventOrCompetitionName}.',
    recommendedFields: ['eventOrCompetitionName', 'positionOrRank', 'achievementDetails'],
  },
];

/**
 * Returns definition for any CertificateType (with alias fallback)
 */
export function getCertificateDefinition(type: CertificateType | string): CertificateDefinition {
  // Aliases
  let normalized = type;
  if (type === 'bonafide') normalized = 'bonafide_certificate';
  if (type === 'appreciation') normalized = 'merit';
  if (type === 'course_completion_certificate') normalized = 'course_completion';

  const found = CERTIFICATE_CATALOG.find((c) => c.id === normalized);
  if (found) return found;

  // Fallback default
  return {
    id: 'bonafide_certificate',
    category: 'official_academic',
    number: 2,
    title: 'Official Certificate',
    subtitle: 'To Whom It May Concern',
    prefix: 'CERT',
    description: 'Official institutional document',
    badgeColor: 'bg-blue-100 text-blue-800',
    defaultWording:
      'This is to certify that {studentName}, Roll No. {rollNumber} of {className}, has been duly issued this certificate from this institution.',
  };
}

/**
 * Returns clean English institutional details for certificate printing
 */
export function getEnglishInstituteDetails(institute: Institute | null | undefined) {
  const defaultName =
    institute?.type === 'college'
      ? 'GOVERNMENT MODEL DEGREE COLLEGE'
      : 'MODEL HIGH SCHOOL & COLLEGE';

  const englishName = (institute?.name || defaultName).toUpperCase();
  const address = institute?.address || 'Education Board Area, Dhaka, Bangladesh';
  const eiin = institute?.eiin ? `EIIN: ${institute.eiin}` : 'EIIN: 134567';
  const instituteCode = institute?.code ? `Code: ${institute.code}` : 'Code: 1042';
  const board = institute?.educationBoard
    ? `Affiliated with Board of Intermediate & Secondary Education, ${institute.educationBoard}`
    : 'Affiliated with Board of Intermediate & Secondary Education, Dhaka';
  const estd = institute?.establishedYear ? `ESTD: ${institute.establishedYear}` : 'ESTD: 1985';
  const phone = institute?.phone ? `Phone: ${institute.phone}` : '';
  const email = institute?.email ? `Email: ${institute.email}` : '';
  const website = institute?.website ? `Website: ${institute.website}` : '';
  const principalTitle =
    institute?.type === 'college' ? 'Principal' : 'Headmaster / Principal';

  return {
    name: englishName,
    address,
    eiin,
    instituteCode,
    board,
    estd,
    phone,
    email,
    website,
    principalTitle,
    motto: institute?.motto || 'Knowledge • Integrity • Excellence',
    logoUrl: institute?.logoUrl || '',
  };
}
