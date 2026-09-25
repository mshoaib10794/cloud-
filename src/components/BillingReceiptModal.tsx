import React, { useState } from 'react';
import { LabOrder, Patient, TestCatalogItem, PaymentMethod, LabProfile } from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { downloadStandaloneInvoiceHTML } from '../utils/downloadHelpers';

interface BillingReceiptModalProps {
  order: LabOrder;
  patient: Patient;
  catalog: TestCatalogItem[];
  profile?: LabProfile;
  onUpdatePayment?: (orderId: string, paidAmount: number, paymentMethod: PaymentMethod) => void;
  onClose: () => void;
}

export const BillingReceiptModal: React.FC<BillingReceiptModalProps> = ({
  order,
  patient,
  catalog,
  profile,
  onUpdatePayment,
  onClose
}) => {
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');
  const [isCollecting, setIsCollecting] = useState(false);
  const [additionalPayment, setAdditionalPayment] = useState<number>(order.netAmount - order.paidAmount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod || 'Cash');

  const testItems = order.tests.map(code => catalog.find(t => t.code === code)).filter(Boolean) as TestCatalogItem[];
  const balanceDue = Math.max(0, order.netAmount - order.paidAmount);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = () => {
    downloadStandaloneInvoiceHTML(order, patient, catalog, profile);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePayment) {
      const newPaid = Math.min(order.netAmount, order.paidAmount + Number(additionalPayment));
      onUpdatePayment(order.id, newPaid, paymentMethod);
      setIsCollecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Controls (No Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-2 no-print">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Receipt Preview
            </span>
            {/* Toggle format: Thermal 80mm vs Standard A4 */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFormat('thermal')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  format === 'thermal' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Thermal Slip (80mm)
              </button>
              <button
                onClick={() => setFormat('a4')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  format === 'a4' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 Tax Invoice
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {balanceDue > 0 && !isCollecting && (
              <button
                onClick={() => setIsCollecting(true)}
                className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                + Collect Dues
              </button>
            )}
            <button
              onClick={handleDownloadInvoice}
              title="Download standalone invoice HTML/PDF ready file"
              className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Payment Form if Collecting */}
        {isCollecting && (
          <form onSubmit={handleSavePayment} className="p-4 bg-teal-50/70 border-b border-teal-200 no-print flex flex-wrap items-end gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Receive Amount (Max {formatPKR(balanceDue)}):
              </label>
              <input
                type="number"
                min={1}
                max={balanceDue}
                value={additionalPayment}
                onChange={(e) => setAdditionalPayment(Number(e.target.value))}
                className="bg-white border border-teal-300 rounded-md px-2.5 py-1.5 font-mono text-sm w-36 font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="bg-white border border-teal-300 rounded-md px-2.5 py-1.5 text-xs font-medium"
              >
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Bank Card / Transfer">Bank Card / 1Link</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-teal-700 text-white font-semibold rounded-md hover:bg-teal-800"
              >
                Confirm Payment
              </button>
              <button
                type="button"
                onClick={() => setIsCollecting(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Content Viewport */}
        <div className="p-6 overflow-y-auto bg-slate-100/60 flex justify-center">
          {format === 'thermal' ? (
            /* ========================================================================= */
            /* 80mm Thermal Receipt Simulation (hcloud.pk standard counter receipt)     */
            /* ========================================================================= */
            <div
              id="printable-thermal-receipt"
              className="w-[340px] bg-white border border-slate-300 p-5 shadow-sm text-slate-900 font-mono text-[11px] leading-relaxed"
            >
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3 font-sans">
                {profile?.logoUrl && (
                  <div className="flex justify-center mb-2">
                    <img
                      src={profile.logoUrl}
                      alt={profile?.labName || 'Logo'}
                      className="max-h-12 max-w-[140px] object-contain"
                    />
                  </div>
                )}
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {profile?.labName || 'Lab-Portal-App'}
                </h2>
                <p className="text-[10px] text-slate-600 font-normal">
                  {profile?.tagline || 'Clinical Pathology & Research Lab'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {profile?.address || 'Main Campus: Blue Area, Islamabad'} · UAN: {profile?.phone || '051-8484200'}
                </p>
                <p className="text-[9px] text-slate-400">Reg: {profile?.registrationNumber || 'PHC-LAB-9201'} · STRN Registered</p>
              </div>

              {/* Order & Patient Info */}
              <div className="space-y-1 pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold text-slate-900">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{formatLabDate(order.bookingDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold truncate max-w-[190px]">{patient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient ID:</span>
                  <span>{patient.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age/Gender:</span>
                  <span>{patient.age}Y / {patient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span>{patient.phone}</span>
                </div>
                {order.referredByDoctor && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref By:</span>
                    <span className="truncate max-w-[170px]">{order.referredByDoctor}</span>
                  </div>
                )}
              </div>

              {/* Barcode Section */}
              <div className="py-2.5 flex flex-col items-center justify-center border-b border-dashed border-slate-300">
                <BarcodeRenderer value={order.sampleBarcode} height={32} showText={true} />
                <span className="text-[9px] text-slate-400 mt-0.5">Sample Barcode: {order.sampleBarcode}</span>
              </div>

              {/* Investigations Line Items */}
              <div className="py-2.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-[10px] uppercase text-slate-700 pb-1 mb-1 border-b border-slate-200">
                  <span>Investigation</span>
                  <span>Fee (PKR)</span>
                </div>
                {testItems.map(test => (
                  <div key={test.code} className="flex justify-between py-0.5 text-[11px]">
                    <span className="truncate max-w-[210px] font-sans">{test.name}</span>
                    <span className="font-semibold tabular-nums">{formatPKR(test.fee)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown (PKR) */}
              <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="tabular-nums font-medium">{formatPKR(order.totalAmount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>Discount:</span>
                    <span className="tabular-nums font-medium">- {formatPKR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Payable:</span>
                  <span className="tabular-nums">{formatPKR(order.netAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Paid ({order.paymentMethod}):</span>
                  <span className="tabular-nums font-semibold text-emerald-700">{formatPKR(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className={balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}>
                    Balance Due:
                  </span>
                  <span className={`tabular-nums ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatPKR(balanceDue)}
                  </span>
                </div>
              </div>

              {/* Payment Status Stamp */}
              <div className="py-2 text-center">
                <span
                  className={`inline-block font-sans font-bold text-xs uppercase px-3 py-0.5 rounded border ${
                    order.paymentStatus === 'Paid'
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                      : order.paymentStatus === 'Partial'
                      ? 'border-amber-500 text-amber-700 bg-amber-50'
                      : 'border-rose-500 text-rose-700 bg-rose-50'
                  }`}
                >
                  Payment: {order.paymentStatus}
                </span>
              </div>

              {/* Footer notes */}
              <div className="pt-2 text-[9px] text-center text-slate-500 font-sans space-y-1">
                <p>• Please bring this receipt when collecting laboratory reports.</p>
                <p>• Reports can also be checked online at: <strong>{profile?.websiteUrl || 'https://lab-portal-app.pk/reports'}</strong></p>
                <p className="text-slate-400">Software: Lab-Portal-App v4</p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* A4 Full Diagnostic Tax Invoice                                            */
            /* ========================================================================= */
            <div
              id="printable-a4-invoice"
              className="w-full max-w-xl bg-white border border-slate-300 p-8 shadow-sm text-slate-900 font-sans"
            >
              {profile?.headerType === 'custom_banner' && profile?.headerBannerUrl ? (
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <img
                    src={profile.headerBannerUrl}
                    alt={profile?.labName || 'Header Banner'}
                    className="w-full max-h-28 object-contain mx-auto"
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-100 pt-1.5">
                    <span>INVOICE REF: <strong>{order.id}</strong></span>
                    <span>DATE: <strong>{formatLabDate(order.bookingDate)}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    {profile?.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt={profile?.labName || 'Logo'}
                        style={{ width: `${Math.min(profile.logoWidth || 80, 90)}px` }}
                        className="max-h-16 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                        LP
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-teal-800 leading-tight">{profile?.labName || 'Lab-Portal-App'}</h2>
                      <p className="text-xs text-slate-500">{profile?.tagline || 'Pathology, Radiology & Clinical Laboratory Services'}</p>
                      <p className="text-xs text-slate-400">Reg: {profile?.registrationNumber || 'PHC-LAB-9201'} · Sales Tax Exempt (Healthcare Srv)</p>
                      <p className="text-[11px] text-slate-400">{profile?.address} | UAN: {profile?.phone}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tax Invoice</div>
                    <div className="text-base font-mono font-bold text-slate-900">{order.id}</div>
                    <div className="text-xs text-slate-500">{formatLabDate(order.bookingDate)}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 mb-6">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Billed To (Patient):</span>
                  <span className="font-bold text-slate-900 text-sm block">{patient.name}</span>
                  <span className="text-slate-600 block">MRN: {patient.id} · {patient.gender}, {patient.age} Yrs</span>
                  <span className="text-slate-600 block">CNIC: {patient.cnic || 'N/A'}</span>
                  <span className="text-slate-500 block">Phone: {patient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px]">Order Details:</span>
                  <span className="text-slate-700 block">Sample Barcode: <strong className="font-mono">{order.sampleBarcode}</strong></span>
                  <span className="text-slate-700 block">Specimen: {order.sampleType}</span>
                  <span className="text-slate-700 block">Doctor: {order.referredByDoctor || 'Self'}</span>
                  <span className="text-slate-700 block">Payment Mode: <span className="font-semibold">{order.paymentMethod}</span></span>
                </div>
              </div>

              <table className="w-full text-xs text-left mb-6">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2">Item / Test Name</th>
                    <th className="py-2">Category</th>
                    <th className="py-2 text-right">Fee (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {testItems.map(test => (
                    <tr key={test.code}>
                      <td className="py-2.5 font-medium text-slate-800">{test.name}</td>
                      <td className="py-2.5 text-slate-500">{test.category}</td>
                      <td className="py-2.5 font-mono text-right tabular-nums font-semibold">{formatPKR(test.fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gross Total:</span>
                  <span className="font-mono tabular-nums">{formatPKR(order.totalAmount)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span>Discount Allowed:</span>
                    <span className="font-mono tabular-nums">- {formatPKR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1 text-slate-900">
                  <span>Net Payable Amount:</span>
                  <span className="font-mono tabular-nums">{formatPKR(order.netAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Received:</span>
                  <span className="font-mono tabular-nums">{formatPKR(order.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className={balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}>Balance Remaining:</span>
                  <span className={`font-mono tabular-nums ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatPKR(balanceDue)}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-400">
                <div>
                  <p>Cashier Signature / Official Stamp</p>
                  <p className="font-mono text-[9px] text-slate-300 mt-4">Authorized Laboratory System Stamp</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">Thank you for choosing {profile?.labName || 'Lab-Portal-App'}</p>
                  <p>Helpline: {profile?.phone || '+92 42 3588 9100'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
