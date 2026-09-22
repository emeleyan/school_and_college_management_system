import React from 'react';

/**
 * Generates an SVG Barcode based on input string
 */
export const BarcodeSvg: React.FC<{
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}> = ({ value, width = 160, height = 40, showText = true, className = '' }) => {
  // Generate deterministic bar widths from character codes
  const bars: { x: number; w: number }[] = [];
  let currentX = 5;
  const totalBarWidth = width - 10;
  
  // Create pattern from string
  const cleanVal = value.replace(/[^A-Z0-9-]/gi, '').toUpperCase() || 'ID123456';
  const patternSeed = cleanVal.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);

  for (let i = 0; i < 35; i++) {
    const isBar = (patternSeed * (i + 7) + i * 13) % 10 > 3;
    const w = ((patternSeed + i * 3) % 3 === 0 ? 3 : (patternSeed + i) % 2 === 0 ? 2 : 1.2);
    if (isBar && currentX + w < totalBarWidth) {
      bars.push({ x: currentX, w });
    }
    currentX += w + 1.2;
    if (currentX >= totalBarWidth - 6) break;
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        <rect width={width} height={height} fill="transparent" />
        {/* Guard bars */}
        <rect x="2" y="2" width="2" height={height - (showText ? 14 : 4)} fill="#0f172a" />
        <rect x="6" y="2" width="1.5" height={height - (showText ? 14 : 4)} fill="#0f172a" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="2"
            width={bar.w}
            height={height - (showText ? 14 : 4)}
            fill="#0f172a"
          />
        ))}
        {/* End guard bars */}
        <rect x={width - 8} y="2" width="1.5" height={height - (showText ? 14 : 4)} fill="#0f172a" />
        <rect x={width - 4} y="2" width="2" height={height - (showText ? 14 : 4)} fill="#0f172a" />
      </svg>
      {showText && (
        <span className="text-[9px] font-mono tracking-widest text-slate-700 dark:text-slate-300 font-bold -mt-2">
          *{cleanVal}*
        </span>
      )}
    </div>
  );
};

/**
 * Generates an SVG 2D QR Code representation with authentic corner finder patterns
 */
export const QrCodeSvg: React.FC<{
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}> = ({
  value,
  size = 72,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
}) => {
  const gridSize = 21; // Standard Version 1 QR code 21x21 modules
  const moduleSize = size / gridSize;

  // Pseudo-random deterministic module matrix based on string
  const modules: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  // Helper to place 7x7 finder pattern
  const placeFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        } else {
          modules[row + r][col + c] = false;
        }
      }
    }
  };

  // 1. Finder patterns at Top-Left, Top-Right, Bottom-Left
  placeFinder(0, 0);
  placeFinder(0, gridSize - 7);
  placeFinder(gridSize - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // 3. Fill data modules based on data string hash
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder zones and separators
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= gridSize - 8;
      const inBL = r >= gridSize - 8 && c < 8;
      const inTiming = r === 6 || c === 6;

      if (!inTL && !inTR && !inBL && !inTiming) {
        const bit = Math.abs((hash ^ (r * 31 + c * 17) ^ (r * c)) % 3) !== 0;
        modules[r][c] = bit;
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`inline-block ${className}`}
      style={{ backgroundColor: lightColor, padding: '2px', borderRadius: '4px' }}
    >
      {modules.map((row, rIdx) =>
        row.map((isDark, cIdx) =>
          isDark ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * moduleSize}
              y={rIdx * moduleSize}
              width={moduleSize + 0.1}
              height={moduleSize + 0.1}
              fill={darkColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};
