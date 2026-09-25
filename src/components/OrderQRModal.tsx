import React, { useState } from 'react';
import { LabOrder, Patient } from '../types/lims';
import { QRCodeRenderer, generateQRDataURL } from './QRCodeRenderer';
import { BarcodeRenderer } from './BarcodeRenderer';
import { createOrderQRPayload } from '../utils/qrPayload';
import { formatPKR, formatLabDate } from '../utils/formatters';

interface OrderQRModalProps {
  order: LabOrder;
  patient?: Patient;
  onClose: () => void;
  onOpenScanner?: (orderId: string) => void;
  onViewReceipt?: (order: LabOrder) => void;
  onViewReport?: (order: LabOrder) => void;
}

export const OrderQRModal: React.FC<OrderQRModalProps> = ({
  order,
  patient,
  onClose,
  onOpenScanner,
  onViewReceipt,
  onViewReport
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const payload = createOrderQRPayload(order, patient);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = async () => {
    try {
      setIsDownloading(true);
      const dataUrl = await generateQRDataURL(payload, 500);
      const link = document.createElement('a');
      link.download = `QR_${order.id}_${order.sampleBarcode}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download QR code image', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintQRSticker = () => {
    const printWindow = window.open('', '_blank', 'width=500,height=400');
    if (!printWindow) {
      window.print();
      return;
    }

    const testList = order.tests.join(', ');
    const ageGen = `${patient?.age || '—'}Y/${patient?.gender?.[0] || '—'}`;

    generateQRDataURL(payload, 200).then((qrUrl) => {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Specimen QR Sticker - ${order.id}</title>
          <style>
            @page {
              size: 50mm 28mm;
              margin: 0;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 2mm;
              box-sizing: border-box;
              background: #fff;
              color: #000;
            }
            .label {
              width: 46mm;
              height: 24mm;
              border: 1px dashed #666;
              padding: 1.5mm;
              box-sizing: border-box;
              display: flex;
              gap: 2mm;
              align-items: center;
            }
            .qr-col {
              flex-shrink: 0;
              text-align: center;
            }
            .qr-col img {
              width: 19mm;
              height: 19mm;
              display: block;
            }
            .info-col {
              flex: 1;
              overflow: hidden;
              font-size: 7.5px;
              line-height: 1.25;
            }
            .patient-name {
              font-size: 8.5px;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .order-id {
              font-family: monospace;
              font-weight: bold;
              font-size: 8px;
            }
            .barcode-text {
              font-family: monospace;
              font-size: 7.5px;
              font-weight: bold;
            }
            .specimen {
              font-size: 7px;
              color: #333;
            }
            .tests {
              font-weight: bold;
              font-size: 7.5px;
              color: #111;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="label">
            <div class="qr-col">
              <img src="${qrUrl}" alt="QR Code" />
            </div>
            <div class="info-col">
              <div class="patient-name">${patient?.name || 'Patient'} (${ageGen})</div>
              <div class="order-id">ID: ${order.id}</div>
              <div class="barcode-text">BC: ${order.sampleBarcode}</div>
              <div class="specimen">${order.sampleType}</div>
              <div class="tests">${testList}</div>
              <div style="font-size: 6.5px; color: #555; margin-top: 1px;">${formatLabDate(order.bookingDate)}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-2xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Patient Order QR Code
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {order.id} · Barcode: {order.sampleBarcode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Main QR Display Card */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {/* High-res QR Renderer */}
            <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0 flex flex-col items-center">
              <QRCodeRenderer
                value={payload}
                size={160}
                className="rounded"
                alt={`Order ${order.id} QR`}
              />
              <span className="mt-2 text-[10px] font-mono font-semibold text-slate-500">
                SCANNABLE QR
              </span>
            </div>

            {/* Quick Order Summary */}
            <div className="flex-1 space-y-2 text-left w-full">
              <div>
                <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
                  Patient
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {patient?.name || 'Patient'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {order.patientId} · {patient?.gender}, {patient?.age}y · {patient?.phone || 'No phone'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 text-[10px] block">Specimen</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {order.sampleType}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Status</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                    {order.sampleStatus}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 text-[10px] block mb-0.5">Tests Prescribed</span>
                <div className="flex flex-wrap gap-1">
                  {order.tests.map(code => (
                    <span
                      key={code}
                      className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-800 font-mono text-[10px] font-semibold rounded"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono border-t border-slate-200">
                <span className="text-slate-500">Billing Net:</span>
                <span className="font-bold text-slate-900">
                  {formatPKR(order.netAmount)} ({order.paymentStatus})
                </span>
              </div>
            </div>
          </div>

          {/* Linear Barcode Secondary View */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Code-128 Specimen Barcode
              </span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {order.sampleBarcode}
              </span>
            </div>
            <BarcodeRenderer value={order.sampleBarcode} height={28} showText={false} />
          </div>

          {/* Scanned JSON details toggle */}
          <div>
            <button
              onClick={() => setShowRawPayload(!showRawPayload)}
              className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showRawPayload ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              {showRawPayload ? 'Hide Scanned JSON Payload' : 'View Embedded Scanner JSON Payload'}
            </button>
            {showRawPayload && (
              <pre className="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-32 border border-slate-800">
                {JSON.stringify(JSON.parse(payload), null, 2)}
              </pre>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPayload}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1.5"
                title="Copy scanner data payload to clipboard"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {copied ? 'Copied!' : 'Copy Data'}
              </button>

              <button
                onClick={handleDownloadPNG}
                disabled={isDownloading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1.5"
                title="Download QR code image as PNG"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onViewReport && (
                <button
                  onClick={() => {
                    onClose();
                    onViewReport(order);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Generate and print diagnostic report"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Generate Report Print
                </button>
              )}

              {onOpenScanner && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenScanner(order.id);
                  }}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  title="Test scanning this order in the scanner tool"
                >
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Test Scanner
                </button>
              )}

              <button
                onClick={handlePrintQRSticker}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                title="Print dual QR & Barcode Vacutainer tube sticker"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print QR Sticker
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
