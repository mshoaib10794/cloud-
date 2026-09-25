import React, { useState, useMemo } from 'react';
import { LabOrder, Patient, TestCatalogItem, OrderResultReport } from '../types/lims';
import { downloadCSV } from '../utils/downloadHelpers';
import { formatLabDate } from '../utils/formatters';

interface BulkReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: LabOrder[];
  patients: Patient[];
  reports: OrderResultReport[];
  catalog: TestCatalogItem[];
}

type DateBasis = 'completion' | 'booking';
type ExportFormat = 'detailed' | 'summary';

export const BulkReportExportModal: React.FC<BulkReportExportModalProps> = ({
  isOpen,
  onClose,
  orders,
  patients,
  reports,
  catalog
}) => {
  // Calculate default dates (Last 7 Days up to today)
  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const defaultStartStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);

  // Form State
  const [startDate, setStartDate] = useState<string>(defaultStartStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [dateBasis, setDateBasis] = useState<DateBasis>('completion');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('detailed');
  const [selectedTestCode, setSelectedTestCode] = useState<string>('ALL');
  const [flagFilter, setFlagFilter] = useState<'ALL' | 'ABNORMAL_ONLY'>('ALL');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Catalog Map for metadata
  const catalogMap = useMemo(() => {
    const map = new Map<string, TestCatalogItem>();
    catalog.forEach(item => {
      map.set(item.code.toUpperCase(), item);
    });
    return map;
  }, [catalog]);

  // Unique test codes present in completed orders
  const availableTestCodes = useMemo(() => {
    const codes = new Set<string>();
    orders.forEach(o => {
      o.tests.forEach(t => codes.add(t.toUpperCase()));
    });
    return Array.from(codes).sort();
  }, [orders]);

  // Helper to determine if an order has a completed / approved report
  const isCompletedReport = (order: LabOrder) => {
    const rep = reports.find(r => r.orderId === order.id);
    return order.sampleStatus === 'Completed' || order.sampleStatus === 'Delivered' || rep?.isApproved === true;
  };

  // Find earliest and latest dates in orders for "All Time" preset
  const { earliestDate, latestDate } = useMemo(() => {
    let earliest = todayStr;
    let latest = todayStr;
    orders.forEach(o => {
      const bDate = o.bookingDate ? o.bookingDate.slice(0, 10) : '';
      if (bDate) {
        if (bDate < earliest) earliest = bDate;
        if (bDate > latest) latest = bDate;
      }
    });
    return { earliestDate: earliest, latestDate: latest };
  }, [orders, todayStr]);

  // Quick Preset Handlers
  const handlePreset = (type: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'all') => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (type === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (type === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (type === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (type === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(today);
    } else if (type === 'all') {
      setStartDate(earliestDate);
      setEndDate(latestDate || today);
    }
  };

  // Filter Completed Orders matching the criteria
  const matchingData = useMemo(() => {
    return orders
      .filter(order => {
        // Must be completed
        if (!isCompletedReport(order)) return false;

        const rep = reports.find(r => r.orderId === order.id);

        // Date range matching
        let targetDateStr = '';
        if (dateBasis === 'completion') {
          targetDateStr = rep?.approvedAt ? rep.approvedAt.slice(0, 10) : (order.bookingDate ? order.bookingDate.slice(0, 10) : '');
        } else {
          targetDateStr = order.bookingDate ? order.bookingDate.slice(0, 10) : '';
        }

        if (!targetDateStr) return false;

        if (startDate && targetDateStr < startDate) return false;
        if (endDate && targetDateStr > endDate) return false;

        // Specific test filter
        if (selectedTestCode !== 'ALL') {
          const hasTest = order.tests.some(t => t.toUpperCase() === selectedTestCode.toUpperCase());
          if (!hasTest) return false;
        }

        return true;
      })
      .map(order => {
        const patient = patients.find(p => p.id === order.patientId);
        const report = reports.find(r => r.orderId === order.id);

        // Calculate parameter stats
        let totalParams = 0;
        let abnormalCount = 0;
        let criticalCount = 0;

        if (report && report.results) {
          report.results.forEach(res => {
            if (selectedTestCode === 'ALL' || res.testCode.toUpperCase() === selectedTestCode.toUpperCase()) {
              totalParams++;
              if (res.flag === 'High' || res.flag === 'Low') abnormalCount++;
              if (res.flag === 'Critical') criticalCount++;
            }
          });
        }

        return {
          order,
          patient,
          report,
          totalParams,
          abnormalCount,
          criticalCount
        };
      });
  }, [orders, reports, patients, startDate, endDate, dateBasis, selectedTestCode]);

  // Aggregate stats of matching reports
  const totalMatchingReports = matchingData.length;
  const totalMatchingParameters = useMemo(() => {
    return matchingData.reduce((acc, curr) => acc + curr.totalParams, 0);
  }, [matchingData]);

  const totalMatchingAbnormal = useMemo(() => {
    return matchingData.reduce((acc, curr) => acc + curr.abnormalCount + curr.criticalCount, 0);
  }, [matchingData]);

  // Execute CSV Export
  const handleExport = (formatToExport: ExportFormat = exportFormat) => {
    if (matchingData.length === 0) return;

    const startLabel = startDate || 'Start';
    const endLabel = endDate || 'End';

    if (formatToExport === 'detailed') {
      // 1. Detailed Biomarkers / Parameters (Row per parameter)
      const headers = [
        'Order ID',
        'Sample Barcode',
        'Booking Date',
        'Approval Date',
        'Patient ID (MRN)',
        'Patient Name',
        'Age',
        'Gender',
        'Patient Phone',
        'Referred By Doctor',
        'Specimen Type',
        'Test Code',
        'Test Name',
        'Department / Category',
        'Sub-Heading',
        'Parameter Name',
        'Observed Value',
        'Unit',
        'Reference Interval (Normal Range)',
        'Flag (High/Low/Critical)',
        'Approved By',
        'Pathologist Remarks',
        'Report Status'
      ];

      const rows: (string | number)[][] = [];

      matchingData.forEach(({ order, patient, report }) => {
        const patientName = patient?.name || 'Walk-in Patient';
        const patientAge = patient?.age !== undefined ? `${patient.age} Yrs` : '';
        const patientGender = patient?.gender || '';
        const patientPhone = patient?.phone || '';
        const doctor = order.referredByDoctor || 'Self / Walk-in';
        const bookingDate = order.bookingDate ? order.bookingDate.slice(0, 16).replace('T', ' ') : '';
        const approvalDate = report?.approvedAt ? report.approvedAt.slice(0, 16).replace('T', ' ') : bookingDate;
        const approver = report?.approvedBy || 'Pathologist Consultant';
        const remarks = report?.pathologistRemarks || '';
        const status = order.sampleStatus;

        if (report && report.results && report.results.length > 0) {
          report.results.forEach(res => {
            // Apply test code filter
            if (selectedTestCode !== 'ALL' && res.testCode.toUpperCase() !== selectedTestCode.toUpperCase()) {
              return;
            }

            // Apply flag filter
            if (flagFilter === 'ABNORMAL_ONLY' && (res.flag === 'Normal' || !res.flag)) {
              return;
            }

            const catalogItem = catalogMap.get(res.testCode.toUpperCase());
            const testName = catalogItem?.name || res.testCode;
            const category = catalogItem?.category || 'Clinical Pathology';

            rows.push([
              order.id,
              order.sampleBarcode,
              bookingDate,
              approvalDate,
              order.patientId,
              patientName,
              patientAge,
              patientGender,
              patientPhone,
              doctor,
              order.sampleType,
              res.testCode,
              testName,
              category,
              res.subHeadingTitle,
              res.parameterName,
              res.value || '',
              res.unit || '',
              res.normalRangeText || '',
              res.flag || 'Normal',
              approver,
              remarks,
              status
            ]);
          });
        } else {
          // If no parsed results yet but order is marked completed
          order.tests.forEach(testCode => {
            if (selectedTestCode !== 'ALL' && testCode.toUpperCase() !== selectedTestCode.toUpperCase()) {
              return;
            }
            const catalogItem = catalogMap.get(testCode.toUpperCase());
            rows.push([
              order.id,
              order.sampleBarcode,
              bookingDate,
              approvalDate,
              order.patientId,
              patientName,
              patientAge,
              patientGender,
              patientPhone,
              doctor,
              order.sampleType,
              testCode,
              catalogItem?.name || testCode,
              catalogItem?.category || 'Clinical Pathology',
              'General',
              'Report Summary',
              'Completed',
              '',
              '',
              'Normal',
              approver,
              remarks,
              status
            ]);
          });
        }
      });

      const filename = `Completed_Test_Parameters_${startLabel}_to_${endLabel}`;
      downloadCSV(filename, headers, rows);

      setExportSuccessMessage(`Exported ${rows.length} test parameter rows across ${matchingData.length} completed reports.`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    } else {
      // 2. Summary per Order (Row per patient order)
      const headers = [
        'Order ID',
        'Sample Barcode',
        'Booking Date',
        'Approval Date',
        'Patient ID (MRN)',
        'Patient Name',
        'Age',
        'Gender',
        'Patient Phone',
        'Referred By Doctor',
        'Specimen Type',
        'Tests Conducted',
        'Test Codes',
        'Total Parameters Tested',
        'Abnormal Parameters Count',
        'Critical Flags Count',
        'Net Amount PKR',
        'Payment Status',
        'Approved By',
        'Pathologist Remarks',
        'Report Status'
      ];

      const rows: (string | number)[][] = matchingData.map(({ order, patient, report, totalParams, abnormalCount, criticalCount }) => {
        const testNames = order.tests
          .map(t => catalogMap.get(t.toUpperCase())?.name || t)
          .join('; ');
        const bookingDate = order.bookingDate ? order.bookingDate.slice(0, 16).replace('T', ' ') : '';
        const approvalDate = report?.approvedAt ? report.approvedAt.slice(0, 16).replace('T', ' ') : bookingDate;

        return [
          order.id,
          order.sampleBarcode,
          bookingDate,
          approvalDate,
          order.patientId,
          patient?.name || 'Walk-in Patient',
          patient?.age !== undefined ? `${patient.age} Yrs` : '',
          patient?.gender || '',
          patient?.phone || '',
          order.referredByDoctor || 'Self / Walk-in',
          order.sampleType,
          testNames,
          order.tests.join(', '),
          totalParams,
          abnormalCount,
          criticalCount,
          order.netAmount,
          order.paymentStatus,
          report?.approvedBy || 'Pathologist Consultant',
          report?.pathologistRemarks || '',
          order.sampleStatus
        ];
      });

      const filename = `Completed_Reports_Summary_${startLabel}_to_${endLabel}`;
      downloadCSV(filename, headers, rows);

      setExportSuccessMessage(`Exported ${rows.length} completed patient report summaries.`);
      setTimeout(() => setExportSuccessMessage(null), 5000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bulk Export Completed Reports (CSV)
              </h2>
              <p className="text-xs text-slate-500">
                Filter and export verified diagnostic test findings into spreadsheet-ready CSV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Close export modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Success Banner */}
          {exportSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{exportSuccessMessage}</span>
            </div>
          )}

          {/* Date Range Selection Card */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Select Report Date Range
              </label>

              {/* Date Basis toggle */}
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Filter by:</span>
                <select
                  value={dateBasis}
                  onChange={e => setDateBasis(e.target.value as DateBasis)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-800 focus:outline-teal-600"
                >
                  <option value="completion">Completion / Approval Date</option>
                  <option value="booking">Order Booking Date</option>
                </select>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => handlePreset('today')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handlePreset('yesterday')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handlePreset('7days')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePreset('30days')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePreset('thisMonth')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 font-semibold transition-colors"
              >
                All Completed
              </button>
            </div>

            {/* Start and End Date Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Start Date (From)
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-medium focus:outline-teal-600"
                />
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                  End Date (To)
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-medium focus:outline-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Filtering & Format Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Filter by Test Profile */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Filter by Investigation Profile
              </label>
              <select
                value={selectedTestCode}
                onChange={e => setSelectedTestCode(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-teal-600"
              >
                <option value="ALL">All Completed Investigations ({availableTestCodes.length} tests)</option>
                {availableTestCodes.map(code => {
                  const item = catalogMap.get(code);
                  return (
                    <option key={code} value={code}>
                      {code} — {item?.name || code}
                    </option>
                  );
                })}
              </select>
              <span className="text-[10px] text-slate-400 block">
                Limit export to a single test panel or leave as all investigations
              </span>
            </div>

            {/* Abnormal Results Filter */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Biomarker Flag Criteria
              </label>
              <select
                value={flagFilter}
                onChange={e => setFlagFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-teal-600"
              >
                <option value="ALL">Include All Results (Normal, High, Low, Critical)</option>
                <option value="ABNORMAL_ONLY">Flagged Out-of-Range Only (High / Low / Critical)</option>
              </select>
              <span className="text-[10px] text-slate-400 block">
                Filter for diagnostic review audits and doctor follow-up lists
              </span>
            </div>
          </div>

          {/* Granularity / Format Selection */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
              Choose CSV File Granularity
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Detailed option */}
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportFormat === 'detailed'
                    ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="detailed"
                  checked={exportFormat === 'detailed'}
                  onChange={() => setExportFormat('detailed')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Detailed Parameters (Biomarker Level)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1 row per test parameter with observed values, reference intervals, units, and flags. Recommended for pathology audits and statistical analysis.
                  </p>
                </div>
              </label>

              {/* Summary option */}
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportFormat === 'summary'
                    ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="exportFormat"
                  value="summary"
                  checked={exportFormat === 'summary'}
                  onChange={() => setExportFormat('summary')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Reports Summary (Patient Order Level)
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1 row per patient report with list of tests conducted, total parameters, abnormal count, approval timestamp, and pathologist remarks.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Scope & Live Match Preview Banner */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Export Scope ({startDate || 'Start'} to {endDate || 'End'})
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-bold font-mono text-teal-900">
                  {totalMatchingReports} <span className="text-xs font-normal text-slate-500 font-sans">completed reports</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-600">
                  <strong className="text-slate-900 font-mono">{totalMatchingParameters}</strong> test parameters
                </span>
                {totalMatchingAbnormal > 0 && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs text-amber-700 font-semibold">
                      {totalMatchingAbnormal} flagged
                    </span>
                  </>
                )}
              </div>
            </div>

            {totalMatchingReports === 0 ? (
              <span className="text-xs text-amber-700 bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-lg font-medium self-start sm:self-center">
                No completed reports in this date range
              </span>
            ) : (
              <span className="text-xs text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-3 py-1 rounded-lg font-bold self-start sm:self-center flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Ready to Export
              </span>
            )}
          </div>

          {/* Quick Preview Table of matching reports */}
          {totalMatchingReports > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 text-[11px] flex items-center justify-between">
                <span>Sample Preview of Matching Reports (Showing top {Math.min(4, totalMatchingReports)} of {totalMatchingReports}):</span>
                <span className="text-[10px] text-slate-400 font-mono">Date: {dateBasis === 'completion' ? 'Approval' : 'Booking'}</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto bg-white">
                {matchingData.slice(0, 4).map(({ order, patient, report, totalParams, abnormalCount }) => (
                  <div key={order.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50/80">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="font-mono font-bold text-teal-800 text-[11px]">{order.id}</span>
                      <span className="font-semibold text-slate-800 truncate">{patient?.name || 'Walk-in'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({order.tests.join(', ')})</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {report?.approvedAt ? report.approvedAt.slice(0, 10) : order.bookingDate?.slice(0, 10)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                        {totalParams} params
                      </span>
                      {abnormalCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {abnormalCount} flag
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs space-y-2">
              <p>No completed reports found between <strong>{startDate}</strong> and <strong>{endDate}</strong>.</p>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className="text-xs font-bold text-teal-700 hover:underline"
              >
                Expand date range to "All Completed" reports →
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Exported CSV files can be opened in Microsoft Excel, Google Sheets, or any LIMS audit database.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-xs"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={totalMatchingReports === 0}
              onClick={() => handleExport(exportFormat)}
              className={`w-full sm:w-auto px-5 py-2 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 ${
                totalMatchingReports === 0
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-teal-700 hover:bg-teal-800 shadow-teal-700/20 cursor-pointer'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download CSV ({totalMatchingReports} reports)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
