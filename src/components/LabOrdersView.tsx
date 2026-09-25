import React, { useState } from 'react';
import { LabOrder, Patient, SampleStatus, TestCatalogItem, OrderResultReport, UserAccount } from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { BarcodeRenderer, TubeLabelModal } from './BarcodeRenderer';
import { downloadCSV } from '../utils/downloadHelpers';
import { QRCodeRenderer } from './QRCodeRenderer';
import { OrderQRModal } from './OrderQRModal';
import { OrderScannerModal } from './OrderScannerModal';
import { createOrderQRPayload, parseScannedOrderInput } from '../utils/qrPayload';

interface LabOrdersViewProps {
  orders: LabOrder[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  reports: OrderResultReport[];
  currentUser?: UserAccount;
  onUpdateOrderStatus: (orderId: string, status: SampleStatus, collectedBy?: string) => void;
  onOpenNewOrder: () => void;
  onViewReceipt: (order: LabOrder) => void;
  onViewReport: (order: LabOrder) => void;
  onEnterResults: (order: LabOrder) => void;
}

export const LabOrdersView: React.FC<LabOrdersViewProps> = ({
  orders,
  patients,
  catalog,
  reports,
  currentUser,
  onUpdateOrderStatus,
  onOpenNewOrder,
  onViewReceipt,
  onViewReport,
  onEnterResults
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [barcodeModalOrder, setBarcodeModalOrder] = useState<LabOrder | null>(null);

  // QR Code and Scanner Modals
  const [selectedQROrder, setSelectedQROrder] = useState<LabOrder | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerInitialOrderId, setScannerInitialOrderId] = useState<string | undefined>(undefined);

  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist';
  const isAdmin = currentUser?.role === 'admin';

  // Quick Phlebotomy Collect Sample Modal
  const [collectingOrder, setCollectingOrder] = useState<LabOrder | null>(null);
  const [phlebotomistName, setPhlebotomistName] = useState(
    currentUser?.role === 'technologist' ? `${currentUser.name} (MLT)` : 'Hamza Malik (Sr. Phlebotomist)'
  );

  const statuses: SampleStatus[] = [
    'Sample Pending',
    'Sample Collected',
    'In Processing',
    'Completed',
    'Delivered'
  ];

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Sample Barcode',
      'Patient ID',
      'Patient Name',
      'Phone',
      'Tests',
      'Specimen Type',
      'Booking Date',
      'Status',
      'Total Fee PKR',
      'Discount PKR',
      'Net Amount PKR',
      'Paid PKR',
      'Payment Status'
    ];
    const rows = filteredOrders.map(order => {
      const patient = patients.find(p => p.id === order.patientId);
      return [
        order.id,
        order.sampleBarcode,
        order.patientId,
        patient?.name || '',
        patient?.phone || '',
        order.tests.join('; '),
        order.sampleType,
        order.bookingDate,
        order.sampleStatus,
        order.totalAmount,
        order.discount,
        order.netAmount,
        order.paidAmount,
        order.paymentStatus
      ];
    });
    downloadCSV(`Lab_Orders_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const parsedSearch = parseScannedOrderInput(search);
  const searchLower = search.trim().toLowerCase();

  const filteredOrders = orders.filter(order => {
    const patient = patients.find(p => p.id === order.patientId);
    const matchesStatus = statusFilter === 'All' || order.sampleStatus === statusFilter;

    if (!searchLower) return matchesStatus;

    // Check if scanner gun / query matches orderId or barcode or patientId
    const matchesParsed =
      (parsedSearch.orderId && order.id.toLowerCase() === parsedSearch.orderId.toLowerCase()) ||
      (parsedSearch.barcode && order.sampleBarcode.toLowerCase() === parsedSearch.barcode.toLowerCase()) ||
      (parsedSearch.patientId && order.patientId.toLowerCase() === parsedSearch.patientId.toLowerCase());

    const matchesSearch =
      matchesParsed ||
      order.id.toLowerCase().includes(searchLower) ||
      order.sampleBarcode.toLowerCase().includes(searchLower) ||
      order.patientId.toLowerCase().includes(searchLower) ||
      (patient && patient.name.toLowerCase().includes(searchLower)) ||
      (patient && patient.phone.includes(searchLower));

    return matchesStatus && matchesSearch;
  });

  const handleConfirmCollection = () => {
    if (collectingOrder) {
      onUpdateOrderStatus(collectingOrder.id, 'Sample Collected', phlebotomistName);
      setCollectingOrder(null);
    }
  };

  const getStatusBadge = (status: SampleStatus) => {
    switch (status) {
      case 'Sample Pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Sample Collected':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'In Processing':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Delivered':
        return 'text-slate-700 bg-slate-100 border-slate-300';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
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
              <strong>Patient Invoicing & Orders:</strong> Book lab orders, print QR code labels for specimen tubes and receipts, and retrieve patient details via scanner.
            </span>
          </div>
        </div>
      )}

      {isTechnician && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">
              Lab Technician Workbench
            </span>
            <span>
              <strong>Phlebotomy & Specimen Accessioning:</strong> Collect blood tubes, scan QR/barcodes with scanner gun to quickly retrieve patient orders, and enter results.
            </span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isTechnician ? 'Specimen Accessioning & QR Tracking' : 'Lab Orders & QR Code Specimen Tracking'}
          </h1>
          <p className="text-xs text-slate-500">
            {isTechnician
              ? 'Scan order QR codes, collect specimens, print tube labels, and proceed to result entry'
              : 'Generate 2D QR codes for instant order retrieval, track vacutainer tubes, and manage patient workflows'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* QR Scanner Quick Retrieval Button */}
          <button
            onClick={() => {
              setScannerInitialOrderId(undefined);
              setIsScannerModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            title="Scan QR Code or Barcode with handheld scanner gun"
          >
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Scan Order QR
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>

          {!isTechnician && (
            <button
              onClick={onOpenNewOrder}
              className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Book New Order
            </button>
          )}
        </div>
      </div>

      {/* Filter and Live Barcode Lookup Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full md:w-96">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <input
            type="text"
            placeholder="Scan QR / Barcode with Gun, Order ID, Patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter by Sample Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              statusFilter === 'All' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({orders.length})
          </button>
          {statuses.map(st => {
            const count = orders.filter(o => o.sampleStatus === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Scanned Search Match Notification Banner */}
      {search && filteredOrders.length === 1 && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-teal-600 text-white rounded text-[10px]">
              Scanner Match
            </span>
            <span>
              Retrieved Order: <strong className="font-mono">{filteredOrders[0].id}</strong> ({filteredOrders[0].sampleBarcode}) for{' '}
              <strong>{patients.find(p => p.id === filteredOrders[0].patientId)?.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setScannerInitialOrderId(filteredOrders[0].id);
                setIsScannerModalOpen(true);
              }}
              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              Open Retrieval Card
            </button>
            <button
              onClick={() => setSelectedQROrder(filteredOrders[0])}
              className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 font-semibold rounded-lg transition-colors"
            >
              Enlarge QR
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order & Scannable QR</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-3">Investigations</th>
                <th className="py-3 px-3">Booking Date</th>
                <th className="py-3 px-3">Sample Status</th>
                <th className="py-3 px-3">Net PKR</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(order => {
                const pat = patients.find(p => p.id === order.patientId);
                const qrPayload = createOrderQRPayload(order, pat);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order ID & Scannable QR Code */}
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        {/* Interactive Scannable QR Code Thumbnail */}
                        <div
                          onClick={() => setSelectedQROrder(order)}
                          className="p-1 bg-white border border-slate-200 hover:border-teal-500 rounded-lg hover:shadow-xs transition-all cursor-pointer shrink-0 group relative"
                          title="Click to view & enlarge scannable QR code"
                        >
                          <QRCodeRenderer
                            value={qrPayload}
                            size={44}
                            className="rounded"
                            alt={`QR for ${order.id}`}
                          />
                          <div className="absolute inset-0 bg-teal-900/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center">
                            <span className="bg-teal-700 text-white text-[8px] font-bold px-1 rounded shadow-xs">
                              QR
                            </span>
                          </div>
                        </div>

                        {/* Order & Barcode Details */}
                        <div className="min-w-0">
                          <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{order.id}</span>
                            <button
                              onClick={() => setSelectedQROrder(order)}
                              title="Enlarge QR Code & Details"
                              className="text-slate-400 hover:text-teal-700 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                              {order.sampleBarcode}
                            </span>
                            <button
                              onClick={() => setBarcodeModalOrder(order)}
                              title="Print 1D tube barcode sticker"
                              className="text-slate-400 hover:text-teal-700 p-0.5 rounded hover:bg-slate-100"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                            {order.sampleType}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pat?.name || 'Unknown Patient'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {order.patientId} · {pat?.gender}, {pat?.age}y
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {pat?.phone}
                      </div>
                    </td>

                    {/* Tests */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {order.tests.map(code => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold rounded"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Booking Date */}
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {formatLabDate(order.bookingDate)}
                    </td>

                    {/* Status with Quick Transition Dropdown */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${getStatusBadge(
                            order.sampleStatus
                          )}`}
                        >
                          {order.sampleStatus}
                        </span>
                        {order.collectedBy && (
                          <span className="text-[9px] text-slate-400">
                            By {order.collectedBy}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Net PKR & Payment indicator */}
                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatPKR(order.netAmount)}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-sans font-bold ${
                          order.paymentStatus === 'Paid'
                            ? 'text-emerald-700'
                            : order.paymentStatus === 'Partial'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* QR Code Action Button */}
                        <button
                          onClick={() => setSelectedQROrder(order)}
                          className="px-2 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors flex items-center gap-1"
                          title="View & Print Order QR Code"
                        >
                          <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          QR Code
                        </button>

                        {/* Technologist & Admin Actions: Collect, Run, Tube Label, Enter Results */}
                        {(isTechnician || isAdmin) && (
                          <>
                            {order.sampleStatus === 'Sample Pending' && (
                              <button
                                onClick={() => setCollectingOrder(order)}
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                Collect Sample
                              </button>
                            )}

                            {order.sampleStatus === 'Sample Collected' && (
                              <button
                                onClick={() => onUpdateOrderStatus(order.id, 'In Processing')}
                                className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors"
                              >
                                Run Analyzer
                              </button>
                            )}

                            <button
                              onClick={() => setBarcodeModalOrder(order)}
                              className="px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
                              title="Print 50x25mm Tube Barcode Label"
                            >
                              Tube Label
                            </button>

                            <button
                              onClick={() => onEnterResults(order)}
                              className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors"
                            >
                              Enter Results
                            </button>

                            {/* Lab Technician & Admin Can Also Generate Report Prints */}
                            {order.sampleStatus === 'Completed' || reports.some(r => r.orderId === order.id && r.isApproved) ? (
                              <button
                                onClick={() => onViewReport(order)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1 shadow-2xs"
                                title="Generate and Print Completed Pathology Report"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Report
                              </button>
                            ) : (
                              <button
                                onClick={() => onViewReport(order)}
                                className="px-2 py-1 text-xs font-semibold text-slate-700 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 rounded transition-colors flex items-center gap-1"
                                title="Preview & Generate Preliminary Report Print"
                              >
                                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Preview
                              </button>
                            )}
                          </>
                        )}

                        {/* Receptionist Actions: Invoice/Receipt, Barcode Slip, Print Completed Report */}
                        {isReceptionist && (
                          <>
                            <button
                              onClick={() => onViewReceipt(order)}
                              className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded transition-colors flex items-center gap-1"
                              title="Generate or view patient invoice & payment receipt"
                            >
                              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                              </svg>
                              Invoice / Receipt
                            </button>

                            <button
                              onClick={() => setBarcodeModalOrder(order)}
                              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 rounded"
                              title="Patient Barcode Slip"
                            >
                              Slip
                            </button>

                            {order.sampleStatus === 'Completed' ? (
                              <button
                                onClick={() => onViewReport(order)}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1 shadow-2xs"
                                title="Print Completed Pathology Report"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print Report
                              </button>
                            ) : (
                              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                                Pending Lab
                              </span>
                            )}
                          </>
                        )}

                        {/* Admin Additional Quick Actions */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onViewReport(order)}
                              className="px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded"
                              title="Preview Diagnostic Report"
                            >
                              Report
                            </button>
                            <button
                              onClick={() => onViewReceipt(order)}
                              className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 border border-slate-200 rounded"
                              title="Invoice Receipt & Slip"
                            >
                              Slip
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No lab orders found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Sample Phlebotomy Confirmation Modal */}
      {collectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                Specimen Collection Phlebotomy Counter
              </h3>
              <button
                onClick={() => setCollectingOrder(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="text-teal-900 font-bold text-sm mb-1">
                  Order {collectingOrder.id}
                </div>
                <div className="text-slate-700">
                  Barcode: <strong className="font-mono">{collectingOrder.sampleBarcode}</strong>
                </div>
                <div className="text-slate-700">
                  Specimen Needed: <strong>{collectingOrder.sampleType}</strong>
                </div>
                <div className="text-slate-700">
                  Tests: <strong>{collectingOrder.tests.join(', ')}</strong>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Phlebotomist / Tech Name:
                </label>
                <input
                  type="text"
                  value={phlebotomistName}
                  onChange={(e) => setPhlebotomistName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setBarcodeModalOrder(collectingOrder)}
                  className="text-teal-700 hover:underline font-semibold flex items-center gap-1"
                >
                  Print Vacutainer Sticker
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCollectingOrder(null)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCollection}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                  >
                    Mark Sample Collected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specimen Tube Barcode Modal */}
      {barcodeModalOrder && (
        <TubeLabelModal
          barcode={barcodeModalOrder.sampleBarcode}
          orderId={barcodeModalOrder.id}
          patientName={patients.find(p => p.id === barcodeModalOrder.patientId)?.name || 'Patient'}
          patientId={barcodeModalOrder.patientId}
          patientAgeGender={`${patients.find(p => p.id === barcodeModalOrder.patientId)?.age || ''}Y/${patients.find(p => p.id === barcodeModalOrder.patientId)?.gender?.[0] || ''}`}
          testCodes={barcodeModalOrder.tests}
          bookingDate={barcodeModalOrder.bookingDate}
          sampleType={barcodeModalOrder.sampleType}
          onClose={() => setBarcodeModalOrder(null)}
        />
      )}

      {/* Order QR Code View Modal */}
      {selectedQROrder && (
        <OrderQRModal
          order={selectedQROrder}
          patient={patients.find(p => p.id === selectedQROrder.patientId)}
          onClose={() => setSelectedQROrder(null)}
          onOpenScanner={(orderId) => {
            setSelectedQROrder(null);
            setScannerInitialOrderId(orderId);
            setIsScannerModalOpen(true);
          }}
          onViewReceipt={onViewReceipt}
          onViewReport={onViewReport}
        />
      )}

      {/* Quick Order QR Scanner Modal */}
      {isScannerModalOpen && (
        <OrderScannerModal
          orders={orders}
          patients={patients}
          catalog={catalog}
          reports={reports}
          currentUser={currentUser}
          initialOrderId={scannerInitialOrderId}
          onClose={() => {
            setIsScannerModalOpen(false);
            setScannerInitialOrderId(undefined);
          }}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onViewReceipt={onViewReceipt}
          onViewReport={onViewReport}
          onEnterResults={onEnterResults}
          onOpenQRModal={(order) => {
            setSelectedQROrder(order);
          }}
        />
      )}
    </div>
  );
};
