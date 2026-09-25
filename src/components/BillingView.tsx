import React, { useState } from 'react';
import { LabOrder, Patient, PaymentStatus, PaymentMethod, TestCatalogItem, UserAccount } from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { downloadCSV, downloadStandaloneInvoiceHTML } from '../utils/downloadHelpers';

interface BillingViewProps {
  orders: LabOrder[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  currentUser?: UserAccount;
  onUpdatePayment: (orderId: string, paidAmount: number, paymentMethod: PaymentMethod) => void;
  onViewReceipt: (order: LabOrder) => void;
  onViewReport: (order: LabOrder) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  orders,
  patients,
  catalog,
  currentUser,
  onUpdatePayment,
  onViewReceipt,
  onViewReport
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist';
  const isAdmin = currentUser?.role === 'admin';

  // Quick payment modal
  const [collectingOrder, setCollectingOrder] = useState<LabOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Cash');

  // Overall financial calculations
  const totalBilled = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalDiscounts = orders.reduce((acc, o) => acc + o.discount, 0);
  const totalNet = orders.reduce((acc, o) => acc + o.netAmount, 0);
  const totalReceived = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalReceivables = Math.max(0, totalNet - totalReceived);

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Sample Barcode', 'Patient ID', 'Patient Name', 'Phone', 'Booking Date', 'Total Amount PKR', 'Discount PKR', 'Net Amount PKR', 'Paid Amount PKR', 'Balance Due PKR', 'Payment Method', 'Payment Status'];
    const rows = filteredOrders.map(order => {
      const pat = patients.find(p => p.id === order.patientId);
      const balanceDue = Math.max(0, order.netAmount - order.paidAmount);
      return [
        order.id,
        order.sampleBarcode,
        order.patientId,
        pat?.name || '',
        pat?.phone || '',
        order.bookingDate,
        order.totalAmount,
        order.discount,
        order.netAmount,
        order.paidAmount,
        balanceDue,
        order.paymentMethod,
        order.paymentStatus
      ];
    });
    downloadCSV(`Invoices_Ledger_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleQuickDownloadInvoice = (order: LabOrder) => {
    const patient = patients.find(p => p.id === order.patientId) || {
      id: order.patientId,
      name: 'Patient',
      age: 30,
      gender: 'Male',
      phone: '',
      cnic: '',
      address: '',
      createdAt: ''
    };
    downloadStandaloneInvoiceHTML(order, patient, catalog);
  };

  const filteredOrders = orders.filter(order => {
    const pat = patients.find(p => p.id === order.patientId);
    const matchesStatus = statusFilter === 'All' || order.paymentStatus === statusFilter;

    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.sampleBarcode.toLowerCase().includes(search.toLowerCase()) ||
      (pat && pat.name.toLowerCase().includes(search.toLowerCase())) ||
      (pat && pat.phone.includes(search));

    return matchesStatus && matchesSearch;
  });

  const openPaymentModal = (order: LabOrder) => {
    const due = Math.max(0, order.netAmount - order.paidAmount);
    setCollectingOrder(order);
    setPaymentAmount(due);
    setSelectedMethod(order.paymentMethod || 'Cash');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingOrder) return;
    const newPaid = Math.min(collectingOrder.netAmount, collectingOrder.paidAmount + Number(paymentAmount));
    onUpdatePayment(collectingOrder.id, newPaid, selectedMethod);
    setCollectingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Role specific notification banner */}
      {isReceptionist && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-teal-600 text-white rounded text-[10px]">
              Reception Desk
            </span>
            <span>
              <strong>Billing & Invoices:</strong> Receive patient payments, print invoice receipts, and directly print completed diagnostic reports for patients at the counter.
            </span>
          </div>
        </div>
      )}

      {isTechnician && (
        <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-slate-600 text-white rounded text-[10px]">
              Technician Note
            </span>
            <span>
              Financial transactions, invoices & cash collections are handled by the Receptionist. Switch to "Lab Orders" or "Test Results" for sample collection and validation.
            </span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Invoices & Billing Counter
          </h1>
          <p className="text-xs text-slate-500">
            Track Pakistani Rupee (PKR) revenues, cash, JazzCash & EasyPaisa collections and patient receivables
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Financials (CSV)
        </button>
      </div>

      {/* Financial Overview Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Gross Billed (PKR)
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatPKR(totalBilled)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {orders.length} total orders
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Discounts Given
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-teal-700 tabular-nums">
            {formatPKR(totalDiscounts)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Patient concessions
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
            Net Revenue
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatPKR(totalNet)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            After discounts
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider block">
            Collected Cash / Online
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-700 tabular-nums">
            {formatPKR(totalReceived)}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            Settled in full
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-rose-600 text-[10px] font-bold uppercase tracking-wider block">
            Pending Receivables
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-rose-700 tabular-nums">
            {formatPKR(totalReceivables)}
          </span>
          <span className="text-[10px] text-rose-500 block mt-0.5">
            Due on report pickup
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-96">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoice by Order ID, Patient Name, or Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium">Payment Status:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {['All', 'Paid', 'Partial', 'Unpaid'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Total Fee (PKR)</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Net Amount</th>
                <th className="py-3 px-3 text-right">Paid (Method)</th>
                <th className="py-3 px-3 text-right">Balance Due</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const pat = patients.find(p => p.id === order.patientId);
                const balanceDue = Math.max(0, order.netAmount - order.paidAmount);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID */}
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">
                      {order.id}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {order.sampleBarcode}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pat?.name || 'Unknown Patient'}</div>
                      <div className="text-[10px] text-slate-500">
                        {pat?.phone} · {pat?.gender}, {pat?.age}y
                      </div>
                    </td>

                    {/* Booking Date */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {formatLabDate(order.bookingDate)}
                    </td>

                    {/* Total Amount in PKR */}
                    <td className="py-3 px-3 font-mono text-right text-slate-700 tabular-nums">
                      {formatPKR(order.totalAmount)}
                    </td>

                    {/* Discount */}
                    <td className="py-3 px-3 font-mono text-right text-teal-700 tabular-nums">
                      {order.discount > 0 ? `- ${formatPKR(order.discount)}` : 'Rs. 0'}
                    </td>

                    {/* Net Amount */}
                    <td className="py-3 px-3 font-mono text-right font-bold text-slate-900 tabular-nums">
                      {formatPKR(order.netAmount)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-3 font-mono text-right tabular-nums">
                      <div className="font-semibold text-emerald-700">{formatPKR(order.paidAmount)}</div>
                      <span className="text-[10px] text-slate-400 font-sans block">{order.paymentMethod}</span>
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-3 font-mono text-right tabular-nums">
                      <span className={`font-bold ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {formatPKR(balanceDue)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                          order.paymentStatus === 'Paid'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : order.paymentStatus === 'Partial'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {balanceDue > 0 && !isTechnician && (
                          <button
                            onClick={() => openPaymentModal(order)}
                            className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                          >
                            Receive
                          </button>
                        )}
                        <button
                          onClick={() => onViewReceipt(order)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center gap-1"
                          title="Preview Receipt & Invoice"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Receipt
                        </button>
                        <button
                          onClick={() => handleQuickDownloadInvoice(order)}
                          className="px-2 py-1 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded transition-colors"
                          title="Download Offline HTML/PDF Invoice"
                        >
                          Download
                        </button>
                        {order.sampleStatus === 'Completed' && (
                          <button
                            onClick={() => onViewReport(order)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1 shadow-2xs"
                            title="Print Completed Diagnostic Pathology Report"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No billing records found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {collectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                Receive Dues: Order #{collectingOrder.id}
              </h3>
              <button
                onClick={() => setCollectingOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Net Amount:</span>
                  <span className="font-mono font-bold">{formatPKR(collectingOrder.netAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-mono text-emerald-700 font-semibold">{formatPKR(collectingOrder.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-mono">{formatPKR(collectingOrder.netAmount - collectingOrder.paidAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount Received (PKR):
                </label>
                <input
                  type="number"
                  min={1}
                  max={collectingOrder.netAmount - collectingOrder.paidAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-teal-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Channel:</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="Cash">Cash Counter</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="Bank Card / Transfer">Bank Card / 1Link</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCollectingOrder(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
