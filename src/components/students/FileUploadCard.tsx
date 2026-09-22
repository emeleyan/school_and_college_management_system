import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { StudentDocument } from '../../types';
import { DocumentViewerModal } from './DocumentViewerModal';
import { processDigitalSignature } from '../../utils/signatureProcessor';

interface FileUploadCardProps {
  id: string;
  label: string;
  bengaliLabel: string;
  accept?: string;
  allowPdf?: boolean;
  value?: string | StudentDocument | null;
  onChange?: (val: { dataUrl: string; name: string; type: string; size: number } | null) => void;
  helperText?: string;
  isSignature?: boolean;
  // Alternate props for Teacher/Staff modal
  icon?: React.ComponentType<{ className?: string }>;
  existingPreviewUrl?: string | null;
  existingDoc?: any;
  onFileSelected?: (file: File, dataUrl: string) => void;
  onClear?: () => void;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  id,
  label,
  bengaliLabel,
  accept = 'image/*',
  allowPdf = false,
  value,
  onChange,
  helperText,
  isSignature = false,
  icon: CustomIcon,
  existingPreviewUrl,
  onFileSelected,
  onClear,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if field is signature
  const isSignatureField =
    isSignature ||
    id.toLowerCase().includes('signature') ||
    label.toLowerCase().includes('signature') ||
    bengaliLabel.toLowerCase().includes('স্বাক্ষর');

  // Determine existing values
  const isDocObject = value && typeof value === 'object';
  const dataUrl =
    (isDocObject ? (value as StudentDocument).dataUrl : (value as string)) ||
    existingPreviewUrl ||
    '';
  const fileName = isDocObject ? (value as StudentDocument).name : '';
  const fileType = isDocObject ? (value as StudentDocument).type : '';
  const fileSize = isDocObject ? (value as StudentDocument).size : 0;
  const isPdf =
    fileType === 'application/pdf' ||
    (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
    (typeof dataUrl === 'string' && dataUrl.startsWith('data:application/pdf'));

  const hasFile = Boolean(dataUrl);

  const processFile = async (file: File) => {
    setErrorMsg(null);

    // Size limit: 5 MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('File exceeds 5 MB limit. Please select a smaller photo or document.');
      return;
    }

    // Type check
    const isFilePdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isFilePdf && !allowPdf) {
      setErrorMsg('PDF files are not supported for this field. Please upload an image.');
      return;
    }

    if (!file.type.startsWith('image/') && !isFilePdf) {
      setErrorMsg('Invalid file format. Please upload JPG, PNG, or PDF.');
      return;
    }

    // Handle Signature: Auto-convert to transparent, sharp, pure-black digital signature
    if (isSignatureField && !isFilePdf) {
      try {
        setIsProcessing(true);
        const digitalSig = await processDigitalSignature(file, { maxWidth: 900, maxHeight: 320 });
        const cleanName = file.name.replace(/\.[^/.]+$/, '') + '-digital.png';

        if (onChange) {
          onChange({
            dataUrl: digitalSig,
            name: cleanName,
            type: 'image/png',
            size: Math.round(digitalSig.length * 0.75),
          });
        }
        if (onFileSelected) {
          onFileSelected(file, digitalSig);
        }
      } catch (err: any) {
        setErrorMsg('Failed to process digital signature: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Standard file read for photos/documents
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (onChange) {
        onChange({
          dataUrl: result,
          name: file.name,
          type: file.type || (isFilePdf ? 'application/pdf' : 'image/jpeg'),
          size: file.size,
        });
      }
      if (onFileSelected) {
        onFileSelected(file, result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) onChange(null);
    if (onClear) onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all hover:border-slate-300 dark:hover:border-slate-600 flex flex-col justify-between">
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Label and badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <label
              htmlFor={id}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 block cursor-pointer"
            >
              {label}
            </label>
            <span className="text-[11px] text-slate-500 font-medium block">
              {bengaliLabel}
            </span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              hasFile
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {hasFile ? 'Uploaded' : 'Optional'}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Container or Preview */}
        {isProcessing ? (
          <div className="mt-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-lg border border-indigo-200 dark:border-indigo-800/60 p-4 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              Generating Digital Signature...
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-300 text-center">
              Removing paper background • Converting to pure black ink • Sharpening edges
            </span>
          </div>
        ) : hasFile ? (
          <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {isPdf ? (
                <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex flex-col items-center justify-center shrink-0 text-rose-600">
                  <FileText className="w-6 h-6" />
                  <span className="text-[8px] font-bold uppercase mt-0.5">PDF</span>
                </div>
              ) : (
                <img
                  src={dataUrl}
                  alt={label}
                  className={`rounded-lg object-contain border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900 ${
                    isSignatureField ? 'w-20 h-10 p-1' : 'w-12 h-12 object-cover'
                  }`}
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {fileName || (isPdf ? 'Document.pdf' : isSignatureField ? 'Digital Signature' : 'Image File')}
                </div>
                <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                  {isSignatureField && (
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Digital Clear
                    </span>
                  )}
                  {fileSize > 0 && <span>• {(fileSize / 1024).toFixed(0)} KB</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                title="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                title="Replace file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center">
              {CustomIcon ? (
                <CustomIcon className="w-4 h-4 text-blue-500" />
              ) : allowPdf ? (
                <FileText className="w-4 h-4 text-blue-500" />
              ) : (
                <Upload className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-blue-600 dark:text-blue-400">Click to upload</span> or drag file
            </div>
            <div className="text-[10px] text-slate-400">
              {helperText ||
                (isSignatureField
                  ? 'Photo or scan of signature (Auto background removal & sharp black ink)'
                  : allowPdf
                  ? 'Images (JPG, PNG) or PDF'
                  : 'JPG, PNG, WebP (Max 5MB)')}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <DocumentViewerModal
          title={label}
          doc={
            isDocObject
              ? (value as StudentDocument)
              : dataUrl
              ? {
                  name: fileName || label,
                  type: fileType || (isPdf ? 'application/pdf' : 'image/jpeg'),
                  size: fileSize || 0,
                  dataUrl,
                  uploadedAt: new Date().toISOString(),
                }
              : null
          }
          imageUrl={!isPdf ? dataUrl : null}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
