import { LabOrder, Patient, TestCatalogItem, OrderResultReport, LabProfile } from '../types/lims';
import { formatPKR, formatLabDate } from './formatters';

/**
 * Trigger browser file download from Blob
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export data array to CSV file
 */
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  triggerFileDownload(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Generate and download a standalone, self-contained printable HTML Diagnostic Report
 */
export function downloadStandaloneReportHTML(
  order: LabOrder,
  patient: Patient,
  catalog: TestCatalogItem[],
  report?: OrderResultReport,
  profile?: LabProfile,
  technologistName?: string,
  technologistDesignation?: string
) {
  const labName = profile?.labName || 'Lab-Portal-App';
  const tagline = profile?.tagline || 'ISO 15189:2022 Certified · Reg: Healthcare Commission PHC/SHC-9201';
  const contactLine = `${profile?.address || 'Main Campus: Blue Area, Islamabad'} | UAN: ${profile?.phone || '+92 (51) 848-4200'}`;
  const pathologistName = report?.approvedBy || profile?.chiefPathologist || 'Prof. Dr. Tariq Mahmood';
  const pathologistQual = profile?.pathologistQualification || 'MBBS, M.Phil (Pathology), FRCPath';

  const testItems = order.tests.map(code => catalog.find(t => t.code === code)).filter(Boolean) as TestCatalogItem[];

  let testsTableHtml = '';

  testItems.forEach(test => {
    const testResults = report?.results?.filter(r => r.testCode === test.code) || [];

    let rowsHtml = '';
    if (test.subHeadings && test.subHeadings.length > 0) {
      test.subHeadings.forEach(sh => {
        rowsHtml += `
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="5" style="padding: 6px 12px; color: #0f766e; font-size: 11px;">
              • ${sh.title}
            </td>
          </tr>
        `;
        sh.parameters.forEach(param => {
          const res = testResults.find(r => r.parameterId === param.id);
          const val = res?.value || param.defaultValue || '-';
          const flag = res?.flag || 'Normal';
          const isHigh = flag === 'High';
          const isLow = flag === 'Low';
          const isCritical = flag === 'Critical';

          const valStyle = isCritical
            ? 'color: #b91c1c; font-weight: bold; text-decoration: underline;'
            : isHigh
            ? 'color: #dc2626; font-weight: bold;'
            : isLow
            ? 'color: #2563eb; font-weight: bold;'
            : 'color: #0f172a; font-weight: 600;';

          const flagBadge = isHigh
            ? '<span style="color: #dc2626; font-weight: bold;">HIGH ▲</span>'
            : isLow
            ? '<span style="color: #2563eb; font-weight: bold;">LOW ▼</span>'
            : isCritical
            ? '<span style="color: #b91c1c; font-weight: bold;">CRITICAL ⚠️</span>'
            : '<span style="color: #94a3b8;">Normal</span>';

          rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; ${isHigh || isLow || isCritical ? 'background-color: #fffbeb;' : ''}">
              <td style="padding: 7px 12px;">${param.name}</td>
              <td style="padding: 7px 10px; font-family: monospace; ${valStyle}">${val}</td>
              <td style="padding: 7px 10px; text-align: center; font-size: 10px;">${flagBadge}</td>
              <td style="padding: 7px 10px; font-family: monospace; color: #475569;">${param.normalRangeText || '-'}</td>
              <td style="padding: 7px 10px; font-family: monospace; color: #64748b;">${param.unit || '-'}</td>
            </tr>
          `;
        });
      });
    }

    testsTableHtml += `
      <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
        <div style="background-color: #e2e8f0; padding: 8px 14px; font-weight: bold; font-size: 13px; display: flex; justify-content: space-between;">
          <span>${test.name} (${test.category})</span>
          <span style="font-size: 11px; font-weight: normal; color: #475569;">Specimen: ${test.specimen}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 7px 12px; width: 40%;">Investigation / Parameter</th>
              <th style="padding: 7px 10px; width: 18%;">Observed Value</th>
              <th style="padding: 7px 10px; width: 12%; text-align: center;">Flag</th>
              <th style="padding: 7px 10px; width: 18%;">Reference Interval</th>
              <th style="padding: 7px 10px; width: 12%;">Unit</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Diagnostic Report - ${order.id} - ${patient.name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      line-height: 1.4;
    }
    .container { max-width: 820px; margin: 0 auto; }
    .header { border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
    .header-left h1 { font-size: 20px; margin: 0 0 4px 0; color: #0f172a; letter-spacing: -0.5px; }
    .header-left p { margin: 0; font-size: 11px; color: #64748b; }
    .demographics { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 11px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .demo-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; margin-bottom: 2px; }
    .demo-val { font-weight: bold; color: #0f172a; }
    .remarks { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-top: 20px; font-size: 11px; }
    .footer { margin-top: 28px; border-top: 2px solid #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; }
    .btn-print { background: #0f766e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 16px; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print" style="text-align: right;">
      <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
    </div>

    ${profile?.headerType === 'custom_banner' && profile?.headerBannerUrl ? `
      <div style="border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px;">
        <img src="${profile.headerBannerUrl}" alt="${labName}" style="width: 100%; max-height: 120px; object-fit: contain; margin: 0 auto; display: block;" />
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-family: monospace; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
          <div>SAMPLE ID: <strong style="color: #0f766e;">${order.sampleBarcode}</strong></div>
          <div>ORDER REF: <strong>${order.id}</strong></div>
        </div>
      </div>
    ` : `
      <div class="header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${profile?.logoUrl ? `<img src="${profile.logoUrl}" alt="${labName}" style="width: ${profile.logoWidth || 80}px; max-height: 70px; object-fit: contain;" />` : ''}
          <div class="header-left">
            <h1 style="font-size: 20px; margin: 0 0 4px 0; color: #0f172a; letter-spacing: -0.5px;">${labName}</h1>
            <p style="margin: 0; font-size: 11px; color: #64748b;"><strong>${tagline}</strong></p>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${contactLine}</p>
          </div>
        </div>
        <div style="text-align: right; font-family: monospace;">
          <div style="font-size: 12px; font-weight: bold; color: #0f766e;">SAMPLE ID: ${order.sampleBarcode}</div>
          <div style="font-size: 10px; color: #64748b;">ORDER: ${order.id}</div>
        </div>
      </div>
    `}

    <div class="demographics">
      <div>
        <div class="demo-label">Patient Name</div>
        <div class="demo-val" style="font-size: 13px;">${patient.name}</div>
      </div>
      <div>
        <div class="demo-label">MRN / Patient ID</div>
        <div class="demo-val" style="font-family: monospace;">${patient.id}</div>
      </div>
      <div>
        <div class="demo-label">Age / Gender</div>
        <div class="demo-val">${patient.age} Yrs / ${patient.gender}</div>
      </div>
      <div>
        <div class="demo-label">CNIC No.</div>
        <div class="demo-val" style="font-family: monospace;">${patient.cnic || 'N/A'}</div>
      </div>
      <div>
        <div class="demo-label">Referred By</div>
        <div class="demo-val">${order.referredByDoctor || 'Self'}</div>
      </div>
      <div>
        <div class="demo-label">Booking Date</div>
        <div class="demo-val">${formatLabDate(order.bookingDate)}</div>
      </div>
      <div>
        <div class="demo-label">Reporting Date</div>
        <div class="demo-val">${report?.approvedAt ? formatLabDate(report.approvedAt) : formatLabDate(new Date().toISOString())}</div>
      </div>
      <div>
        <div class="demo-label">Specimen</div>
        <div class="demo-val">${order.sampleType}</div>
      </div>
    </div>

    ${testsTableHtml}

    <div class="remarks">
      <div style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #475569; margin-bottom: 4px;">
        Pathologist Clinical Interpretation:
      </div>
      <div style="font-style: italic; color: #334155;">
        ${report?.pathologistRemarks || 'Laboratory values should be interpreted in clinical correlation with symptoms and medical history.'}
      </div>
    </div>

    <div class="footer">
      <div>
        <div style="font-weight: bold;">${technologistName || 'Muhammad Bilal, MLT'}</div>
        <div style="color: #64748b; font-size: 10px;">${technologistDesignation || 'Senior Medical Laboratory Technologist (MLT)'}</div>
        <div style="color: #0f766e; font-size: 9px; font-weight: bold; margin-top: 2px;">Verified & Generated on Analyzer</div>
      </div>
      <div style="text-align: center;">
        <div style="border: 1px solid #cbd5e1; padding: 4px; display: inline-block; background: #fff; font-size: 9px; color: #64748b;">
          [QR Code Verified]
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: Georgia, serif; font-style: italic; color: #0f766e; font-size: 14px; font-weight: bold;">${pathologistName}</div>
        <div style="font-weight: bold;">${pathologistName}</div>
        <div style="color: #64748b; font-size: 10px;">${pathologistQual}</div>
        <div style="font-size: 9px; color: #0f766e; font-weight: bold; margin-top: 2px;">✓ DIGITALLY SIGNED & AUTHORIZED</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  triggerFileDownload(fullHtml, `Diagnostic_Report_${order.id}_${patient.name.replace(/\s+/g, '_')}.html`, 'text/html;charset=utf-8;');
}

/**
 * Generate and download a standalone, self-contained printable HTML Invoice / Thermal slip
 */
export function downloadStandaloneInvoiceHTML(
  order: LabOrder,
  patient: Patient,
  catalog: TestCatalogItem[],
  profile?: LabProfile
) {
  const labName = profile?.labName || 'Lab-Portal-App';
  const tagline = profile?.tagline || 'Clinical Pathology Laboratory';
  const contact = `UAN: ${profile?.phone || '+92 51 8484200'} · Reg: ${profile?.registrationNumber || 'PHC-LAB-9201'}`;

  const testItems = order.tests.map(code => catalog.find(t => t.code === code)).filter(Boolean) as TestCatalogItem[];
  const balanceDue = Math.max(0, order.netAmount - order.paidAmount);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${order.id} - ${patient.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 30px;
    }
    .invoice-card {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    .table th, .table td { padding: 8px 12px; text-align: left; }
    .table th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .table td { border-bottom: 1px solid #e2e8f0; }
    .totals { border-top: 2px solid #cbd5e1; padding-top: 12px; font-size: 13px; line-height: 1.8; }
    .btn-print { background: #0f766e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 16px; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none !important; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div style="max-width: 650px; margin: 0 auto;" class="no-print">
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    ${profile?.headerType === 'custom_banner' && profile?.headerBannerUrl ? `
      <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
        <img src="${profile.headerBannerUrl}" alt="${labName}" style="width: 100%; max-height: 100px; object-fit: contain; margin: 0 auto; display: block;" />
        <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px;">
          <div><strong>Tax Invoice: ${order.id}</strong> · ${formatLabDate(order.bookingDate)}</div>
          <div style="font-weight: bold; color: ${order.paymentStatus === 'Paid' ? '#16a34a' : '#d97706'}; text-transform: uppercase;">${order.paymentStatus}</div>
        </div>
      </div>
    ` : `
      <div class="header" style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${profile?.logoUrl ? `<img src="${profile.logoUrl}" alt="${labName}" style="width: ${Math.min(profile.logoWidth || 70, 80)}px; max-height: 60px; object-fit: contain;" />` : ''}
          <div>
            <h2 style="margin: 0; color: #0f766e; font-size: 18px;">${labName}</h2>
            <div style="font-size: 11px; color: #64748b;">${tagline}</div>
            <div style="font-size: 10px; color: #94a3b8;">${contact}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: bold; font-family: monospace;">${order.id}</div>
          <div style="font-size: 11px; color: #64748b;">${formatLabDate(order.bookingDate)}</div>
          <div style="font-size: 11px; font-weight: bold; color: ${order.paymentStatus === 'Paid' ? '#16a34a' : '#d97706'}; text-transform: uppercase;">
            ${order.paymentStatus}
          </div>
        </div>
      </div>
    `}

    <div style="background: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; line-height: 1.6; margin-bottom: 16px;">
      <div><strong>Patient:</strong> ${patient.name} (${patient.gender}, ${patient.age}Y)</div>
      <div><strong>MRN / ID:</strong> ${patient.id} · <strong>Phone:</strong> ${patient.phone}</div>
      <div><strong>Sample Barcode:</strong> ${order.sampleBarcode} · <strong>Doctor:</strong> ${order.referredByDoctor || 'Self'}</div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Investigation / Test</th>
          <th>Category</th>
          <th style="text-align: right;">Fee (PKR)</th>
        </tr>
      </thead>
      <tbody>
        ${testItems.map(t => `
          <tr>
            <td style="font-weight: 600;">${t.name}</td>
            <td style="color: #64748b;">${t.category}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold;">${formatPKR(t.fee)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div style="display: flex; justify-content: space-between;">
        <span>Gross Total:</span>
        <span style="font-family: monospace;">${formatPKR(order.totalAmount)}</span>
      </div>
      ${order.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #0f766e;">
          <span>Discount:</span>
          <span style="font-family: monospace;">- ${formatPKR(order.discount)}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
        <span>Net Amount (PKR):</span>
        <span style="font-family: monospace;">${formatPKR(order.netAmount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: bold;">
        <span>Paid (${order.paymentMethod}):</span>
        <span style="font-family: monospace;">${formatPKR(order.paidAmount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: ${balanceDue > 0 ? '#dc2626' : '#64748b'};">
        <span>Balance Due:</span>
        <span style="font-family: monospace;">${formatPKR(balanceDue)}</span>
      </div>
    </div>

    <div style="margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 10px; color: #94a3b8;">
      Thank you for choosing ${labName} · Reports available at ${profile?.websiteUrl || 'https://lab-portal-app.pk/reports'}
    </div>
  </div>
</body>
</html>`;

  triggerFileDownload(fullHtml, `Invoice_${order.id}_${patient.name.replace(/\s+/g, '_')}.html`, 'text/html;charset=utf-8;');
}
