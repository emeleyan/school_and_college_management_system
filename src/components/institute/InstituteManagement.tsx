import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Institute, InstituteHeadRole } from '../../types';
import { update } from '../../db/indexedDB';
import { fileToBase64, processDigitalSignature, PRESET_INSTITUTE_LOGOS, PRESET_DIGITAL_SIGNATURES } from '../../utils/imageUtils';
import {
  Building2,
  GraduationCap,
  Edit2,
  CheckCircle2,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Upload,
  Image as ImageIcon,
  FileSignature,
  Trash2,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Award,
} from 'lucide-react';

export const InstituteManagement: React.FC = () => {
  const {
    institutes,
    activeInstitute,
    switchInstitute,
    refreshContext,
    logAudit,
    language,
    t,
  } = useApp();

  const [editingInst, setEditingInst] = useState<Institute | null>(null);
  const [formData, setFormData] = useState<Partial<Institute>>({});
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingSign, setUploadingSign] = useState<boolean>(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);
  const viceSignInputRef = useRef<HTMLInputElement>(null);
  const actingSignInputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (inst: Institute) => {
    setEditingInst(inst);
    setFormData({
      ...inst,
      headRole: inst.headRole || (inst.type === 'college' ? 'principal' : 'headmaster'),
    });
    setStatusMsg('');
    setErrorMsg('');
  };

  // Logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG).');
      return;
    }

    try {
      setUploadingLogo(true);
      const base64 = await fileToBase64(file, 400, 400);
      setFormData((prev) => ({ ...prev, logoUrl: base64 }));
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg('Failed to process image file: ' + err.message);
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Primary Digital Signature upload - Auto-converts to transparent background, sharp black digital signature
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (JPG, PNG, or photo of signature).');
      return;
    }

    try {
      setUploadingSign(true);
      const digitalSignature = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 300 });
      setFormData((prev) => ({ ...prev, signatureUrl: digitalSignature }));
      setErrorMsg('');
      setStatusMsg('✓ Digital signature generated: 100% transparent background, crisp black ink & enhanced sharpness.');
    } catch (err: any) {
      setErrorMsg('Failed to process signature image: ' + err.message);
    } finally {
      setUploadingSign(false);
      if (signInputRef.current) signInputRef.current.value = '';
    }
  };

  // Vice-Principal Signature upload - Auto-converts to transparent background, sharp black digital signature
  const handleViceSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const digitalSignature = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 300 });
      setFormData((prev) => ({ ...prev, viceSignatureUrl: digitalSignature }));
      setStatusMsg('✓ Vice-Principal signature converted to crisp transparent digital signature.');
    } catch (err: any) {
      setErrorMsg('Failed to process vice signature: ' + err.message);
    } finally {
      if (viceSignInputRef.current) viceSignInputRef.current.value = '';
    }
  };

  // Acting Principal Signature upload - Auto-converts to transparent background, sharp black digital signature
  const handleActingSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const digitalSignature = await processDigitalSignature(file, { maxWidth: 800, maxHeight: 300 });
      setFormData((prev) => ({ ...prev, actingSignatureUrl: digitalSignature }));
      setStatusMsg('✓ Acting Principal signature converted to crisp transparent digital signature.');
    } catch (err: any) {
      setErrorMsg('Failed to process acting principal signature: ' + err.message);
    } finally {
      if (actingSignInputRef.current) actingSignInputRef.current.value = '';
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst || !formData.name || !formData.eiin) {
      setErrorMsg('Institute name and EIIN are mandatory fields.');
      return;
    }

    try {
      // Determine titles based on headRole
      let headTitle = 'Principal';
      let headTitleBengali = 'অধ্যক্ষ';

      if (formData.headRole === 'acting_principal') {
        headTitle = 'Acting Principal';
        headTitleBengali = 'ভারপ্রাপ্ত অধ্যক্ষ';
      } else if (formData.headRole === 'vice_principal') {
        headTitle = 'Vice-Principal';
        headTitleBengali = 'উপাধ্যক্ষ';
      } else if (formData.headRole === 'headmaster') {
        headTitle = 'Headmaster';
        headTitleBengali = 'প্রধান শিক্ষক';
      } else if (formData.headRole === 'acting_headmaster') {
        headTitle = 'Acting Headmaster';
        headTitleBengali = 'ভারপ্রাপ্ত প্রধান শিক্ষক';
      } else if (formData.headRole === 'assistant_headmaster') {
        headTitle = 'Assistant Headmaster';
        headTitleBengali = 'সহকারী প্রধান শিক্ষক';
      }

      const updated: Institute = {
        ...(editingInst as Institute),
        ...(formData as Institute),
        headTitle,
        headTitleBengali,
        updatedAt: new Date().toISOString(),
      };

      await update('institutes', updated);
      await logAudit(
        'INSTITUTE_UPDATE',
        'institute',
        `Updated settings, logo & institutional head roles for ${updated.name} (EIIN: ${updated.eiin})`,
        updated.id
      );

      await refreshContext();
      setEditingInst(null);
      setStatusMsg(t.savedSuccessfully);
    } catch (err: any) {
      console.error('Error saving institute:', err);
      setErrorMsg(err.message || 'Failed to update institute');
    }
  };

  const getHeadRoleLabel = (inst: Institute) => {
    const role = inst.headRole || (inst.type === 'college' ? 'principal' : 'headmaster');
    switch (role) {
      case 'acting_principal':
        return {
          en: 'Acting Principal',
          bn: 'ভারপ্রাপ্ত অধ্যক্ষ',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        };
      case 'vice_principal':
        return {
          en: 'Vice-Principal',
          bn: 'উপাধ্যক্ষ',
          badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        };
      case 'acting_headmaster':
        return {
          en: 'Acting Headmaster',
          bn: 'ভারপ্রাপ্ত প্রধান শিক্ষক',
          badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        };
      case 'assistant_headmaster':
        return {
          en: 'Assistant Headmaster',
          bn: 'সহকারী প্রধান শিক্ষক',
          badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        };
      case 'headmaster':
        return {
          en: 'Headmaster',
          bn: 'প্রধান শিক্ষক',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        };
      case 'principal':
      default:
        return {
          en: 'Principal',
          bn: 'অধ্যক্ষ',
          badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>{t.institute}</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              Phase 13 • Logos, Head Hierarchy & Digital Signatures
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {language === 'bn'
              ? 'স্কুল ও কলেজের প্রাতিষ্ঠানিক লোগো, কলেজ প্রধানের পদবি (অধ্যক্ষ, উপাধ্যক্ষ, ভারপ্রাপ্ত অধ্যক্ষ) এবং ডিজিটাল স্বাক্ষর কনফিগারেশন।'
              : 'Configure School & College official logos, Institutional Head hierarchy (Principal, Vice-Principal, Acting Principal), and official Digital Signatures for circulars.'}
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Institutes Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {institutes.map((inst) => {
          const isActive = inst.id === activeInstitute?.id;
          const isSchool = inst.type === 'school';
          const headMeta = getHeadRoleLabel(inst);

          return (
            <div
              key={inst.id}
              className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-850 p-6 flex flex-col justify-between shadow-xs ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="space-y-5">
                {/* Top badge, Logo, and action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Official Logo or Emblem */}
                    <div className="relative">
                      {inst.logoUrl ? (
                        <img
                          src={inst.logoUrl}
                          alt={`${inst.name} Logo`}
                          className="w-16 h-16 rounded-xl object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 shadow-xs"
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-xs ${
                            isSchool ? 'bg-emerald-600' : 'bg-blue-600'
                          }`}
                        >
                          {isSchool ? (
                            <GraduationCap className="w-8 h-8" />
                          ) : (
                            <Building2 className="w-8 h-8" />
                          )}
                          <span className="text-[9px] mt-0.5 uppercase tracking-wider font-semibold">
                            No Logo
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isSchool
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {isSchool ? t.school : t.college} Entity
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Code: {inst.code}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {inst.name}
                      </h3>
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400 font-serif">
                        {inst.bengaliName || 'বাংলা নাম যোগ করা হয়নি'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => switchInstitute(inst.id)}
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {t.switchInstitute}
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(inst)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      title="Edit Profile, Logo & Signatures"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Motto */}
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  &ldquo;{inst.motto || 'No motto specified'}&rdquo;
                </p>

                {/* Key fields including Institutional Head Hierarchy */}
                <div className="space-y-3 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        EIIN Number:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {inst.eiin}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Established:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inst.establishedYear || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Institutional Authority / Head Hierarchy Display */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Institutional Executive Head</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${headMeta.badge}`}>
                        {headMeta.en} ({headMeta.bn})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {inst.principalName || 'Not designated'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {headMeta.en} / {headMeta.bn}
                        </div>
                      </div>

                      {/* Vice-Principal / 2nd In Command if present */}
                      {inst.vicePrincipalName && (
                        <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {inst.vicePrincipalName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Vice-Principal (২য় পজিশন / উপাধ্যক্ষ)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Digital Signature Status Preview */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Official Digital Signature</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {inst.signatureUrl ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Digital Signature Configured
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">
                            Not uploaded yet (Manual signature will be used)
                          </span>
                        )}
                      </div>
                    </div>

                    {inst.signatureUrl && (
                      <div className="w-28 h-10 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={inst.signatureUrl}
                          alt="Signature Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact list */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{inst.address || 'Address not configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{inst.phone || 'Phone not configured'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{inst.email || 'Email not configured'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Created: {new Date(inst.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleStartEdit(inst)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold font-sans cursor-pointer text-xs"
                >
                  Configure Profile & Signatures →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* EDIT MODAL: LOGO, HEAD HIERARCHY & DIGITAL SIGNATURES   */}
      {/* ======================================================== */}
      {editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Edit Profile: {editingInst.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set up Institutional Logo, Head designation hierarchy & Digital Signatures
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingInst(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* SECTION 1: LOGO UPLOAD & BRANDING */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>Official Institutional Logo / Emblem (প্রাতিষ্ঠানিক লোগো ও প্রতীক)</span>
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t.removeLogo}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* High-Definition Logo Preview with Checkerboard Transparency Background */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700/60 flex items-center justify-center shrink-0 overflow-hidden shadow-sm relative group bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] bg-[size:10px_10px] bg-slate-50 dark:bg-slate-900">
                      {formData.logoUrl ? (
                        <>
                          <img
                            src={formData.logoUrl}
                            alt="Institutional Logo"
                            className="w-full h-full object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                            onError={() => setErrorMsg('Logo image format could not be rendered properly. Please re-upload a PNG or JPG.')}
                          />
                          <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Active
                          </span>
                        </>
                      ) : (
                        <div className="text-center text-slate-400 p-2">
                          <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40 text-blue-500" />
                          <span className="text-[11px] font-medium block">No Logo Uploaded</span>
                          <span className="text-[9px] text-slate-400">PNG, JPG, SVG</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1.5 text-center">
                      Preview with Transparency
                    </span>
                  </div>

                  {/* Upload Controls */}
                  <div className="md:col-span-8 space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('image/')) {
                          try {
                            setUploadingLogo(true);
                            const base64 = await fileToBase64(file, 600, 600);
                            setFormData((prev) => ({ ...prev, logoUrl: base64 }));
                            setErrorMsg('');
                          } catch (err: any) {
                            setErrorMsg('Drop failed: ' + err.message);
                          } finally {
                            setUploadingLogo(false);
                          }
                        }
                      }}
                      className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingLogo ? 'Processing High-Res Image...' : 'Choose Logo File'}</span>
                        </button>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          or drag & drop logo file here
                        </span>
                      </div>
                    </div>

                    {/* Presets Row */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                        Official Presets (সরকারি ও প্রাতিষ্ঠানিক প্রিসেট):
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: PRESET_INSTITUTE_LOGOS.collegeCrest })}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-blue-100"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>College Crest (কলেজ প্রতীক)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: PRESET_INSTITUTE_LOGOS.schoolCrest })}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>School Crest (বিদ্যালয় প্রতীক)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: PRESET_INSTITUTE_LOGOS.academicEmblem })}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-purple-100"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>Academic Emblem</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      ✓ Transparent PNG, JPG, or SVG. This logo will automatically display on the Topbar, Student ID Cards, Transfer Certificates, Circular Notices, and Official Receipts.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: INSTITUTIONAL HEAD HIERARCHY */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Institutional Head Hierarchy (প্রধান ও উপাধ্যক্ষ পদবি ও দায়িত্ব)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    College / School Leadership Model
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Head Role Designation */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation of Current Executive Head *
                    </label>
                    <select
                      value={formData.headRole || 'principal'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          headRole: e.target.value as InstituteHeadRole,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold"
                    >
                      {editingInst.type === 'college' ? (
                        <>
                          <option value="principal">
                            Principal (অধ্যক্ষ) — Regular Institutional Head
                          </option>
                          <option value="vice_principal">
                            Vice-Principal (উপাধ্যক্ষ) — 2nd Position in Charge
                          </option>
                          <option value="acting_principal">
                            Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ) — In Absence of Regular Principal
                          </option>
                        </>
                      ) : (
                        <>
                          <option value="headmaster">
                            Headmaster (প্রধান শিক্ষক) — Regular Head
                          </option>
                          <option value="principal">
                            Principal (অধ্যক্ষ)
                          </option>
                          <option value="assistant_headmaster">
                            Assistant Headmaster (সহকারী প্রধান শিক্ষক)
                          </option>
                          <option value="acting_headmaster">
                            Acting Headmaster (ভারপ্রাপ্ত প্রধান শিক্ষক)
                          </option>
                          <option value="acting_principal">
                            Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ)
                          </option>
                        </>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Select who currently holds executive charge (e.g., if Principal is absent, select Acting Principal).
                    </p>
                  </div>

                  {/* Primary In-Charge Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {formData.headRole === 'acting_principal'
                        ? 'Acting Principal Name (ভারপ্রাপ্ত অধ্যক্ষের নাম) *'
                        : formData.headRole === 'vice_principal'
                        ? 'Vice-Principal Name (উপাধ্যক্ষের নাম) *'
                        : formData.headRole === 'acting_headmaster'
                        ? 'Acting Headmaster Name (ভারপ্রাপ্ত প্রধান শিক্ষক) *'
                        : 'Principal / Headmaster Name (অধ্যক্ষ / প্রধান শিক্ষক) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.principalName || ''}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      placeholder="e.g. Prof. Dr. Anisur Rahman"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  {/* Vice-Principal Name (2nd position) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vice-Principal / Assistant Head Name (২য় পজিশন / উপাধ্যক্ষের নাম)
                    </label>
                    <input
                      type="text"
                      value={formData.vicePrincipalName || ''}
                      onChange={(e) => setFormData({ ...formData, vicePrincipalName: e.target.value })}
                      placeholder="e.g. Md. Mostafa Kamal (Vice-Principal)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    />
                  </div>

                  {/* Acting Principal Name (if principal is maintained separately) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Acting Principal / Officer In-Charge (ভারপ্রাপ্ত অধ্যক্ষ - বিকল্প)
                    </label>
                    <input
                      type="text"
                      value={formData.actingPrincipalName || ''}
                      onChange={(e) => setFormData({ ...formData, actingPrincipalName: e.target.value })}
                      placeholder="e.g. Associate Prof. Shahidul Islam"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: DIGITAL SIGNATURE MANAGEMENT */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-emerald-600" />
                      <span>Official Digital Signature (ডিজিটাল স্বাক্ষর আপলোড)</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Used for electronic circular notices, digital approvals, and verified letterheads
                    </p>
                  </div>

                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, signatureUrl: undefined })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t.removeSignature}</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Smart Digital Signature Engine:</strong> Upload any paper photograph or scan. The system automatically removes paper backgrounds for 100% transparency, converts pen ink to crisp authoritative pure black, and sharpens pen stroke edges.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Primary Head / Principal Signature */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {formData.type === 'college' ? '1. Principal Signature (অধ্যক্ষ)' : '1. Headmaster Signature (প্রধান শিক্ষক)'}
                      </span>
                      {formData.signatureUrl && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Attached
                        </span>
                      )}
                    </div>

                    <div className="h-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 relative overflow-hidden">
                      {formData.signatureUrl ? (
                        <img
                          src={formData.signatureUrl}
                          alt="Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No digital signature uploaded
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={signInputRef}
                        onChange={handleSignatureUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => signInputRef.current?.click()}
                        disabled={uploadingSign}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const preset =
                            formData.type === 'college'
                              ? PRESET_DIGITAL_SIGNATURES.principal
                              : PRESET_DIGITAL_SIGNATURES.headmaster;
                          setFormData({ ...formData, signatureUrl: preset });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Preset
                      </button>

                      {formData.signatureUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, signatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1"
                          title="Remove signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Vice-Principal Signature (2nd Position) */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {formData.type === 'college'
                          ? '2. Vice-Principal (উপাধ্যক্ষ — ২য় পজিশন)'
                          : '2. Asst. Headmaster (সহকারী প্রধান শিক্ষক)'}
                      </span>
                      {formData.viceSignatureUrl && (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Attached
                        </span>
                      )}
                    </div>

                    <div className="h-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 relative overflow-hidden">
                      {formData.viceSignatureUrl ? (
                        <img
                          src={formData.viceSignatureUrl}
                          alt="Vice Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No vice signature uploaded
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={viceSignInputRef}
                        onChange={handleViceSignatureUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => viceSignInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            viceSignatureUrl: PRESET_DIGITAL_SIGNATURES.vicePrincipal,
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Preset
                      </button>

                      {formData.viceSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, viceSignatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1"
                          title="Remove Vice Signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Acting Principal Signature (In absence of Principal/Vice-Principal) */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                        {formData.type === 'college'
                          ? '3. Acting Principal (ভারপ্রাপ্ত অধ্যক্ষ — বিকল্প)'
                          : '3. Acting Headmaster (ভারপ্রাপ্ত প্রধান শিক্ষক)'}
                      </span>
                      {formData.actingSignatureUrl && (
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Attached
                        </span>
                      )}
                    </div>

                    <div className="h-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-2 relative overflow-hidden">
                      {formData.actingSignatureUrl ? (
                        <img
                          src={formData.actingSignatureUrl}
                          alt="Acting Principal Signature"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No acting signature uploaded
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={actingSignInputRef}
                        onChange={handleActingSignatureUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => actingSignInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            actingSignatureUrl: PRESET_DIGITAL_SIGNATURES.actingPrincipal,
                          });
                        }}
                        className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Preset
                      </button>

                      {formData.actingSignatureUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, actingSignatureUrl: undefined })}
                          className="text-rose-500 hover:text-rose-600 p-1"
                          title="Remove Acting Signature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: STANDARD GENERAL FIELDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.instituteName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.bengaliName}
                  </label>
                  <input
                    type="text"
                    value={formData.bengaliName || ''}
                    onChange={(e) => setFormData({ ...formData, bengaliName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.eiin} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eiin || ''}
                    onChange={(e) => setFormData({ ...formData, eiin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.establishedYear}
                  </label>
                  <input
                    type="text"
                    value={formData.establishedYear || ''}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Education Board (শিক্ষা বোর্ড)
                  </label>
                  <input
                    type="text"
                    value={formData.educationBoard || 'Dhaka'}
                    onChange={(e) => setFormData({ ...formData, educationBoard: e.target.value })}
                    placeholder="e.g. Dhaka, Cumilla, Rajshahi, Technical"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.motto}
                  </label>
                  <input
                    type="text"
                    value={formData.motto || ''}
                    onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.address}
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.phone}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingInst(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
