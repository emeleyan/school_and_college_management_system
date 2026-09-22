import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Printer, Download, Settings2, Sliders, CheckCircle2 } from 'lucide-react';
import { exportToExcel, printOrSavePdf, PaperSize, PageOrientation } from '../../utils/exportUtils';
import { useApp } from '../../context/AppContext';

export interface UniversalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultFilename?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  subtitle?: string;
  metaDetails?: { label: string; value: string }[];
}

export const UniversalExportModal: React.FC<UniversalExportModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultFilename = 'export_data',
  headers,
  rows,
  subtitle,
  metaDetails = [],
}) => {
  const { activeInstitute, activeAcademicYear } = useApp();
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [customTitle, setCustomTitle] = useState(title);
  const [filename, setFilename] = useState(defaultFilename);
  const [exportedStatus, setExportedStatus] = useState(false);

  if (!isOpen) return null;

  const handleExecuteExport = () => {
    if (exportType === 'excel') {
      const cleanName = filename.trim() ? filename.trim() : 'exported_data';
      exportToExcel(cleanName, headers, rows);
      setExportedStatus(true);
      setTimeout(() => setExportedStatus(false), 3000);
    } else {
      printOrSavePdf({
        title: customTitle.trim() || title,
        subtitle: subtitle || (activeAcademicYear ? `Academic Session: ${activeAcademicYear.yearName}` : ''),
        instituteName: activeInstitute?.name || 'School & College Management System',
        instituteEiin: activeInstitute?.eiin,
        headers,
        rows,
        paperSize,
        orientation,
        metaDetails,
      });
      setExportedStatus(true);
      setTimeout(() => setExportedStatus(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Export &amp; Print Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate Excel spreadsheet or custom formatted PDF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Format Selector: 2 Types Required */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Select Export Format (২ ধরনের এক্সপোর্ট)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportType('excel')}
                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                  exportType === 'excel'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold">1. Excel File (.csv/.xls)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    UTF-8 BOM support for Bangla &amp; English
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('pdf')}
                className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                  exportType === 'pdf'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold">2. PDF Document</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    A4 or Legal page size setup
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional settings for PDF: Paper Size (A4 vs Legal) and Orientation */}
          {exportType === 'pdf' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>PDF Page Setup (পৃষ্ঠার পরিমাপ ও লেআউট)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Paper Size Setting */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Page Size (কাগজের সাইজ):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaperSize('A4')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        paperSize === 'A4'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      A4 (210×297 mm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaperSize('Legal')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        paperSize === 'Legal'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Legal (8.5×14 in)
                    </button>
                  </div>
                </div>

                {/* Orientation Setting */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Orientation (লেআউট দিক):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        orientation === 'portrait'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Portrait (লম্বালম্বি)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        orientation === 'landscape'
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Landscape (আড়াআড়ি)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Document Header Title:
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Conditional setting for Excel */}
          {exportType === 'excel' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                File Name:
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="e.g. students_roster_2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-l-lg text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 rounded-r-lg text-xs font-bold text-slate-500">
                  .csv
                </span>
              </div>
            </div>
          )}

          {/* Data Summary Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Total Columns:</span>{' '}
              {headers.length}
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Total Rows:</span>{' '}
              {rows.length}
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Format:</span>{' '}
              {exportType === 'excel' ? 'Excel Spreadsheet' : `PDF (${paperSize})`}
            </div>
          </div>

          {exportedStatus && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {exportType === 'excel'
                  ? 'Excel file generated and downloaded successfully!'
                  : 'PDF print preview prepared with your custom page size!'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecuteExport}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
              exportType === 'excel'
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {exportType === 'excel' ? (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export to Excel File</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Generate PDF ({paperSize})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
