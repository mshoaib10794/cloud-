import React, { useState, useMemo } from 'react';
import { Patient, LabOrder, TestCatalogItem, OrderResultReport, ParameterResult, ResultFlag, UserAccount, TestParameterDef } from '../types/lims';
import { formatLabDate } from '../utils/formatters';
import { downloadCSV } from '../utils/downloadHelpers';

interface MedicalHistoryViewProps {
  patient: Patient;
  patients?: Patient[];
  orders: LabOrder[];
  reports: OrderResultReport[];
  catalog: TestCatalogItem[];
  currentUser?: UserAccount;
  onSelectPatient?: (patient: Patient) => void;
  onViewOrderReport?: (order: LabOrder) => void;
  onViewOrderReceipt?: (order: LabOrder) => void;
  onBookOrder?: (patient: Patient) => void;
  compactMode?: boolean;
}

interface ParameterHistoryPoint {
  orderId: string;
  bookingDate: string;
  value: string;
  numericValue: number | null;
  unit: string;
  flag: ResultFlag;
  normalRangeText: string;
  min?: number;
  max?: number;
}

interface ParameterLongitudinalTrend {
  parameterId: string;
  parameterName: string;
  testCode: string;
  testName: string;
  subHeadingTitle: string;
  unit: string;
  normalRangeText: string;
  min?: number;
  max?: number;
  history: ParameterHistoryPoint[];
  latestPoint?: ParameterHistoryPoint;
  previousPoint?: ParameterHistoryPoint;
  trajectory?: 'increasing' | 'decreasing' | 'stable' | 'single';
  deltaText?: string;
  hasAbnormal: boolean;
}

export const MedicalHistoryView: React.FC<MedicalHistoryViewProps> = ({
  patient,
  patients = [],
  orders,
  reports,
  catalog,
  currentUser,
  onSelectPatient,
  onViewOrderReport,
  onViewOrderReceipt,
  onBookOrder,
  compactMode = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [biomarkerSearch, setBiomarkerSearch] = useState<string>('');
  const [showAbnormalOnly, setShowAbnormalOnly] = useState<boolean>(false);
  const [selectedBiomarkerForChart, setSelectedBiomarkerForChart] = useState<string>('param_hb');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [activeSubView, setActiveSubView] = useState<'matrix' | 'timeline' | 'trends'>('matrix');

  // Filter orders for the selected patient
  const patientOrders = useMemo(() => {
    return orders
      .filter((o) => o.patientId === patient.id)
      .sort((a, b) => {
        const timeA = new Date(a.bookingDate).getTime();
        const timeB = new Date(b.bookingDate).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [orders, patient.id, sortOrder]);

  // Extract all parameter results for each order
  const orderResultsMap = useMemo(() => {
    const map = new Map<string, ParameterResult[]>();

    patientOrders.forEach((order) => {
      const rep = reports.find((r) => r.orderId === order.id);
      if (rep && rep.results && rep.results.length > 0) {
        map.set(order.id, rep.results);
      } else {
        // Fallback: build default results from catalog for tests requested in the order
        const fallbackResults: ParameterResult[] = [];
        order.tests.forEach((code) => {
          const testDef = catalog.find((c) => c.code === code);
          testDef?.subHeadings?.forEach((sh) => {
            sh.parameters?.forEach((param) => {
              fallbackResults.push({
                testCode: code,
                subHeadingId: sh.id,
                subHeadingTitle: sh.title,
                parameterId: param.id,
                parameterName: param.name,
                value: param.defaultValue || (param.normalRangeMin ? String(((param.normalRangeMin + (param.normalRangeMax || param.normalRangeMin * 1.5)) / 2).toFixed(1)) : 'Normal'),
                unit: param.unit,
                normalRangeText: param.normalRangeText,
                flag: 'Normal'
              });
            });
          });
        });
        map.set(order.id, fallbackResults);
      }
    });

    return map;
  }, [patientOrders, reports, catalog]);

  // Chronologically ordered dates for header columns (oldest to newest for longitudinal analysis)
  const chronologicalOrders = useMemo(() => {
    return [...patientOrders].sort(
      (a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
    );
  }, [patientOrders]);

  // Group and compute longitudinal trends for each unique parameter
  const longitudinalTrends = useMemo(() => {
    const paramMap = new Map<string, ParameterLongitudinalTrend>();

    chronologicalOrders.forEach((order) => {
      const results = orderResultsMap.get(order.id) || [];
      results.forEach((res) => {
        const testItem = catalog.find((t) => t.code === res.testCode);
        let paramDef: TestParameterDef | undefined;
        if (testItem?.subHeadings) {
          for (const sh of testItem.subHeadings) {
            const found = sh.parameters?.find((param) => param.id === res.parameterId);
            if (found) {
              paramDef = found;
              break;
            }
          }
        }

        const numVal = parseFloat(res.value);
        const point: ParameterHistoryPoint = {
          orderId: order.id,
          bookingDate: order.bookingDate,
          value: res.value,
          numericValue: isNaN(numVal) ? null : numVal,
          unit: res.unit,
          flag: res.flag || 'Normal',
          normalRangeText: res.normalRangeText || paramDef?.normalRangeText || '',
          min: paramDef?.normalRangeMin,
          max: paramDef?.normalRangeMax
        };

        if (!paramMap.has(res.parameterId)) {
          paramMap.set(res.parameterId, {
            parameterId: res.parameterId,
            parameterName: res.parameterName,
            testCode: res.testCode,
            testName: testItem?.name || res.testCode,
            subHeadingTitle: res.subHeadingTitle,
            unit: res.unit,
            normalRangeText: res.normalRangeText || paramDef?.normalRangeText || '',
            min: paramDef?.normalRangeMin,
            max: paramDef?.normalRangeMax,
            history: [point],
            hasAbnormal: point.flag !== 'Normal'
          });
        } else {
          const existing = paramMap.get(res.parameterId)!;
          existing.history.push(point);
          if (point.flag !== 'Normal') {
            existing.hasAbnormal = true;
          }
        }
      });
    });

    // Compute trajectories and deltas between latest and previous visits
    paramMap.forEach((item) => {
      if (item.history.length >= 2) {
        const prev = item.history[item.history.length - 2];
        const latest = item.history[item.history.length - 1];
        item.previousPoint = prev;
        item.latestPoint = latest;

        if (latest.numericValue !== null && prev.numericValue !== null) {
          const diff = latest.numericValue - prev.numericValue;
          const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
          item.deltaText = `${diffStr} ${item.unit}`;
          if (Math.abs(diff) < 0.05) {
            item.trajectory = 'stable';
          } else if (diff > 0) {
            item.trajectory = 'increasing';
          } else {
            item.trajectory = 'decreasing';
          }
        } else {
          item.trajectory = latest.value === prev.value ? 'stable' : 'increasing';
        }
      } else if (item.history.length === 1) {
        item.latestPoint = item.history[0];
        item.trajectory = 'single';
      }
    });

    return Array.from(paramMap.values());
  }, [chronologicalOrders, orderResultsMap, catalog]);

  // Extract categories present in this patient's medical history
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    longitudinalTrends.forEach((t) => {
      const item = catalog.find((c) => c.code === t.testCode);
      if (item?.category) cats.add(item.category);
      else cats.add(t.testName);
    });
    return ['All', ...Array.from(cats)];
  }, [longitudinalTrends, catalog]);

  // Filtered longitudinal trends
  const filteredTrends = useMemo(() => {
    return longitudinalTrends.filter((item) => {
      const cat = catalog.find((c) => c.code === item.testCode)?.category || item.testName;
      const matchesCat = selectedCategory === 'All' || cat === selectedCategory;
      const matchesSearch =
        item.parameterName.toLowerCase().includes(biomarkerSearch.toLowerCase()) ||
        item.testCode.toLowerCase().includes(biomarkerSearch.toLowerCase()) ||
        item.subHeadingTitle.toLowerCase().includes(biomarkerSearch.toLowerCase());
      const matchesAbnormal = !showAbnormalOnly || item.hasAbnormal;

      return matchesCat && matchesSearch && matchesAbnormal;
    });
  }, [longitudinalTrends, selectedCategory, biomarkerSearch, showAbnormalOnly, catalog]);

  // Selected parameter for the interactive trend chart
  const chartParameter = useMemo(() => {
    return longitudinalTrends.find((t) => t.parameterId === selectedBiomarkerForChart) || longitudinalTrends[0];
  }, [longitudinalTrends, selectedBiomarkerForChart]);

  // Export Longitudinal CSV
  const handleExportLongitudinalCSV = () => {
    const headers = [
      'Biomarker Parameter',
      'Test Code',
      'Test Name',
      'Reference Range',
      'Unit',
      ...chronologicalOrders.map((o) => `Visit ${formatLabDate(o.bookingDate)} (${o.id})`),
      'Latest Health Trajectory'
    ];

    const rows = longitudinalTrends.map((t) => {
      const dateValues = chronologicalOrders.map((o) => {
        const point = t.history.find((h) => h.orderId === o.id);
        return point ? `${point.value} [${point.flag}]` : 'Not Tested';
      });

      return [
        t.parameterName,
        t.testCode,
        t.testName,
        t.normalRangeText,
        t.unit,
        ...dateValues,
        t.deltaText || t.trajectory || 'Single Visit'
      ];
    });

    downloadCSV(`Longitudinal_Medical_History_${patient.id}_${patient.name.replace(/\s+/g, '_')}`, headers, rows);
  };

  // Metrics summary
  const totalAbnormalFlags = useMemo(() => {
    let count = 0;
    longitudinalTrends.forEach((t) => {
      t.history.forEach((h) => {
        if (h.flag !== 'Normal') count++;
      });
    });
    return count;
  }, [longitudinalTrends]);

  return (
    <div className="space-y-6">
      {/* Top Patient Header & Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {patient.name}
                </h2>
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {patient.id}
                </span>
                <span className="text-xs text-slate-500">
                  {patient.gender} · {patient.age} Yrs
                </span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>📞 {patient.phone}</span>
                <span>·</span>
                <span>CNIC: {patient.cnic || 'N/A'}</span>
                {patient.referredBy && (
                  <>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">Ref: {patient.referredBy}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Patient Switcher & Clinical Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {patients.length > 1 && onSelectPatient && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium hidden sm:inline">Switch Patient:</span>
                <select
                  value={patient.id}
                  onChange={(e) => {
                    const found = patients.find((p) => p.id === e.target.value);
                    if (found) onSelectPatient(found);
                  }}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-teal-600"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExportLongitudinalCSV}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              title="Download chronological biomarker trends as CSV spreadsheet"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              title="Print chronological medical history summary"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print History
            </button>

            {onBookOrder && (
              <button
                onClick={() => onBookOrder(patient)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                + Book Follow-up Test
              </button>
            )}
          </div>
        </div>

        {/* Clinical Longitudinal Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Investigations</span>
            <span className="font-bold text-slate-900 text-sm">{patientOrders.length} Lab Visits</span>
            <span className="text-[10px] text-slate-500 block truncate">
              {longitudinalTrends.length} unique biomarkers tracked
            </span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Longitudinal Span</span>
            <span className="font-bold text-slate-900 text-sm">
              {chronologicalOrders.length > 0 ? formatLabDate(chronologicalOrders[0].bookingDate).split(',')[0] : 'None'}
            </span>
            <span className="text-[10px] text-slate-500 block truncate">
              To {chronologicalOrders.length > 0 ? formatLabDate(chronologicalOrders[chronologicalOrders.length - 1].bookingDate).split(',')[0] : 'Current'}
            </span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clinical Alerts</span>
            <span className={`font-bold text-sm ${totalAbnormalFlags > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {totalAbnormalFlags} Out-of-Range Flags
            </span>
            <span className="text-[10px] text-slate-500 block">
              {totalAbnormalFlags === 0 ? 'All parameters within normal intervals' : 'Requires clinical correlation'}
            </span>
          </div>

          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Trajectory Status</span>
            <span className="font-bold text-teal-800 text-sm">
              {patientOrders.length >= 2 ? 'Active Multi-Visit Trend' : 'Baseline Documented'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {patientOrders.length >= 2 ? `${patientOrders.length} chronological episodes` : 'Single investigation record'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs: Matrix, Visual Trends, Timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveSubView('matrix')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubView === 'matrix'
                ? 'bg-white text-teal-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Biomarker Comparison Matrix
          </button>

          <button
            onClick={() => setActiveSubView('trends')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubView === 'trends'
                ? 'bg-white text-teal-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Longitudinal Charts
          </button>

          <button
            onClick={() => setActiveSubView('timeline')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubView === 'timeline'
                ? 'bg-white text-teal-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Chronological Timeline ({patientOrders.length})
          </button>
        </div>

        {/* Search & Abnormal Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter biomarker (Hb, ALT, Platelet)..."
            value={biomarkerSearch}
            onChange={(e) => setBiomarkerSearch(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono w-48 sm:w-56 focus:outline-teal-600"
          />

          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={showAbnormalOnly}
              onChange={(e) => setShowAbnormalOnly(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="font-semibold text-slate-700">Abnormal Only</span>
          </label>
        </div>
      </div>

      {/* SUB-VIEW 1: LONGITUDINAL BIOMARKER COMPARISON MATRIX */}
      {activeSubView === 'matrix' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-3 min-w-[200px]">Biomarker & Investigation</th>
                    <th className="py-3 px-2 min-w-[120px]">Reference Interval</th>
                    <th className="py-3 px-2">Unit</th>
                    {/* Chronological visit columns */}
                    {chronologicalOrders.map((ord, idx) => (
                      <th key={ord.id} className="py-3 px-3 text-center min-w-[130px] border-l border-slate-200 bg-slate-100/50">
                        <div className="font-bold text-slate-800 text-[11px]">
                          {formatLabDate(ord.bookingDate).split(',')[0]}
                        </div>
                        <div className="font-mono text-[9px] text-teal-700 mt-0.5">
                          {ord.id} · Visit #{idx + 1}
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right min-w-[120px] border-l border-slate-200 bg-teal-50/50">
                      Longitudinal Trend
                    </th>
                    <th className="py-3 px-2 text-center w-12">Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrends.map((trend) => (
                    <tr
                      key={trend.parameterId}
                      className={`hover:bg-teal-50/30 transition-colors ${
                        selectedBiomarkerForChart === trend.parameterId ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{trend.parameterName}</div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {trend.testName} ({trend.testCode}) · {trend.subHeadingTitle}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-600 text-[11px]">
                        {trend.normalRangeText || '—'}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500 text-[11px]">
                        {trend.unit || '—'}
                      </td>

                      {/* Values across historical visit dates */}
                      {chronologicalOrders.map((ord) => {
                        const point = trend.history.find((h) => h.orderId === ord.id);
                        if (!point) {
                          return (
                            <td key={ord.id} className="py-2.5 px-3 text-center border-l border-slate-100 text-slate-300">
                              —
                            </td>
                          );
                        }

                        const isHigh = point.flag === 'High';
                        const isLow = point.flag === 'Low';
                        const isCritical = point.flag === 'Critical';

                        return (
                          <td
                            key={ord.id}
                            className={`py-2.5 px-3 text-center border-l border-slate-100 font-mono ${
                              isCritical
                                ? 'bg-rose-100/60 font-bold'
                                : isHigh
                                ? 'bg-rose-50/70 font-bold'
                                : isLow
                                ? 'bg-blue-50/70 font-bold'
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={`text-xs ${
                                  isCritical
                                    ? 'text-rose-700 underline'
                                    : isHigh
                                    ? 'text-rose-600'
                                    : isLow
                                    ? 'text-blue-600'
                                    : 'text-slate-800'
                                }`}
                              >
                                {point.value}
                              </span>
                              {isHigh && <span className="text-[9px] text-rose-600 font-sans font-bold">▲</span>}
                              {isLow && <span className="text-[9px] text-blue-600 font-sans font-bold">▼</span>}
                              {isCritical && <span className="text-[9px] text-rose-700 font-sans font-bold">⚠️</span>}
                            </div>
                            <span
                              className={`text-[8px] uppercase tracking-wider block font-sans font-semibold mt-0.5 ${
                                isCritical
                                  ? 'text-rose-700'
                                  : isHigh
                                  ? 'text-rose-600'
                                  : isLow
                                  ? 'text-blue-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {point.flag}
                            </span>
                          </td>
                        );
                      })}

                      {/* Longitudinal Trajectory Delta */}
                      <td className="py-2.5 px-3 text-right border-l border-slate-200 font-mono text-[11px] bg-teal-50/20">
                        {trend.trajectory === 'increasing' && (
                          <span className="font-bold text-amber-700 flex items-center justify-end gap-1">
                            <span>{trend.deltaText || '▲ Rising'}</span>
                            <span className="text-xs">▲</span>
                          </span>
                        )}
                        {trend.trajectory === 'decreasing' && (
                          <span className="font-bold text-blue-700 flex items-center justify-end gap-1">
                            <span>{trend.deltaText || '▼ Decreased'}</span>
                            <span className="text-xs">▼</span>
                          </span>
                        )}
                        {trend.trajectory === 'stable' && (
                          <span className="font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <span>Stable</span>
                            <span className="text-xs">▬</span>
                          </span>
                        )}
                        {trend.trajectory === 'single' && (
                          <span className="text-slate-400 text-[10px]">Baseline</span>
                        )}
                      </td>

                      {/* View chart icon button */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBiomarkerForChart(trend.parameterId);
                            setActiveSubView('trends');
                          }}
                          className={`p-1 rounded hover:bg-teal-100 text-teal-700 transition-colors ${
                            selectedBiomarkerForChart === trend.parameterId ? 'bg-teal-200' : ''
                          }`}
                          title={`Plot ${trend.parameterName} trend graph`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredTrends.length === 0 && (
                    <tr>
                      <td colSpan={5 + chronologicalOrders.length} className="py-8 text-center text-slate-400">
                        No biomarkers found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: INTERACTIVE LONGITUDINAL TREND CHARTS */}
      {activeSubView === 'trends' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                Visual Health Progression Curve
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {chartParameter ? `${chartParameter.parameterName} (${chartParameter.unit})` : 'Select a Biomarker'}
              </h3>
              <p className="text-xs text-slate-500">
                Reference Range: <strong className="font-mono text-slate-700">{chartParameter?.normalRangeText || 'N/A'}</strong> · Tested in {chartParameter?.testName}
              </p>
            </div>

            {/* Quick biomarker pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Quick Select:</span>
              {longitudinalTrends.slice(0, 6).map((t) => (
                <button
                  key={t.parameterId}
                  onClick={() => setSelectedBiomarkerForChart(t.parameterId)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedBiomarkerForChart === t.parameterId
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.parameterName.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Trend Graph */}
          {chartParameter && chartParameter.history.length > 0 ? (
            <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
              <div className="w-full overflow-x-auto">
                <svg viewBox="0 0 650 220" className="w-full h-56 min-w-[500px]">
                  {/* Background grid */}
                  <line x1="50" y1="20" x2="620" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="70" x2="620" y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="120" x2="620" y2="120" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="50" y1="170" x2="620" y2="170" stroke="#e2e8f0" strokeDasharray="3 3" />

                  {/* Normal reference range band if min & max exist */}
                  {(() => {
                    const pointsWithNums = chartParameter.history.filter((h) => h.numericValue !== null);
                    const values = pointsWithNums.map((h) => h.numericValue as number);
                    if (chartParameter.min !== undefined) values.push(chartParameter.min);
                    if (chartParameter.max !== undefined) values.push(chartParameter.max);

                    const dataMin = Math.min(...values) * 0.85;
                    const dataMax = Math.max(...values) * 1.15 || 10;
                    const range = dataMax - dataMin || 1;

                    const getY = (val: number) => 170 - ((val - dataMin) / range) * 140;

                    // Plot reference band
                    let refBand = null;
                    if (chartParameter.min !== undefined && chartParameter.max !== undefined) {
                      const yTop = getY(chartParameter.max);
                      const yBottom = getY(chartParameter.min);
                      const bandHeight = Math.max(yBottom - yTop, 6);
                      refBand = (
                        <g>
                          <rect
                            x="50"
                            y={yTop}
                            width="570"
                            height={bandHeight}
                            fill="#10b981"
                            fillOpacity="0.12"
                            rx="4"
                          />
                          <text x="55" y={yTop + 12} fontSize="9" fill="#059669" fontWeight="bold">
                            Normal Range: {chartParameter.min} - {chartParameter.max} {chartParameter.unit}
                          </text>
                        </g>
                      );
                    }

                    // Plot line connecting points
                    const coords = chartParameter.history.map((pt, i) => {
                      const x =
                        chartParameter.history.length === 1
                          ? 335
                          : 80 + (i / (chartParameter.history.length - 1)) * 500;
                      const y = pt.numericValue !== null ? getY(pt.numericValue) : 95;
                      return { x, y, pt };
                    });

                    const pathString = coords
                      .map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`))
                      .join(' ');

                    return (
                      <g>
                        {refBand}

                        {/* Connecting Line */}
                        {coords.length > 1 && (
                          <path
                            d={pathString}
                            fill="none"
                            stroke="#0f766e"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

                        {/* Data Points */}
                        {coords.map((c, idx) => {
                          const isNormal = c.pt.flag === 'Normal';
                          const isHigh = c.pt.flag === 'High';
                          const isLow = c.pt.flag === 'Low';
                          const pointColor = isHigh ? '#dc2626' : isLow ? '#2563eb' : '#059669';

                          return (
                            <g key={c.pt.orderId + idx}>
                              {/* Pulse ring for latest point */}
                              {idx === coords.length - 1 && (
                                <circle cx={c.x} cy={c.y} r="12" fill={pointColor} fillOpacity="0.2" />
                              )}
                              <circle
                                cx={c.x}
                                cy={c.y}
                                r="6"
                                fill={pointColor}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />

                              {/* Value Label above */}
                              <rect
                                x={c.x - 28}
                                y={c.y - 28}
                                width="56"
                                height="18"
                                rx="4"
                                fill="#0f172a"
                              />
                              <text
                                x={c.x}
                                y={c.y - 16}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize="10"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {c.pt.value}
                              </text>

                              {/* Date label below axis */}
                              <text
                                x={c.x}
                                y="195"
                                textAnchor="middle"
                                fill="#475569"
                                fontSize="10"
                                fontWeight="bold"
                              >
                                {formatLabDate(c.pt.bookingDate).split(',')[0]}
                              </text>
                              <text
                                x={c.x}
                                y="208"
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="9"
                                fontFamily="monospace"
                              >
                                {c.pt.orderId}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Trajectory Insights box */}
              <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0"></span>
                  <span className="text-slate-700">
                    <strong>Longitudinal Assessment:</strong>{' '}
                    {chartParameter.trajectory === 'increasing'
                      ? `Parameter shows an upward shift (${chartParameter.deltaText}). Clinically verify if intentional therapeutic response or pathology.`
                      : chartParameter.trajectory === 'decreasing'
                      ? `Parameter shows a downward trend (${chartParameter.deltaText}). Follow up for stabilization.`
                      : chartParameter.trajectory === 'stable'
                      ? 'Values are stable and consistent across chronological evaluations.'
                      : 'Single baseline investigation recorded. Further testing advised for trend analysis.'}
                  </span>
                </div>
                {chartParameter.latestPoint && (
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                      chartParameter.latestPoint.flag === 'Normal'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Current: {chartParameter.latestPoint.flag} ({chartParameter.latestPoint.value} {chartParameter.unit})
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              No longitudinal trend points available for this biomarker.
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: CHRONOLOGICAL LAB RESULTS TIMELINE */}
      {activeSubView === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>
              Showing <strong>{patientOrders.length}</strong> previous laboratory investigations chronologically:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {patientOrders.map((order, index) => {
              const rep = reports.find((r) => r.orderId === order.id);
              const results = orderResultsMap.get(order.id) || [];

              return (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:border-slate-300 transition-all"
                >
                  {/* Order Timeline Card Header */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-teal-600 text-white font-bold text-[10px] rounded">
                          Visit #{sortOrder === 'desc' ? patientOrders.length - index : index + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">{order.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-600 text-xs">Barcode: {order.sampleBarcode}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-600 font-semibold">
                          📅 {formatLabDate(order.bookingDate)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                        <span>Specimen: <strong>{order.sampleType}</strong></span>
                        <span>·</span>
                        <span>Referred by: <strong>{order.referredByDoctor || 'Self'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          order.sampleStatus === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {order.sampleStatus}
                      </span>

                      {onViewOrderReport && (
                        <button
                          onClick={() => onViewOrderReport(order)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                          title="View / Print Official Pathology Report"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Report Print
                        </button>
                      )}

                      {onViewOrderReceipt && (
                        <button
                          onClick={() => onViewOrderReceipt(order)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Invoice Slip
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Investigation Results Table */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-slate-500 font-semibold">Investigations Performed:</span>
                      {order.tests.map((code) => {
                        const item = catalog.find((c) => c.code === code);
                        return (
                          <span
                            key={code}
                            className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs font-mono font-bold rounded"
                          >
                            {code} - {item?.name || code}
                          </span>
                        );
                      })}
                    </div>

                    {results.length > 0 ? (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px]">
                            <tr>
                              <th className="py-2 px-3">Parameter Investigation</th>
                              <th className="py-2 px-3 font-mono">Observed Value</th>
                              <th className="py-2 px-2 text-center">Status Flag</th>
                              <th className="py-2 px-3 font-mono">Reference Range</th>
                              <th className="py-2 px-2 font-mono">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {results.map((res) => {
                              const isHigh = res.flag === 'High';
                              const isLow = res.flag === 'Low';
                              const isCritical = res.flag === 'Critical';

                              return (
                                <tr
                                  key={res.parameterId}
                                  className={isHigh || isLow || isCritical ? 'bg-amber-50/40' : 'bg-white'}
                                >
                                  <td className="py-1.5 px-3">
                                    <span className="font-semibold text-slate-800">{res.parameterName}</span>
                                    <span className="text-[10px] text-slate-400 block">{res.subHeadingTitle}</span>
                                  </td>
                                  <td className={`py-1.5 px-3 font-mono font-bold ${
                                    isCritical ? 'text-rose-700 underline' : isHigh ? 'text-rose-600' : isLow ? 'text-blue-600' : 'text-slate-900'
                                  }`}>
                                    {res.value}
                                  </td>
                                  <td className="py-1.5 px-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        isCritical
                                          ? 'bg-rose-100 text-rose-800'
                                          : isHigh
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : isLow
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {res.flag}
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-3 font-mono text-slate-600 text-[11px]">
                                    {res.normalRangeText || '—'}
                                  </td>
                                  <td className="py-1.5 px-2 font-mono text-slate-500 text-[11px]">
                                    {res.unit || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs italic">
                        Parameters undergoing laboratory analyzer run.
                      </div>
                    )}

                    {/* Pathologist Impression on this visit */}
                    {rep?.pathologistRemarks && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">
                          Pathologist Clinical Impression:
                        </span>
                        <p className="text-slate-600 italic leading-relaxed">
                          "{rep.pathologistRemarks}"
                        </p>
                        {rep.approvedBy && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Validated by: <strong>{rep.approvedBy}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {patientOrders.length === 0 && (
              <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                No past lab orders documented for this patient.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
