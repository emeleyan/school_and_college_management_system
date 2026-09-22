import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CertificateFontConfig,
  CertificateSignatoriesConfig,
  CERTIFICATE_FONT_OPTIONS,
  DEFAULT_CERTIFICATE_FONTS,
  FONT_PRESETS,
} from './certificateCustomizationTypes';
import { processDigitalSignature } from '../../utils/signatureProcessor';
import {
  Palette,
  Type,
  Image as ImageIcon,
  FileSignature,
  Save,
  CheckCircle2,
  RotateCw,
  X,
  Upload,
  Sparkles,
  SlidersHorizontal,
  Layers,
  RotateCcw,
  Check,
  ShieldCheck,
  Eye,
} from 'lucide-react';

interface MasterCertificateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const TEMPLATE_STYLES = [
  {
    id: 'classic_gold',
    name: 'Classic Ivory & Royal Gold',
    description: 'Traditional academic elegance with double gold borders and warm ivory background',
    borderClass: 'border-8 border-double border-amber-600/70',
    bgClass: 'bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20',
    accentColor: '#b45309',
  },
  {
    id: 'royal_navy',
    name: 'Royal Navy Executive',
    description: 'Prestigious institutional navy border with formal gold heraldic accents',
    borderClass: 'border-8 border-double border-blue-900/70',
    bgClass: 'bg-gradient-to-b from-blue-50/20 via-white to-slate-50/20',
    accentColor: '#1e3a8a',
  },
  {
    id: 'emerald_distinction',
    name: 'Emerald Distinction & Merit',
    description: 'Dignified emerald green border suitable for graduation and honors',
    borderClass: 'border-8 border-double border-emerald-700/60',
    bgClass: 'bg-gradient-to-b from-emerald-50/25 via-white to-emerald-50/15',
    accentColor: '#047857',
  },
  {
    id: 'crimson_prestigious',
    name: 'Prestigious Crimson Crest',
    description: 'Authoritative deep crimson borders for state certificates and supreme distinction',
    borderClass: 'border-8 border-double border-rose-800/70',
    bgClass: 'bg-gradient-to-b from-rose-50/20 via-white to-amber-50/15',
    accentColor: '#9f1239',
  },
  {
    id: 'minimalist_modern',
    name: 'Minimalist Clean Architectural',
    description: 'Subtle slate borders with crisp modern negative space',
    borderClass: 'border-2 border-slate-300',
    bgClass: 'bg-white',
    accentColor: '#0f172a',
  },
  {
    id: 'custom_letterhead',
    name: 'Custom Institutional Letterhead',
    description: 'Uses your uploaded school parchment paper or pre-printed stationery background',
    borderClass: 'border border-slate-200',
    bgClass: 'bg-white',
    accentColor: '#2563eb',
  },
];

export const MasterCertificateTemplateModal: React.FC<MasterCertificateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const { activeInstitute, language } = useApp();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'template' | 'fonts' | 'logo_watermark' | 'signatures'>(
    'template'
  );

  // 1. Template Style
  const [templateStyle, setTemplateStyle] = useState<string>(() => {
    return localStorage.getItem('cert_master_template_style') || 'classic_gold';
  });

  const [customTemplateBg, setCustomTemplateBg] = useState<string>(() => {
    return localStorage.getItem('cert_custom_template_bg') || '';
  });

  const [showBorder, setShowBorder] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_border');
    return val === null ? true : val === 'true';
  });

  const [showHeader, setShowHeader] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_header');
    return val === null ? true : val === 'true';
  });

  // 2. Fonts Configuration
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

  // 3. Logo & Watermark Settings
  const [showLogo, setShowLogo] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_logo');
    return val === null ? true : val === 'true';
  });

  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return localStorage.getItem('cert_custom_logo_url') || (activeInstitute?.logoUrl || '');
  });

  const [logoRotation, setLogoRotation] = useState<number>(() => {
    return Number(localStorage.getItem('cert_logo_rotation')) || 0;
  });

  const [logoSize, setLogoSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('cert_logo_size') as any) || 'md';
  });

  const [showWatermark, setShowWatermark] = useState<boolean>(() => {
    const val = localStorage.getItem('cert_show_watermark');
    return val === null ? true : val === 'true';
  });

  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(() => {
    return Number(localStorage.getItem('cert_watermark_opacity')) || 0.08;
  });

  const [watermarkSize, setWatermarkSize] = useState<number>(() => {
    return Number(localStorage.getItem('cert_watermark_size')) || 320;
  });

  const [watermarkGrayscale, setWatermarkGrayscale] = useState<boolean>(() => {
    return localStorage.getItem('cert_watermark_grayscale') !== 'false';
  });

  // 4. Digital Signatures Configuration
  const [signatories, setSignatories] = useState<CertificateSignatoriesConfig>(() => {
    const saved = localStorage.getItem('cert_signatories_config');
    const defaultHeadSig = activeInstitute?.signatureUrl || '';
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
            title: 'Checked By',
            sub: 'Convener / Examination Cell',
            ...(parsed.sig2 || {}),
          },
          sig3: {
            enabled: true,
            useDigital: !!defaultHeadSig,
            signatureUrl: defaultHeadSig,
            title: activeInstitute?.type === 'college' ? 'Principal' : 'Headmaster',
            sub: (activeInstitute?.name || 'MODEL HIGH SCHOOL & COLLEGE').toUpperCase(),
            ...(parsed.sig3 || {}),
          },
        };
      } catch (e) {
        // fallback
      }
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
        title: 'Checked By',
        sub: 'Convener / Examination Cell',
      },
      sig3: {
        enabled: true,
        useDigital: !!defaultHeadSig,
        signatureUrl: defaultHeadSig,
        title: activeInstitute?.type === 'college' ? 'Principal' : 'Headmaster',
        sub: (activeInstitute?.name || 'MODEL HIGH SCHOOL & COLLEGE').toUpperCase(),
      },
    };
  });

  // Processing state for signatures
  const [processingSigKey, setProcessingSigKey] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // File Inputs
  const bgInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sig1InputRef = useRef<HTMLInputElement>(null);
  const sig2InputRef = useRef<HTMLInputElement>(null);
  const sig3InputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Background Letterhead Upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setCustomTemplateBg(b64);
      setTemplateStyle('custom_letterhead');
    };
    reader.readAsDataURL(file);
  };

  // Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setCustomLogoUrl(b64);
    };
    reader.readAsDataURL(file);
  };

  // Smart Digital Signature Upload & Conversion
  const handleSignatureUpload = async (key: 'sig1' | 'sig2' | 'sig3', file: File) => {
    setProcessingSigKey(key);
    try {
      const processedPng = await processDigitalSignature(file, {
        maxWidth: 800,
        maxHeight: 400,
        crispnessBoost: 1.4,
        trimPadding: 8,
      });

      setSignatories((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          signatureUrl: processedPng,
          useDigital: true,
        },
      }));
    } catch (err) {
      console.error('Failed to process digital signature:', err);
    } finally {
      setProcessingSigKey(null);
    }
  };

  // SUBMIT & PERSIST TO ALL CERTIFICATES
  const handleSaveMasterTemplate = () => {
    localStorage.setItem('cert_master_template_style', templateStyle);
    localStorage.setItem('cert_custom_template_bg', customTemplateBg);
    localStorage.setItem('cert_show_border', String(showBorder));
    localStorage.setItem('cert_show_header', String(showHeader));

    localStorage.setItem('cert_default_fonts', JSON.stringify(fonts));

    localStorage.setItem('cert_show_logo', String(showLogo));
    localStorage.setItem('cert_custom_logo_url', customLogoUrl);
    localStorage.setItem('cert_logo_rotation', String(logoRotation));
    localStorage.setItem('cert_logo_size', logoSize);

    localStorage.setItem('cert_show_watermark', String(showWatermark));
    localStorage.setItem('cert_watermark_opacity', String(watermarkOpacity));
    localStorage.setItem('cert_watermark_size', String(watermarkSize));
    localStorage.setItem('cert_watermark_grayscale', String(watermarkGrayscale));

    localStorage.setItem('cert_signatories_config', JSON.stringify(signatories));

    setSavedSuccessMessage(
      isBn
        ? 'মাস্টার সার্টিফিকেট টেমপ্লেট ও ফন্ট ডিজাইন সফলভাবে সংরক্ষণ করা হয়েছে! সকল সনদপত্রে এটি কার্যকর হবে।'
        : 'Master Certificate Template & Typography successfully saved! All certificates will now uniformly use these settings.'
    );

    onSaved?.();

    setTimeout(() => {
      setSavedSuccessMessage(null);
      onClose();
    }, 1800);
  };

  const selectedTemplateObj =
    TEMPLATE_STYLES.find((t) => t.id === templateStyle) || TEMPLATE_STYLES[0];

  const instNameEn = (activeInstitute?.name || 'MODEL HIGH SCHOOL & COLLEGE').toUpperCase();
  const instMotto = activeInstitute?.motto || 'Knowledge • Integrity • Excellence';
  const instAddress = activeInstitute?.address || 'Education Board Area, Dhaka, Bangladesh';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={bgInputRef}
        onChange={handleBgUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={sig1InputRef}
        onChange={(e) => e.target.files?.[0] && handleSignatureUpload('sig1', e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={sig2InputRef}
        onChange={(e) => e.target.files?.[0] && handleSignatureUpload('sig2', e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={sig3InputRef}
        onChange={(e) => e.target.files?.[0] && handleSignatureUpload('sig3', e.target.files[0])}
        accept="image/*"
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isBn ? 'মাস্টার সার্টিফিকেট টেমপ্লেট ও ফন্ট ডিজাইন সেটিংস' : 'Master Certificate Template & Typography Studio'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono">
                  Global Preset
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'এখানে ১টি ডিজাইন ও ফন্ট টাইপ সিলেক্ট করে সাবমিট করলে সকল সার্টিফিকেট একই ফরম্যাটে কার্যকর হবে'
                  : 'Configure the master design and section-wise fonts here. Once saved, all certificates will adopt this template.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {savedSuccessMessage && (
          <div className="p-3.5 bg-emerald-600 text-white flex items-center justify-center gap-2 text-xs font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'template'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Template Style</span>
          </button>

          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'fonts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>2. Typography &amp; Fonts</span>
          </button>

          <button
            onClick={() => setActiveTab('logo_watermark')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'logo_watermark'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Logo &amp; Watermark</span>
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'signatures'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>4. Digital Signatures</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: TEMPLATE STYLE SELECTION                                           */}
          {/* ========================================================================= */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Institutional Certificate Frame &amp; Color Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every issued certificate across all 28 categories will inherit this default visual styling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {TEMPLATE_STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setTemplateStyle(style.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      templateStyle === style.id
                        ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-850'
                    }`}
                  >
                    {templateStyle === style.id && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div>
                      {/* Mini Preview Box */}
                      <div
                        className={`h-16 rounded-lg mb-3 ${style.borderClass} ${style.bgClass} flex items-center justify-center p-2 relative overflow-hidden`}
                      >
                        <div className="text-[9px] font-bold tracking-widest text-slate-800 font-serif uppercase">
                          CERTIFICATE
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {style.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {style.description}
                      </p>
                    </div>

                    {style.id === 'custom_letterhead' && (
                      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            bgInputRef.current?.click();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{customTemplateBg ? 'Change Letterhead' : 'Upload Parchment'}</span>
                        </button>
                        {customTemplateBg && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block text-center mt-1">
                            Letterhead active
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Layout switches */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Include Ornate Double Border
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Displays the royal decorative frame around the certificate edge
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Full Institutional Header &amp; Contact Bar
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prints EIIN, Board, School Code, and Government Affiliation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showHeader}
                    onChange={(e) => setShowHeader(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TYPOGRAPHY & FONTS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'fonts' && (
            <div className="space-y-6">
              {/* Presets Row */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  One-Click Recommended Font Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FONT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setFonts(p.fonts)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-blue-500 text-left transition-all cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-2">
                        {p.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section-wise Font Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                {/* 1. Header / Institute Font */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    1. Institute Name &amp; Letterhead Font
                  </label>
                  <select
                    value={fonts.headerFont}
                    onChange={(e) => setFonts({ ...fonts, headerFont: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="text-xs text-slate-700 dark:text-slate-200 font-bold p-2 bg-slate-100 dark:bg-slate-800 rounded-lg truncate"
                    style={{ fontFamily: fonts.headerFont }}
                  >
                    {instNameEn}
                  </p>
                </div>

                {/* 2. Certificate Title Font */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    2. Certificate Title Font
                  </label>
                  <select
                    value={fonts.titleFont}
                    onChange={(e) => setFonts({ ...fonts, titleFont: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="text-xs text-slate-700 dark:text-slate-200 font-bold p-2 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase tracking-wider truncate"
                    style={{ fontFamily: fonts.titleFont }}
                  >
                    CERTIFICATE OF MERIT &amp; EXCELLENCE
                  </p>
                </div>

                {/* 3. Student Name Font (Always All-Caps in certificate) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>3. Student Name Font</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      Names are ALWAYS in CAPITAL LETTERS
                    </span>
                  </label>
                  <select
                    value={fonts.studentNameFont}
                    onChange={(e) => setFonts({ ...fonts, studentNameFont: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="text-sm text-blue-900 dark:text-blue-200 font-bold p-2 bg-slate-100 dark:bg-slate-800 rounded-lg uppercase tracking-wide truncate"
                    style={{ fontFamily: fonts.studentNameFont }}
                  >
                    MOHAMMAD TANVIR AHMED
                  </p>
                </div>

                {/* 4. Body & Particulars Font */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    4. Body / Particulars Paragraph Font
                  </label>
                  <select
                    value={fonts.bodyFont}
                    onChange={(e) => setFonts({ ...fonts, bodyFont: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="text-xs text-slate-700 dark:text-slate-300 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg leading-relaxed line-clamp-2"
                    style={{ fontFamily: fonts.bodyFont }}
                  >
                    This is to certify that the student has demonstrated exemplary academic conduct, character, and scholastic standing.
                  </p>
                </div>

                {/* 5. Signatories Font */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    5. Signatories &amp; Subtitle Font
                  </label>
                  <select
                    value={fonts.footerFont}
                    onChange={(e) => setFonts({ ...fonts, footerFont: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    {CERTIFICATE_FONT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LOGO & WATERMARK                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'logo_watermark' && (
            <div className="space-y-6">
              {/* Institution Logo Section */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Institution Logo &amp; Alignment
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Upload or straighten the school crest if it appears tilted.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <span>Show Logo</span>
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Logo Preview with Live Rotation */}
                  <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {customLogoUrl ? (
                      <img
                        src={customLogoUrl}
                        alt="Logo"
                        style={{ transform: `rotate(${logoRotation}deg)` }}
                        className="max-w-full max-h-full object-contain transition-transform"
                      />
                    ) : (
                      <div className="text-slate-400 text-[10px] font-bold text-center">NO LOGO</div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New Logo</span>
                      </button>
                      {logoRotation !== 0 && (
                        <button
                          type="button"
                          onClick={() => setLogoRotation(0)}
                          className="py-2 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl border border-slate-300 cursor-pointer"
                          title="Reset Rotation to 0 deg"
                        >
                          Reset Angle
                        </button>
                      )}
                    </div>

                    {/* Rotation slider to fix tilted logo */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <RotateCw className="w-3 h-3 text-blue-600" />
                          <span>Straighten / Rotate Angle:</span>
                        </span>
                        <span className="font-mono font-bold text-blue-600">{logoRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={logoRotation}
                        onChange={(e) => setLogoRotation(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    {/* Logo Size */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-semibold">Size:</span>
                      {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLogoSize(s)}
                          className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold cursor-pointer ${
                            logoSize === s
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 text-slate-600'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark Controls */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Center Watermark Emblem
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Uses the institution logo as a background security watermark behind the certificate text.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <span>Enable Watermark</span>
                    <input
                      type="checkbox"
                      checked={showWatermark}
                      onChange={(e) => setShowWatermark(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                  </label>
                </div>

                {showWatermark && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>Watermark Opacity:</span>
                        <span className="font-mono font-bold text-blue-600">
                          {Math.round(watermarkOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.02"
                        max="0.30"
                        step="0.01"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>Watermark Diameter:</span>
                        <span className="font-mono font-bold text-blue-600">{watermarkSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="160"
                        max="500"
                        step="10"
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center justify-between cursor-pointer pt-1">
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        Monochrome / Grayscale Security Watermark
                      </span>
                      <input
                        type="checkbox"
                        checked={watermarkGrayscale}
                        onChange={(e) => setWatermarkGrayscale(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DIGITAL SIGNATURES CONFIGURATION                                   */}
          {/* ========================================================================= */}
          {activeTab === 'signatures' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Automated Signature Engine:</strong> When you upload any signature picture, the system automatically removes paper backgrounds, normalizes ink into crisp deep black, and sharpens stroke edges. You can also uncheck "Use Digital Signature" anytime to leave blank lines for physical pen signing.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SIGNATORY 1 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Signatory 1 (Left)
                    </span>
                    <input
                      type="checkbox"
                      checked={signatories.sig1.enabled}
                      onChange={(e) =>
                        setSignatories({
                          ...signatories,
                          sig1: { ...signatories.sig1, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>

                  <input
                    type="text"
                    value={signatories.sig1.title}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig1: { ...signatories.sig1, title: e.target.value },
                      })
                    }
                    placeholder="Prepared By"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                  <input
                    type="text"
                    value={signatories.sig1.sub}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig1: { ...signatories.sig1, sub: e.target.value },
                      })
                    }
                    placeholder="Office Registrar"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />

                  {/* Signature Box */}
                  <div className="h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    {processingSigKey === 'sig1' ? (
                      <span className="text-[10px] font-bold text-blue-600 animate-pulse">
                        Converting to Digital Signature...
                      </span>
                    ) : signatories.sig1.signatureUrl && signatories.sig1.useDigital ? (
                      <img
                        src={signatories.sig1.signatureUrl}
                        alt="Signature 1"
                        className="max-h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        [Manual Pen Signing Line]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sig1InputRef.current?.click()}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      {signatories.sig1.signatureUrl ? 'Change Signature' : 'Upload Signature'}
                    </button>
                    {signatories.sig1.signatureUrl && (
                      <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={signatories.sig1.useDigital}
                          onChange={(e) =>
                            setSignatories({
                              ...signatories,
                              sig1: { ...signatories.sig1, useDigital: e.target.checked },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span>Digital</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* SIGNATORY 2 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Signatory 2 (Center)
                    </span>
                    <input
                      type="checkbox"
                      checked={signatories.sig2.enabled}
                      onChange={(e) =>
                        setSignatories({
                          ...signatories,
                          sig2: { ...signatories.sig2, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>

                  <input
                    type="text"
                    value={signatories.sig2.title}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig2: { ...signatories.sig2, title: e.target.value },
                      })
                    }
                    placeholder="Checked By"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                  <input
                    type="text"
                    value={signatories.sig2.sub}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig2: { ...signatories.sig2, sub: e.target.value },
                      })
                    }
                    placeholder="Convener / Examination Cell"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />

                  {/* Signature Box */}
                  <div className="h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    {processingSigKey === 'sig2' ? (
                      <span className="text-[10px] font-bold text-blue-600 animate-pulse">
                        Converting to Digital Signature...
                      </span>
                    ) : signatories.sig2.signatureUrl && signatories.sig2.useDigital ? (
                      <img
                        src={signatories.sig2.signatureUrl}
                        alt="Signature 2"
                        className="max-h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        [Manual Pen Signing Line]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sig2InputRef.current?.click()}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      {signatories.sig2.signatureUrl ? 'Change Signature' : 'Upload Signature'}
                    </button>
                    {signatories.sig2.signatureUrl && (
                      <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={signatories.sig2.useDigital}
                          onChange={(e) =>
                            setSignatories({
                              ...signatories,
                              sig2: { ...signatories.sig2, useDigital: e.target.checked },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span>Digital</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* SIGNATORY 3 */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Signatory 3 (Right)
                    </span>
                    <input
                      type="checkbox"
                      checked={signatories.sig3.enabled}
                      onChange={(e) =>
                        setSignatories({
                          ...signatories,
                          sig3: { ...signatories.sig3, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>

                  <input
                    type="text"
                    value={signatories.sig3.title}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig3: { ...signatories.sig3, title: e.target.value },
                      })
                    }
                    placeholder="Principal"
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                  <input
                    type="text"
                    value={signatories.sig3.sub}
                    onChange={(e) =>
                      setSignatories({
                        ...signatories,
                        sig3: { ...signatories.sig3, sub: e.target.value },
                      })
                    }
                    placeholder={instNameEn}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />

                  {/* Signature Box */}
                  <div className="h-16 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    {processingSigKey === 'sig3' ? (
                      <span className="text-[10px] font-bold text-blue-600 animate-pulse">
                        Converting to Digital Signature...
                      </span>
                    ) : signatories.sig3.signatureUrl && signatories.sig3.useDigital ? (
                      <img
                        src={signatories.sig3.signatureUrl}
                        alt="Signature 3"
                        className="max-h-full object-contain filter contrast-125"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono italic">
                        [Manual Pen Signing Line]
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => sig3InputRef.current?.click()}
                      className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      {signatories.sig3.signatureUrl ? 'Change Signature' : 'Upload Signature'}
                    </button>
                    {signatories.sig3.signatureUrl && (
                      <label className="flex items-center gap-1 text-[10px] font-bold cursor-pointer text-slate-600">
                        <input
                          type="checkbox"
                          checked={signatories.sig3.useDigital}
                          onChange={(e) =>
                            setSignatories({
                              ...signatories,
                              sig3: { ...signatories.sig3, useDigital: e.target.checked },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-blue-600"
                        />
                        <span>Digital</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* LIVE DEMO PREVIEW CANVAS                                                  */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Certificate Master Preview</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Showing how all certificates will render with your chosen template &amp; fonts
              </span>
            </div>

            <div
              className={`p-6 sm:p-8 rounded-2xl relative overflow-hidden transition-all shadow-md text-slate-900 ${
                showBorder ? selectedTemplateObj.borderClass : 'border border-slate-200'
              } ${selectedTemplateObj.bgClass}`}
            >
              {/* Custom background if present */}
              {customTemplateBg && templateStyle === 'custom_letterhead' && (
                <img
                  src={customTemplateBg}
                  alt="Custom Template"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 z-0"
                />
              )}

              {/* Watermark in Preview */}
              {showWatermark && customLogoUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <img
                    src={customLogoUrl}
                    alt="Watermark"
                    style={{
                      width: `${watermarkSize * 0.55}px`,
                      opacity: watermarkOpacity,
                      filter: watermarkGrayscale ? 'grayscale(100%)' : 'none',
                      transform: `rotate(${logoRotation}deg)`,
                    }}
                    className="object-contain"
                  />
                </div>
              )}

              {/* Certificate Header */}
              <div className="relative z-10 text-center space-y-2">
                {showLogo && customLogoUrl && (
                  <div className="flex justify-center mb-1">
                    <img
                      src={customLogoUrl}
                      alt="Logo"
                      style={{ transform: `rotate(${logoRotation}deg)` }}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}

                {showHeader && (
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold tracking-tight uppercase"
                      style={{ fontFamily: fonts.headerFont }}
                    >
                      {instNameEn}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                      {instMotto} • {instAddress}
                    </p>
                  </div>
                )}

                <div className="py-2">
                  <div
                    className="text-sm sm:text-base font-black uppercase tracking-widest text-slate-900 border-b border-t border-slate-300 py-1 inline-block px-4"
                    style={{ fontFamily: fonts.titleFont }}
                  >
                    CERTIFICATE OF MERIT &amp; EXCELLENCE
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 font-serif italic">
                  This is to proudly certify that
                </p>

                {/* Student Name: ALWAYS CAPITAL LETTERS */}
                <div
                  className="text-base sm:text-lg font-black uppercase tracking-wide text-blue-950 my-1"
                  style={{ fontFamily: fonts.studentNameFont }}
                >
                  MOHAMMAD TANVIR AHMED
                </div>

                <p
                  className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed"
                  style={{ fontFamily: fonts.bodyFont }}
                >
                  Son of <strong>MOHAMMAD RAFIQUL ISLAM</strong> and <strong>NASIMA BEGUM</strong>, Roll No. 101 of Class 10 (Science), has achieved distinction in the Annual Academic Evaluation.
                </p>

                {/* Signatories Row */}
                <div className="pt-6 grid grid-cols-3 gap-4 text-center mt-3 border-t border-slate-200">
                  {signatories.sig1.enabled && (
                    <div className="flex flex-col items-center justify-end">
                      <div className="h-8 flex items-center justify-center">
                        {signatories.sig1.useDigital && signatories.sig1.signatureUrl ? (
                          <img
                            src={signatories.sig1.signatureUrl}
                            alt="Sig 1"
                            className="max-h-7 object-contain"
                          />
                        ) : (
                          <div className="w-16 border-b border-slate-400" />
                        )}
                      </div>
                      <p
                        className="text-[10px] font-bold text-slate-800"
                        style={{ fontFamily: fonts.footerFont }}
                      >
                        {signatories.sig1.title}
                      </p>
                      <p className="text-[8.5px] text-slate-500">{signatories.sig1.sub}</p>
                    </div>
                  )}

                  {signatories.sig2.enabled && (
                    <div className="flex flex-col items-center justify-end">
                      <div className="h-8 flex items-center justify-center">
                        {signatories.sig2.useDigital && signatories.sig2.signatureUrl ? (
                          <img
                            src={signatories.sig2.signatureUrl}
                            alt="Sig 2"
                            className="max-h-7 object-contain"
                          />
                        ) : (
                          <div className="w-16 border-b border-slate-400" />
                        )}
                      </div>
                      <p
                        className="text-[10px] font-bold text-slate-800"
                        style={{ fontFamily: fonts.footerFont }}
                      >
                        {signatories.sig2.title}
                      </p>
                      <p className="text-[8.5px] text-slate-500">{signatories.sig2.sub}</p>
                    </div>
                  )}

                  {signatories.sig3.enabled && (
                    <div className="flex flex-col items-center justify-end">
                      <div className="h-8 flex items-center justify-center">
                        {signatories.sig3.useDigital && signatories.sig3.signatureUrl ? (
                          <img
                            src={signatories.sig3.signatureUrl}
                            alt="Sig 3"
                            className="max-h-7 object-contain"
                          />
                        ) : (
                          <div className="w-16 border-b border-slate-400" />
                        )}
                      </div>
                      <p
                        className="text-[10px] font-bold text-slate-800"
                        style={{ fontFamily: fonts.footerFont }}
                      >
                        {signatories.sig3.title}
                      </p>
                      <p className="text-[8.5px] text-slate-500">{signatories.sig3.sub}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER WITH SUBMIT ACTION */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {isBn
                ? 'সাবমিট বাটনে ক্লিক করলেই এই টেমপ্লেট ও ফন্ট সমস্ত সনদে স্বয়ংক্রিয়ভাবে কার্যকর হবে'
                : 'Saving will apply this template, watermark, and fonts to all student certificates.'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveMasterTemplate}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isBn ? 'সংরক্ষণ ও সকল সার্টিফিকেটে কার্যকর করুন' : 'Save & Apply to All Certificates'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
