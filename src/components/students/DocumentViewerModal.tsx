import React from 'react';
import { X, Download, FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { StudentDocument } from '../../types';

interface DocumentViewerModalProps {
  title: string;
  doc?: StudentDocument | null;
  imageUrl?: string | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  title,
  doc,
  imageUrl,
  onClose,
}) => {
  const isPdf = doc?.type === 'application/pdf' || doc?.name?.toLowerCase().endsWith('.pdf');
  const sourceUrl = doc?.dataUrl || imageUrl || '';

  const handleDownload = () => {
    if (!sourceUrl) return;
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.download = doc?.name || `${title.toLowerCase().replace(/\s+/g, '_')}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    if (!sourceUrl) return;
    const win = window.open();
    if (win) {
      if (isPdf) {
        win.document.write(
          `<html><head><title>${title}</title></head><body style="margin:0;"><iframe src="${sourceUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe></body></html>`
        );
      } else {
        win.document.write(
          `<html><head><title>${title}</title></head><body style="margin:0; background:#111; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="${sourceUrl}" style="max-width:100%; max-height:100%; object-fit:contain;" /></body></html>`
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <FileText className="w-5 h-5 text-rose-500" />
            ) : (
              <ImageIcon className="w-5 h-5 text-blue-500" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              {doc && (
                <p className="text-[11px] text-slate-400">
                  {doc.name} • {(doc.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="p-4 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
          {isPdf ? (
            <iframe
              src={sourceUrl}
              title={title}
              className="w-full h-[65vh] rounded-lg border border-slate-300 dark:border-slate-700 bg-white"
            />
          ) : (
            <div className="max-h-[70vh] flex items-center justify-center">
              <img
                src={sourceUrl}
                alt={title}
                className="max-h-[68vh] max-w-full rounded-lg object-contain shadow-md border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
