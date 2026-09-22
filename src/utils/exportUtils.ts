/**
 * Export and Utility functions for Reports Center & Universal ERP Export
 * Supports UTF-8 with BOM for Bengali script compatibility in Microsoft Excel
 * Supports PDF generation with configurable page size (A4 vs Legal) and orientation (Portrait vs Landscape)
 */

export type PaperSize = 'A4' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): void {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays Bangla characters correctly
  const csvContent =
    '\uFEFF' +
    [
      headers.map((h) => `"${String(h ?? '').replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.endsWith('.csv') ? filename : filename + '.csv'}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Alias for Excel export
export const exportToExcel = exportToCsv;

export interface PrintPdfOptions {
  title: string;
  subtitle?: string;
  instituteName?: string;
  instituteEiin?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
  paperSize?: PaperSize; // 'A4' | 'Legal'
  orientation?: PageOrientation; // 'portrait' | 'landscape'
  metaDetails?: { label: string; value: string }[];
  footerNote?: string;
}

export function printOrSavePdf(options: PrintPdfOptions): void {
  const {
    title,
    subtitle = '',
    instituteName = 'School & College Management System',
    instituteEiin = '',
    headers,
    rows,
    paperSize = 'A4',
    orientation = 'portrait',
    metaDetails = [],
    footerNote = 'Generated automatically by School & College ERP',
  } = options;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to preview and print or save the PDF document.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${instituteName}</title>
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: 12mm 10mm 12mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "SolaimanLipi", "Kalpurush", sans-serif;
      font-size: 11px;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.4;
      padding: 10px;
    }
    .header-box {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .inst-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e40af;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .doc-subtitle {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 12px;
      font-size: 10px;
    }
    .meta-item {
      display: flex;
      gap: 4px;
    }
    .meta-label {
      font-weight: 600;
      color: #64748b;
    }
    .meta-val {
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      font-size: 10px;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #0f172a;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.2px;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer-box {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748b;
    }
    .sign-row {
      margin-top: 35px;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
    }
    .sign-line {
      border-top: 1px solid #475569;
      width: 140px;
      text-align: center;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 600;
      color: #334155;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="padding: 6px 14px; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Print / Save as PDF (${paperSize} - ${orientation})
    </button>
    <button onclick="window.close()" style="padding: 6px 14px; background: #64748b; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Close
    </button>
  </div>

  <div class="header-box">
    <div class="inst-name">${instituteName}</div>
    ${instituteEiin ? `<div class="inst-meta">EIIN: ${instituteEiin} | Academic Session Export</div>` : ''}
    <div class="doc-title">${title}</div>
    ${subtitle ? `<div class="doc-subtitle">${subtitle}</div>` : ''}
  </div>

  <div class="meta-bar">
    <div class="meta-item"><span class="meta-label">Total Records:</span> <span class="meta-val">${rows.length}</span></div>
    <div class="meta-item"><span class="meta-label">Page Spec:</span> <span class="meta-val">${paperSize} (${orientation.toUpperCase()})</span></div>
    <div class="meta-item"><span class="meta-label">Export Date:</span> <span class="meta-val">${generatedDate}</span></div>
    ${metaDetails
      .map(
        (m) =>
          `<div class="meta-item"><span class="meta-label">${m.label}:</span> <span class="meta-val">${m.value}</span></div>`
      )
      .join('')}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row, idx) => `
        <tr>
          <td style="text-align: center; color: #64748b;">${idx + 1}</td>
          ${row.map((cell) => `<td>${cell !== null && cell !== undefined ? String(cell) : '-'}</td>`).join('')}
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="sign-row">
    <div class="sign-line">Prepared By</div>
    <div class="sign-line">Checked By</div>
    <div class="sign-line">Head of Institute</div>
  </div>

  <div class="footer-box">
    <span>${footerNote}</span>
    <span>Page Layout: ${paperSize} ${orientation} • Printed: ${generatedDate}</span>
  </div>

  <script>
    window.onload = function() {
      // Small delay to allow fonts and styles to render
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function formatCurrencyBDT(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('BDT', '৳');
}
