import React, { useState, useEffect, useRef } from 'react';
import { LabOrder, Patient, SampleStatus, TestCatalogItem, OrderResultReport, UserAccount } from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { parseScannedOrderInput } from '../utils/qrPayload';
import { QRCodeRenderer } from './QRCodeRenderer';

interface OrderScannerModalProps {
  orders: LabOrder[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  reports: OrderResultReport[];
  currentUser?: UserAccount;
  initialOrderId?: string;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, status: SampleStatus, collectedBy?: string) => void;
  onViewReceipt: (order: LabOrder) => void;
  onViewReport: (order: LabOrder) => void;
  onEnterResults: (order: LabOrder) => void;
  onOpenQRModal: (order: LabOrder) => void;
}

export const OrderScannerModal: React.FC<OrderScannerModalProps> = ({
  orders,
  patients,
  catalog,
  reports,
  currentUser,
  initialOrderId,
  onClose,
  onUpdateOrderStatus,
  onViewReceipt,
  onViewReport,
  onEnterResults,
  onOpenQRModal
}) => {
  const [scanInput, setScanInput] = useState('');
  const [retrievedOrder, setRetrievedOrder] = useState<LabOrder | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScanRaw, setLastScanRaw] = useState<string>('');
  const [phlebotomistName, setPhlebotomistName] = useState(
    currentUser?.role === 'technologist' ? `${currentUser.name} (MLT)` : 'Hamza Malik (Sr. Phlebotomist)'
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Play realistic scanner beep on successful scan
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1450, ctx.currentTime); // 1450Hz medical scanner beep
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // Audio might be blocked by browser policy without user gesture; safe to ignore
    }
  };

  // Find order by multiple identifiers
  const findOrder = (searchTerm: string): LabOrder | undefined => {
    const parsed = parseScannedOrderInput(searchTerm);

    return orders.find((o) => {
      // Check direct parsed orderId
      if (parsed.orderId && o.id.toLowerCase() === parsed.orderId.toLowerCase()) return true;
      // Check barcode
      if (parsed.barcode && o.sampleBarcode.toLowerCase() === parsed.barcode.toLowerCase()) return true;
      // Check patientId
      if (parsed.patientId && o.patientId.toLowerCase() === parsed.patientId.toLowerCase()) return true;

      // General fallback match
      const q = searchTerm.trim().toLowerCase();
      if (o.id.toLowerCase() === q) return true;
      if (o.sampleBarcode.toLowerCase() === q) return true;
      return false;
    });
  };

  const handleProcessScan = (inputToProcess: string) => {
    const trimmed = inputToProcess.trim();
    if (!trimmed) return;

    setErrorMsg(null);
    setLastScanRaw(trimmed);

    const match = findOrder(trimmed);

    if (match) {
      setRetrievedOrder(match);
      setScannedAt(new Date().toLocaleTimeString());
      playScannerBeep();
      setScanInput('');
    } else {
      setErrorMsg(`No lab order found matching "${trimmed}". Ensure the QR code or barcode corresponds to a registered order.`);
    }
  };

  // On initial mount or when initialOrderId is provided
  useEffect(() => {
    if (initialOrderId) {
      const match = orders.find((o) => o.id === initialOrderId);
      if (match) {
        setRetrievedOrder(match);
        setScannedAt(new Date().toLocaleTimeString());
        setLastScanRaw(match.id);
        playScannerBeep();
      }
    }
    // Auto-focus input for physical scanner guns
    inputRef.current?.focus();
  }, [initialOrderId, orders]);

  // Keep retrieved order in sync with orders list
  useEffect(() => {
    if (retrievedOrder) {
      const updated = orders.find((o) => o.id === retrievedOrder.id);
      if (updated) {
        setRetrievedOrder(updated);
      }
    }
  }, [orders]);

  const retrievedPatient = retrievedOrder
    ? patients.find((p) => p.id === retrievedOrder.patientId)
    : null;

  const isTechnician = currentUser?.role === 'technologist';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Order QR Scanner & Patient Retrieval
              </h2>
              <p className="text-xs text-slate-500">
                Scan patient QR code or 1D barcode to immediately retrieve order details and specimen status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Scanner Input Station */}
          <div className="p-4 bg-slate-900 rounded-xl text-white shadow-inner border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Scanner Active · Ready for Input
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                Supports Handheld 2D/1D Gun, Camera QR, & Paste
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan(scanInput);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Scan QR Code / Barcode (or paste JSON/Order ID)..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-400 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Retrieve
              </button>
            </form>

            {/* Quick Demo Scan Buttons */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                <span>Quick Test: Simulate scanning an order QR code:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {orders.slice(0, 5).map((ord) => {
                  const p = patients.find((pt) => pt.id === ord.patientId);
                  return (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => handleProcessScan(ord.id)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 text-[10px] font-mono transition-colors flex items-center gap-1"
                    >
                      <span className="text-emerald-400 font-bold">{ord.id}</span>
                      <span className="text-slate-400">({p?.name?.split(' ')[0] || ord.sampleBarcode})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Retrieved Order Patient Card */}
          {retrievedOrder && retrievedPatient ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Verification Header */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-emerald-900 text-xs">
                      Order Retrieved Successfully
                    </span>
                    <div className="text-[10px] text-emerald-700 font-mono">
                      Scanned at {scannedAt} · Source: {lastScanRaw}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onOpenQRModal(retrievedOrder)}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-white hover:bg-teal-50 border border-teal-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
                  title="View large scannable QR Code"
                >
                  <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  View QR Code
                </button>
              </div>

              {/* Patient & Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Patient Information */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient Demographics
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                      MRN: {retrievedPatient.id}
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {retrievedPatient.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400">Age / Gender:</span>{' '}
                      <strong className="text-slate-800">
                        {retrievedPatient.age} yrs · {retrievedPatient.gender}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>{' '}
                      <strong className="text-slate-800 font-mono">
                        {retrievedPatient.phone}
                      </strong>
                    </div>
                    {retrievedPatient.cnic && (
                      <div>
                        <span className="text-slate-400">CNIC:</span>{' '}
                        <strong className="text-slate-800 font-mono">
                          {retrievedPatient.cnic}
                        </strong>
                      </div>
                    )}
                    {retrievedOrder.referredByDoctor && (
                      <div>
                        <span className="text-slate-400">Referred By:</span>{' '}
                        <strong className="text-slate-800">
                          {retrievedOrder.referredByDoctor}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code preview card */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                  <QRCodeRenderer
                    value={JSON.stringify({
                      orderId: retrievedOrder.id,
                      barcode: retrievedOrder.sampleBarcode,
                      patientId: retrievedOrder.patientId
                    })}
                    size={84}
                    className="rounded"
                  />
                  <span className="mt-1 font-mono text-[10px] font-bold text-slate-700">
                    {retrievedOrder.sampleBarcode}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Vacutainer Barcode
                  </span>
                </div>
              </div>

              {/* Order Status & Rapid Sample Workflow */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Order Identification & Specimen
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {retrievedOrder.id}
                    </span>
                    <span className="text-slate-400 text-xs ml-2">
                      ({formatLabDate(retrievedOrder.bookingDate)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status:</span>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-teal-50 text-teal-800 border-teal-200">
                      {retrievedOrder.sampleStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] p-2.5 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Specimen Type Needed:</span>
                    <strong className="text-slate-800">{retrievedOrder.sampleType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Collection Status:</span>
                    <strong className="text-slate-800">
                      {retrievedOrder.collectedBy
                        ? `Collected by ${retrievedOrder.collectedBy}`
                        : 'Awaiting phlebotomy collection'}
                    </strong>
                  </div>
                </div>

                {/* Quick Status Workflow Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-700">
                    Phlebotomist / Tech Quick Actions:
                  </span>
                  <div className="flex items-center gap-2">
                    {retrievedOrder.sampleStatus === 'Sample Pending' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(retrievedOrder.id, 'Sample Collected', phlebotomistName);
                          playScannerBeep();
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Mark Sample Collected
                      </button>
                    )}

                    {retrievedOrder.sampleStatus === 'Sample Collected' && (
                      <button
                        onClick={() => {
                          onUpdateOrderStatus(retrievedOrder.id, 'In Processing');
                          playScannerBeep();
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        Start Analyzer Run
                      </button>
                    )}

                    {(isTechnician || isAdmin) && (
                      <button
                        onClick={() => {
                          onClose();
                          onEnterResults(retrievedOrder);
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        Enter Results
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Investigations & Billing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tests List */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Prescribed Lab Tests ({retrievedOrder.tests.length})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {retrievedOrder.tests.map((code) => {
                      const item = catalog.find((c) => c.code === code);
                      return (
                        <div
                          key={code}
                          className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-100"
                        >
                          <div>
                            <span className="font-mono font-bold text-teal-800 text-[11px] mr-1.5">
                              {code}
                            </span>
                            <span className="text-slate-700 text-[11px]">
                              {item?.name || code}
                            </span>
                          </div>
                          {item && (
                            <span className="font-mono font-semibold text-slate-600 text-[10px]">
                              {formatPKR(item.fee)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                    Billing & Payment Status
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Gross:</span>
                      <span>{formatPKR(retrievedOrder.totalAmount)}</span>
                    </div>
                    {retrievedOrder.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount:</span>
                        <span>- {formatPKR(retrievedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1">
                      <span>Net Payable:</span>
                      <span>{formatPKR(retrievedOrder.netAmount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Amount Paid:</span>
                      <span>{formatPKR(retrievedOrder.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="font-sans text-[10px] text-slate-500">Status:</span>
                      <span
                        className={`font-sans font-bold px-2 py-0.5 rounded text-[10px] ${
                          retrievedOrder.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {retrievedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    onClose();
                    onViewReceipt(retrievedOrder);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                  Receipt / Invoice
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onViewReport(retrievedOrder);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Generate and print diagnostic pathology report"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Generate Report Print
                </button>

                <button
                  onClick={() => onOpenQRModal(retrievedOrder)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Tube QR Sticker
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600">
                Awaiting Barcode or QR Scan
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Scan any patient order QR code using a handheld scanner gun or click any of the quick test buttons above to retrieve patient details immediately.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
