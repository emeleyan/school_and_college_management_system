/**
 * Automated Digital Signature Processing Engine
 * 
 * Automatically transforms any uploaded signature (from paper photos, mobile camera,
 * flatbed scanners, or digital pens) into a crisp, high-resolution digital signature:
 * 
 * 1. Background Removal:
 *    Completely strips away paper, shadows, desk surfaces, and lighting gradients,
 *    leaving a 100% transparent alpha background.
 * 
 * 2. Pure Black Ink Conversion:
 *    Normalizes any pen ink color (blue ballpoint, gel pen, pencil, red, or faded ink)
 *    into rich, authoritative deep black (#000000) ink.
 * 
 * 3. Sharpness Enhancement & Digital Clarity:
 *    Refines low-sharpness, blurry, or low-contrast strokes using adaptive thresholding,
 *    sub-pixel anti-aliased edge smoothing, and a 2D sharpening kernel to crisp up fine
 *    loops, pen flicks, and signature details.
 * 
 * 4. Auto-Trimming & Framing:
 *    Detects the exact ink bounding box, trims away excess empty white space, and frames
 *    the signature with clean, proportional margins.
 * 
 * 5. Returns a lossless transparent PNG data URL.
 */

export interface SignatureProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  crispnessBoost?: number;
  trimPadding?: number;
}

/**
 * Loads an image from a Data URL or File into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load signature image for processing'));
    img.src = src;
  });
}

/**
 * Converts a File object to Data URL string
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Core processor: transforms a signature image into a transparent, sharp, pure black digital signature
 */
export async function processDigitalSignature(
  source: File | string,
  options: SignatureProcessOptions = {}
): Promise<string> {
  try {
    const rawDataUrl = typeof source === 'string' ? source : await fileToDataUrl(source);

    // If source is vector SVG data, load it onto a high-res canvas to standardize to crisp black
    const img = await loadImage(rawDataUrl);

    let origW = img.naturalWidth || img.width || 800;
    let origH = img.naturalHeight || img.height || 300;

    // Maintain high resolution for razor-sharp rendering, cap maximum dimension to 1400px
    const maxDim = options.maxWidth || 1400;
    let targetW = origW;
    let targetH = origH;
    if (targetW > maxDim || targetH > maxDim) {
      const scale = maxDim / Math.max(targetW, targetH);
      targetW = Math.max(1, Math.round(targetW * scale));
      targetH = Math.max(1, Math.round(targetH * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return rawDataUrl;

    // Draw initial image
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;
    const totalPixels = targetW * targetH;

    // STEP 1: Check if the image already has significant transparency
    let transparentCount = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparentCount++;
    }
    const isAlreadyTransparent = transparentCount / totalPixels > 0.12;

    if (isAlreadyTransparent) {
      // Image already has a transparent background (e.g. PNG with cut-out or digital pen)
      // Convert ink to pure black and enhance sharpness
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 15) {
          data[i + 3] = 0;
        } else {
          // Pure Black Ink
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          // Sharpness curve on alpha
          const normA = a / 255;
          const boostedA = Math.min(255, Math.round(Math.pow(normA, 0.7) * 1.25 * 255));
          data[i + 3] = boostedA;
        }
      }
    } else {
      // STEP 2: Paper Background Analysis (for photos, scans, camera captures)
      // Sample perimeter border pixels to gauge the paper background luminance
      const borderThicknessX = Math.max(2, Math.floor(targetW * 0.04));
      const borderThicknessY = Math.max(2, Math.floor(targetH * 0.04));
      const borderLums: number[] = [];

      for (let y = 0; y < targetH; y += 2) {
        for (let x = 0; x < targetW; x += 2) {
          const isBorder =
            x < borderThicknessX ||
            x >= targetW - borderThicknessX ||
            y < borderThicknessY ||
            y >= targetH - borderThicknessY;
          if (isBorder) {
            const idx = (y * targetW + x) * 4;
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            borderLums.push(lum);
          }
        }
      }

      // Sort border luminance to find paper background level
      borderLums.sort((a, b) => a - b);
      // Use 75th percentile to guard against any stroke extending into the border
      const p75Idx = Math.floor(borderLums.length * 0.75);
      const bgLum = borderLums.length > 0 ? borderLums[p75Idx] : 240;

      // Find ink luminance level across the image
      let minLum = 255;
      for (let i = 0; i < data.length; i += 8) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum < minLum) minLum = lum;
      }

      // Calculate dynamic contrast range
      const lumRange = Math.max(20, bgLum - minLum);

      // Paper cutoff threshold (pixels brighter than this are 100% transparent paper background)
      const tHigh = bgLum - Math.max(10, lumRange * 0.15);

      // Solid ink threshold (pixels darker than this are 100% solid black ink)
      const tLow = minLum + lumRange * 0.35;

      // STEP 3: Background Removal + Black Ink Normalization + Anti-aliased Sharpness
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum >= tHigh) {
          // Paper background -> completely transparent
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        } else if (lum <= tLow) {
          // Solid ink stroke -> rich deep black
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 255;
        } else {
          // Anti-aliased edge: apply power curve to boost edge sharpness and remove blur
          const factor = 1.0 - (lum - tLow) / (tHigh - tLow);
          const sharpenedFactor = Math.min(1.0, Math.pow(factor, 0.72) * 1.25);
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = Math.round(sharpenedFactor * 255);
        }
      }
    }

    // STEP 4: 2D Sharpening Kernel (Unsharp Mask on Alpha Channel)
    // Enhances pen loops, fine flourishes, dots, and stroke clarity
    const alphaMap = new Uint8ClampedArray(totalPixels);
    for (let idx = 0; idx < totalPixels; idx++) {
      alphaMap[idx] = data[idx * 4 + 3];
    }

    const sharpenedAlpha = new Uint8ClampedArray(totalPixels);
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const idx = y * targetW + x;
        const current = alphaMap[idx];

        if (current === 0) {
          sharpenedAlpha[idx] = 0;
          continue;
        }

        if (x === 0 || x === targetW - 1 || y === 0 || y === targetH - 1) {
          sharpenedAlpha[idx] = current;
          continue;
        }

        const top = alphaMap[(y - 1) * targetW + x];
        const bottom = alphaMap[(y + 1) * targetW + x];
        const left = alphaMap[y * targetW + (x - 1)];
        const right = alphaMap[y * targetW + (x + 1)];

        // Unsharp mask kernel: boosts center relative to blurry neighbor pen edges
        const sharpened = current * 1.8 - 0.2 * (top + bottom + left + right);
        sharpenedAlpha[idx] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }

    // Write sharpened alpha back
    for (let idx = 0; idx < totalPixels; idx++) {
      data[idx * 4 + 3] = sharpenedAlpha[idx];
    }

    // STEP 5: Auto-Trim Bounding Box to eliminate useless outer paper margins
    let minX = targetW;
    let maxX = 0;
    let minY = targetH;
    let maxY = 0;
    let hasInk = false;

    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const a = data[(y * targetW + x) * 4 + 3];
        if (a > 18) {
          hasInk = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If no ink was detected, fallback gracefully
    if (!hasInk) {
      return rawDataUrl;
    }

    // Put modified data onto canvas
    ctx.putImageData(imgData, 0, 0);

    // Calculate crop dimensions with proportional breathing room padding
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const padX = options.trimPadding ?? Math.max(16, Math.round(cropW * 0.05));
    const padY = options.trimPadding ?? Math.max(12, Math.round(cropH * 0.08));

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = cropW + padX * 2;
    finalCanvas.height = cropH + padY * 2;
    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return rawDataUrl;

    // Clean transparent background
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Copy cropped, sharpened, pure-black signature onto final canvas
    finalCtx.drawImage(
      canvas,
      minX, minY, cropW, cropH,
      padX, padY, cropW, cropH
    );

    // Return high-quality transparent PNG
    return finalCanvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error processing digital signature:', err);
    // Fallback to original
    return typeof source === 'string' ? source : await fileToDataUrl(source);
  }
}

// Export alias for universal ERP image utility usage
export const processSignatureImage = processDigitalSignature;

