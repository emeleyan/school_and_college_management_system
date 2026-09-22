import React, { useState } from 'react';
import { Institute, AcademicYear, InstituteHeadRole } from '../../types';
import { exportToCsv } from '../../utils/exportUtils';
import { PRESET_DIGITAL_SIGNATURES } from '../../utils/imageUtils';
import {
  Printer,
  Download,
  X,
  Building2,
  ShieldCheck,
  PenTool,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  memoNo?: string;
  institute: Institute | null;
  academicYear: AcademicYear | null;
  columns: { header: string; key: string; align?: 'left' | 'center' | 'right' }[];
  data: Record<string, any>[];
  summaryCards?: { label: string; value: string | number }[];
  defaultSignatoryRole?: string;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  memoNo = `REP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
  institute,
  academicYear,
  columns,
  data,
  summaryCards = [],
  defaultSignatoryRole,
}) => {
  // Print & Signature states
  const [includeDigitalSignature, setIncludeDigitalSignature] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState<string>(
    defaultSignatoryRole || institute?.headRole || (institute?.type === 'college' ? 'principal' : 'headmaster')
  );

  if (!isOpen) return null;

  const isCollege = institute?.type === 'college';

  // Determine signature image and designation
  const getSignerInfo = () => {
    let designation = 'Headmaster';
    let bengaliDesignation = 'প্রধান শিক্ষক';
    let signatureUrl = institute?.signatureUrl;

    if (selectedRole === 'principal') {
      designation = 'Principal';
      bengaliDesignation = 'অধ্যক্ষ';
      signatureUrl = institute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.principal;
    } else if (selectedRole === 'vice_principal') {
      designation = 'Vice-Principal';
      bengaliDesignation = 'উপাধ্যক্ষ';
      signatureUrl = institute?.viceSignatureUrl || PRESET_DIGITAL_SIGNATURES.vicePrincipal;
    } else if (selectedRole === 'acting_principal') {
      designation = 'Acting Principal';
      bengaliDesignation = 'ভারপ্রাপ্ত অধ্যক্ষ';
      signatureUrl = institute?.actingSignatureUrl || institute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.actingPrincipal;
    } else if (selectedRole === 'acting_headmaster') {
      designation = 'Acting Headmaster';
      bengaliDesignation = 'ভারপ্রাপ্ত প্রধান শিক্ষক';
      signatureUrl = institute?.actingSignatureUrl || institute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.actingPrincipal;
    } else {
      designation = 'Headmaster';
      bengaliDesignation = 'প্রধান শিক্ষক';
      signatureUrl = institute?.signatureUrl || PRESET_DIGITAL_SIGNATURES.principal;
    }

    return { designation, bengaliDesignation, signatureUrl };
  };

  const signer = getSignerInfo();

  const handlePrint = () => {
    window.print();
  };

  const handleCsvExport = () => {
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((c) => row[c.key] ?? ''));
    exportToCsv(title.toLowerCase().replace(/\s+/g, '_'), headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Official Report Print &amp; Export Preview
              </h3>
              <p className="text-[11px] text-slate-500">
                Institutional memo, letterhead, signatures, and formatted layout
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Digital Signature Toggle */}
            <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDigitalSignature}
                onChange={(e) => setIncludeDigitalSignature(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
              />
              <span className="flex items-center gap-1 font-medium text-[11px]">
                {includeDigitalSignature ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PenTool className="w-3.5 h-3.5 text-amber-600" />
                )}
                {includeDigitalSignature ? 'Digital Signature ON' : 'Manual Sign (Physical)'}
              </span>
            </label>

            {/* Signatory Authority Selection */}
            {includeDigitalSignature && (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {isCollege ? (
                  <>
                    <option value="principal">Principal (অধ্যক্ষ - Main Head)</option>
                    <option value="vice_principal">Vice-Principal (উপাধ্যক্ষ - 2nd Position)</option>
                    <option value="acting_principal">Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ)</option>
                  </>
                ) : (
                  <>
                    <option value="headmaster">Headmaster (প্রধান শিক্ষক - Main Head)</option>
                    <option value="acting_headmaster">Acting Headmaster (ভারপ্রাপ্ত প্রধান শিক্ষক)</option>
                  </>
                )}
              </select>
            )}

            {/* CSV Export */}
            <button
              onClick={handleCsvExport}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              title="Download spreadsheet in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Export</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="report-printable-area"
          className="printable-document flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 dark:bg-slate-900 dark:text-white print:bg-white print:text-black print:p-4 print:overflow-visible print:h-auto"
        >
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-slate-900 dark:border-slate-300 pb-4 mb-6 text-center relative">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 print:bg-white print:border-none">
                {institute?.logoUrl ? (
                  <img
                    src={institute.logoUrl}
                    alt="Logo"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-400" />
                )}
              </div>

              {/* Institution Header Details */}
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white print:text-black tracking-tight font-serif">
                  {institute?.bengaliName || institute?.name || 'শিক্ষা প্রতিষ্ঠান'}
                </h1>
                <h2 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 print:text-slate-800 tracking-wide mt-0.5">
                  {institute?.name || 'Educational Institution'}
                </h2>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700 mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 font-medium">
                  <span>EIIN: {institute?.eiin || '108452'}</span>
                  <span>•</span>
                  <span>College/School Code: {institute?.code || '3201'}</span>
                  <span>•</span>
                  <span>Board: {institute?.educationBoard || 'Dhaka'}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                  {institute?.address || 'Dhaka, Bangladesh'}
                </div>
              </div>

              {/* Monogram Seal Placeholder on Right */}
              <div className="w-20 shrink-0 hidden sm:flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-[9px] text-slate-400">
                  <span>OFFICIAL</span>
                  <span className="font-bold">SEAL</span>
                </div>
              </div>
            </div>

            {/* Document Memo & Meta Strip */}
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 print:text-slate-700">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">Memo No: </span>
                <span>{memoNo}</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">Academic Session: </span>
                  <span>{academicYear?.yearName || new Date().getFullYear()}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 print:text-black">Date: </span>
                  <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Report Title Badge */}
          <div className="text-center my-4">
            <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 dark:text-white print:text-black underline decoration-slate-400 underline-offset-4 font-serif">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Summary KPIs (if provided) */}
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {summaryCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 print:bg-slate-50 print:border-slate-300 text-center"
                >
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    {card.label}
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white print:text-black mt-0.5">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table Data */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-slate-900 dark:text-white print:text-black border-b border-slate-200 dark:border-slate-700 print:border-slate-400">
                  <th className="py-2.5 px-3 text-center w-12 font-bold">SL</th>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300 text-slate-800 dark:text-slate-200 print:text-black">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400">
                      No records found for the selected report filters.
                    </td>
                  </tr>
                ) : (
                  data.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-850/30 print:bg-slate-50/40' : ''}
                    >
                      <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">
                        {rIdx + 1}
                      </td>
                      {columns.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-2 px-3 text-[11px] ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right font-mono'
                              : 'text-left'
                          }`}
                        >
                          {row[col.key] ?? '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Official Signatory Approval Footer */}
          <div className="mt-14 pt-6 border-t border-slate-200 dark:border-slate-800 print:border-slate-300 page-break-inside-avoid">
            <div className="grid grid-cols-3 gap-6 text-center">
              {/* Prepared By */}
              <div className="flex flex-col items-center justify-end">
                <div className="w-36 border-b border-slate-400 dark:border-slate-500 print:border-black mb-1.5" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black">
                  Prepared By
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600">
                  Assistant / Accountant
                </div>
              </div>

              {/* Checked & Verified By */}
              <div className="flex flex-col items-center justify-end">
                <div className="w-36 border-b border-slate-400 dark:border-slate-500 print:border-black mb-1.5" />
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black">
                  Checked &amp; Verified
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600">
                  Academic In-charge / Convener
                </div>
              </div>

              {/* Approved & Signed by Head of Institute */}
              <div className="flex flex-col items-center justify-end">
                {includeDigitalSignature ? (
                  <div className="flex flex-col items-center mb-1">
                    <div className="h-10 w-28 flex items-center justify-center p-0.5">
                      {signer.signatureUrl ? (
                        <img
                          src={signer.signatureUrl}
                          alt="Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] italic text-slate-400">Digital Signature</span>
                      )}
                    </div>
                    <div className="text-[9px] font-bold text-emerald-600 print:text-black flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 inline" />
                      Digitally Verified
                    </div>
                  </div>
                ) : (
                  <div className="h-10" />
                )}
                <div className="w-40 border-b border-slate-400 dark:border-slate-500 print:border-black mb-1.5" />
                <div className="text-xs font-extrabold text-slate-900 dark:text-white print:text-black">
                  {signer.designation} ({signer.bengaliDesignation})
                </div>
                <div className="text-[10px] text-slate-500 print:text-slate-600">
                  {institute?.name || 'Head of the Institution'}
                </div>
              </div>
            </div>

            {/* Print Timestamp footnote */}
            <div className="mt-8 text-center text-[9px] text-slate-400 print:text-slate-500">
              Generated automatically by School &amp; College ERP System on{' '}
              {new Date().toLocaleString('en-GB')} • Offline Ready Engine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
