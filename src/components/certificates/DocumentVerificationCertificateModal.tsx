import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Calendar,
  Clock,
  Building2,
  Award,
  Stamp,
  ExternalLink,
  Search,
  Hash,
  QrCode,
  FileText
} from 'lucide-react';
import { CertificateRecord, Institute } from '../../types';
import { getCertificateDefinition } from './certificateDefinitions';
import { QrCodeSvg, BarcodeSvg } from '../../utils/qrBarcodeUtils';

interface DocumentVerificationCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'verified' | 'unverified';
  record?: CertificateRecord | null;
  queriedNumberOrCode?: string;
  queriedPayload?: string;
  institute?: Institute | null;
}

export const DocumentVerificationCertificateModal: React.FC<DocumentVerificationCertificateModalProps> = ({
  isOpen,
  onClose,
  status,
  record,
  queriedNumberOrCode = '',
  queriedPayload = '',
  institute,
}) => {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Institute Fallbacks
  const instName = institute?.name || 'Model High School & College';
  const instEiin = institute?.eiin || '134215';
  const instCode = institute?.code || (institute as any)?.schoolCode || 'SC-1082';
  const instAddress = institute?.address || 'Education Board Area, Dhaka, Bangladesh';
  const instLogo = institute?.logoUrl || '';

  // Verification Timestamps
  const verificationTime = new Date();
  const formattedDate = verificationTime.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = verificationTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Tracking identifiers
  const isVerified = status === 'verified' && !!record;
  const trackingId = isVerified
    ? `VRC-${verificationTime.getFullYear()}-${record?.certificateNumber?.replace(/[^A-Z0-9]/gi, '') || 'AUTH'}`
    : `NV-ALERT-${verificationTime.getFullYear()}-${(queriedNumberOrCode || 'UNKNOWN').replace(/[^A-Z0-9]/gi, '').slice(0, 10)}`;

  const certDef = record ? getCertificateDefinition(record.certificateType) : null;

  // QR Code payload
  const qrVerificationUrl = isVerified
    ? `https://verify.edu.bd/report/v1/VERIFIED?id=${encodeURIComponent(record?.certificateNumber || '')}&code=${encodeURIComponent(record?.verificationCode || '')}&std=${encodeURIComponent(record?.studentName || '')}`
    : `https://verify.edu.bd/report/v1/UNVERIFIED?query=${encodeURIComponent(queriedNumberOrCode)}&time=${encodeURIComponent(verificationTime.toISOString())}&status=REJECTED`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = isVerified && record
      ? `[INSTITUTION VERIFIED CERTIFICATE]
Tracking Ref: ${trackingId}
Status: AUTHENTIC & VERIFIED
Document: ${certDef?.title || 'Certificate'}
Serial No: ${record.certificateNumber}
Student: ${record.studentName.toUpperCase()}
Father: ${record.fatherName.toUpperCase()}
Mother: ${record.motherName.toUpperCase()}
Class/Roll: ${record.className} (Roll ${record.rollNumber})
Institution: ${instName} (EIIN: ${instEiin})
Verification Time: ${formattedDate} ${formattedTime}`
      : `[UNVERIFIED DOCUMENT ALERT REPORT]
Incident Ref: ${trackingId}
Status: NOT VERIFIED / RECORD NOT FOUND
Queried Code: ${queriedNumberOrCode}
Institution: ${instName} (EIIN: ${instEiin})
Notice: The queried document has NO RECORD in institutional archives and is classified as INVALID or POTENTIALLY FORGED.
Timestamp: ${formattedDate} ${formattedTime}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Container Dialog */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-300 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:bg-white">
        
        {/* ========================================================================= */}
        {/* MODAL CONTROL HEADER (Hidden on Print)                                    */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            {isVerified ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isVerified ? 'Official Document Verification Certificate' : 'Official Notice & Certificate of Non-Verification'}
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 animate-pulse'
                }`}>
                  {isVerified ? 'VERIFIED • AUTHENTIC' : 'NOT VERIFIED • RECORD NOT FOUND'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                System Auto-Generated Institutional Verification Certificate • Ready for Print &amp; Official Use
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Copy verification report summary to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CERTIFICATE SHEET (Printable Paper Canvas)                                */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[82vh] print:p-0 print:overflow-visible print:max-h-none flex justify-center bg-slate-200 dark:bg-slate-950/60 print:bg-white">
          <div
            ref={printRef}
            id="verification-certificate-print-area"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-10 shadow-xl border border-slate-300 print:shadow-none print:border-none print:p-6 relative flex flex-col justify-between overflow-hidden"
            style={{ boxSizing: 'border-box' }}
          >
            {/* ========================================================================= */}
            {/* WATERMARK BACKGROUND                                                      */}
            {/* ========================================================================= */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none overflow-hidden z-0">
              {isVerified ? (
                instLogo ? (
                  <img src={instLogo} alt="" className="w-96 h-96 object-contain grayscale" />
                ) : (
                  <div className="text-center font-serif text-8xl font-black tracking-widest text-emerald-900 transform -rotate-45">
                    AUTHENTIC<br />VERIFIED
                  </div>
                )
              ) : (
                <div className="text-center font-serif text-7xl font-black tracking-widest text-rose-900 transform -rotate-45 border-8 border-rose-900 p-8 rounded-3xl">
                  NOT VERIFIED<br />INVALID / FORGED<br />NO RECORD FOUND
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* ORNATE OFFICIAL BORDER                                                    */}
            {/* ========================================================================= */}
            <div className={`absolute inset-3 border-2 pointer-events-none ${
              isVerified ? 'border-emerald-800/80' : 'border-rose-800/80'
            }`}>
              <div className={`absolute inset-1 border pointer-events-none ${
                isVerified ? 'border-emerald-700/40' : 'border-rose-700/40'
              }`} />
              {/* Corner Ornaments */}
              <div className={`absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 ${isVerified ? 'border-emerald-900' : 'border-rose-900'}`} />
              <div className={`absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 ${isVerified ? 'border-emerald-900' : 'border-rose-900'}`} />
              <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 ${isVerified ? 'border-emerald-900' : 'border-rose-900'}`} />
              <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 ${isVerified ? 'border-emerald-900' : 'border-rose-900'}`} />
            </div>

            {/* Content Container (relative z-10) */}
            <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
              
              {/* HEADER SECTION */}
              <div>
                {/* Government & Ministry Subheading */}
                <div className="text-center space-y-0.5 border-b border-slate-300 pb-2">
                  <p className="text-[11px] font-serif font-bold uppercase tracking-widest text-slate-700">
                    PEOPLE'S REPUBLIC OF BANGLADESH
                  </p>
                  <p className="text-[9.5px] font-sans font-semibold text-slate-600">
                    Approved by Ministry of Education &amp; Board of Intermediate and Secondary Education
                  </p>
                </div>

                {/* Institute Header with Emblem */}
                <div className="flex items-center justify-between gap-4 pt-3 pb-2">
                  {/* Left Logo / Emblem */}
                  <div className="w-18 h-18 flex items-center justify-center shrink-0">
                    {instLogo ? (
                      <img src={instLogo} alt="Logo" className="w-16 h-16 object-contain" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-serif font-black text-xl shadow-xs ${
                        isVerified
                          ? 'border-emerald-800 text-emerald-800 bg-emerald-50'
                          : 'border-rose-800 text-rose-800 bg-rose-50'
                      }`}>
                        {instName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Center Name & Particulars */}
                  <div className="text-center flex-1">
                    <h1 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-tight text-slate-900 leading-tight">
                      {instName}
                    </h1>
                    <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                      {instAddress}
                    </p>
                    <div className="flex items-center justify-center gap-3 text-[9.5px] font-mono font-bold text-slate-700 mt-1">
                      <span>EIIN: {instEiin}</span>
                      <span>•</span>
                      <span>School Code: {instCode}</span>
                      <span>•</span>
                      <span>ESTD: 1965</span>
                    </div>
                  </div>

                  {/* Right Security Seal/Badge */}
                  <div className="w-18 h-18 flex flex-col items-center justify-center shrink-0">
                    <div className={`w-16 h-16 rounded-full border-2 border-dashed flex flex-col items-center justify-center p-1 text-center ${
                      isVerified
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-rose-600 bg-rose-50 text-rose-800'
                    }`}>
                      {isVerified ? (
                        <>
                          <ShieldCheck className="w-5 h-5 text-emerald-700" />
                          <span className="text-[7.5px] font-black uppercase tracking-tighter leading-tight mt-0.5">
                            INSTITUTION<br />VERIFIED
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-5 h-5 text-rose-700" />
                          <span className="text-[7px] font-black uppercase tracking-tighter leading-tight mt-0.5">
                            RECORD<br />NOT FOUND
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Office Department Line */}
                <div className="bg-slate-900 text-white text-center py-1 px-3 text-[10px] font-bold uppercase tracking-wider font-mono">
                  Office of the Controller of Examinations &amp; Academic Registry Records
                </div>

                {/* Metadata Tracking Strip */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 border-b border-slate-200 py-1.5 px-1">
                  <div>
                    <span className="text-slate-500 font-semibold">Verification Ref: </span>
                    <strong className="text-slate-900 font-bold">{trackingId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Date &amp; Time: </span>
                    <strong className="text-slate-900 font-bold">{formattedDate}, {formattedTime}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Channel: </span>
                    <strong className="text-slate-900 font-bold">DIGITAL SECURE REGISTRY</strong>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CERTIFICATE TITLE BANNER                                                  */}
              {/* ========================================================================= */}
              <div className="text-center my-1">
                {isVerified ? (
                  <div className="inline-block p-1 bg-gradient-to-r from-emerald-100 via-emerald-50 to-emerald-100 border border-emerald-300 rounded-lg px-6 py-2 shadow-xs">
                    <h3 className="text-base sm:text-lg font-black font-serif uppercase tracking-wider text-emerald-950">
                      OFFICIAL CERTIFICATE OF DOCUMENT VERIFICATION
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-800 font-serif">
                      Institutional Credential Authenticity &amp; Validation Record
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        INSTITUTION VERIFIED &amp; AUTHENTICATED
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="inline-block p-1 bg-gradient-to-r from-rose-100 via-rose-50 to-rose-100 border-2 border-rose-400 rounded-lg px-6 py-2 shadow-xs">
                    <h3 className="text-base sm:text-lg font-black font-serif uppercase tracking-wider text-rose-950">
                      OFFICIAL NOTICE &amp; CERTIFICATE OF NON-VERIFICATION
                    </h3>
                    <p className="text-[11px] font-bold text-rose-800 font-serif">
                      Official Advisory: Credential Verification Failed &amp; Record Unverified
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-rose-700 text-white px-2.5 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        NOT VERIFIED • NO MATCHING RECORD FOUND • FRAUD ALERT
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* BODY PARTICULARS: VERIFIED vs NOT VERIFIED                                 */}
              {/* ========================================================================= */}
              {isVerified && record ? (
                /* CASE A: VERIFIED RECORD PARTICULARS */
                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  {/* Formal Declaration Paragraph */}
                  <p className="text-justify indent-6 font-serif text-[11.5px] leading-relaxed">
                    This is to formally certify and declare that upon a verification request submitted to the examination and records wing of <strong>{instName}</strong>, the academic credential details below were verified against the permanent archives, admission registers, and official certificate issuance logs. <strong>All information has been matched and verified to be 100% authentic, genuine, and duly issued by this institution.</strong>
                  </p>

                  {/* VERIFIED DETAILS TABLE - MANDATED STRICT UPPERCASE FOR NAMES */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-slate-50/70 shadow-xs">
                    <div className="bg-slate-200/80 px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-[10px] font-bold uppercase text-slate-700 font-mono">
                      <span>Verified Student &amp; Certificate Particulars</span>
                      <span className="text-emerald-700 font-bold">STATUS: VALID &amp; REGISTERED</span>
                    </div>
                    
                    <div className="grid grid-cols-2 divide-x divide-slate-200 text-[11px]">
                      {/* Left Column */}
                      <div className="p-3 space-y-2">
                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Student Full Name:</span>
                          <strong className="text-slate-950 uppercase font-black tracking-wide text-xs block font-sans">
                            {record.studentName.toUpperCase()}
                          </strong>
                          {record.studentBengaliName && (
                            <span className="text-slate-600 text-[10.5px] block font-serif">
                              {record.studentBengaliName}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Father's Name:</span>
                          <strong className="text-slate-900 uppercase font-bold block">
                            {record.fatherName.toUpperCase()}
                          </strong>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Mother's Name:</span>
                          <strong className="text-slate-900 uppercase font-bold block">
                            {record.motherName.toUpperCase()}
                          </strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Class &amp; Section:</span>
                            <span className="text-slate-900 font-bold">{record.className} ({record.sectionName || 'General'})</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Class Roll:</span>
                            <span className="text-slate-900 font-bold font-mono">{record.rollNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="p-3 space-y-2">
                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Verified Document Type:</span>
                          <strong className="text-blue-900 font-bold uppercase text-[11px] block">
                            {certDef?.title || 'Academic Certificate'}
                          </strong>
                          <span className="text-slate-500 text-[9px] block">
                            Template Category: {certDef?.category?.toUpperCase().replace('_', ' ') || 'OFFICIAL'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Certificate Serial Number:</span>
                          <strong className="text-slate-950 font-mono font-black text-xs block bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {record.certificateNumber}
                          </strong>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Security Verification Hash / Code:</span>
                          <strong className="text-emerald-800 font-mono font-bold text-[11px] block">
                            {record.verificationCode}
                          </strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Academic Session:</span>
                            <span className="text-slate-900 font-bold">{record.session}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase font-semibold">Original Issue Date:</span>
                            <span className="text-slate-900 font-bold">
                              {new Date(record.issueDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Institutional Authority Confirmation Clause */}
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-[10px] text-emerald-950 font-serif leading-relaxed">
                    <strong>Official Authenticity Confirmation:</strong> This verified credential has been validated via institutional digital cryptographic ledger and archival comparison. All academic transcripts, board registrations, and disciplinary records corroborate the aforementioned student. This certificate of verification may be accepted by employers, universities, passport/visa authorities, and legal bodies without reservation.
                  </div>
                </div>
              ) : (
                /* CASE B: NOT VERIFIED / FRAUD ALERT INCIDENT PARTICULARS */
                <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                  {/* Warning Notice Statement */}
                  <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-lg space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs uppercase font-serif">
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>OFFICIAL WARNING &amp; FORMAL REJECTION DECLARATION</span>
                    </div>
                    <p className="text-justify font-serif text-[11px] leading-relaxed text-rose-950">
                      This certificate serves as an official institutional notice that an authenticity verification query was performed on <strong>{formattedDate} at {formattedTime}</strong> for the queried credential/identifier detailed below. Following an exhaustive and comprehensive query across the student registries, admission archives, and permanent issuance databases of <strong>{instName}</strong>, <strong>NO RECORD WAS FOUND</strong>.
                    </p>
                  </div>

                  {/* UNVERIFIED QUERY DETAILS TABLE */}
                  <div className="border-2 border-rose-300 rounded-lg overflow-hidden bg-white shadow-xs">
                    <div className="bg-rose-100 px-3 py-1.5 border-b border-rose-200 flex items-center justify-between text-[10px] font-bold uppercase text-rose-900 font-mono">
                      <span>Queried Identifier &amp; Incident Parameters</span>
                      <span className="text-rose-700 bg-white px-2 py-0.5 rounded font-bold border border-rose-300">
                        STATUS: UNVERIFIED / NOT FOUND
                      </span>
                    </div>

                    <div className="p-3 space-y-2.5 text-[11px]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-1">
                        <span className="text-slate-500 font-medium">Queried Serial Number / Reference Code:</span>
                        <div className="bg-rose-50 border border-rose-300 px-3 py-1 rounded font-mono font-black text-rose-900 text-sm">
                          {queriedNumberOrCode || 'N/A (Query String Empty)'}
                        </div>
                      </div>

                      {queriedPayload && queriedPayload !== queriedNumberOrCode && (
                        <div className="border-b border-slate-100 pb-2">
                          <span className="text-slate-500 block text-[10px] font-medium">Scanned QR Code Raw Payload:</span>
                          <span className="font-mono text-[10px] text-slate-700 bg-slate-100 p-1.5 rounded block break-all mt-0.5">
                            {queriedPayload}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-2">
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Queried Institution:</span>
                          <strong className="text-slate-800">{instName} (EIIN: {instEiin})</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Search Scope Checked:</span>
                          <strong className="text-slate-800">All Batches, Archival Ledger &amp; Registers</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Verification Incident Case Ref:</span>
                          <strong className="font-mono text-rose-800 font-bold">{trackingId}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Query Result Classification:</span>
                          <strong className="text-rose-700 font-bold">UNAUTHORIZED / VOID / POTENTIAL FORGERY</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legal Caution Advisory */}
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[9.5px] text-amber-950 font-serif leading-relaxed">
                    <strong>LEGAL ADVISORY &amp; DISCLAIMER:</strong> The institution hereby disclaims any responsibility for any document, seal, or signature bearing the queried identifier <strong>"{queriedNumberOrCode}"</strong>. Such documents are declared INVALID, VOID, and NOT RECOGNIZED. Academic boards, universities, employers, immigration authorities, and law enforcement agencies are advised to treat any physical or digital copy carrying this identifier as counterfeit and report it to the institutional authority.
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECURITY QR CODE, BARCODE & VERIFICATION STAMP                            */}
              {/* ========================================================================= */}
              <div className="border-t border-b border-slate-300 py-3 my-2 flex items-center justify-between gap-4">
                {/* QR Code and digital hash */}
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-white border border-slate-300 rounded shadow-xs">
                    <QrCodeSvg value={qrVerificationUrl} size={64} />
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900 uppercase">
                      {isVerified ? 'Official Digital Verification QR' : 'Incident Report Audit QR'}
                    </p>
                    <p className="text-[8px] text-slate-500">Scan to re-verify on official portal</p>
                    <p className="text-[8px] text-blue-700 font-semibold truncate max-w-[180px]">
                      verify.edu.bd/report/{trackingId}
                    </p>
                  </div>
                </div>

                {/* Central Barcode */}
                <div className="hidden sm:flex flex-col items-center justify-center">
                  <BarcodeSvg value={trackingId} width={140} height={32} showText={true} />
                  <span className="text-[8px] font-mono text-slate-400">Institutional Ledger Code</span>
                </div>

                {/* Verification Stamp / Seal */}
                <div className="flex items-center gap-2">
                  <div className={`w-20 h-20 rounded-full border-2 border-double flex flex-col items-center justify-center text-center p-1 select-none transform rotate-3 ${
                    isVerified
                      ? 'border-emerald-700 text-emerald-800 bg-emerald-50/60 shadow-xs'
                      : 'border-rose-700 text-rose-800 bg-rose-50/60 shadow-xs'
                  }`}>
                    <span className="text-[6.5px] font-mono font-bold tracking-tighter uppercase">
                      {instName.slice(0, 15)}
                    </span>
                    <div className="my-0.5">
                      {isVerified ? (
                        <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-700" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 mx-auto text-rose-700" />
                      )}
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-tighter">
                      {isVerified ? 'VERIFIED SEAL' : 'NON-VERIFIED'}
                    </span>
                    <span className="text-[6px] font-mono font-semibold">
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* INSTITUTION SIGNATORIES SECTION                                           */}
              {/* ========================================================================= */}
              <div className="pt-4 grid grid-cols-3 gap-6 text-center">
                {/* Signatory 1: Verification Officer */}
                <div className="flex flex-col items-center justify-end">
                  <div className="h-10 flex items-center justify-center">
                    <div className="text-[10px] font-mono font-bold text-slate-500 italic">
                      [Digitally Validated]
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-700 pt-1">
                    <p className="text-[10.5px] font-bold text-slate-900">
                      Verification Officer
                    </p>
                    <p className="text-[9px] text-slate-500">
                      ICT &amp; Records Verification Cell
                    </p>
                  </div>
                </div>

                {/* Signatory 2: Controller of Examinations */}
                <div className="flex flex-col items-center justify-end">
                  <div className="h-10 flex items-center justify-center">
                    <div className="font-serif italic text-xs font-bold text-slate-700">
                      {instName.slice(0, 8)}
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-700 pt-1">
                    <p className="text-[10.5px] font-bold text-slate-900">
                      Controller of Examinations
                    </p>
                    <p className="text-[9px] text-slate-500">
                      Academic Evaluation &amp; Archives
                    </p>
                  </div>
                </div>

                {/* Signatory 3: Headmaster / Principal */}
                <div className="flex flex-col items-center justify-end">
                  <div className="h-10 flex items-center justify-center">
                    <div className="font-serif italic font-black text-xs text-slate-800">
                      Principal
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-700 pt-1">
                    <p className="text-[10.5px] font-bold text-slate-900">
                      Head of Institution / Principal
                    </p>
                    <p className="text-[9px] text-slate-500">
                      {instName}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER NOTICE */}
              <div className="text-center pt-2 border-t border-slate-200 text-[8.5px] text-slate-500 font-mono">
                Official Document Verification Certificate • System Generated at {verificationTime.toISOString()} • Query Ref: {trackingId} • Bangladesh Education Archive
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BOTTOM CONTROLS (Hidden on Print)                                   */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 print:hidden text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Ready for printing on standard A4 paper with portrait orientation.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                isVerified ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isVerified ? 'Print Verified Certificate' : 'Print Non-Verification Certificate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
