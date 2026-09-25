import React from 'react';
import { generateBarcodeBars } from '../utils/formatters';
import { QRCodeRenderer } from './QRCodeRenderer';

interface BarcodeRendererProps {
  value: string;
  height?: number;
  showText?: boolean;
  className?: string;
  barColor?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  height = 36,
  showText = true,
  className = '',
  barColor = '#0f172a'
}) => {
  const bars = generateBarcodeBars(value || 'SAMPLE-000');
  const totalUnits = bars.reduce((acc, curr) => acc + curr, 0);

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        height={height}
        className="w-full max-w-[220px]"
        preserveAspectRatio="none"
        aria-label={`Barcode: ${value}`}
      >
        {bars.map((width, idx) => {
          const x = currentX;
          currentX += width;
          // Every even index is a drawn black bar, odd index is whitespace
          if (idx % 2 === 0) {
            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={width}
                height={height}
                fill={barColor}
              />
            );
          }
          return null;
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-700 mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
};

interface TubeLabelStickerProps {
  barcode: string;
  orderId: string;
  patientName: string;
  patientId: string;
  patientAgeGender: string;
  testCodes: string[];
  bookingDate: string;
  sampleType: string;
  onClose?: () => void;
}

export const TubeLabelModal: React.FC<TubeLabelStickerProps> = ({
  barcode,
  orderId,
  patientName,
  patientId,
  patientAgeGender,
  testCodes,
  bookingDate,
  sampleType,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSticker = () => {
    const stickerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barcode Tube Sticker - ${barcode}</title>
  <style>
    @page { size: 50mm 25mm; margin: 0; }
    body { margin: 0; padding: 4px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .label { width: 48mm; height: 23mm; border: 1px solid #000; box-sizing: border-box; padding: 2px 4px; font-size: 8px; }
    .header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 1px; }
    .barcode { text-align: center; margin: 2px 0; font-family: monospace; font-size: 10px; letter-spacing: 2px; font-weight: bold; }
    .footer { display: flex; justify-content: space-between; font-size: 7px; }
  </style>
</head>
<body onload="window.print()">
  <div class="label">
    <div class="header">
      <span>${patientName}</span>
      <span>${patientAgeGender}</span>
    </div>
    <div style="font-size: 7px; color: #333;">MRN: ${patientId} | Ord: ${orderId}</div>
    <div class="barcode">||| | |||| || ||||| | |||</div>
    <div style="text-align: center; font-size: 8px; font-weight: bold; font-family: monospace;">*${barcode}*</div>
    <div class="footer">
      <span>${testCodes.join(',')}</span>
      <span>${sampleType}</span>
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([stickerHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tube_Barcode_${barcode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Specimen Tube Barcode Label</h3>
            <p className="text-xs text-slate-500">Standard 50mm × 25mm Vacutainer label format</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>

        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/50">
          {/* Authentic Laboratory Vacutainer Sticker Simulation */}
          <div
            id="printable-tube-sticker"
            className="w-[320px] bg-white border-2 border-dashed border-slate-300 rounded p-3 shadow-xs font-sans text-slate-900"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-1 mb-1.5">
              <div>
                <div className="text-[11px] font-bold tracking-tight text-teal-700 uppercase">
                  Lab-Portal-App Diagnostics
                </div>
                <div className="text-xs font-bold truncate max-w-[190px]">
                  {patientName}
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] font-bold text-slate-700 block">
                  {orderId}
                </span>
                <span className="text-[10px] text-slate-500">
                  {patientAgeGender}
                </span>
              </div>
            </div>

            {/* Barcode and QR visual */}
            <div className="py-1 flex items-center justify-between gap-3 bg-white px-1">
              <div className="flex-1 flex justify-center">
                <BarcodeRenderer value={barcode} height={36} showText={true} />
              </div>
              <div className="p-1 bg-white border border-slate-200 rounded shrink-0" title="Scannable 2D QR Code">
                <QRCodeRenderer
                  value={JSON.stringify({ orderId, barcode, patientId })}
                  size={42}
                  includeMargin={false}
                  alt={`QR for ${orderId}`}
                />
              </div>
            </div>

            <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
              <div>
                <span className="font-medium text-slate-700">Tests: </span>
                <span className="font-mono font-semibold">{testCodes.join(', ')}</span>
              </div>
              <div className="font-mono text-[9px] text-slate-500">
                {patientId}
              </div>
            </div>

            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
              <span>{sampleType}</span>
              <span>{new Date(bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={handleDownloadSticker}
            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
};
