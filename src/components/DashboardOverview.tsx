import React, { useState } from 'react';
import { LabOrder, Patient, TestCatalogItem, OrderResultReport, UserAccount, LabProfile } from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { downloadStandaloneReportHTML, downloadStandaloneInvoiceHTML } from '../utils/downloadHelpers';
import { DailyRevenueBarChart } from './DailyRevenueBarChart';
import { DailyTestFrequencyLineChart } from './DailyTestFrequencyLineChart';
import { DemographicSummaryWidget } from './DemographicSummaryWidget';

interface DashboardOverviewProps {
  orders: LabOrder[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  reports: OrderResultReport[];
  currentUser?: UserAccount;
  profile?: LabProfile;
  onOpenSettings?: () => void;
  onOpenNewOrder: () => void;
  onOpenNewPatient: () => void;
  onNavigateTab: (tab: string) => void;
  onViewReceipt: (order: LabOrder) => void;
  onViewReport: (order: LabOrder) => void;
  onEnterResults: (order: LabOrder) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  orders,
  patients,
  catalog,
  reports,
  currentUser,
  profile,
  onOpenSettings,
  onOpenNewOrder,
  onOpenNewPatient,
  onNavigateTab,
  onViewReceipt,
  onViewReport,
  onEnterResults
}) => {
  const [quickSearch, setQuickSearch] = useState('');

  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist' || (currentUser?.role as string) === 'technician';
  const isAdmin = currentUser?.role === 'admin';

  const handleQuickDownloadReport = (order: LabOrder) => {
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
    const report = reports.find(r => r.orderId === order.id);
    downloadStandaloneReportHTML(order, patient, catalog, report);
  };

  // Financial summary
  const totalRevenue = orders.reduce((acc, o) => acc + o.paidAmount, 0);
  const totalReceivables = orders.reduce((acc, o) => acc + Math.max(0, o.netAmount - o.paidAmount), 0);
  const pendingSamplesCount = orders.filter(o => o.sampleStatus === 'Sample Pending').length;
  const inProcessingCount = orders.filter(o => o.sampleStatus === 'In Processing' || o.sampleStatus === 'Sample Collected').length;
  const completedReportsCount = reports.filter(r => r.isApproved).length;

  // Daily and Overall Report Workload Calculations for Staff Overview
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.bookingDate && o.bookingDate.startsWith(todayStr));
  const hasOrdersToday = todayOrders.length > 0;
  const targetScopeOrders = hasOrdersToday ? todayOrders : orders;

  const scopeTotalReports = targetScopeOrders.length;
  const scopeCompletedReports = targetScopeOrders.filter(
    o => o.sampleStatus === 'Completed' || o.sampleStatus === 'Delivered' || reports.some(r => r.orderId === o.id && r.isApproved)
  ).length;
  const scopePendingReports = targetScopeOrders.filter(
    o => o.sampleStatus !== 'Completed' && o.sampleStatus !== 'Delivered' && !reports.some(r => r.orderId === o.id && r.isApproved)
  ).length;

  const scopeSamplePending = targetScopeOrders.filter(o => o.sampleStatus === 'Sample Pending').length;
  const scopeInAnalysis = targetScopeOrders.filter(
    o => o.sampleStatus === 'In Processing' || o.sampleStatus === 'Sample Collected'
  ).length;
  const scopeCompletionRate = scopeTotalReports > 0 ? Math.round((scopeCompletedReports / scopeTotalReports) * 100) : 0;

  // Overall Lab Totals
  const overallActiveOrders = orders.length;
  const overallCompletedCount = orders.filter(
    o => o.sampleStatus === 'Completed' || o.sampleStatus === 'Delivered' || reports.some(r => r.orderId === o.id && r.isApproved)
  ).length;
  const overallPendingCount = orders.filter(
    o => o.sampleStatus !== 'Completed' && o.sampleStatus !== 'Delivered' && !reports.some(r => r.orderId === o.id && r.isApproved)
  ).length;

  // Filtered orders for quick lookup
  const displayOrders = orders.filter(order => {
    if (!quickSearch) return true;
    const pat = patients.find(p => p.id === order.patientId);
    return (
      order.id.toLowerCase().includes(quickSearch.toLowerCase()) ||
      order.sampleBarcode.toLowerCase().includes(quickSearch.toLowerCase()) ||
      (pat && pat.name.toLowerCase().includes(quickSearch.toLowerCase())) ||
      (pat && pat.phone.includes(quickSearch)) ||
      (pat && pat.cnic.includes(quickSearch))
    );
  }).slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Barcode Scanner Search */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Pakistan Cloud Pathology Edition
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PKR Pricing · ISO 15189
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              {profile?.labName || 'Lab-Portal-App'}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {profile?.tagline || 'Automated specimen barcoding, sub-heading investigation profiles, reference interval flagging, and comprehensive PKR billing receipts.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenNewOrder}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              + Book Lab Order
            </button>
            <button
              onClick={onOpenNewPatient}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              + Register Patient
            </button>
            {isAdmin && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Configure Lab Profile, Manual Logo & Letterhead Banner"
                className="px-3.5 py-2.5 bg-teal-900/60 hover:bg-teal-800/80 text-teal-200 border border-teal-500/40 font-semibold text-xs rounded-xl transition-all flex items-center gap-2"
              >
                <span>⚙</span>
                <span>Branding & Logo</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Barcode Scanner Input */}
        <div className="mt-6 pt-5 border-t border-slate-800 relative z-10 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full">
            <svg
              className="w-4 h-4 absolute left-3.5 top-3 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <input
              type="text"
              placeholder="Fast Scan: Type Barcode (e.g. BC-849102), Order ID, Patient CNIC or Phone..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-400 font-mono"
            />
          </div>
          {quickSearch && (
            <button
              onClick={() => setQuickSearch('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total PKR Revenue or Samples For Analysis for Lab Technician */}
        {isTechnician ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-semibold">Samples For Analysis</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
              {inProcessingCount + pendingSamplesCount} Samples
            </div>
            <div className="mt-1 text-[11px] text-teal-700 font-medium">
              {inProcessingCount} in processing · {pendingSamplesCount} awaiting collection
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs font-semibold">Total PKR Collected</span>
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatPKR(totalRevenue)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Dues balance: <span className="text-rose-600 font-mono font-medium">{formatPKR(totalReceivables)}</span>
            </div>
          </div>
        )}

        {/* Registered Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">Registered Patients</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {patients.length} Patients
          </div>
          <div className="mt-1 text-[11px] text-teal-700 font-medium">
            MRN auto system generated
          </div>
        </div>

        {/* Specimen Pipeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">Active Lab Orders</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {orders.length} Booked
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {pendingSamplesCount} sample pending · {inProcessingCount} processing
          </div>
        </div>

        {/* Test Catalog Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 text-xs font-semibold">Test Catalog</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-slate-900 tabular-nums">
            {catalog.length} Test Profiles
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {completedReportsCount} reports finalized
          </div>
        </div>
      </div>

      {/* Daily Report Counts & Staff Worklist Summary Widget */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-800">
                  Daily Report Summary & Worklist Overview
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 uppercase tracking-wide">
                  Staff Monitor
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quick diagnostic throughput monitoring: total completed reports versus pending specimens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('results')}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg border border-teal-200 transition-colors flex items-center gap-1.5"
            >
              <span>Verify Results</span>
              <span className="text-[10px] bg-teal-200/60 px-1.5 py-0.2 rounded font-mono font-bold">
                {scopePendingReports}
              </span>
            </button>
            <button
              onClick={() => onNavigateTab('orders')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
            >
              All Orders
            </button>
          </div>
        </div>

        {/* 3 Main Stat Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Completed Reports */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold mb-1">
              <span>Completed Reports</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                Approved
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 font-mono tabular-nums">
              {scopeCompletedReports}
              <span className="text-xs font-normal text-emerald-700 ml-1.5 font-sans">
                / {scopeTotalReports} total
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Finalized, authorized by Pathologist & ready for patient collection
            </p>
          </div>

          {/* Pending Reports */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between text-xs text-amber-800 font-semibold mb-1">
              <span>Pending Reports</span>
              <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">
                In Queue
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-mono tabular-nums">
              {scopePendingReports}
              <span className="text-xs font-normal text-amber-700 ml-1.5 font-sans">
                awaiting results
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-800 font-medium">
              <span>• {scopeSamplePending} awaiting sample</span>
              <span>• {scopeInAnalysis} in processing</span>
            </div>
          </div>

          {/* Turnaround & Completion Progress */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Daily Completion Rate</span>
                <span className="font-mono font-bold text-teal-800 text-sm">
                  {scopeCompletionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-2">
                <div
                  className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, scopeCompletionRate))}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span>Overall Lab Archive:</span>
              <span className="font-bold text-slate-700">
                {overallCompletedCount} done · {overallPendingCount} pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Diagnostic Test Frequency Line Chart */}
      <DailyTestFrequencyLineChart
        orders={orders}
        reports={reports}
        catalog={catalog}
        patients={patients}
        onNavigateTab={onNavigateTab}
        onEnterResults={onEnterResults}
        onViewReport={onViewReport}
      />

      {/* Patient Demographic Summary Widget (Age Groups & Gender Breakdown) */}
      <DemographicSummaryWidget
        patients={patients}
        orders={orders}
        reports={reports}
        onNavigateTab={onNavigateTab}
        onOpenNewPatient={onOpenNewPatient}
      />

      {/* 7-Day Revenue Bar Chart from Completed Billing Transactions (Removed for Lab Technician account) */}
      {!isTechnician && (
        <DailyRevenueBarChart
          orders={orders}
          patients={patients}
          onViewReceipt={onViewReceipt}
          onNavigateToBilling={() => onNavigateTab('billing')}
        />
      )}

      {/* Recent Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Recent Laboratory Orders & Samples
            </h2>
            <p className="text-xs text-slate-500">
              Live worklist with real-time status and quick actions
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-teal-700 hover:underline"
          >
            View All Orders →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Order ID / Barcode</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-3">Investigations</th>
                <th className="py-3 px-3">Booking Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Net Fee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayOrders.map(order => {
                const pat = patients.find(p => p.id === order.patientId);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-teal-800">{order.id}</div>
                      <div className="font-mono text-[11px] text-slate-500">{order.sampleBarcode}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{pat?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-slate-500">{pat?.phone} · {pat?.gender}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-800">
                        {order.tests.join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">{order.sampleType}</div>
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {formatLabDate(order.bookingDate)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                          order.sampleStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : order.sampleStatus === 'In Processing'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : order.sampleStatus === 'Sample Collected'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.sampleStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900 tabular-nums">
                      {formatPKR(order.netAmount)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Technologist / Admin results link */}
                        {(isTechnician || isAdmin) && (
                          <button
                            onClick={() => onEnterResults(order)}
                            className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded"
                          >
                            Enter Results
                          </button>
                        )}

                        {/* Reception / Admin slip link */}
                        {(isReceptionist || isAdmin) && (
                          <button
                            onClick={() => onViewReceipt(order)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
                            title="View Invoice Receipt"
                          >
                            Invoice / Slip
                          </button>
                        )}

                        {/* Report preview / print */}
                        {(isReceptionist && order.sampleStatus === 'Completed') || isTechnician || isAdmin ? (
                          <button
                            onClick={() => onViewReport(order)}
                            className={`px-2.5 py-1 text-xs rounded font-bold flex items-center gap-1 ${
                              order.sampleStatus === 'Completed'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Preview / Print Diagnostic Report"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            {order.sampleStatus === 'Completed' ? 'Print Report' : 'Preview'}
                          </button>
                        ) : null}

                        <button
                          onClick={() => handleQuickDownloadReport(order)}
                          className="px-2 py-1 text-xs text-slate-600 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 rounded transition-colors"
                          title="Download Offline HTML/PDF Report"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
