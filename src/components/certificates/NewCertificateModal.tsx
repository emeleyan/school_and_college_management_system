import React, { useState } from 'react';
import {
  CertificateRecord,
  CertificateType,
  CertificateCategory,
  Student,
  Institute,
  AcademicYear,
} from '../../types';
import {
  CERTIFICATE_CATEGORIES,
  CERTIFICATE_CATALOG,
  getCertificateDefinition,
} from './certificateDefinitions';
import {
  X,
  Search,
  FileBadge,
  Check,
  Award,
  Sparkles,
  Trophy,
  Medal,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface NewCertificateModalProps {
  students: Student[];
  institute?: Institute | null;
  academicYear?: AcademicYear | null;
  existingCount: number;
  onSave: (certificate: CertificateRecord) => Promise<void>;
  onClose: () => void;
}

export const NewCertificateModal: React.FC<NewCertificateModalProps> = ({
  students,
  institute,
  academicYear,
  existingCount,
  onSave,
  onClose,
}) => {
  // Category & Certificate Type
  const [selectedCategory, setSelectedCategory] = useState<CertificateCategory>('official_academic');
  const [certType, setCertType] = useState<CertificateType>('bonafide_certificate');

  // Student selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Common particulars
  const [studentName, setStudentName] = useState<string>('');
  const [studentBengaliName, setStudentBengaliName] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');
  const [rollNumber, setRollNumber] = useState<number>(1);
  const [className, setClassName] = useState<string>('Class 10');
  const [sectionName, setSectionName] = useState<string>('Section A');
  const [groupName, setGroupName] = useState<string>('Science');
  const [session, setSession] = useState<string>(academicYear?.yearName || '2026');
  const [dateOfBirth, setDateOfBirth] = useState<string>('2010-01-01');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [conductAndCharacter, setConductAndCharacter] = useState<string>('Exemplary and Disciplined');
  const [customRemarks, setCustomRemarks] = useState<string>('');

  // Category A: Official/Academic Specifics
  const [admissionDate, setAdmissionDate] = useState<string>('2026-01-05');
  const [admissionNumber, setAdmissionNumber] = useState<string>('ADM-2026-042');
  const [promotedToClass, setPromotedToClass] = useState<string>('Class 10 (Science)');
  const [reasonForLeaving, setReasonForLeaving] = useState<string>(
    'Guardian relocation / transfer to another division'
  );
  const [duesClearedUntil, setDuesClearedUntil] = useState<string>('December 2026');
  const [highestClassPassed, setHighestClassPassed] = useState<string>('Class 9 Annual Examination');
  const [boardRoll, setBoardRoll] = useState<string>('142981');
  const [boardReg, setBoardReg] = useState<string>('1912849201');
  const [boardName, setBoardName] = useState<string>('Dhaka');
  const [examResultOrGpa, setExamResultOrGpa] = useState<string>('GPA 5.00');

  // Category B & C: Achievement & Activities Specifics
  const [eventOrCompetitionName, setEventOrCompetitionName] = useState<string>(
    'Annual Inter-School Athletics Championship'
  );
  const [positionOrRank, setPositionOrRank] = useState<string>('1st Place (Champion)');
  const [eventOrMeritTitle, setEventOrMeritTitle] = useState<string>(
    'Academic Brilliance & Top Rank Award'
  );
  const [achievementDetails, setAchievementDetails] = useState<string>(
    'Recognized for exceptional scholastic mastery, dedication, and leadership.'
  );

  // When a student is clicked in the picker
  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    setStudentName(`${student.firstName} ${student.lastName}`.trim().toUpperCase());
    setStudentBengaliName(student.bengaliName || '');
    setFatherName((student.guardian?.fatherName || '').trim().toUpperCase());
    setMotherName((student.guardian?.motherName || '').trim().toUpperCase());
    setRollNumber(student.rollNumber || 1);
    setDateOfBirth(student.dateOfBirth || '2010-01-01');
    setStudentSearch('');
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return false;
    const q = studentSearch.toLowerCase();
    const nameMatch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
    const rollMatch = String(s.rollNumber).includes(q);
    const idMatch = s.studentId?.toLowerCase().includes(q);
    const bnMatch = s.bengaliName?.includes(studentSearch);
    return nameMatch || rollMatch || idMatch || bnMatch;
  });

  // Switch category
  const handleCategorySwitch = (cat: CertificateCategory) => {
    setSelectedCategory(cat);
    const firstInCat = CERTIFICATE_CATALOG.find((c) => c.category === cat);
    if (firstInCat) {
      setCertType(firstInCat.id);
    }
  };

  // Select a certificate type
  const handleSelectCert = (def: (typeof CERTIFICATE_CATALOG)[0]) => {
    setCertType(def.id);
    setSelectedCategory(def.category);

    // Contextual defaults based on type
    if (def.category === 'activities') {
      if (!eventOrCompetitionName || eventOrCompetitionName.includes('Athletics')) {
        if (def.id === 'sports') setEventOrCompetitionName('Annual Sports Meet 400m Sprint & Long Jump');
        else if (def.id === 'debate') setEventOrCompetitionName('National Inter-School Parliamentary Debate');
        else if (def.id === 'quiz') setEventOrCompetitionName('All-Bangladesh Science & General Knowledge Quiz');
        else if (def.id === 'science_fair') setEventOrCompetitionName('Annual Science & Tech Innovation Fair');
        else if (def.id === 'olympiad') setEventOrCompetitionName('National Mathematics & Science Olympiad');
        else if (def.id === 'art_drawing') setEventOrCompetitionName('Annual Fine Arts & Creative Painting Exhibition');
        else if (def.id === 'essay_writing') setEventOrCompetitionName('National Independence Day Essay Competition');
        else if (def.id === 'cultural') setEventOrCompetitionName('Annual Cultural & Performing Arts Festival');
        else if (def.id === 'leadership') setEventOrCompetitionName('Prefect & Student Council Leadership Body');
        else if (def.id === 'volunteer') setEventOrCompetitionName('Community Relief & Youth Red Crescent Drive');
        else if (def.id === 'winner_champion') setEventOrCompetitionName('Inter-School Football Tournament Championship');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Please specify or select a student name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const yearStr = new Date().getFullYear();
      const currentDef = getCertificateDefinition(certType);
      const certNumber = `${currentDef.prefix}-${yearStr}-${String(existingCount + 1).padStart(4, '0')}`;
      const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase();
      const verificationCode = `VER-${currentDef.prefix}-${randomHash}`;

      const newCert: CertificateRecord = {
        id: `cert-${Date.now()}`,
        certificateNumber: certNumber,
        certificateType: certType,
        category: selectedCategory,
        instituteId: institute?.id || 'inst-01',
        academicYearId: academicYear?.id || 'ay-2026',
        studentId: selectedStudentId || `stu-custom-${Date.now()}`,
        studentName: studentName.trim().toUpperCase(),
        studentBengaliName: studentBengaliName.trim() || undefined,
        fatherName: (fatherName.trim() || 'GUARDIAN NAME').toUpperCase(),
        motherName: (motherName.trim() || 'MOTHER NAME').toUpperCase(),
        rollNumber: Number(rollNumber) || 1,
        className: className.trim(),
        sectionName: sectionName.trim(),
        groupName: groupName.trim() || undefined,
        session: session.trim() || '2026',
        dateOfBirth,
        issueDate,
        status: 'issued',

        // Specific fields
        admissionDate: certType === 'admission_certificate' ? admissionDate : undefined,
        admissionNumber: certType === 'admission_certificate' ? admissionNumber : undefined,
        promotedToClass: certType === 'promotion_certificate' ? promotedToClass : undefined,
        reasonForLeaving:
          certType === 'transfer_certificate' || certType === 'school_leaving_certificate'
            ? reasonForLeaving
            : undefined,
        conductAndCharacter,
        duesClearedUntil:
          certType === 'transfer_certificate' || certType === 'school_leaving_certificate'
            ? duesClearedUntil
            : undefined,
        highestClassPassed:
          certType === 'transfer_certificate' || certType === 'course_completion'
            ? highestClassPassed
            : undefined,
        boardRoll: certType === 'testimonial' || certType === 'result_certificate' ? boardRoll : undefined,
        boardReg: certType === 'testimonial' || certType === 'result_certificate' ? boardReg : undefined,
        boardName: certType === 'testimonial' || certType === 'result_certificate' ? boardName : undefined,
        examResultOrGpa:
          selectedCategory === 'achievement' ||
          certType === 'result_certificate' ||
          certType === 'testimonial' ||
          certType === 'promotion_certificate'
            ? examResultOrGpa
            : undefined,
        eventOrCompetitionName:
          selectedCategory === 'activities' ? eventOrCompetitionName : undefined,
        positionOrRank:
          selectedCategory === 'activities' || selectedCategory === 'achievement'
            ? positionOrRank
            : undefined,
        eventOrMeritTitle:
          selectedCategory === 'achievement' || certType === 'leadership'
            ? eventOrMeritTitle
            : undefined,
        achievementDetails:
          selectedCategory === 'achievement' || selectedCategory === 'activities'
            ? achievementDetails
            : undefined,
        customRemarks: customRemarks.trim() || undefined,

        issuedBy: institute?.principalName ? `${institute.principalName} (Principal)` : 'Principal / Headmaster',
        verificationCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(newCert);
      onClose();
    } catch (err) {
      console.error('Failed to issue certificate:', err);
      alert('Failed to issue certificate. Please check data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeDef = getCertificateDefinition(certType);
  const catalogForCurrentCategory = CERTIFICATE_CATALOG.filter(
    (c) => c.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Issue Student Certificate (English)
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                  28 Types
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official English certificates with verifiable QR code and institutional details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: CATEGORY SELECTION TABS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                1. Select Certificate Category
              </label>
              <span className="text-[11px] text-slate-400">
                Choose from 3 primary institutional categories
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {CERTIFICATE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySwitch(cat.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono">
                        Category {cat.code}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                        {cat.count} Templates
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {cat.bengaliTitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CERTIFICATE SELECTION WITHIN CATEGORY */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Select Specific Certificate ({catalogForCurrentCategory.length} Available)
              </label>
              <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                Prefix: {activeDef.prefix}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
              {catalogForCurrentCategory.map((def) => {
                const isSelected = certType === def.id;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => handleSelectCert(def)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-white dark:bg-slate-800 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                      {def.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {def.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {def.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK STUDENT SEARCH & AUTO-FILL */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                Select Student from Roster (Auto-fill particulars)
              </label>
              {selectedStudentId && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Auto-filled from Student Database
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search by student English name, roll number, or student ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />

              {studentSearch.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectStudent(s)}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-slate-700/50 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white font-medium">
                            {s.firstName} {s.lastName}
                          </strong>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                            (Roll: {s.rollNumber})
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          ID: {s.studentId}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No matching student found. You can enter details manually below.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: STUDENT CORE PARTICULARS (IN ENGLISH) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Student Particulars (English)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Student Full Name (English) *
                  </label>
                  <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                    CAPITAL LETTERS
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. TANVIR AHMED"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Father's Name (English) *
                  </label>
                  <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                    CAPITAL LETTERS
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. MD. RAFIQUL ISLAM"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Mother's Name (English) *
                  </label>
                  <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                    CAPITAL LETTERS
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHAHANARA BEGUM"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value.toUpperCase())}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 uppercase font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 10"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Section Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section A"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Class Roll *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Group / Stream
                  </label>
                  <input
                    type="text"
                    placeholder="Science / General"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Academic Session *
                  </label>
                  <input
                    type="text"
                    required
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Certificate Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: CATEGORY & TYPE-SPECIFIC FIELDS */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 space-y-4">
            <h3 className="text-xs font-bold text-blue-950 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              4. Specific Certificate Details ({activeDef.title})
            </h3>

            {/* If Category A: Admission Certificate */}
            {certType === 'admission_certificate' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Admission Date
                  </label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Admission Number / Reg No.
                  </label>
                  <input
                    type="text"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="e.g. ADM-2026-042"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* If Category A: Promotion Certificate */}
            {certType === 'promotion_certificate' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Promoted To Class *
                  </label>
                  <input
                    type="text"
                    value={promotedToClass}
                    onChange={(e) => setPromotedToClass(e.target.value)}
                    placeholder="e.g. Class 10 (Science)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Annual Exam GPA / Marks
                  </label>
                  <input
                    type="text"
                    value={examResultOrGpa}
                    onChange={(e) => setExamResultOrGpa(e.target.value)}
                    placeholder="e.g. GPA 4.90"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* If Category A: Transfer Certificate or School Leaving */}
            {(certType === 'transfer_certificate' || certType === 'school_leaving_certificate') && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Leaving / Transfer *
                  </label>
                  <input
                    type="text"
                    value={reasonForLeaving}
                    onChange={(e) => setReasonForLeaving(e.target.value)}
                    placeholder="e.g. Guardian relocation / transfer of workplace"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      School Dues Cleared Up To
                    </label>
                    <input
                      type="text"
                      value={duesClearedUntil}
                      onChange={(e) => setDuesClearedUntil(e.target.value)}
                      placeholder="e.g. September 2026"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Highest Class Passed
                    </label>
                    <input
                      type="text"
                      value={highestClassPassed}
                      onChange={(e) => setHighestClassPassed(e.target.value)}
                      placeholder="e.g. Class 9 Annual Exam"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* If Category A: Testimonial or Result Certificate */}
            {(certType === 'testimonial' || certType === 'result_certificate') && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Board Roll No.
                  </label>
                  <input
                    type="text"
                    value={boardRoll}
                    onChange={(e) => setBoardRoll(e.target.value)}
                    placeholder="142981"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Registration No.
                  </label>
                  <input
                    type="text"
                    value={boardReg}
                    onChange={(e) => setBoardReg(e.target.value)}
                    placeholder="1912849201"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Education Board
                  </label>
                  <input
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Result / GPA
                  </label>
                  <input
                    type="text"
                    value={examResultOrGpa}
                    onChange={(e) => setExamResultOrGpa(e.target.value)}
                    placeholder="GPA 5.00 (Golden A+)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* If Category B: Achievement Specifics */}
            {selectedCategory === 'achievement' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Position / Rank / Standing
                  </label>
                  <input
                    type="text"
                    value={positionOrRank}
                    onChange={(e) => setPositionOrRank(e.target.value)}
                    placeholder="e.g. 1st Rank (Top Scholastic Honor)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Academic Score / GPA
                  </label>
                  <input
                    type="text"
                    value={examResultOrGpa}
                    onChange={(e) => setExamResultOrGpa(e.target.value)}
                    placeholder="e.g. GPA 5.00 / 95% Aggregate"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Distinction Citation / Citation of Honor
                  </label>
                  <textarea
                    rows={2}
                    value={achievementDetails}
                    onChange={(e) => setAchievementDetails(e.target.value)}
                    placeholder="Details of achievement..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* If Category C: Activities Specifics */}
            {selectedCategory === 'activities' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event / Competition Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventOrCompetitionName}
                    onChange={(e) => setEventOrCompetitionName(e.target.value)}
                    placeholder="e.g. National Inter-School Debate Tournament"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Position / Honors Conferred *
                  </label>
                  <input
                    type="text"
                    required
                    value={positionOrRank}
                    onChange={(e) => setPositionOrRank(e.target.value)}
                    placeholder="e.g. Champion / 1st Place / Gold Medalist"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Citation of Commendation / Performance Details
                  </label>
                  <textarea
                    rows={2}
                    value={achievementDetails}
                    onChange={(e) => setAchievementDetails(e.target.value)}
                    placeholder="e.g. Displayed outstanding leadership, strategic debating logic, and team dedication."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Character Assessment & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Conduct &amp; Character Assessment
                </label>
                <input
                  type="text"
                  value={conductAndCharacter}
                  onChange={(e) => setConductAndCharacter(e.target.value)}
                  placeholder="e.g. Exemplary, Disciplined and Trustworthy"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Institutional Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  placeholder="e.g. We wish him/her shining future academic success."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Serial preview: {activeDef.prefix}-{new Date().getFullYear()}-{String(existingCount + 1).padStart(4, '0')}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <FileBadge className="w-4 h-4" />
                <span>{isSubmitting ? 'Generating...' : 'Issue Certificate (English)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
