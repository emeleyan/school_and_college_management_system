import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { InstituteHeadRole } from '../../types';
import {
  fileToBase64,
  processDigitalSignature,
  PRESET_INSTITUTE_LOGOS,
  PRESET_DIGITAL_SIGNATURES,
} from '../../utils/imageUtils';
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  User,
  Phone,
  Mail,
  MapPin,
  FileBadge,
  Upload,
  Image as ImageIcon,
  PenTool,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const SetupWizard: React.FC = () => {
  const { completeSetupWizard, language, t } = useApp();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form states
  const [adminUser, setAdminUser] = useState({
    username: 'admin',
    password: 'admin123',
    confirmPassword: 'admin123',
    fullName: 'System Administrator',
    email: 'admin@schoolcollege.local',
    mobile: '01712345678',
  });

  const [school, setSchool] = useState({
    name: 'Agrani Model High School',
    bengaliName: 'অগ্রণী মডেল উচ্চ বিদ্যালয়',
    eiin: '108450',
    address: 'Sector 4, Uttara, Dhaka-1230',
    phone: '+880 2 8954321',
    email: 'info@agranischool.edu.bd',
    headRole: 'headmaster' as InstituteHeadRole,
    principalName: 'Md. Rafiqul Islam',
    establishedYear: '1992',
    motto: 'Knowledge is Light',
    logoUrl: PRESET_INSTITUTE_LOGOS.schoolCrest as string | undefined,
    signatureUrl: PRESET_DIGITAL_SIGNATURES.headmaster as string | undefined,
  });

  const [college, setCollege] = useState({
    name: 'Agrani Model College',
    bengaliName: 'অগ্রণী মডেল কলেজ',
    eiin: '134890',
    address: 'Sector 4, Uttara, Dhaka-1230',
    phone: '+880 2 8954322',
    email: 'info@agranicollege.edu.bd',
    headRole: 'principal' as InstituteHeadRole,
    principalName: 'Prof. Dr. Anisur Rahman',
    vicePrincipalName: 'Mohammad Abdul Kayum',
    actingPrincipalName: 'Dr. Shah Alam Chowdhury',
    establishedYear: '2004',
    motto: 'Excellence in Higher Secondary Education',
    logoUrl: PRESET_INSTITUTE_LOGOS.collegeCrest as string | undefined,
    signatureUrl: PRESET_DIGITAL_SIGNATURES.principal as string | undefined,
    viceSignatureUrl: PRESET_DIGITAL_SIGNATURES.vicePrincipal as string | undefined,
    actingSignatureUrl: PRESET_DIGITAL_SIGNATURES.actingPrincipal as string | undefined,
  });

  const [academicYears, setAcademicYears] = useState<string[]>(['2025', '2026', '2027']);
  const [activeYear, setActiveYear] = useState<string>('2026');
  const [newYearInput, setNewYearInput] = useState<string>('');

  const schoolLogoRef = useRef<HTMLInputElement>(null);
  const schoolSignRef = useRef<HTMLInputElement>(null);
  const collegeLogoRef = useRef<HTMLInputElement>(null);
  const collegeSignRef = useRef<HTMLInputElement>(null);
  const collegeViceSignRef = useRef<HTMLInputElement>(null);
  const collegeActingSignRef = useRef<HTMLInputElement>(null);

  // Fill sample data
  const handlePreFillDemo = () => {
    setAdminUser({
      username: 'admin',
      password: 'admin123',
      confirmPassword: 'admin123',
      fullName: 'System Administrator',
      email: 'admin@institute.edu.bd',
      mobile: '01711000000',
    });
    setSchool({
      name: 'Pioneer Ideal High School',
      bengaliName: 'পাইওনিয়ার আইডিয়াল উচ্চ বিদ্যালয়',
      eiin: '109821',
      address: 'Mirpur, Dhaka, Bangladesh',
      phone: '01811223344',
      email: 'school@pioneer.edu.bd',
      headRole: 'headmaster',
      principalName: 'Kazi Nurul Huda',
      establishedYear: '1988',
      motto: 'Discipline, Morality, Education',
      logoUrl: PRESET_INSTITUTE_LOGOS.schoolCrest,
      signatureUrl: PRESET_DIGITAL_SIGNATURES.headmaster,
    });
    setCollege({
      name: 'Pioneer Higher Secondary College',
      bengaliName: 'পাইওনিয়ার উচ্চ মাধ্যমিক কলেজ',
      eiin: '138902',
      address: 'Mirpur, Dhaka, Bangladesh',
      phone: '01811223355',
      email: 'college@pioneer.edu.bd',
      headRole: 'principal',
      principalName: 'Prof. Shamsul Alam',
      vicePrincipalName: 'Mohammad Abdul Kayum',
      actingPrincipalName: 'Dr. Shah Alam Chowdhury',
      establishedYear: '2002',
      motto: 'Illuminating Minds, Empowering Future',
      logoUrl: PRESET_INSTITUTE_LOGOS.collegeCrest,
      signatureUrl: PRESET_DIGITAL_SIGNATURES.principal,
      viceSignatureUrl: PRESET_DIGITAL_SIGNATURES.vicePrincipal,
      actingSignatureUrl: PRESET_DIGITAL_SIGNATURES.actingPrincipal,
    });
  };

  const handleSchoolLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 400, 400);
      setSchool((prev) => ({ ...prev, logoUrl: base64 }));
    } catch (err: any) {
      setError('Failed to upload school logo: ' + err.message);
    }
  };

  const handleSchoolSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const digitalSig = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 300 });
      setSchool((prev) => ({ ...prev, signatureUrl: digitalSig }));
    } catch (err: any) {
      setError('Failed to upload school signature: ' + err.message);
    }
  };

  const handleCollegeLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 400, 400);
      setCollege((prev) => ({ ...prev, logoUrl: base64 }));
    } catch (err: any) {
      setError('Failed to upload college logo: ' + err.message);
    }
  };

  const handleCollegeSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const digitalSig = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 300 });
      setCollege((prev) => ({ ...prev, signatureUrl: digitalSig }));
    } catch (err: any) {
      setError('Failed to upload college principal signature: ' + err.message);
    }
  };

  const handleCollegeViceSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 480, 160);
      setCollege((prev) => ({ ...prev, viceSignatureUrl: base64 }));
    } catch (err: any) {
      setError('Failed to upload college vice signature: ' + err.message);
    }
  };

  const handleCollegeActingSignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file, 480, 160);
      setCollege((prev) => ({ ...prev, actingSignatureUrl: base64 }));
    } catch (err: any) {
      setError('Failed to upload college acting signature: ' + err.message);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!adminUser.username.trim() || !adminUser.password.trim()) {
        setError('Username and password are required.');
        return;
      }
      if (adminUser.password !== adminUser.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    } else if (step === 2) {
      if (!school.name.trim() || !school.eiin.trim()) {
        setError('School name and EIIN are required.');
        return;
      }
    } else if (step === 3) {
      if (!college.name.trim() || !college.eiin.trim()) {
        setError('College name and EIIN are required.');
        return;
      }
    } else if (step === 4) {
      if (academicYears.length === 0) {
        setError('Please configure at least one academic year.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      await completeSetupWizard({
        adminUser,
        school,
        college,
        initialYears: academicYears,
        activeYear,
      });
    } catch (err: any) {
      console.error('Setup wizard error:', err);
      setError(err.message || 'Failed to initialize database.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 text-white p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {t.setupTitle}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.setupSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreFillDemo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Populate with realistic Bangladeshi School & College data"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Demo Presets</span>
            </button>
          </div>

          {/* Stepper indicator */}
          <div className="grid grid-cols-5 gap-2 mt-6 pt-4 border-t border-slate-800 text-center text-xs">
            {[
              { num: 1, label: 'Admin' },
              { num: 2, label: 'School' },
              { num: 3, label: 'College' },
              { num: 4, label: 'Years' },
              { num: 5, label: 'Review' },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 justify-center py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  step === s.num
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > s.num
                    ? 'text-blue-400 bg-slate-800/80'
                    : 'text-slate-500 bg-slate-800/40'
                }`}
              >
                <span>{s.num}.</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* STEP 1: Administrator Account */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  {t.step1Admin}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create the primary offline Super Administrator account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.username} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-admin-username"
                      type="text"
                      value={adminUser.username}
                      onChange={(e) => setAdminUser({ ...adminUser, username: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="e.g. admin"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.fullName} *
                  </label>
                  <input
                    id="input-admin-fullname"
                    type="text"
                    value={adminUser.fullName}
                    onChange={(e) => setAdminUser({ ...adminUser, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="System Administrator"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.password} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-admin-password"
                      type="password"
                      value={adminUser.password}
                      onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.confirmPassword} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-admin-confirm-password"
                      type="password"
                      value={adminUser.confirmPassword}
                      onChange={(e) => setAdminUser({ ...adminUser, confirmPassword: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-admin-email"
                      type="email"
                      value={adminUser.email}
                      onChange={(e) => setAdminUser({ ...adminUser, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.mobile}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      id="input-admin-mobile"
                      type="tel"
                      value={adminUser.mobile}
                      onChange={(e) => setAdminUser({ ...adminUser, mobile: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: School Setup */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  {t.step2School}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure School entity identity, official logo, headmaster details, and digital signatures.
                </p>
              </div>

              {/* School Logo Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    School Official Logo / Emblem (স্কুল মনোগ্রাম / লোগো)
                  </span>
                  {school.logoUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Logo Attached
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                    {school.logoUrl ? (
                      <img
                        src={school.logoUrl}
                        alt="School Logo Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <GraduationCap className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      type="file"
                      ref={schoolLogoRef}
                      onChange={handleSchoolLogoUpload}
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => schoolLogoRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchool({ ...school, logoUrl: PRESET_INSTITUTE_LOGOS.schoolCrest })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    >
                      Use School Crest
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchool({ ...school, logoUrl: PRESET_INSTITUTE_LOGOS.academicEmblem })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    >
                      Academic Emblem
                    </button>
                    {school.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSchool({ ...school, logoUrl: undefined })}
                        className="text-rose-500 hover:text-rose-600 p-1.5 cursor-pointer"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* School Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.instituteName} *
                  </label>
                  <input
                    id="input-school-name"
                    type="text"
                    value={school.name}
                    onChange={(e) => setSchool({ ...school, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Agrani Model High School"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.bengaliName}
                  </label>
                  <input
                    id="input-school-bn-name"
                    type="text"
                    value={school.bengaliName}
                    onChange={(e) => setSchool({ ...school, bengaliName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="যেমন: অগ্রণী মডেল উচ্চ বিদ্যালয়"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.eiin} *
                  </label>
                  <input
                    id="input-school-eiin"
                    type="text"
                    value={school.eiin}
                    onChange={(e) => setSchool({ ...school, eiin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. 108450"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    School Head Designation (প্রধানের পদবী)
                  </label>
                  <select
                    id="select-school-head-role"
                    value={school.headRole}
                    onChange={(e) => setSchool({ ...school, headRole: e.target.value as InstituteHeadRole })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="headmaster">Headmaster (প্রধান শিক্ষক)</option>
                    <option value="assistant_headmaster">Assistant Headmaster (সহকারী প্রধান শিক্ষক)</option>
                    <option value="acting_headmaster">Acting Headmaster (ভারপ্রাপ্ত প্রধান শিক্ষক)</option>
                    <option value="principal">Principal (অধ্যক্ষ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Head of School Name (প্রধানের নাম)
                  </label>
                  <input
                    id="input-school-principal"
                    type="text"
                    value={school.principalName}
                    onChange={(e) => setSchool({ ...school, principalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Md. Rafiqul Islam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.establishedYear}
                  </label>
                  <input
                    id="input-school-est-year"
                    type="text"
                    value={school.establishedYear}
                    onChange={(e) => setSchool({ ...school, establishedYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone}
                  </label>
                  <input
                    id="input-school-phone"
                    type="tel"
                    value={school.phone}
                    onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.address}
                  </label>
                  <input
                    id="input-school-address"
                    type="text"
                    value={school.address}
                    onChange={(e) => setSchool({ ...school, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* School Digital Signature Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-indigo-600" />
                    School Head Digital Signature (ডিজিটাল স্বাক্ষর - নোটিশ ও প্রত্যয়নের জন্য)
                  </span>
                  {school.signatureUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Signature Attached
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-16 w-44 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-xs">
                    {school.signatureUrl ? (
                      <img
                        src={school.signatureUrl}
                        alt="School Head Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No signature uploaded</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={schoolSignRef}
                      onChange={handleSchoolSignUpload}
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => schoolSignRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Signature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchool({ ...school, signatureUrl: PRESET_DIGITAL_SIGNATURES.headmaster })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    >
                      Sample Handwritten Preset
                    </button>
                    {school.signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSchool({ ...school, signatureUrl: undefined })}
                        className="text-rose-500 hover:text-rose-600 p-1.5 cursor-pointer"
                        title="Remove Signature"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: College Setup */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  {t.step3College}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure College entity identity, official logo, leadership positions (Principal, Vice-Principal, Acting Principal), and digital signatures.
                </p>
              </div>

              {/* College Logo Section */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    College Official Logo / Emblem (কলেজ মনোগ্রাম / লোগো)
                  </span>
                  {college.logoUrl && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Logo Attached
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                    {college.logoUrl ? (
                      <img
                        src={college.logoUrl}
                        alt="College Logo Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                      type="file"
                      ref={collegeLogoRef}
                      onChange={handleCollegeLogoUpload}
                      accept="image/png, image/jpeg, image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => collegeLogoRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollege({ ...college, logoUrl: PRESET_INSTITUTE_LOGOS.collegeCrest })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    >
                      Use College Crest
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollege({ ...college, logoUrl: PRESET_INSTITUTE_LOGOS.academicEmblem })}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                    >
                      Academic Emblem
                    </button>
                    {college.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setCollege({ ...college, logoUrl: undefined })}
                        className="text-rose-500 hover:text-rose-600 p-1.5 cursor-pointer"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* College Information Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.instituteName} *
                  </label>
                  <input
                    id="input-college-name"
                    type="text"
                    value={college.name}
                    onChange={(e) => setCollege({ ...college, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Agrani Model College"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.bengaliName}
                  </label>
                  <input
                    id="input-college-bn-name"
                    type="text"
                    value={college.bengaliName}
                    onChange={(e) => setCollege({ ...college, bengaliName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="যেমন: অগ্রণী মডেল কলেজ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.eiin} *
                  </label>
                  <input
                    id="input-college-eiin"
                    type="text"
                    value={college.eiin}
                    onChange={(e) => setCollege({ ...college, eiin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. 134890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Current In-Charge Head Position (বর্তমান প্রধান দায়িত্বপ্রাপ্ত পদ) *
                  </label>
                  <select
                    id="select-college-head-role"
                    value={college.headRole}
                    onChange={(e) => setCollege({ ...college, headRole: e.target.value as InstituteHeadRole })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                  >
                    <option value="principal">1. Principal (অধ্যক্ষ — মেইন হেড)</option>
                    <option value="vice_principal">2. Vice-Principal (উপাধ্যক্ষ — ২য় পজিশন ইন-চার্জ)</option>
                    <option value="acting_principal">3. Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ — প্রিন্সিপাল না থাকলে)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    1. Principal Name (মেইন হেড / অধ্যক্ষের নাম)
                  </label>
                  <input
                    id="input-college-principal"
                    type="text"
                    value={college.principalName}
                    onChange={(e) => setCollege({ ...college, principalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Prof. Dr. Anisur Rahman"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    2. Vice-Principal Name (২য় পজিশন / উপাধ্যক্ষের নাম)
                  </label>
                  <input
                    id="input-college-vice-principal"
                    type="text"
                    value={college.vicePrincipalName || ''}
                    onChange={(e) => setCollege({ ...college, vicePrincipalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Mohammad Abdul Kayum"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    3. Acting Principal Name (ভারপ্রাপ্ত অধ্যক্ষের নাম - প্রধান না থাকলে)
                  </label>
                  <input
                    id="input-college-acting-principal"
                    type="text"
                    value={college.actingPrincipalName || ''}
                    onChange={(e) => setCollege({ ...college, actingPrincipalName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="e.g. Dr. Shah Alam Chowdhury"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.establishedYear}
                  </label>
                  <input
                    id="input-college-est-year"
                    type="text"
                    value={college.establishedYear}
                    onChange={(e) => setCollege({ ...college, establishedYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone}
                  </label>
                  <input
                    id="input-college-phone"
                    type="tel"
                    value={college.phone}
                    onChange={(e) => setCollege({ ...college, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.address}
                  </label>
                  <input
                    id="input-college-address"
                    type="text"
                    value={college.address}
                    onChange={(e) => setCollege({ ...college, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* College Digital Signatures Section (3 Roles) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-teal-600" />
                    College Authority Digital Signatures (ডিজিটাল স্বাক্ষর — নোটিশ ও অনুমোদনের জন্য)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  You can upload or pick signatures for all three leadership positions. In notices, you can optionally include or exclude digital signatures as required.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Slot 1: Principal */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                        1. Principal (অধ্যক্ষ)
                      </span>
                      {college.signatureUrl && (
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full">
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="h-14 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-1 overflow-hidden">
                      {college.signatureUrl ? (
                        <img
                          src={college.signatureUrl}
                          alt="Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No signature</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={collegeSignRef}
                        onChange={handleCollegeSignUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => collegeSignRef.current?.click()}
                        className="px-2 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollege({ ...college, signatureUrl: PRESET_DIGITAL_SIGNATURES.principal })}
                        className="px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium cursor-pointer transition-colors"
                      >
                        Preset
                      </button>
                      {college.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => setCollege({ ...college, signatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slot 2: Vice-Principal */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                        2. Vice-Principal (উপাধ্যক্ষ)
                      </span>
                      {college.viceSignatureUrl && (
                        <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded-full">
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="h-14 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-1 overflow-hidden">
                      {college.viceSignatureUrl ? (
                        <img
                          src={college.viceSignatureUrl}
                          alt="Vice-Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No signature</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={collegeViceSignRef}
                        onChange={handleCollegeViceSignUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => collegeViceSignRef.current?.click()}
                        className="px-2 py-1 rounded-md bg-teal-600 hover:bg-teal-700 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollege({ ...college, viceSignatureUrl: PRESET_DIGITAL_SIGNATURES.vicePrincipal })}
                        className="px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium cursor-pointer transition-colors"
                      >
                        Preset
                      </button>
                      {college.viceSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => setCollege({ ...college, viceSignatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slot 3: Acting Principal */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">
                        3. Acting Principal (ভারপ্রাপ্ত)
                      </span>
                      {college.actingSignatureUrl && (
                        <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.5 rounded-full">
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="h-14 rounded-md border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center p-1 overflow-hidden">
                      {college.actingSignatureUrl ? (
                        <img
                          src={college.actingSignatureUrl}
                          alt="Acting Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No signature</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="file"
                        ref={collegeActingSignRef}
                        onChange={handleCollegeActingSignUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => collegeActingSignRef.current?.click()}
                        className="px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollege({ ...college, actingSignatureUrl: PRESET_DIGITAL_SIGNATURES.actingPrincipal })}
                        className="px-1.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-medium cursor-pointer transition-colors"
                      >
                        Preset
                      </button>
                      {college.actingSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => setCollege({ ...college, actingSignatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Academic Years */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {t.step4Years}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set up academic sessions. Historical data is preserved across years.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Configured Academic Years:
                </label>
                <div className="flex flex-wrap gap-2">
                  {academicYears.map((yr) => (
                    <div
                      key={yr}
                      onClick={() => setActiveYear(yr)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                        activeYear === yr
                          ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-200 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{yr}</span>
                      {activeYear === yr ? (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Click to set active</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add Year (e.g. 2028)"
                    value={newYearInput}
                    onChange={(e) => setNewYearInput(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newYearInput.trim() && !academicYears.includes(newYearInput.trim())) {
                        setAcademicYears([...academicYears, newYearInput.trim()]);
                        setNewYearInput('');
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    + Add Year
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Initial Configuration */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  {t.step5Review}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm your initial configuration before creating the local IndexedDB database.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    School Profile
                  </div>
                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                    <div>
                      <strong>Name:</strong> {school.name}
                    </div>
                    <div>
                      <strong>Bengali:</strong> {school.bengaliName}
                    </div>
                    <div>
                      <strong>EIIN:</strong> <span className="font-mono">{school.eiin}</span>
                    </div>
                    <div>
                      <strong>Head:</strong> {school.principalName}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    College Profile
                  </div>
                  <div className="space-y-1 text-slate-600 dark:text-slate-300">
                    <div>
                      <strong>Name:</strong> {college.name}
                    </div>
                    <div>
                      <strong>Bengali:</strong> {college.bengaliName}
                    </div>
                    <div>
                      <strong>EIIN:</strong> <span className="font-mono">{college.eiin}</span>
                    </div>
                    <div>
                      <strong>Principal:</strong> {college.principalName}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
                  <div className="font-bold text-white flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Super Administrator
                  </div>
                  <div className="text-slate-300">
                    Username: <strong className="text-white">@{adminUser.username}</strong> |
                    Full Name: {adminUser.fullName} | Active Academic Year:{' '}
                    <strong className="text-blue-400">{activeYear}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.previous}</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                id="btn-wizard-next"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                <span>{t.next}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-wizard-finish"
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Initializing Database...' : t.finish}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
