import React from 'react';
import { Institute, IdCardOrientation, IdCardTheme } from '../../types';
import { BarcodeSvg, QrCodeSvg } from '../../utils/qrBarcodeUtils';
import { Droplet, Phone, Calendar, Shield, Award, Sparkles } from 'lucide-react';

export interface CardData {
  id: string;
  type: 'student' | 'teacher';
  name: string;
  bengaliName?: string;
  roleOrClass: string;
  rollOrIndex?: string;
  idNumber: string;
  bloodGroup?: string;
  phone?: string;
  validUntil: string;
  photoUrl?: string;
  qrPayload?: string;
  barcodePayload?: string;
}

export interface IdCardCustomConfig {
  showLogo?: boolean;
  showHeader?: boolean;
  showBengaliName?: boolean;
  showBloodGroup?: boolean;
  showQrCode?: boolean;
  showBarcode?: boolean;
  showPhone?: boolean;
  showValidUntil?: boolean;
  showSignature?: boolean;
  showWatermark?: boolean;
  showCardTitle?: boolean;
  cardTitleText?: string;
  customRules?: string[];
  customFrontBg?: string;
  customBackBg?: string;
}

interface SingleIdCardViewProps {
  card: CardData;
  institute?: Institute | null;
  orientation?: IdCardOrientation;
  theme?: IdCardTheme;
  showBack?: boolean;
  config?: IdCardCustomConfig;
}

export const SingleIdCardView: React.FC<SingleIdCardViewProps> = ({
  card,
  institute,
  orientation = 'portrait',
  theme = 'classic_blue',
  showBack = false,
  config = {} as IdCardCustomConfig,
}) => {
  // Config defaults
  const {
    showLogo = true,
    showHeader = true,
    showBengaliName = true,
    showBloodGroup = true,
    showQrCode = true,
    showBarcode = true,
    showPhone = true,
    showValidUntil = true,
    showSignature = true,
    showWatermark = false,
    showCardTitle = true,
    cardTitleText = 'STUDENT IDENTITY CARD',
    customRules,
    customFrontBg,
    customBackBg,
  } = config;

  // Theme color definitions
  const getThemeStyles = () => {
    switch (theme) {
      case 'emerald_green':
        return {
          headerBg: 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900',
          accentBorder: 'border-emerald-600',
          roleBadge: 'bg-emerald-100 text-emerald-800',
          footerBg: 'bg-emerald-800 text-white',
        };
      case 'royal_maroon':
        return {
          headerBg: 'bg-gradient-to-r from-rose-900 via-rose-800 to-amber-950',
          accentBorder: 'border-rose-700',
          roleBadge: 'bg-rose-100 text-rose-900',
          footerBg: 'bg-rose-900 text-white',
        };
      case 'modern_slate':
        return {
          headerBg: 'bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900',
          accentBorder: 'border-slate-700',
          roleBadge: 'bg-slate-200 text-slate-900',
          footerBg: 'bg-slate-900 text-white',
        };
      case 'classic_blue':
      default:
        return {
          headerBg: 'bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950',
          accentBorder: 'border-blue-600',
          roleBadge: 'bg-blue-100 text-blue-900',
          footerBg: 'bg-blue-900 text-white',
        };
    }
  };

  const themeStyle = getThemeStyles();
  const qrData =
    card.qrPayload ||
    `ID:${card.idNumber}|${card.name}|${card.roleOrClass}|EIIN:${institute?.eiin || '134215'}`;
  const barcodeData = card.barcodePayload || card.idNumber.replace(/[^A-Z0-9]/gi, '');

  const rules = customRules && customRules.length > 0
    ? customRules
    : [
        'এই কার্ডটি প্রতিষ্ঠানের নিজস্ব সম্পত্তি। কার্ডটি হস্তান্তরযোগ্য নয়।',
        'প্রতিষ্ঠান প্রাঙ্গণে সর্বদা কার্ডটি প্রদর্শন বাধ্যতামূলক।',
        'কার্ডটি হারিয়ে গেলে তাৎক্ষণিকভাবে প্রশাসনকে অবহিত করতে হবে।',
      ];

  // ==========================================
  // PORTRAIT CARD FORMAT
  // ==========================================
  if (orientation === 'portrait') {
    if (showBack) {
      // BACK SIDE (PORTRAIT)
      return (
        <div
          className="w-[240px] h-[360px] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-slate-400 relative bg-cover bg-center"
          style={customBackBg ? { backgroundImage: `url(${customBackBg})` } : undefined}
        >
          {/* Subtle Watermark */}
          {showWatermark && institute?.logoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
              <img src={institute.logoUrl} alt="Watermark" className="w-36 h-36 object-contain" />
            </div>
          )}

          {/* Top Bar */}
          <div className={`${themeStyle.headerBg} text-white px-3 py-2 text-center relative z-10`}>
            <div className="text-[10px] font-bold tracking-wider uppercase">
              Important Instructions / নির্দেশনা
            </div>
          </div>

          {/* Rules & Terms */}
          <div className="p-3 text-[9px] text-slate-700 space-y-2 flex-1 relative z-10">
            <div className="p-2 bg-slate-50/90 rounded-md border border-slate-200 text-slate-600 leading-tight">
              <p className="font-semibold text-slate-900 mb-1">কার্ড ব্যবহার সংক্রান্ত নিয়মাবলী:</p>
              <ul className="list-disc pl-3 space-y-1">
                {rules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="text-center pt-1">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 block">
                If found, please return to:
              </span>
              <p className="font-bold text-slate-800 text-[9.5px]">
                {institute?.name || 'Administrative Office'}
              </p>
              <p className="text-[8.5px] text-slate-500">
                {institute?.address || 'Main Campus, Bangladesh'}
              </p>
              <p className="text-[8.5px] text-slate-600 font-mono mt-0.5">
                EIIN: {institute?.eiin || '134215'} • Tel: {institute?.phone || '01700-000000'}
              </p>
            </div>
          </div>

          {/* Principal Signature & Barcode Bottom */}
          <div className="p-3 pt-0 text-center border-t border-slate-100 flex flex-col items-center relative z-10">
            <div className="flex items-end justify-between w-full px-2 mb-1">
              <div className="text-left">
                <span className="text-[7.5px] text-slate-400 block">Card No</span>
                <span className="font-mono text-[8.5px] font-bold text-slate-800">{card.idNumber}</span>
              </div>
              {showSignature && (
                <div className="text-center">
                  {institute?.signatureUrl ? (
                    <img
                      src={institute.signatureUrl}
                      alt="Head Signature"
                      className="h-6 max-w-[64px] object-contain mx-auto"
                    />
                  ) : (
                    <div className="h-6 border-b border-slate-800 w-16 mb-0.5" />
                  )}
                  <span className="text-[7.5px] font-bold text-slate-800 block">
                    {institute?.headTitle || 'Principal'}
                  </span>
                </div>
              )}
            </div>

            {showBarcode && (
              <BarcodeSvg value={barcodeData} width={180} height={32} showText={true} />
            )}
          </div>
        </div>
      );
    }

    // FRONT SIDE (PORTRAIT)
    return (
      <div
        className="w-[240px] h-[360px] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-slate-400 relative bg-cover bg-center"
        style={customFrontBg ? { backgroundImage: `url(${customFrontBg})` } : undefined}
      >
        {/* Subtle Watermark */}
        {showWatermark && institute?.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
            <img src={institute.logoUrl} alt="Watermark" className="w-36 h-36 object-contain" />
          </div>
        )}

        {/* HEADER */}
        {showHeader && (
          <div
            className={`${themeStyle.headerBg} text-white px-3 py-2 text-center relative z-10 flex items-center justify-center gap-2`}
          >
            {showLogo && institute?.logoUrl && (
              <img
                src={institute.logoUrl}
                alt="Logo"
                className="w-7 h-7 rounded-md object-contain bg-white/90 p-0.5 shrink-0"
              />
            )}
            <div className="overflow-hidden">
              <div className="text-[8px] font-medium tracking-widest text-white/80 uppercase">
                {institute?.bengaliName ? 'গণপ্রজাতন্ত্রী বাংলাদেশ' : 'Institution'}
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-tight leading-tight line-clamp-1">
                {institute?.name || 'MODEL HIGH SCHOOL'}
              </h2>
              {showBengaliName && institute?.bengaliName && (
                <p className="text-[9px] font-serif font-bold text-amber-200 line-clamp-1">
                  {institute.bengaliName}
                </p>
              )}
              <div className="text-[7.5px] text-white/80 tracking-wider">
                EIIN: {institute?.eiin || '134215'}
              </div>
            </div>
          </div>
        )}

        {/* PHOTO & BASIC INFO */}
        <div className="px-3 py-2 flex flex-col items-center text-center flex-1 justify-center -mt-1 relative z-10">
          {showCardTitle && (
            <div className="mb-1">
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                {cardTitleText}
              </span>
            </div>
          )}

          {/* Photo Frame */}
          <div className="relative mb-2">
            <div className="w-20 h-24 rounded-lg bg-slate-100 border-2 border-slate-300 overflow-hidden shadow-xs flex items-center justify-center">
              {card.photoUrl ? (
                <img
                  src={card.photoUrl}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-base">
                    {(card.name || 'I').charAt(0)}
                  </div>
                  <span className="text-[8px] mt-1 block">PHOTO</span>
                </div>
              )}
            </div>

            {/* Blood group floating badge */}
            {showBloodGroup && card.bloodGroup && (
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8.5px] font-black shadow-xs flex items-center gap-0.5">
                <Droplet className="w-2.5 h-2.5 fill-current" />
                {card.bloodGroup}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="text-xs font-black text-slate-900 leading-tight">
            {card.name}
          </h3>
          {showBengaliName && card.bengaliName && (
            <p className="text-[10px] font-serif font-semibold text-slate-600">
              {card.bengaliName}
            </p>
          )}

          {/* Role / Class Badge */}
          <div className="mt-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${themeStyle.roleBadge}`}
            >
              {card.roleOrClass}
            </span>
          </div>

          {/* Details Grid */}
          <div className="w-full mt-2 grid grid-cols-2 gap-1 text-[8.5px] text-left bg-slate-50/90 p-1.5 rounded-md border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[7.5px]">
                {card.type === 'student' ? 'ROLL NO' : 'ID / INDEX'}
              </span>
              <strong className="text-slate-900 font-bold font-mono">
                {card.rollOrIndex || 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[7.5px]">CARD ID</span>
              <strong className="text-slate-900 font-bold font-mono">
                {card.idNumber}
              </strong>
            </div>
            {showPhone && card.phone && (
              <div className="col-span-2 flex items-center gap-1 text-slate-700">
                <Phone className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-mono text-[8px]">{card.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM QR & FOOTER */}
        <div className="px-3 pb-2 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            {showQrCode ? (
              <QrCodeSvg value={qrData} size={36} />
            ) : (
              <div className="w-9 h-9 border border-dashed border-slate-300 rounded flex items-center justify-center text-[7px] text-slate-400">
                ID
              </div>
            )}
            <div className="text-[7.5px] text-slate-500 text-left">
              <span className="block font-bold text-slate-800">Scan to Verify</span>
              {showValidUntil && <span>Valid: {card.validUntil}</span>}
            </div>
          </div>
          {showSignature && (
            <div className="text-right">
              {institute?.signatureUrl ? (
                <img
                  src={institute.signatureUrl}
                  alt="Head Signature"
                  className="h-5 max-w-[50px] object-contain ml-auto"
                />
              ) : (
                <div className="h-5 border-b border-slate-600 w-14 mb-0.5 ml-auto" />
              )}
              <span className="text-[7.5px] font-bold text-slate-700 block">Authority</span>
            </div>
          )}
        </div>

        {/* Color bar bottom accent */}
        <div className={`h-1.5 w-full ${themeStyle.footerBg}`} />
      </div>
    );
  }

  // ==========================================
  // LANDSCAPE CARD FORMAT (86mm x 54mm equivalent)
  // ==========================================
  if (showBack) {
    // BACK SIDE (LANDSCAPE)
    return (
      <div
        className="w-[360px] h-[225px] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-slate-400 relative bg-cover bg-center"
        style={customBackBg ? { backgroundImage: `url(${customBackBg})` } : undefined}
      >
        {showWatermark && institute?.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
            <img src={institute.logoUrl} alt="Watermark" className="w-36 h-36 object-contain" />
          </div>
        )}

        <div
          className={`${themeStyle.headerBg} text-white px-4 py-1.5 flex justify-between items-center text-[9px] font-bold tracking-wider relative z-10`}
        >
          <span>IMPORTANT NOTICE / জরুরি নির্দেশনা</span>
          <span className="font-mono text-[8px]">ID: {card.idNumber}</span>
        </div>

        <div className="p-3 text-[9px] text-slate-700 flex-1 flex flex-col justify-between relative z-10">
          <div className="p-2 bg-slate-50/90 rounded-lg border border-slate-200 text-slate-600 text-[8.5px] leading-relaxed">
            <p className="font-bold text-slate-900 mb-0.5">নিয়মাবলী ও শর্তসমূহ:</p>
            {rules.map((r, i) => (
              <p key={i}>
                {i + 1}. {r}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[8px] text-slate-600">
              <span className="font-bold block text-slate-900">{institute?.name}</span>
              <span>{institute?.address || 'Bangladesh'} • EIIN: {institute?.eiin || '134215'}</span>
            </div>
            <div className="flex items-center gap-3">
              {showSignature && institute?.signatureUrl && (
                <div className="text-center">
                  <img
                    src={institute.signatureUrl}
                    alt="Head Signature"
                    className="h-5 max-w-[55px] object-contain mx-auto"
                  />
                  <span className="text-[7px] font-bold text-slate-700 block">
                    {institute?.headTitle || 'Principal'}
                  </span>
                </div>
              )}
              {showBarcode && <BarcodeSvg value={barcodeData} width={110} height={26} showText={false} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FRONT SIDE (LANDSCAPE)
  return (
    <div
      className="w-[360px] h-[225px] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-slate-400 relative bg-cover bg-center"
      style={customFrontBg ? { backgroundImage: `url(${customFrontBg})` } : undefined}
    >
      {showWatermark && institute?.logoUrl && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
          <img src={institute.logoUrl} alt="Watermark" className="w-36 h-36 object-contain" />
        </div>
      )}

      {/* Top Header */}
      {showHeader && (
        <div className={`${themeStyle.headerBg} text-white px-4 py-2 flex items-center justify-between relative z-10`}>
          <div className="flex items-center gap-2">
            {showLogo && institute?.logoUrl && (
              <img
                src={institute.logoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-md object-contain bg-white/90 p-0.5 shrink-0"
              />
            )}
            <div>
              <h2 className="text-[12px] font-black uppercase tracking-tight leading-none">
                {institute?.name || 'MODEL HIGH SCHOOL & COLLEGE'}
              </h2>
              {showBengaliName && institute?.bengaliName && (
                <p className="text-[9.5px] font-serif font-bold text-amber-200 leading-tight">
                  {institute.bengaliName}
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-[8px] text-white/90">
            <span className="block font-bold">EIIN: {institute?.eiin || '134215'}</span>
            <span>ESTD: {institute?.establishedYear || '1998'}</span>
          </div>
        </div>
      )}

      {/* Middle Body */}
      <div className="p-3 flex items-center gap-3.5 flex-1 relative z-10">
        {/* Photo with Blood Group Badge */}
        <div className="relative shrink-0">
          <div className="w-18 h-22 rounded-lg bg-slate-100 border-2 border-slate-300 overflow-hidden shadow-xs flex items-center justify-center">
            {card.photoUrl ? (
              <img src={card.photoUrl} alt={card.name} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-slate-400">
                <div className="w-8 h-8 mx-auto rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                  {(card.name || 'I').charAt(0)}
                </div>
                <span className="text-[7.5px] mt-1 block">PHOTO</span>
              </div>
            )}
          </div>
          {showBloodGroup && card.bloodGroup && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-bold shadow-xs">
              {card.bloodGroup}
            </span>
          )}
        </div>

        {/* Identity Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 leading-tight truncate">
              {card.name}
            </h3>
            <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold ${themeStyle.roleBadge}`}>
              {card.roleOrClass}
            </span>
          </div>
          {showBengaliName && card.bengaliName && (
            <p className="text-[10px] font-serif font-semibold text-slate-600 truncate -mt-0.5">
              {card.bengaliName}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] pt-1">
            <div>
              <span className="text-slate-400 block text-[7.5px]">
                {card.type === 'student' ? 'ROLL NO' : 'ID / INDEX'}
              </span>
              <strong className="text-slate-900 font-mono font-bold">
                {card.rollOrIndex || 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[7.5px]">STUDENT ID</span>
              <strong className="text-slate-900 font-mono font-bold">{card.idNumber}</strong>
            </div>
            {showPhone && card.phone && (
              <div className="col-span-2 flex items-center gap-1 text-slate-700">
                <Phone className="w-2.5 h-2.5 text-slate-400" />
                <span className="font-mono text-[8px]">{card.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* QR Code / Barcode right box */}
        <div className="flex flex-col items-center justify-center shrink-0 pl-1 border-l border-slate-100">
          {showQrCode && <QrCodeSvg value={qrData} size={42} />}
          {showValidUntil && (
            <span className="text-[7.5px] text-slate-500 mt-1 font-mono">
              Exp: {card.validUntil}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Color Accent */}
      <div className={`h-1.5 w-full ${themeStyle.footerBg}`} />
    </div>
  );
};
