/**
 * Image and Digital Signature Utility Functions
 * Supports Base64 conversion, canvas compression, automated signature extraction, and preset emblems/signatures
 */
import { processDigitalSignature, SignatureProcessOptions } from './signatureProcessor';
export { processDigitalSignature, type SignatureProcessOptions };

export interface ProcessSignatureImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  sharpenStrength?: number; // 0.1 to 2.0, default ~1.2
  backgroundThreshold?: number; // 0-255 luminance cut-off
  trimPadding?: number;
}

/**
 * Processes an image file using an HTML Canvas element to:
 * 1. Remove background noise and transparency (paper textures, shadow gradients, desk wood)
 * 2. Convert all pen ink strokes into pure deep black (rgb 0, 0, 0)
 * 3. Apply a 3x3 convolution sharpening filter to enhance signature readability for digital ERP usage
 * 
 * @param fileOrDataUrl - A File object or Base64 data URL of the signature image
 * @param options - Custom processing configuration
 * @returns Promise<string> - Cleaned, high-contrast, sharpened PNG data URL with transparent background
 */
export async function processSignatureImage(
  fileOrDataUrl: File | string,
  options: ProcessSignatureImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 600,
    sharpenStrength = 1.25,
    trimPadding = 12,
  } = options;

  // 1. Resolve source to an image element
  let dataUrl: string;
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image into canvas'));
    image.src = dataUrl;
  });

  // Calculate target canvas dimensions
  let srcW = img.naturalWidth || img.width || 800;
  let srcH = img.naturalHeight || img.height || 400;
  const ratio = Math.min(1, maxWidth / srcW, maxHeight / srcH);
  const targetW = Math.max(1, Math.round(srcW * ratio));
  const targetH = Math.max(1, Math.round(srcH * ratio));

  // 2. Create primary canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return dataUrl;

  ctx.clearRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const imgData = ctx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;
  const totalPixels = targetW * targetH;

  // 3. Remove Background Noise & Convert to Pure Black
  // Sample paper border luminance to detect background vs ink threshold
  let bgLuminanceSum = 0;
  let bgSampleCount = 0;
  const marginX = Math.max(2, Math.floor(targetW * 0.05));
  const marginY = Math.max(2, Math.floor(targetH * 0.05));

  for (let y = 0; y < targetH; y += 2) {
    for (let x = 0; x < targetW; x += 2) {
      if (x < marginX || x > targetW - marginX || y < marginY || y > targetH - marginY) {
        const idx = (y * targetW + x) * 4;
        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        bgLuminanceSum += lum;
        bgSampleCount++;
      }
    }
  }

  const estimatedBgLum = bgSampleCount > 0 ? bgLuminanceSum / bgSampleCount : 240;
  // Any luminance within 18% of paper background is treated as noise/paper and stripped to 0 alpha
  const paperCutoff = options.backgroundThreshold ?? Math.max(160, estimatedBgLum - 35);
  // Pure solid ink cutoff
  const inkCutoff = Math.max(40, paperCutoff - 70);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const originalAlpha = data[i + 3];

    if (originalAlpha < 20) {
      data[i + 3] = 0;
      continue;
    }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum >= paperCutoff) {
      // Background noise / paper -> 100% transparent
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    } else if (lum <= inkCutoff) {
      // Solid ink stroke -> 100% Pure Black (rgb: 0, 0, 0)
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    } else {
      // Anti-aliased transition stroke -> Convert color to Pure Black with heightened alpha
      const t = 1.0 - (lum - inkCutoff) / (paperCutoff - inkCutoff);
      const alphaBoost = Math.min(255, Math.round(Math.pow(t, 0.75) * 255 * 1.15));
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = alphaBoost;
    }
  }

  // 4. Apply Sharpening Filter Kernel (3x3 spatial convolution on alpha mask)
  const alphaBuffer = new Uint8ClampedArray(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    alphaBuffer[i] = data[i * 4 + 3];
  }

  // 3x3 Sharpening kernel: [ 0, -1, 0, -1, 5, -1, 0, -1, 0 ] scaled by sharpenStrength
  const centerWeight = 1.0 + 4.0 * (sharpenStrength * 0.25);
  const edgeWeight = (sharpenStrength * 0.25);

  const sharpenedAlpha = new Uint8ClampedArray(totalPixels);
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const idx = y * targetW + x;
      const cur = alphaBuffer[idx];
      if (cur === 0) {
        sharpenedAlpha[idx] = 0;
        continue;
      }
      if (x === 0 || x === targetW - 1 || y === 0 || y === targetH - 1) {
        sharpenedAlpha[idx] = cur;
        continue;
      }

      const up = alphaBuffer[(y - 1) * targetW + x];
      const down = alphaBuffer[(y + 1) * targetW + x];
      const left = alphaBuffer[y * targetW + (x - 1)];
      const right = alphaBuffer[y * targetW + (x + 1)];

      const val = cur * centerWeight - (up + down + left + right) * edgeWeight;
      sharpenedAlpha[idx] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }

  for (let i = 0; i < totalPixels; i++) {
    data[i * 4 + 3] = sharpenedAlpha[i];
  }

  ctx.putImageData(imgData, 0, 0);

  // 5. Trim bounding box and frame signature
  let minX = targetW, maxX = 0, minY = targetH, maxY = 0;
  let hasInk = false;

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const a = data[(y * targetW + x) * 4 + 3];
      if (a > 20) {
        hasInk = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasInk) {
    return canvas.toDataURL('image/png');
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const outCanvas = document.createElement('canvas');
  outCanvas.width = cropW + trimPadding * 2;
  outCanvas.height = cropH + trimPadding * 2;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas.toDataURL('image/png');

  outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);
  outCtx.drawImage(
    canvas,
    minX, minY, cropW, cropH,
    trimPadding, trimPadding, cropW, cropH
  );

  return outCanvas.toDataURL('image/png');
}

// Re-export as alias for maximum developer convenience
export const cleanAndSharpenSignature = processSignatureImage;

// Convert File to Base64 with optional canvas resize for optimal IndexedDB storage
export async function fileToBase64(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.92,
  isSignature = false
): Promise<string> {
  // If explicitly flagged as a signature, process through our digital signature engine
  if (isSignature) {
    return processDigitalSignature(file, { maxWidth, maxHeight });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }

      // If SVG, return as is
      if (file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }

      // Resize via HTMLCanvas
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);
          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        // If PNG or WebP keep png for alpha transparency, else jpeg
        const isTransparent = file.type === 'image/png' || file.type === 'image/webp' || file.type.includes('png');
        try {
          const dataUrl = canvas.toDataURL(isTransparent ? 'image/png' : 'image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => {
        // Fallback to raw base64
        resolve(result);
      };
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Pre-generated vector SVG logo presets for School and College
 */
export const PRESET_INSTITUTE_LOGOS = {
  schoolCrest: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="%23047857" stroke="%23064e3b" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="%23ffffff" stroke="%23f59e0b" stroke-width="2"/><path d="M50 20 L68 32 L50 44 L32 32 Z" fill="%23047857"/><path d="M50 45 L50 64" stroke="%23047857" stroke-width="2.5"/><path d="M36 48 C42 54 48 54 50 50 C52 54 58 54 64 48 L64 62 C58 66 52 66 50 63 C48 66 42 66 36 62 Z" fill="%23f59e0b"/><path d="M40 76 L60 76 M43 79 L57 79" stroke="%23047857" stroke-width="2" stroke-linecap="round"/><circle cx="50" cy="32" r="3" fill="%23fef08a"/></svg>`,
  collegeCrest: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="46" fill="%231e3a8a" stroke="%23172554" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="%23ffffff" stroke="%233b82f6" stroke-width="2"/><path d="M50 18 L72 32 L50 46 L28 32 Z" fill="%231e3a8a"/><polygon points="50,22 55,34 68,34 57,42 61,54 50,46 39,54 43,42 32,34 45,34" fill="%23fbbf24"/><path d="M38 58 Q50 68 62 58 L62 68 Q50 78 38 68 Z" fill="%233b82f6"/><path d="M45 78 L55 78" stroke="%231e3a8a" stroke-width="2" stroke-linecap="round"/></svg>`,
  academicEmblem: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect x="10" y="10" width="80" height="80" rx="20" fill="%234338ca"/><circle cx="50" cy="50" r="30" fill="%23ffffff"/><path d="M50 28 L66 38 L50 48 L34 38 Z" fill="%234338ca"/><path d="M38 52 C44 56 56 56 62 52 L62 64 C56 68 44 68 38 64 Z" fill="%236366f1"/><circle cx="50" cy="38" r="3" fill="%23fbbf24"/></svg>`,
};

/**
 * Pre-generated realistic handwritten digital signatures
 */
export const PRESET_DIGITAL_SIGNATURES = {
  principal: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80"><path d="M 20 50 Q 35 15 50 48 T 75 42 Q 90 20 105 52 T 130 38 Q 150 10 165 45 T 195 40 Q 215 35 225 38" fill="none" stroke="%231e3a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M 35 60 Q 110 52 210 58" fill="none" stroke="%231e3a8a" stroke-width="1.8" stroke-linecap="round"/><circle cx="218" cy="56" r="2.2" fill="%231e3a8a"/><text x="18" y="75" font-family="sans-serif" font-size="9" fill="%2364748b" letter-spacing="1">DIGITALLY VERIFIED</text></svg>`,
  vicePrincipal: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80"><path d="M 25 45 Q 40 18 60 55 T 85 35 Q 110 25 125 50 T 155 42 Q 175 22 190 48 T 220 40" fill="none" stroke="%230f766e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 40 62 Q 120 56 205 60" fill="none" stroke="%230f766e" stroke-width="1.8" stroke-linecap="round"/><circle cx="212" cy="59" r="2" fill="%230f766e"/><text x="25" y="75" font-family="sans-serif" font-size="9" fill="%230f766e" letter-spacing="1">VICE PRINCIPAL SIGN</text></svg>`,
  actingPrincipal: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80"><path d="M 20 40 Q 30 15 55 48 T 80 40 Q 100 20 120 54 T 145 35 Q 165 15 185 45 T 215 38" fill="none" stroke="%239333ea" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M 30 58 Q 115 50 205 56" fill="none" stroke="%239333ea" stroke-width="1.8" stroke-linecap="round"/><text x="20" y="75" font-family="sans-serif" font-size="9" fill="%239333ea" font-weight="bold" letter-spacing="0.5">ACTING PRINCIPAL (ভারপ্রাপ্ত অধ্যক্ষ)</text></svg>`,
  headmaster: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80" width="240" height="80"><path d="M 15 55 Q 35 15 65 50 T 95 38 Q 115 18 135 52 T 165 40 Q 185 20 205 48 T 225 35" fill="none" stroke="%230369a1" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M 25 64 Q 115 55 215 60" fill="none" stroke="%230369a1" stroke-width="1.8" stroke-linecap="round"/><text x="18" y="76" font-family="sans-serif" font-size="9" fill="%230369a1" letter-spacing="1">HEADMASTER SIGNATURE</text></svg>`,
};
