import React, { useState } from 'react';
import { LabOrder, Patient, TestCatalogItem, OrderResultReport, ParameterResult, ResultFlag, UserAccount } from '../types/lims';
import { calculateFlag, formatLabDate } from '../utils/formatters';
import { downloadStandaloneReportHTML } from '../utils/downloadHelpers';
import { BulkReportExportModal } from './BulkReportExportModal';

interface TestResultsViewProps {
  orders: LabOrder[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  reports: OrderResultReport[];
  currentUser?: UserAccount;
  onSaveReport: (report: OrderResultReport) => void;
  onViewDiagnosticReport: (order: LabOrder) => void;
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  orders,
  patients,
  catalog,
  reports,
  currentUser,
  onSaveReport,
  onViewDiagnosticReport
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [filterState, setFilterState] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [search, setSearch] = useState('');
  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist';
  const isAdmin = currentUser?.role === 'admin';

  // Editing results state for currently selected order
  const activeOrder = orders.find(o => o.id === selectedOrderId);
  const activePatient = patients.find(p => p.id === activeOrder?.patientId);
  const existingReport = reports.find(r => r.orderId === selectedOrderId);
  const isOrderCompleted = activeOrder?.sampleStatus === 'Completed' || existingReport?.isApproved;

  // Form values state: map of paramId -> { value, flag }
  const [paramValues, setParamValues] = useState<{ [paramId: string]: { value: string; flag: ResultFlag } }>({});
  const [approvedBy, setApprovedBy] = useState(
    currentUser?.role === 'technologist'
      ? `${currentUser.name}${currentUser.designation ? ', ' + currentUser.designation : ''}`
      : 'Dr. Salman Tariq, MBBS, MPhil Pathologist'
  );
  const [pathologistRemarks, setPathologistRemarks] = useState('');

  // Sync state whenever activeOrder or existingReport changes
  React.useEffect(() => {
    if (!activeOrder) return;
    const currentReport = reports.find(r => r.orderId === activeOrder.id);
    const initialMap: { [paramId: string]: { value: string; flag: ResultFlag } } = {};

    if (currentReport && currentReport.results) {
      currentReport.results.forEach(res => {
        initialMap[res.parameterId] = {
          value: res.value,
          flag: res.flag
        };
      });
      setApprovedBy(
        currentReport.approvedBy ||
        (currentUser?.role === 'technologist'
          ? `${currentUser.name}${currentUser.designation ? ', ' + currentUser.designation : ''}`
          : 'Dr. Salman Tariq, MBBS, MPhil Pathologist')
      );
      setPathologistRemarks(currentReport.pathologistRemarks || '');
    } else {
      // Prepopulate with default values if available in catalog
      activeOrder.tests.forEach(code => {
        const testItem = catalog.find(t => t.code === code);
        testItem?.subHeadings?.forEach(sh => {
          sh.parameters?.forEach(p => {
            initialMap[p.id] = {
              value: p.defaultValue || '',
              flag: 'Normal'
            };
          });
        });
      });
      setApprovedBy(
        currentUser?.role === 'technologist'
          ? `${currentUser.name}${currentUser.designation ? ', ' + currentUser.designation : ''}`
          : 'Dr. Salman Tariq, MBBS, MPhil Pathologist'
      );
      setPathologistRemarks('');
    }

    setParamValues(initialMap);
  }, [selectedOrderId, reports, catalog, activeOrder, currentUser]);

  // Handle value change with auto-flagging
  const handleValueChange = (
    paramId: string,
    newValue: string,
    min?: number,
    max?: number
  ) => {
    const autoFlag = calculateFlag(newValue, min, max);
    setParamValues(prev => ({
      ...prev,
      [paramId]: {
        value: newValue,
        flag: autoFlag
      }
    }));
  };

  // Handle manual flag override
  const handleFlagOverride = (paramId: string, newFlag: ResultFlag) => {
    setParamValues(prev => ({
      ...prev,
      [paramId]: {
        value: prev[paramId]?.value || '',
        flag: newFlag
      }
    }));
  };

  // Submit / Approve report
  const handleSave = (isApproval: boolean) => {
    if (!activeOrder) return;

    const resultsList: ParameterResult[] = [];

    activeOrder.tests.forEach(code => {
      const testItem = catalog.find(t => t.code === code);
      testItem?.subHeadings?.forEach(sh => {
        sh.parameters?.forEach(param => {
          const entry = paramValues[param.id];
          resultsList.push({
            testCode: code,
            subHeadingId: sh.id,
            subHeadingTitle: sh.title,
            parameterId: param.id,
            parameterName: param.name,
            value: entry?.value || '',
            unit: param.unit,
            normalRangeText: param.normalRangeText,
            flag: entry?.flag || 'Normal'
          });
        });
      });
    });

    const reportObj: OrderResultReport = {
      orderId: activeOrder.id,
      results: resultsList,
      approvedBy,
      approvedAt: isApproval ? new Date().toISOString() : existingReport?.approvedAt,
      pathologistRemarks,
      isApproved: isApproval
    };

    onSaveReport(reportObj);

    if (isApproval) {
      setValidationSuccessMsg(`Report for order ${activeOrder.id} successfully validated and marked as Completed! Lab Technician and Reception can now generate and print this report.`);
      setTimeout(() => setValidationSuccessMsg(null), 6000);
    }

    return reportObj;
  };

  // Validate and immediately launch report print dialog
  const handleValidateAndPrint = () => {
    if (!activeOrder) return;
    handleSave(true);
    onViewDiagnosticReport(activeOrder);
  };

  // Order Worklist filtering
  const filteredOrders = orders.filter(o => {
    const isCompleted = o.sampleStatus === 'Completed';
    const matchesFilter =
      filterState === 'All'
        ? true
        : filterState === 'Completed'
        ? isCompleted
        : !isCompleted;

    const pat = patients.find(p => p.id === o.patientId);
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.sampleBarcode.toLowerCase().includes(search.toLowerCase()) ||
      (pat && pat.name.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Role specific notification banner */}
      {isReceptionist && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-teal-600 text-white rounded text-[10px]">
              Reception Account
            </span>
            <span>
              <strong>Print Completed Reports:</strong> Select an order from the list. If it is marked "Approved / Ready to Print", click "Print Diagnostic Report" to generate the patient printout.
            </span>
          </div>
        </div>
      )}

      {isTechnician && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">
              Lab Technician Account
            </span>
            <span>
              <strong>Clinical Results, Validation & Report Prints:</strong> Enter observed test values, verify reference ranges, validate findings, and generate official diagnostic report prints.
            </span>
          </div>
        </div>
      )}

      {validationSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{validationSuccessMsg}</span>
          </div>
          {activeOrder && (
            <button
              onClick={() => onViewDiagnosticReport(activeOrder)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1.5 shrink-0"
              title="Generate and print official report now"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report Now
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isReceptionist ? 'Print Completed Diagnostic Reports' : 'Pathology Test Results & Clinical Validation'}
          </h1>
          <p className="text-xs text-slate-500">
            {isReceptionist
              ? 'Access completed patient investigations to preview, print or download official laboratory diagnostic reports'
              : 'Enter observed values, automatic reference range flagging (High / Low / Critical), clinical validation, and generate diagnostic report prints'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer hover:border-emerald-400"
            title="Bulk export completed laboratory reports for a selected date range to CSV"
          >
            <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Bulk CSV Export</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-950 font-mono text-[10px] font-bold">
              {orders.filter(o => o.sampleStatus === 'Completed' || o.sampleStatus === 'Delivered' || reports.some(r => r.orderId === o.id && r.isApproved)).length}
            </span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Worklist on Left, Result Entry Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worklist (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Orders Worklist
              </span>
              <div className="flex bg-slate-100 p-0.5 rounded text-[11px]">
                {(['All', 'Pending', 'Completed'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilterState(tab)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      filterState === tab ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Search Order ID, Barcode, Patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
            />

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-slate-400">
                {filteredOrders.length} order{filteredOrders.length === 1 ? '' : 's'} listed
              </span>
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="text-teal-700 hover:text-teal-900 font-bold hover:underline flex items-center gap-1"
                title="Open bulk report CSV export dialog"
              >
                <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV Range
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredOrders.map(order => {
              const pat = patients.find(p => p.id === order.patientId);
              const rep = reports.find(r => r.orderId === order.id);
              const isSelected = selectedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {order.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        order.sampleStatus === 'Completed' || rep?.isApproved
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {order.sampleStatus === 'Completed' || rep?.isApproved
                        ? (isReceptionist ? 'Ready to Print' : 'Completed')
                        : 'Results Pending'}
                    </span>
                  </div>

                  <div className="font-semibold text-slate-800 text-xs truncate">
                    {pat?.name || 'Unknown Patient'}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                    <span className="font-mono">{order.sampleBarcode}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-slate-700">{order.tests.join(', ')}</span>
                      {(order.sampleStatus === 'Completed' || rep?.isApproved) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDiagnosticReport(order);
                          }}
                          title="Generate & Print Diagnostic Report"
                          className="px-1.5 py-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded flex items-center gap-0.5 transition-colors"
                        >
                          <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="p-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
                No orders match your search.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result Entry Workstation (8 cols) */}
        <div className="lg:col-span-8">
          {activeOrder && activePatient ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              {/* Order Context Top Bar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-teal-800">
                      {activeOrder.id}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-xs text-slate-600">
                      Barcode: <strong>{activeOrder.sampleBarcode}</strong>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-xs text-slate-500">
                      Booked: {formatLabDate(activeOrder.bookingDate)}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {activePatient.name} · {activePatient.age} Yrs / {activePatient.gender} · MRN: {activePatient.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewDiagnosticReport(activeOrder)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Diagnostic Report
                  </button>
                </div>
              </div>

              {/* Role Context Bar for active order */}
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200">
                {isOrderCompleted ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>
                        <strong>Report Completed & Validated!</strong> Approved by {existingReport?.approvedBy || 'Lab Consultant'}. Ready for patient and laboratory printout.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewDiagnosticReport(activeOrder)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Official Report
                    </button>
                  </div>
                ) : isReceptionist ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
                    <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="font-bold">Pending Laboratory Technician Validation:</span> This order is still undergoing testing in the lab. Reception can print the official report once the technician validates and completes it.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>
                        <strong>In Progress:</strong> Enter observed parameter values below. Reference ranges auto-flag. You can preview or validate and print the official report directly.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewDiagnosticReport(activeOrder)}
                      className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Preview Print
                    </button>
                  </div>
                )}
              </div>

              {/* Form Body: Investigation Sub-headings & Parameters */}
              <div className="p-5 space-y-6 max-h-[640px] overflow-y-auto">
                {activeOrder.tests.map(code => {
                  const testItem = catalog.find(t => t.code === code);
                  if (!testItem) return null;

                  return (
                    <div key={testItem.code} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Test Title Header */}
                      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          {testItem.name} ({testItem.code})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Specimen: {testItem.specimen}
                        </span>
                      </div>

                      {/* Subheadings and parameters */}
                      <div className="divide-y divide-slate-100">
                        {testItem.subHeadings?.map(sh => (
                          <div key={sh.id} className="p-3 bg-white space-y-2">
                            <div className="font-bold text-xs text-teal-800 bg-slate-50 px-2 py-1 rounded">
                              • {sh.title}
                            </div>

                            {/* Parameter Entry Rows */}
                            <div className="space-y-1.5 pt-1">
                              {sh.parameters?.map(param => {
                                const currentEntry = paramValues[param.id] || { value: '', flag: 'Normal' };
                                const flag = currentEntry.flag;

                                return (
                                  <div
                                    key={param.id}
                                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border text-xs ${
                                      flag === 'High'
                                        ? 'border-rose-200 bg-rose-50/40'
                                        : flag === 'Low'
                                        ? 'border-blue-200 bg-blue-50/40'
                                        : flag === 'Critical'
                                        ? 'border-red-300 bg-red-100/60 font-bold'
                                        : 'border-slate-100 hover:bg-slate-50/60'
                                    }`}
                                  >
                                    {/* Name & Reference */}
                                    <div className="col-span-5">
                                      <div className="font-semibold text-slate-800">
                                        {param.name}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-mono">
                                        Ref: {param.normalRangeText} {param.unit}
                                      </div>
                                    </div>

                                    {/* Observed Value Input / Readonly Display for Reception */}
                                    <div className="col-span-4">
                                      {isReceptionist ? (
                                        <div className="flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800">
                                          <span>{currentEntry.value ? currentEntry.value : <span className="italic text-slate-400 font-normal">Pending lab entry</span>}</span>
                                          <span className="text-[10px] text-slate-400 font-sans ml-auto">{param.unit}</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="text"
                                            placeholder="Value..."
                                            value={currentEntry.value}
                                            onChange={e =>
                                              handleValueChange(
                                                param.id,
                                                e.target.value,
                                                param.normalRangeMin,
                                                param.normalRangeMax
                                              )
                                            }
                                            className={`w-full font-mono text-xs px-2.5 py-1.5 rounded border focus:ring-1 focus:ring-teal-500 ${
                                              flag === 'High' || flag === 'Critical'
                                                ? 'font-bold text-rose-700 bg-white border-rose-300'
                                                : flag === 'Low'
                                                ? 'font-bold text-blue-700 bg-white border-blue-300'
                                                : 'bg-white border-slate-300 text-slate-900'
                                            }`}
                                          />
                                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                                            {param.unit}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Flag Selector or Display */}
                                    <div className="col-span-3 text-right">
                                      {isReceptionist ? (
                                        <span
                                          className={`inline-block text-[10px] font-bold rounded px-2 py-0.5 border ${
                                            flag === 'High'
                                              ? 'text-rose-700 bg-rose-50 border-rose-300'
                                              : flag === 'Low'
                                              ? 'text-blue-700 bg-blue-50 border-blue-300'
                                              : flag === 'Critical'
                                              ? 'text-red-800 bg-red-100 border-red-400'
                                              : 'text-slate-600 bg-slate-50 border-slate-200'
                                          }`}
                                        >
                                          {flag}
                                        </span>
                                      ) : (
                                        <select
                                          value={flag}
                                          onChange={e =>
                                            handleFlagOverride(param.id, e.target.value as ResultFlag)
                                          }
                                          className={`text-[11px] font-bold rounded px-2 py-1 border ${
                                            flag === 'High'
                                              ? 'text-rose-700 bg-rose-50 border-rose-300'
                                              : flag === 'Low'
                                              ? 'text-blue-700 bg-blue-50 border-blue-300'
                                              : flag === 'Critical'
                                              ? 'text-red-800 bg-red-100 border-red-400'
                                              : 'text-slate-600 bg-white border-slate-200'
                                          }`}
                                        >
                                          <option value="Normal">Normal</option>
                                          <option value="High">High ▲</option>
                                          <option value="Low">Low ▼</option>
                                          <option value="Critical">Critical ⚠️</option>
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Remarks & Approval Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {isTechnician ? 'Laboratory Technician & Consultant Sign-off' : 'Validation & Clinical Remarks'}
                  </h4>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-xs">
                      Validated / Approved By *
                    </label>
                    <input
                      type="text"
                      disabled={isReceptionist}
                      value={approvedBy}
                      onChange={e => setApprovedBy(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        isReceptionist
                          ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1 text-xs">
                      Clinical Remarks / Impression (Printed on official report):
                    </label>
                    <textarea
                      rows={2}
                      disabled={isReceptionist}
                      placeholder={isReceptionist ? 'No remarks recorded' : 'e.g. Mild normocytic normochromic anemia. Clinically correlate with iron profile...'}
                      value={pathologistRemarks}
                      onChange={e => setPathologistRemarks(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs ${
                        isReceptionist
                          ? 'bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {isOrderCompleted ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Report Completed & Validated {existingReport?.approvedAt ? `on ${formatLabDate(existingReport.approvedAt)}` : ''}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      {isReceptionist
                        ? 'Pending lab technician validation before report can be printed'
                        : 'Draft mode: Enter results and click "Validate & Complete Report"'}
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  {isReceptionist ? (
                    <button
                      type="button"
                      onClick={() => onViewDiagnosticReport(activeOrder)}
                      disabled={!isOrderCompleted}
                      className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
                        isOrderCompleted
                          ? 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      {isOrderCompleted ? 'Print Completed Report' : 'Awaiting Lab Validation'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSave(false)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors"
                      >
                        Save Draft
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewDiagnosticReport(activeOrder)}
                        className="px-3.5 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Generate and preview printable diagnostic report"
                      >
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Generate Print
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave(true)}
                        className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Validate & Complete
                      </button>

                      <button
                        type="button"
                        onClick={handleValidateAndPrint}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        title="Validate findings and immediately open official report printout"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Validate & Print Report
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select an order from the worklist to start entering lab results.
            </div>
          )}
        </div>
      </div>

      {/* Bulk CSV Report Export Modal */}
      <BulkReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        orders={orders}
        patients={patients}
        reports={reports}
        catalog={catalog}
      />
    </div>
  );
};
