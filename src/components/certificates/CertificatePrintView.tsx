import React, { useState, useRef, useEffect } from 'react';
import { CertificateRecord, Institute, AcademicYear } from '../../types';
import { QrCodeSvg } from '../../utils/qrBarcodeUtils';
import { processDigitalSignature } from '../../utils/imageUtils';
import {
  getCertificateDefinition,
  getEnglishInstituteDetails,
} from './certificateDefinitions';
import {
  CERTIFICATE_FONT_OPTIONS,
  DEFAULT_CERTIFICATE_FONTS,
  FONT_PRESETS,
  CertificateFontConfig,
  CertificateSignatoriesConfig,
} from './certificateCustomizationTypes';
import {
  Printer,
  X,
  Award,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Sliders,
  RotateCcw,
  Sparkles,
  Trophy,
  Medal,
  Check,
  Edit3,
  Type,
  Image as ImageIcon,
  FileSignature,
  Trash2,
  Save,
  RotateCw,
  SlidersHorizontal,
} from 'lucide-react';

interface CertificatePrintViewProps {
  certificate: CertificateRecord;
  institute?: Institute | null;
  academicYear?: AcademicYear | null;
  onClose: () => void;
}

export const CertificatePrintView: React.FC<CertificatePrintViewProps> = ({
  certificate,
  institute,
  academicYear,
  onClose,
}) => {
  // English definition & institutional details
  const certDef = getCertificateDefinition(certificate.certificateType);
  const instDetails = getEnglishInstituteDetails(institute);

  // Formal formatted issue date
  const defaultFormattedIssueDate = new Date(certificate.issueDate || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Date of birth formatted
  const formattedDob = certificate.dateOfBirth
    ? new Date(certificate.dateOfBirth).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Category Theme
  const isAchievement = certDef.category === 'achievement';
  const isActivities = certDef.category === 'activities';

  // =========================================================================
  // 1. DESIGNER CONTROLS & PERSISTED SETTINGS
  // =========================================================================
  const [showDesigner, setShowDesigner] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'text' | 'fonts' | 'logo_watermark' | 'signatures' | 'layout'>('text');
  const [isLiveEditMode, setIsLiveEditMode] = useState<boolean>(false);

  // Background letterhead / parchment template
  const [customTemplateBg, setCustomTemplateBg] = useState<string>(() => {
    return localStorage.getItem('cert_custom_template_bg') || '';
  });

  // Layout toggles
  const [showLogo, setShowLogo] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_logo');
    return val === null ? true : val === 'true';
  });
  const [showWatermark, setShowWatermark] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_watermark');
    return val === null ? true : val === 'true';
  });
  const [showSignatures, setShowSignatures] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_signatures');
    return val === null ? true : val === 'true';
  });
  const [showBorder, setShowBorder] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_border');
    return val === null ? true : val === 'true';
  });
  const [showHeader, setShowHeader] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_header');
    return val === null ? true : val === 'true';
  });

  // =========================================================================
  // 2. LOGO ALIGNMENT, SIZE & ROTATION FIX
  // =========================================================================
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return localStorage.getItem('cert_custom_logo_url') || (instDetails.logoUrl || '');
  });
  const [logoRotation, setLogoRotation] = useState<number>(() => {
    return Number(localStorage.getItem('cert_logo_rotation')) || 0;
  });
  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('cert_logo_size') as any) || 'md';
  });

  // =========================================================================
  // 3. WATERMARK SETTINGS (Institute Logo as Watermark)
  // =========================================================================
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    return Number(localStorage.getItem('cert_watermark_opacity')) || 7;
  });
  const [watermarkSize, setWatermarkSize] = useState<number>(() => {
    return Number(localStorage.getItem('cert_watermark_size')) || 320;
  });
  const [watermarkGrayscale, setWatermarkGrayscale] = useState<boolean>(() => {
    return localStorage.getItem('cert_watermark_grayscale') !== 'false';
  });

  // =========================================================================
  // 4. SECTION-WISE FONT SELECTION & DEFAULT PRESET
  // =========================================================================
  const [fonts, setFonts] = useState<CertificateFontConfig>(() => {
    const saved = localStorage.getItem('cert_default_fonts');
    if (saved) {
      try {
        return { ...DEFAULT_CERTIFICATE_FONTS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_CERTIFICATE_FONTS;
      }
    }
    return DEFAULT_CERTIFICATE_FONTS;
  });

  const [fontSaveNotice, setFontSaveNotice] = useState<boolean>(false);

  const handleSaveFontsAsDefault = () => {
    localStorage.setItem('cert_default_fonts', JSON.stringify(fonts));
    setFontSaveNotice(true);
    setTimeout(() => setFontSaveNotice(false), 3000);
  };

  const handleApplyFontPreset = (presetFonts: CertificateFontConfig) => {
    setFonts(presetFonts);
  };

  // =========================================================================
  // 5. DIGITAL SIGNATURES MANAGEMENT
  // =========================================================================
  const [signatories, setSignatories] = useState<CertificateSignatoriesConfig>(() => {
    const saved = localStorage.getItem('cert_signatories_config');
    const defaultHeadSig = institute?.signatureUrl || '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          sig1: {
            enabled: true,
            useDigital: false,
            signatureUrl: '',
            title: 'Prepared By',
            sub: 'Office Registrar',
            ...(parsed.sig1 || {}),
          },
          sig2: {
            enabled: true,
            useDigital: false,
            signatureUrl: '',
            title: 'Class In-charge',
            sub: 'Academic Section',
            ...(parsed.sig2 || {}),
          },
          sig3: {
            enabled: true,
            useDigital: !!defaultHeadSig,
            signatureUrl: defaultHeadSig,
            title: instDetails.principalTitle,
            sub: instDetails.name,
            ...(parsed.sig3 || {}),
          },
        };
      } catch (e) {}
    }
    return {
      sig1: {
        enabled: true,
        useDigital: false,
        signatureUrl: '',
        title: 'Prepared By',
        sub: 'Office Registrar',
      },
      sig2: {
        enabled: true,
        useDigital: false,
        signatureUrl: '',
        title: 'Class In-charge',
        sub: 'Academic Section',
      },
      sig3: {
        enabled: true,
        useDigital: !!defaultHeadSig,
        signatureUrl: defaultHeadSig,
        title: instDetails.principalTitle,
        sub: instDetails.name,
      },
    };
  });

  const saveSignatoriesToStorage = (updated: CertificateSignatoriesConfig) => {
    setSignatories(updated);
    localStorage.setItem('cert_signatories_config', JSON.stringify(updated));
  };

  // =========================================================================
  // 6. EDITABLE CERTIFICATE TEXTS
  // Student, Father, Mother names MUST ALWAYS BE IN CAPITAL LETTERS
  // =========================================================================
  const initialStudentName = (certificate.studentName || '').toUpperCase();
  const initialFatherName = (certificate.fatherName || '').toUpperCase();
  const initialMotherName = (certificate.motherName || '').toUpperCase();

  const [texts, setTexts] = useState({
    instituteName: instDetails.name,
    instituteMotto: instDetails.motto,
    instituteBoardLine: "People's Republic of Bangladesh • Board of Intermediate & Secondary Education",
    instituteContactLine: `${instDetails.eiin} • ${instDetails.instituteCode} • ${instDetails.estd}`,
    instituteAddress: `${instDetails.address} • ${instDetails.board}`,
    certTitle: certDef.title,
    certSubtitle: certDef.subtitle,
    serialNumber: certificate.certificateNumber,
    issueDate: defaultFormattedIssueDate,
    certLead: 'This is to certify that',
    studentName: initialStudentName,
    fatherName: initialFatherName,
    motherName: initialMotherName,
    className: certificate.className,
    sectionName: certificate.sectionName || '',
    groupName: certificate.groupName || '',
    rollNumber: String(certificate.rollNumber),
    session: certificate.session,
    conductStatement: certificate.conductAndCharacter || 'Exemplary and Disciplined',
    customRemarks: certificate.customRemarks || '',
    achievementDetails: certificate.achievementDetails || '',
    closingStatement:
      'He/She has neither taken part in any subversive activity nor committed any act detrimental to institutional discipline. We take immense pride in his/her diligence and wish him/her shining success in all future educational endeavors.',
  });

  // Keep student, father, mother strictly UPPERCASE
  const handleUpdateText = (key: keyof typeof texts, value: string) => {
    let finalVal = value;
    if (key === 'studentName' || key === 'fatherName' || key === 'motherName') {
      finalVal = value.toUpperCase();
    }
    setTexts((prev) => ({ ...prev, [key]: finalVal }));
  };

  const handleResetTexts = () => {
    setTexts({
      instituteName: instDetails.name,
      instituteMotto: instDetails.motto,
      instituteBoardLine: "People's Republic of Bangladesh • Board of Intermediate & Secondary Education",
      instituteContactLine: `${instDetails.eiin} • ${instDetails.instituteCode} • ${instDetails.estd}`,
      instituteAddress: `${instDetails.address} • ${instDetails.board}`,
      certTitle: certDef.title,
      certSubtitle: certDef.subtitle,
      serialNumber: certificate.certificateNumber,
      issueDate: defaultFormattedIssueDate,
      certLead: 'This is to certify that',
      studentName: initialStudentName,
      fatherName: initialFatherName,
      motherName: initialMotherName,
      className: certificate.className,
      sectionName: certificate.sectionName || '',
      groupName: certificate.groupName || '',
      rollNumber: String(certificate.rollNumber),
      session: certificate.session,
      conductStatement: certificate.conductAndCharacter || 'Exemplary and Disciplined',
      customRemarks: certificate.customRemarks || '',
      achievementDetails: certificate.achievementDetails || '',
      closingStatement:
        'He/She has neither taken part in any subversive activity nor committed any act detrimental to institutional discipline. We take immense pride in his/her diligence and wish him/her shining success in all future educational endeavors.',
    });
  };

  // =========================================================================
  // FILE REFS & HANDLERS
  // =========================================================================
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const sig1InputRef = useRef<HTMLInputElement | null>(null);
  const sig2InputRef = useRef<HTMLInputElement | null>(null);
  const sig3InputRef = useRef<HTMLInputElement | null>(null);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomTemplateBg(b64);
      localStorage.setItem('cert_custom_template_bg', b64);
    };
    reader.readAsDataURL(file);
  };

  // Master Template Style computed from Registry Settings
  const masterTemplateStyle = localStorage.getItem('cert_master_template_style') || 'classic_gold';
  let templateBorderAndBg = 'border-8 border-double border-amber-600/70 bg-gradient-to-b from-amber-50/25 via-white to-amber-50/20';
  let cornerBorderColor = 'border-amber-700';

  if (masterTemplateStyle === 'royal_navy') {
    templateBorderAndBg = 'border-8 border-double border-blue-900/70 bg-gradient-to-b from-blue-50/20 via-white to-slate-50/20';
    cornerBorderColor = 'border-blue-900';
  } else if (masterTemplateStyle === 'emerald_distinction') {
    templateBorderAndBg = 'border-8 border-double border-emerald-700/60 bg-gradient-to-b from-emerald-50/25 via-white to-emerald-50/15';
    cornerBorderColor = 'border-emerald-800';
  } else if (masterTemplateStyle === 'crimson_prestigious') {
    templateBorderAndBg = 'border-8 border-double border-rose-800/70 bg-gradient-to-b from-rose-50/20 via-white to-amber-50/15';
    cornerBorderColor = 'border-rose-900';
  } else if (masterTemplateStyle === 'minimalist_modern') {
    templateBorderAndBg = 'border-2 border-slate-300 bg-white';
    cornerBorderColor = 'border-slate-400';
  } else if (masterTemplateStyle === 'custom_letterhead') {
    templateBorderAndBg = 'border border-slate-200 bg-white';
    cornerBorderColor = 'border-slate-300';
  } else {
    if (isAchievement) {
      templateBorderAndBg = 'border-8 border-double border-amber-600/70 bg-gradient-to-b from-amber-50/25 via-white to-amber-50/20';
      cornerBorderColor = 'border-amber-700';
    } else if (isActivities) {
      templateBorderAndBg = 'border-8 border-double border-emerald-700/60 bg-gradient-to-b from-emerald-50/25 via-white to-emerald-50/15';
      cornerBorderColor = 'border-emerald-700';
    } else {
      templateBorderAndBg = 'border-8 border-double border-blue-900/70 bg-gradient-to-b from-blue-50/20 via-white to-slate-50/20';
      cornerBorderColor = 'border-blue-900';
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomLogoUrl(b64);
      localStorage.setItem('cert_custom_logo_url', b64);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = async (sigKey: 'sig1' | 'sig2' | 'sig3', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Automatically clean paper background, boost sharpness, and convert to crisp black ink
      const digitalSig = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 280 });
      const updated = {
        ...signatories,
        [sigKey]: {
          ...signatories[sigKey],
          useDigital: true,
          signatureUrl: digitalSig,
        },
      };
      saveSignatoriesToStorage(updated);
    } catch (err) {
      console.error('Failed to process digital signature:', err);
    }
  };

  const updateSetting = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
  };

  const handlePrint = () => {
    window.print();
  };

  // Logo size classes
  const logoDimensions =
    logoSize === 'sm'
      ? 'w-12 h-12'
      : logoSize === 'lg'
      ? 'w-20 h-20'
      : logoSize === 'xl'
      ? 'w-24 h-24'
      : 'w-16 h-16';

  const logoImgSrc = customLogoUrl || instDetails.logoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* Hidden file inputs */}
      <input type="file" ref={bgInputRef} onChange={handleBgUpload} accept="image/*" className="hidden" />
      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
      <input type="file" ref={sig1InputRef} onChange={(e) => handleSignatureUpload('sig1', e)} accept="image/*" className="hidden" />
      <input type="file" ref={sig2InputRef} onChange={(e) => handleSignatureUpload('sig2', e)} accept="image/*" className="hidden" />
      <input type="file" ref={sig3InputRef} onChange={(e) => handleSignatureUpload('sig3', e)} accept="image/*" className="hidden" />

      {/* ACTION BAR (Hidden on Print) */}
      <div className="fixed top-4 right-4 z-60 flex items-center gap-2 print:hidden bg-slate-800/95 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-slate-700">
        <button
          onClick={() => setIsLiveEditMode(!isLiveEditMode)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            isLiveEditMode
              ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-100'
          }`}
          title="Toggle inline text editing on the certificate"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isLiveEditMode ? '✓ Done Editing' : '✏️ Live Edit Text'}</span>
        </button>

        <button
          onClick={() => setShowDesigner(!showDesigner)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            showDesigner
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
          title="Customize Certificate Fonts, Signatures, Logo & Watermark"
        >
          <Sliders className="w-4 h-4" />
          <span>{showDesigner ? 'Hide Settings' : 'Certificate Settings'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Certificate</span>
        </button>

        <button
          onClick={onClose}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Close Preview"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LIVE EDIT MODE BANNER */}
      {isLiveEditMode && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-60 bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-full shadow-xl text-xs flex items-center gap-2 print:hidden border border-amber-300">
          <Edit3 className="w-3.5 h-3.5" />
          <span>Live In-Place Edit Mode Active — Click any text on certificate to edit! Names stay in CAPITAL LETTERS.</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING DESIGNER DRAWER (Hidden on Print)                                */}
      {/* ========================================================================= */}
      {showDesigner && (
        <div className="fixed top-16 right-4 z-60 w-96 max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-850 p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 print:hidden space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 font-bold text-sm">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <SlidersHorizontal className="w-4 h-4" />
              Certificate Customization Hub
            </span>
            <button
              onClick={() => setShowDesigner(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB SELECTOR */}
          <div className="grid grid-cols-5 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-[10px]">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Texts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fonts')}
              className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all ${
                activeTab === 'fonts'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Fonts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logo_watermark')}
              className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all ${
                activeTab === 'logo_watermark'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Logo &amp; Mark
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signatures')}
              className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all ${
                activeTab === 'signatures'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Signatures
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-all ${
                activeTab === 'layout'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Layout
            </button>
          </div>

          {/* TAB 1: EDITABLE TEXTS */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-500 uppercase">
                  Edit All Certificate Texts
                </span>
                <button
                  type="button"
                  onClick={handleResetTexts}
                  className="text-[10px] text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Defaults
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Institution Header Title
                  </label>
                  <input
                    type="text"
                    value={texts.instituteName}
                    onChange={(e) => handleUpdateText('instituteName', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Certificate Title
                  </label>
                  <input
                    type="text"
                    value={texts.certTitle}
                    onChange={(e) => handleUpdateText('certTitle', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Certificate Subtitle / Ribbon Text
                  </label>
                  <input
                    type="text"
                    value={texts.certSubtitle}
                    onChange={(e) => handleUpdateText('certSubtitle', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 italic"
                  />
                </div>

                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300">
                      Student &amp; Parent Names
                    </span>
                    <span className="text-[9px] uppercase font-bold text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      ALWAYS CAPITAL
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      value={texts.studentName}
                      onChange={(e) => handleUpdateText('studentName', e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      value={texts.fatherName}
                      onChange={(e) => handleUpdateText('fatherName', e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 block mb-0.5">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      value={texts.motherName}
                      onChange={(e) => handleUpdateText('motherName', e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Conduct &amp; Character Assessment
                  </label>
                  <input
                    type="text"
                    value={texts.conductStatement}
                    onChange={(e) => handleUpdateText('conductStatement', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Custom Remarks / Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    value={texts.customRemarks}
                    onChange={(e) => handleUpdateText('customRemarks', e.target.value)}
                    placeholder="e.g. He took an active part in inter-school athletics..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-0.5">
                    Closing Blessing / Institutional Declaration
                  </label>
                  <textarea
                    rows={3}
                    value={texts.closingStatement}
                    onChange={(e) => handleUpdateText('closingStatement', e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FONTS CUSTOMIZATION & DEFAULT PRESET */}
          {activeTab === 'fonts' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-500 uppercase">
                  Section Typography &amp; Defaults
                </span>
                {fontSaveNotice && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved as Default!
                  </span>
                )}
              </div>

              {/* Quick Font Presets */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block">Quick Typography Themes:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {FONT_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyFontPreset(preset.fonts)}
                      className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/80 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </div>
                      <div className="text-[9px] text-slate-400 line-clamp-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section-by-Section Font Pickers */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    1. Institution Header Font
                  </label>
                  <select
                    value={fonts.headerFont}
                    onChange={(e) => setFonts({ ...fonts, headerFont: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    2. Certificate Title Banner Font
                  </label>
                  <select
                    value={fonts.titleFont}
                    onChange={(e) => setFonts({ ...fonts, titleFont: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    3. Student Name Highlight Font
                  </label>
                  <select
                    value={fonts.studentNameFont}
                    onChange={(e) => setFonts({ ...fonts, studentNameFont: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    4. Body Narrative &amp; Particulars Font
                  </label>
                  <select
                    value={fonts.bodyFont}
                    onChange={(e) => setFonts({ ...fonts, bodyFont: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                    5. Signatures &amp; Footer Font
                  </label>
                  <select
                    value={fonts.footerFont}
                    onChange={(e) => setFonts({ ...fonts, footerFont: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SAVE AS DEFAULT BUTTON */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleSaveFontsAsDefault}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Set as Institutional Default Fonts</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  Will apply to all 28 certificate templates automatically.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO ALIGNMENT & WATERMARK */}
          {activeTab === 'logo_watermark' && (
            <div className="space-y-4">
              {/* LOGO CONTROLS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase">
                    Institution Logo &amp; Alignment
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => updateSetting('cert_show_logo', e.target.checked, setShowLogo)}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Show Logo</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customLogoUrl ? 'Replace Logo' : 'Upload Logo'}</span>
                  </button>

                  {customLogoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLogoUrl('');
                        localStorage.removeItem('cert_custom_logo_url');
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800 cursor-pointer"
                      title="Reset Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Fix Crooked/Sideways Logo - Rotation Control */}
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Logo Rotation (Fix Sideways/Crooked Photos)
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600">{logoRotation}°</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => {
                          setLogoRotation(deg);
                          localStorage.setItem('cert_logo_rotation', String(deg));
                        }}
                        className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                          logoRotation === deg
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size Control */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    Logo Display Size
                  </span>
                  <div className="flex gap-1">
                    {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setLogoSize(sz);
                          localStorage.setItem('cert_logo_size', sz);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer uppercase ${
                          logoSize === sz
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* WATERMARK WITH INSTITUTE LOGO */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 uppercase">
                    Institute Logo Watermark
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) =>
                        updateSetting('cert_show_watermark', e.target.checked, setShowWatermark)
                      }
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Enable Watermark</span>
                  </label>
                </div>

                <p className="text-[10px] text-slate-500">
                  Renders the official school/college emblem/logo at the center of the certificate background.
                </p>

                {showWatermark && (
                  <div className="space-y-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span>Watermark Opacity:</span>
                        <span>{watermarkOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="25"
                        step="1"
                        value={watermarkOpacity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWatermarkOpacity(val);
                          localStorage.setItem('cert_watermark_opacity', String(val));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span>Watermark Size:</span>
                        <span>{watermarkSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="180"
                        max="480"
                        step="20"
                        value={watermarkSize}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setWatermarkSize(val);
                          localStorage.setItem('cert_watermark_size', String(val));
                        }}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center justify-between text-[10px] font-bold cursor-pointer pt-1">
                      <span>Monochrome / Subtle Grayscale</span>
                      <input
                        type="checkbox"
                        checked={watermarkGrayscale}
                        onChange={(e) => {
                          setWatermarkGrayscale(e.target.checked);
                          localStorage.setItem('cert_watermark_grayscale', String(e.target.checked));
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DIGITAL SIGNATURES */}
          {activeTab === 'signatures' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-500 uppercase">
                  Digital Signatures &amp; Approvals
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) =>
                      updateSetting('cert_show_signatures', e.target.checked, setShowSignatures)
                    }
                    className="w-3.5 h-3.5 rounded text-blue-600"
                  />
                  <span>Show Signature Row</span>
                </label>
              </div>

              <div className="p-2 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Auto Digital Engine:</strong> Upload any paper signature. The system removes background, renders pure black ink, and sharpens strokes for crystal-clear printing.
                </span>
              </div>

              {/* Signatory 1: Prepared By / Registrar */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900 dark:text-white">1. Prepared By (Office)</strong>
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signatories.sig1.enabled}
                      onChange={(e) => {
                        const updated = {
                          ...signatories,
                          sig1: { ...signatories.sig1, enabled: e.target.checked },
                        };
                        saveSignatoriesToStorage(updated);
                      }}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {signatories.sig1.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signatories.sig1.useDigital}
                          onChange={(e) => {
                            const updated = {
                              ...signatories,
                              sig1: { ...signatories.sig1, useDigital: e.target.checked },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          Use Digital Signature Image
                        </span>
                      </label>

                      {signatories.sig1.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...signatories,
                              sig1: { ...signatories.sig1, signatureUrl: '', useDigital: false },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sig1InputRef.current?.click()}
                        className="py-1 px-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{signatories.sig1.signatureUrl ? 'Change Signature' : 'Upload PNG Signature'}</span>
                      </button>
                      {signatories.sig1.signatureUrl && (
                        <img
                          src={signatories.sig1.signatureUrl}
                          alt="Signature Preview"
                          className="h-6 max-w-24 object-contain bg-white rounded border border-slate-300 p-0.5"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Title (e.g. Prepared By)"
                        value={signatories.sig1.title}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig1: { ...signatories.sig1, title: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Sub (e.g. Office Registrar)"
                        value={signatories.sig1.sub}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig1: { ...signatories.sig1, sub: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Signatory 2: Class In-charge / Convener */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900 dark:text-white">2. Class In-charge / Teacher</strong>
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signatories.sig2.enabled}
                      onChange={(e) => {
                        const updated = {
                          ...signatories,
                          sig2: { ...signatories.sig2, enabled: e.target.checked },
                        };
                        saveSignatoriesToStorage(updated);
                      }}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {signatories.sig2.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signatories.sig2.useDigital}
                          onChange={(e) => {
                            const updated = {
                              ...signatories,
                              sig2: { ...signatories.sig2, useDigital: e.target.checked },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          Use Digital Signature Image
                        </span>
                      </label>

                      {signatories.sig2.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...signatories,
                              sig2: { ...signatories.sig2, signatureUrl: '', useDigital: false },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sig2InputRef.current?.click()}
                        className="py-1 px-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{signatories.sig2.signatureUrl ? 'Change Signature' : 'Upload PNG Signature'}</span>
                      </button>
                      {signatories.sig2.signatureUrl && (
                        <img
                          src={signatories.sig2.signatureUrl}
                          alt="Signature Preview"
                          className="h-6 max-w-24 object-contain bg-white rounded border border-slate-300 p-0.5"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Title (e.g. Class In-charge)"
                        value={signatories.sig2.title}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig2: { ...signatories.sig2, title: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Sub (e.g. Academic Section)"
                        value={signatories.sig2.sub}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig2: { ...signatories.sig2, sub: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Signatory 3: Head of Institution / Principal */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-slate-900 dark:text-white">3. Head of Institution / Principal</strong>
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={signatories.sig3.enabled}
                      onChange={(e) => {
                        const updated = {
                          ...signatories,
                          sig3: { ...signatories.sig3, enabled: e.target.checked },
                        };
                        saveSignatoriesToStorage(updated);
                      }}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Visible</span>
                  </label>
                </div>

                {signatories.sig3.enabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={signatories.sig3.useDigital}
                          onChange={(e) => {
                            const updated = {
                              ...signatories,
                              sig3: { ...signatories.sig3, useDigital: e.target.checked },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          Use Digital Signature Image
                        </span>
                      </label>

                      {signatories.sig3.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...signatories,
                              sig3: { ...signatories.sig3, signatureUrl: '', useDigital: false },
                            };
                            saveSignatoriesToStorage(updated);
                          }}
                          className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sig3InputRef.current?.click()}
                        className="py-1 px-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{signatories.sig3.signatureUrl ? 'Change Signature' : 'Upload PNG Signature'}</span>
                      </button>
                      {signatories.sig3.signatureUrl && (
                        <img
                          src={signatories.sig3.signatureUrl}
                          alt="Signature Preview"
                          className="h-6 max-w-24 object-contain bg-white rounded border border-slate-300 p-0.5"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Title (e.g. Principal / Headmaster)"
                        value={signatories.sig3.title}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig3: { ...signatories.sig3, title: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Sub (e.g. Institution Name)"
                        value={signatories.sig3.sub}
                        onChange={(e) => {
                          const updated = {
                            ...signatories,
                            sig3: { ...signatories.sig3, sub: e.target.value },
                          };
                          saveSignatoriesToStorage(updated);
                        }}
                        className="text-[11px] p-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: LAYOUT & PARCHMENT TEMPLATE */}
          {activeTab === 'layout' && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="font-bold text-[11px] text-slate-600 dark:text-slate-300 block">
                  Custom Parchment / Background Template
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg font-semibold cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Template</span>
                  </button>
                  {customTemplateBg && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTemplateBg('');
                        localStorage.removeItem('cert_custom_template_bg');
                      }}
                      className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg border border-rose-200 dark:border-rose-800 cursor-pointer"
                      title="Remove Custom Template"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {customTemplateBg && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Custom template background active
                  </p>
                )}
              </div>

              {/* Borders & Headers toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span>Royal Decorative Border</span>
                  <input
                    type="checkbox"
                    checked={showBorder}
                    onChange={(e) => updateSetting('cert_show_border', e.target.checked, setShowBorder)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span>Full Institution Header</span>
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => updateSetting('cert_show_header', e.target.checked, setShowHeader)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CERTIFICATE CANVAS (A4 Landscape Formatted, 100% English Language)       */}
      {/* ========================================================================= */}
      <div
        className={`my-auto w-full max-w-4xl bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-6 print:m-0 print:max-w-none print:w-full ${
          showBorder ? templateBorderAndBg : 'border border-slate-200'
        }`}
      >
        {/* Custom Template Background Image */}
        {customTemplateBg && (
          <img
            src={customTemplateBg}
            alt="Custom Certificate Template"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        )}

        {/* Ornate Corner Accents */}
        {showBorder && (
          <>
            <div
              className={`absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 pointer-events-none z-10 ${cornerBorderColor}`}
            />
            <div
              className={`absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 pointer-events-none z-10 ${cornerBorderColor}`}
            />
            <div
              className={`absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 pointer-events-none z-10 ${cornerBorderColor}`}
            />
            <div
              className={`absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 pointer-events-none z-10 ${cornerBorderColor}`}
            />
            <div
              className={`absolute inset-4 border pointer-events-none z-10 ${
                isAchievement ? 'border-amber-700/20' : isActivities ? 'border-emerald-700/20' : 'border-blue-900/20'
              }`}
            />
          </>
        )}

        {/* ========================================================================= */}
        {/* INSTITUTIONAL WATERMARK (Using Real Institute Logo Image)                  */}
        {/* ========================================================================= */}
        {showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10"
            style={{ opacity: watermarkOpacity / 100 }}
          >
            <div className="text-center flex flex-col items-center justify-center">
              {logoImgSrc ? (
                <img
                  src={logoImgSrc}
                  alt="Institute Logo Watermark"
                  style={{
                    width: `${watermarkSize}px`,
                    height: `${watermarkSize}px`,
                    transform: `rotate(${logoRotation}deg)`,
                    filter: watermarkGrayscale ? 'grayscale(100%)' : 'none',
                  }}
                  className="object-contain"
                />
              ) : (
                <div className="text-center">
                  {isAchievement ? (
                    <Trophy className="mx-auto text-amber-900" style={{ width: `${watermarkSize}px`, height: `${watermarkSize}px` }} />
                  ) : isActivities ? (
                    <Medal className="mx-auto text-emerald-900" style={{ width: `${watermarkSize}px`, height: `${watermarkSize}px` }} />
                  ) : (
                    <Award className="mx-auto text-blue-900" style={{ width: `${watermarkSize}px`, height: `${watermarkSize}px` }} />
                  )}
                  <div
                    className="text-3xl font-bold uppercase tracking-widest mt-2"
                    style={{ fontFamily: fonts.headerFont }}
                  >
                    {texts.instituteName}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. INSTITUTION HEADER SECTION                                             */}
        {/* ========================================================================= */}
        {showHeader && (
          <div
            className="text-center relative z-20 border-b-2 border-slate-900/20 pb-4"
            style={{ fontFamily: fonts.headerFont }}
          >
            <div
              className={`text-[10px] uppercase tracking-widest text-slate-500 mb-1 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('instituteBoardLine', e.currentTarget.textContent || '')}
            >
              {texts.instituteBoardLine}
            </div>

            <div className="flex items-center justify-center gap-4 my-1">
              {/* Corrected Upright Logo with Rotation & Size Controls */}
              {showLogo && (
                <div
                  className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-300/80 bg-white p-1 shadow-xs ${logoDimensions}`}
                >
                  {logoImgSrc ? (
                    <img
                      src={logoImgSrc}
                      alt="Institute Crest"
                      style={{
                        transform: `rotate(${logoRotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full object-contain object-center transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-serif font-black text-xl">
                      {texts.instituteName ? texts.instituteName.charAt(0) : 'S'}
                    </div>
                  )}
                </div>
              )}

              <div className="text-left sm:text-center">
                <h1
                  className={`text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight ${
                    isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-1 rounded cursor-text' : ''
                  }`}
                  contentEditable={isLiveEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateText('instituteName', e.currentTarget.textContent || '')}
                >
                  {texts.instituteName}
                </h1>
                <p
                  className={`text-xs sm:text-sm font-semibold text-slate-700 italic ${
                    isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''
                  }`}
                  contentEditable={isLiveEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateText('instituteMotto', e.currentTarget.textContent || '')}
                >
                  {texts.instituteMotto}
                </p>
              </div>
            </div>

            <div
              className={`flex flex-wrap items-center justify-center gap-3 text-xs text-slate-700 mt-1 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('instituteContactLine', e.currentTarget.textContent || '')}
            >
              {texts.instituteContactLine}
            </div>
            <p
              className={`text-[11px] text-slate-600 mt-0.5 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('instituteAddress', e.currentTarget.textContent || '')}
            >
              {texts.instituteAddress}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. SERIAL & VERIFICATION BAR                                              */}
        {/* ========================================================================= */}
        <div
          className="flex items-center justify-between mt-4 text-xs text-slate-700 relative z-10 px-2"
          style={{ fontFamily: fonts.footerFont }}
        >
          <div>
            <span>Serial No: </span>
            <strong
              className={`text-slate-950 font-mono text-sm tracking-wider ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('serialNumber', e.currentTarget.textContent || '')}
            >
              {texts.serialNumber}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Institutional Document
            </span>
          </div>
          <div>
            <span>Date of Issue: </span>
            <strong
              className={`text-slate-950 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('issueDate', e.currentTarget.textContent || '')}
            >
              {texts.issueDate}
            </strong>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CERTIFICATE TITLE BANNER                                               */}
        {/* ========================================================================= */}
        <div className="my-6 text-center relative z-10">
          <div className="inline-block relative">
            <div
              className={`px-8 py-2 border-y-2 rounded-sm ${
                isAchievement
                  ? 'bg-amber-100/50 border-amber-700/60'
                  : isActivities
                  ? 'bg-emerald-100/50 border-emerald-700/60'
                  : 'bg-blue-100/50 border-blue-900/60'
              }`}
            >
              <h2
                className={`text-lg sm:text-2xl font-black tracking-widest uppercase ${
                  isAchievement ? 'text-amber-950' : isActivities ? 'text-emerald-950' : 'text-blue-950'
                } ${isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-2 rounded cursor-text' : ''}`}
                style={{ fontFamily: fonts.titleFont }}
                contentEditable={isLiveEditMode}
                suppressContentEditableWarning
                onBlur={(e) => handleUpdateText('certTitle', e.currentTarget.textContent || '')}
              >
                {texts.certTitle}
              </h2>
            </div>
          </div>
          <div
            className={`text-xs italic text-slate-600 mt-1.5 ${
              isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''
            }`}
            style={{ fontFamily: fonts.titleFont }}
            contentEditable={isLiveEditMode}
            suppressContentEditableWarning
            onBlur={(e) => handleUpdateText('certSubtitle', e.currentTarget.textContent || '')}
          >
            {texts.certSubtitle}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CERTIFICATE BODY & STUDENT PARTICULARS (CAPITAL NAMES MANDATED)        */}
        {/* ========================================================================= */}
        <div
          className="relative z-10 px-2 sm:px-6 my-6 text-slate-800 leading-relaxed text-sm sm:text-base text-justify space-y-4"
          style={{ fontFamily: fonts.bodyFont }}
        >
          <p>
            <span
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('certLead', e.currentTarget.textContent || '')}
              className={isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text' : ''}
            >
              {texts.certLead}
            </span>{' '}
            {/* Student Name: ALWAYS CAPITAL LETTERS */}
            <strong
              className={`font-bold text-slate-950 underline decoration-slate-400 decoration-1 underline-offset-4 text-base sm:text-lg uppercase tracking-wide ${
                isLiveEditMode ? 'outline-dashed outline-2 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''
              }`}
              style={{ fontFamily: fonts.studentNameFont }}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('studentName', (e.currentTarget.textContent || '').toUpperCase())}
            >
              {texts.studentName}
            </strong>
            , Son / Daughter of{' '}
            {/* Father Name: ALWAYS CAPITAL LETTERS */}
            <strong
              className={`font-semibold text-slate-900 uppercase tracking-wide ${
                isLiveEditMode ? 'outline-dashed outline-2 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('fatherName', (e.currentTarget.textContent || '').toUpperCase())}
            >
              {texts.fatherName}
            </strong>{' '}
            and{' '}
            {/* Mother Name: ALWAYS CAPITAL LETTERS */}
            <strong
              className={`font-semibold text-slate-900 uppercase tracking-wide ${
                isLiveEditMode ? 'outline-dashed outline-2 outline-amber-500 bg-amber-50 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('motherName', (e.currentTarget.textContent || '').toUpperCase())}
            >
              {texts.motherName}
            </strong>
            , has been a bonafide student of this institution in{' '}
            <strong
              className={`font-semibold text-slate-900 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('className', e.currentTarget.textContent || '')}
            >
              {texts.className}
            </strong>
            {texts.sectionName ? `, Section ${texts.sectionName}` : ''}
            {texts.groupName ? ` (${texts.groupName} Group)` : ''}, bearing Class Roll Number{' '}
            <strong
              className={`font-semibold text-slate-900 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('rollNumber', e.currentTarget.textContent || '')}
            >
              {texts.rollNumber}
            </strong>{' '}
            during the Academic Session{' '}
            <strong
              className={`font-semibold text-slate-900 ${
                isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
              }`}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('session', e.currentTarget.textContent || '')}
            >
              {texts.session}
            </strong>.
          </p>

          {/* DYNAMIC PARTICULARS BOX */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Class &amp; Section</span>
              <strong className="text-slate-900 font-semibold">{texts.className} ({texts.sectionName || 'General'})</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Roll Number</span>
              <strong className="text-slate-900 font-semibold">{texts.rollNumber}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Academic Session</span>
              <strong className="text-slate-900 font-semibold">{texts.session}</strong>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Birth</span>
              <strong className="text-slate-900 font-semibold">{formattedDob || 'As per School Register'}</strong>
            </div>

            {/* Admission Specifics */}
            {certificate.admissionDate && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Date</span>
                <strong className="text-slate-900 font-semibold">{certificate.admissionDate}</strong>
              </div>
            )}
            {certificate.admissionNumber && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Admission Reg. No.</span>
                <strong className="text-slate-900 font-mono font-semibold">{certificate.admissionNumber}</strong>
              </div>
            )}

            {/* Promotion Specifics */}
            {certificate.promotedToClass && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Promoted To Class</span>
                <strong className="text-emerald-800 font-bold">{certificate.promotedToClass}</strong>
              </div>
            )}

            {/* Examination / Board / Result Specifics */}
            {certificate.examResultOrGpa && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Result / GPA Achieved</span>
                <strong className="text-amber-900 font-black">{certificate.examResultOrGpa}</strong>
              </div>
            )}
            {certificate.boardRoll && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Board Roll No.</span>
                <strong className="text-slate-900 font-mono font-semibold">{certificate.boardRoll}</strong>
              </div>
            )}
            {certificate.boardReg && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Registration No.</span>
                <strong className="text-slate-900 font-mono font-semibold">{certificate.boardReg}</strong>
              </div>
            )}

            {/* Achievement / Activity Specifics */}
            {certificate.eventOrCompetitionName && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Event / Competition</span>
                <strong className="text-slate-900 font-bold">{certificate.eventOrCompetitionName}</strong>
              </div>
            )}
            {certificate.positionOrRank && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Position / Honors Conferred</span>
                <strong className="text-amber-900 font-black text-sm">★ {certificate.positionOrRank} ★</strong>
              </div>
            )}
            {certificate.eventOrMeritTitle && !certificate.eventOrCompetitionName && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Achievement Field / Honor</span>
                <strong className="text-slate-900 font-bold">{certificate.eventOrMeritTitle}</strong>
              </div>
            )}

            {/* TC / Leaving Specifics */}
            {certificate.reasonForLeaving && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Reason for Leaving</span>
                <strong className="text-slate-900 font-semibold">{certificate.reasonForLeaving}</strong>
              </div>
            )}
            {certificate.duesClearedUntil && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Dues Cleared Up To</span>
                <strong className="text-emerald-800 font-semibold">{certificate.duesClearedUntil}</strong>
              </div>
            )}
            {certificate.highestClassPassed && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Highest Class Passed</span>
                <strong className="text-slate-900 font-semibold">{certificate.highestClassPassed}</strong>
              </div>
            )}
          </div>

          {/* CERTIFICATION STATEMENT */}
          <div className="space-y-2">
            {texts.achievementDetails && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs sm:text-sm">
                <span className="font-bold text-amber-950 block mb-0.5">Citation of Distinction:</span>
                <p
                  className={`text-slate-800 ${
                    isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-1 rounded cursor-text' : ''
                  }`}
                  contentEditable={isLiveEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateText('achievementDetails', e.currentTarget.textContent || '')}
                >
                  {texts.achievementDetails}
                </p>
              </div>
            )}

            <p>
              During his/her period of stay and academic pursuits in this institution, his/her moral character, conduct, and behavior have been{' '}
              <strong
                className={`text-slate-950 ${
                  isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 px-1 rounded cursor-text' : ''
                }`}
                contentEditable={isLiveEditMode}
                suppressContentEditableWarning
                onBlur={(e) => handleUpdateText('conductStatement', e.currentTarget.textContent || '')}
              >
                {texts.conductStatement}
              </strong>.
              {texts.customRemarks && (
                <span
                  className={isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-0.5 rounded cursor-text ml-1' : ' ml-1'}
                  contentEditable={isLiveEditMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateText('customRemarks', e.currentTarget.textContent || '')}
                >
                  {texts.customRemarks}
                </span>
              )}
            </p>

            <p
              className={isLiveEditMode ? 'outline-dashed outline-1 outline-amber-400 p-1 rounded cursor-text' : ''}
              contentEditable={isLiveEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateText('closingStatement', e.currentTarget.textContent || '')}
            >
              {texts.closingStatement}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. SIGNATURE & VERIFICATION SECURITY FOOTER                               */}
        {/* ========================================================================= */}
        <div
          className="mt-10 pt-4 border-t border-slate-900/20 relative z-10 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6 px-2 sm:px-6"
          style={{ fontFamily: fonts.footerFont }}
        >
          {/* QR Code Verification Box */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <QrCodeSvg
              value={`https://verify.edu.bd/cert/${certificate.verificationCode}|${certificate.certificateNumber}|EIIN:${instDetails.eiin}`}
              size={54}
            />
            <div className="text-[10px] text-slate-600">
              <span className="block font-bold text-slate-900">Official Digital Verification</span>
              <span className="font-mono text-[9px] text-slate-500">{certificate.verificationCode}</span>
              <span className="block text-[9px] text-emerald-700 font-semibold">Government Registered Standard</span>
            </div>
          </div>

          {/* Official Signatures Row */}
          {showSignatures ? (
            <div className="flex items-end justify-between sm:justify-end gap-6 sm:gap-12 w-full sm:w-auto text-center text-xs text-slate-800">
              {/* Signatory 1: Prepared By */}
              {signatories.sig1.enabled && (
                <div>
                  <div className="h-10 border-b border-slate-900/60 w-28 sm:w-32 mb-1 flex items-end justify-center pb-0.5">
                    {signatories.sig1.useDigital && signatories.sig1.signatureUrl ? (
                      <img
                        src={signatories.sig1.signatureUrl}
                        alt="Digital Signature"
                        className="max-h-9 max-w-28 object-contain mx-auto"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">Office Seal</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-950 block">{signatories.sig1.title}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{signatories.sig1.sub}</span>
                </div>
              )}

              {/* Signatory 2: Class In-charge */}
              {signatories.sig2.enabled && (
                <div>
                  <div className="h-10 border-b border-slate-900/60 w-28 sm:w-32 mb-1 flex items-end justify-center pb-0.5">
                    {signatories.sig2.useDigital && signatories.sig2.signatureUrl ? (
                      <img
                        src={signatories.sig2.signatureUrl}
                        alt="Digital Signature"
                        className="max-h-9 max-w-28 object-contain mx-auto"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">Class In-charge</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-950 block">{signatories.sig2.title}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{signatories.sig2.sub}</span>
                </div>
              )}

              {/* Signatory 3: Head of Institution / Principal */}
              {signatories.sig3.enabled && (
                <div>
                  <div className="h-10 border-b border-slate-900/60 w-32 sm:w-40 mb-1 flex items-end justify-center pb-0.5">
                    {signatories.sig3.useDigital && signatories.sig3.signatureUrl ? (
                      <img
                        src={signatories.sig3.signatureUrl}
                        alt="Principal Digital Signature"
                        className="max-h-9 max-w-36 object-contain mx-auto"
                      />
                    ) : (
                      <span className="text-[9px] text-slate-400 italic">Head of Institution</span>
                    )}
                  </div>
                  <span className="font-bold text-slate-950 block">{signatories.sig3.title}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{signatories.sig3.sub}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-right text-xs text-slate-500 font-serif">
              <span>{instDetails.principalTitle}</span>
              <div className="font-bold text-slate-900">{instDetails.name}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
