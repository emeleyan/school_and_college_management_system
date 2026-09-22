import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CertificateRecord, Institute } from '../../types';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  CheckCircle2,
  QrCode,
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Printer,
  Check,
  FileCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import jsQR from 'jsqr';
import { QrCodeSvg } from '../../utils/qrBarcodeUtils';
import { getCertificateDefinition } from './certificateDefinitions';
import { DocumentVerificationCertificateModal } from './DocumentVerificationCertificateModal';

interface CertificateVerificationModalProps {
  certificates: CertificateRecord[];
  institute?: Institute | null;
  onClose: () => void;
  onViewPrint: (cert: CertificateRecord) => void;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  certificates,
  institute,
  onClose,
  onViewPrint,
}) => {
  const [activeTab, setActiveTab] = useState<'number' | 'camera_qr' | 'upload_qr'>('number');
  const [query, setQuery] = useState<string>('');
  const [verifiedRecord, setVerifiedRecord] = useState<CertificateRecord | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchFailedQuery, setSearchFailedQuery] = useState<string>('');

  // Auto-Generated Document Verification Certificate Modal State
  const [showVerificationReport, setShowVerificationReport] = useState<boolean>(false);
  const [reportStatus, setReportStatus] = useState<'verified' | 'unverified'>('verified');
  const [reportRecord, setReportRecord] = useState<CertificateRecord | null>(null);
  const [reportQueriedQuery, setReportQueriedQuery] = useState<string>('');

  // Camera scanner states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // File upload scanner state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Audio confirmation beep
  const playSuccessBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  // Match record from string (serial number, verification code, hash, or URL)
  const matchCertificate = useCallback(
    (raw: string): CertificateRecord | null => {
      const cleaned = raw.trim();
      if (!cleaned) return null;

      // Check if URL with params e.g. https://verify.edu.bd/cert/VER-TC-892471|TC-2026-0042|...
      const upper = cleaned.toUpperCase();
      const parts = upper.split(/[|/&?]/).map((p) => p.trim());

      const found = certificates.find((c) => {
        const certNum = c.certificateNumber.toUpperCase();
        const verCode = c.verificationCode.toUpperCase();
        const roll = c.boardRoll ? c.boardRoll.toUpperCase() : '';

        if (certNum === upper || verCode === upper || (roll && roll === upper)) {
          return true;
        }

        // Check inside parts
        return parts.some((p) => p === certNum || p === verCode || (p.startsWith('VER-') && p === verCode));
      });

      return found || null;
    },
    [certificates]
  );

  // Verification by text query
  const handleVerifyQuery = (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    const found = matchCertificate(q);
    if (found) {
      playSuccessBeep();
      setVerifiedRecord(found);
      setHasSearched(true);
      setSearchFailedQuery('');
    } else {
      setVerifiedRecord(null);
      setHasSearched(true);
      setSearchFailedQuery(q);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerifyQuery();
  };

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Continuous QR scanning from video stream
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (qrCode && qrCode.data) {
        const detectedData = qrCode.data;
        const matched = matchCertificate(detectedData);
        if (matched) {
          playSuccessBeep();
          stopCamera();
          setVerifiedRecord(matched);
          setHasSearched(true);
          setSearchFailedQuery('');
          return;
        } else {
          stopCamera();
          setVerifiedRecord(null);
          setHasSearched(true);
          setSearchFailedQuery(detectedData);
          setScanStatus(`Scanned: "${detectedData}". Not found in institution database.`);
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [matchCertificate, stopCamera]);

  // Start live camera scanner
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScanStatus('Align the QR code from the printed certificate inside the guide box...');

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Camera access was denied or not available. Please allow camera permissions in your browser or try the "Upload QR Code Image" tab.'
      );
      setCameraActive(false);
    }
  }, [facingMode, scanVideoFrame, stopCamera]);

  // Handle switching tabs
  useEffect(() => {
    if (activeTab === 'camera_qr') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Handle QR image file upload
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStatus('Processing image...');
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode && qrCode.data) {
          const matched = matchCertificate(qrCode.data);
          if (matched) {
            playSuccessBeep();
            setVerifiedRecord(matched);
            setHasSearched(true);
            setScanStatus(null);
            setSearchFailedQuery('');
          } else {
            setHasSearched(true);
            setVerifiedRecord(null);
            setSearchFailedQuery(qrCode.data);
            setScanStatus(`QR code detected ("${qrCode.data}") but not found in active records.`);
          }
        } else {
          setScanStatus('Could not locate a clear QR code in this image. Please ensure the QR is well-lit and unobstructed.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white dark:bg-slate-850 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Certificate Digital Verification Hub</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Official
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify institutional authenticity via Serial Number, Hash ID, or Live QR Scan
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* VERIFICATION MODE TABS */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('number');
              setScanStatus(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'number'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Serial / Hash No.</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera_qr');
              setScanStatus(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera_qr'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload_qr');
              setScanStatus(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload_qr'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Upload QR Image</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: SERIAL NUMBER & HASH INPUT                                         */}
          {/* ========================================================================= */}
          {activeTab === 'number' && (
            <div className="space-y-4">
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Enter Certificate Serial Number or Official Digital Verification Hash *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. TC-2026-0042, VER-TC-892471, TST-2026-0105"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono uppercase font-semibold"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Authenticity</span>
                  </button>
                </div>
              </form>

              {/* Sample Fast-Click chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Quick-Verify Issued Certificates in Registry:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {certificates.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setQuery(c.certificateNumber);
                        handleVerifyQuery(c.certificateNumber);
                      }}
                      className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{c.certificateNumber}</span>
                      <span className="text-slate-400">({c.studentName})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LIVE CAMERA QR SCANNER                                            */}
          {/* ========================================================================= */}
          {activeTab === 'camera_qr' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-4/3 bg-black rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                {/* Hidden canvas used by jsQR */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video Stream */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Overlay Scanning Reticle */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      {/* Animated Laser line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce" />
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                )}

                {/* Error message if camera unavailable */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-4 text-center flex flex-col items-center justify-center space-y-2 text-slate-200">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <p className="text-xs max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload_qr')}
                      className="text-xs text-emerald-400 underline font-semibold cursor-pointer"
                    >
                      Switch to Image Upload Scanner
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                  {scanStatus || 'Center the QR code on the certificate inside the green box'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
                    startCamera();
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Switch Camera
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: UPLOAD QR CODE IMAGE                                              */}
          {/* ========================================================================= */}
          {activeTab === 'upload_qr' && (
            <div className="space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleQrImageUpload}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 dark:bg-slate-900/40 transition-all hover:bg-emerald-50/20"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                  Upload Certificate or QR Code Photo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-3">
                  Select a certificate image, snapshot, or cropped QR code. The system will decode and authenticate it automatically.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Select Image File
                </span>
              </div>

              {scanStatus && (
                <div className="text-xs text-center text-slate-600 dark:text-slate-400 font-medium">
                  {scanStatus}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VERIFICATION RESULTS PANE                                                 */}
          {/* ========================================================================= */}
          {hasSearched && (
            <div className="pt-2">
              {verifiedRecord ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500/80 space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/50 pb-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>OFFICIAL DOCUMENT AUTHENTICITY CONFIRMED</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full font-mono">
                      VALID
                    </span>
                  </div>

                  {/* CERTIFICATE DETAILS: NAMES ALWAYS CAPITALIZED */}
                  <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <span className="text-slate-500 font-medium">Certificate Document:</span>
                      <strong className="text-blue-700 dark:text-blue-400 font-bold text-xs uppercase">
                        {getCertificateDefinition(verifiedRecord.certificateType).title}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <span className="text-slate-500 font-medium">Certificate Serial Number:</span>
                      <strong className="font-mono text-slate-900 dark:text-white font-bold">
                        {verifiedRecord.certificateNumber}
                      </strong>
                    </div>

                    {/* Student Name: CAPITAL LETTERS MANDATED */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <span className="text-slate-500 font-medium">Student Full Name:</span>
                      <strong className="text-slate-950 dark:text-white uppercase font-black text-sm tracking-wide">
                        {verifiedRecord.studentName.toUpperCase()}
                      </strong>
                    </div>

                    {/* Father Name: CAPITAL LETTERS MANDATED */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <span className="text-slate-500 font-medium">Father's Name:</span>
                      <strong className="text-slate-900 dark:text-slate-200 uppercase font-semibold">
                        {verifiedRecord.fatherName.toUpperCase()}
                      </strong>
                    </div>

                    {/* Mother Name: CAPITAL LETTERS MANDATED */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <span className="text-slate-500 font-medium">Mother's Name:</span>
                      <strong className="text-slate-900 dark:text-slate-200 uppercase font-semibold">
                        {verifiedRecord.motherName.toUpperCase()}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Class &amp; Section:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          {verifiedRecord.className} ({verifiedRecord.sectionName || 'General'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Class Roll:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          {verifiedRecord.rollNumber}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-1.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Academic Session:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          {verifiedRecord.session}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Date of Issue:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                          {new Date(verifiedRecord.issueDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-medium">Institution &amp; EIIN:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {institute?.name || 'Ideal School & College'} (EIIN: {institute?.eiin || '134215'})
                      </span>
                    </div>
                  </div>

                  {/* QR & ACTIONS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2">
                      <QrCodeSvg
                        value={`https://verify.edu.bd/cert/${verifiedRecord.verificationCode}|${verifiedRecord.certificateNumber}`}
                        size={42}
                      />
                      <div className="text-[10px] text-slate-500 font-mono">
                        <span className="block font-bold text-emerald-800 dark:text-emerald-400">
                          {verifiedRecord.verificationCode}
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">✓ Cryptographically Valid</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Auto-Generated Official Verification Certificate Button */}
                      <button
                        onClick={() => {
                          stopCamera();
                          setReportStatus('verified');
                          setReportRecord(verifiedRecord);
                          setReportQueriedQuery(verifiedRecord.certificateNumber);
                          setShowVerificationReport(true);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        title="Generate official Verification Certificate (প্রত্যয়নপত্র)"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Official Verification Certificate</span>
                      </button>

                      {/* View & Print Original Certificate */}
                      <button
                        onClick={() => {
                          stopCamera();
                          onViewPrint(verifiedRecord);
                        }}
                        className="px-3 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        title="View Original Certificate Document"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Original Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE B: UNSUCCESSFUL / NOT VERIFIED RESULT */
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400 dark:border-rose-800/80 text-center space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 dark:text-rose-200">
                      NO MATCHING INSTITUTIONAL RECORD FOUND
                    </h4>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300/80 max-w-sm mx-auto mt-0.5">
                      The queried document serial or code was not found in the official records archive.
                    </p>
                  </div>

                  {/* Queried Code & Scanned QR preview */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/60 text-left flex items-center justify-between gap-3 shadow-2xs">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                        Queried Serial / Barcode / QR:
                      </span>
                      <strong className="font-mono text-xs font-black text-rose-800 dark:text-rose-300 block truncate">
                        {searchFailedQuery || query || 'NO_IDENTIFIER_DETECTED'}
                      </strong>
                      <span className="text-[9.5px] text-rose-600 dark:text-rose-400 font-semibold block">
                        Status: Unverified / Not in Authorized Registry
                      </span>
                    </div>

                    <div className="p-1 bg-white border border-slate-200 rounded shrink-0">
                      <QrCodeSvg value={searchFailedQuery || query || 'UNVERIFIED_QUERY'} size={40} />
                    </div>
                  </div>

                  {/* AUTO-GENERATE NON-VERIFICATION CERTIFICATE BUTTON */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        stopCamera();
                        setReportStatus('unverified');
                        setReportRecord(null);
                        setReportQueriedQuery(searchFailedQuery || query || 'UNVERIFIED_QUERY');
                        setShowVerificationReport(true);
                      }}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Generate &amp; Print Non-Verification Certificate (অপ্রমাণিত সনদপত্র প্রত্যয়নপত্র)</span>
                    </button>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Instantly generates an official institutional alert certificate carrying this queried number &amp; QR code.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AUTO-GENERATED VERIFICATION / NON-VERIFICATION CERTIFICATE MODAL */}
      {showVerificationReport && (
        <DocumentVerificationCertificateModal
          isOpen={showVerificationReport}
          onClose={() => setShowVerificationReport(false)}
          status={reportStatus}
          record={reportRecord}
          queriedNumberOrCode={reportQueriedQuery}
          queriedPayload={reportQueriedQuery}
          institute={institute}
        />
      )}
    </div>
  );
};
