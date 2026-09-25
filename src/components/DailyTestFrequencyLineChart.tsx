import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { LabOrder, Patient, TestCatalogItem, OrderResultReport } from '../types/lims';

interface DailyTestFrequencyLineChartProps {
  orders: LabOrder[];
  reports: OrderResultReport[];
  catalog: TestCatalogItem[];
  patients: Patient[];
  onNavigateTab?: (tab: string) => void;
  onEnterResults?: (order: LabOrder) => void;
  onViewReport?: (order: LabOrder) => void;
}

interface TestFrequencyDayStat {
  dateKey: string;
  dayName: string;
  dateLabel: string;
  fullDateLabel: string;
  isToday: boolean;
  totalTests: number;
  completedTests: number;
  pendingTests: number;
  ordersCount: number;
  dayOrders: LabOrder[];
  testCounts: Record<string, number>;
  // Department categorization
  deptHematology: number;
  deptBiochemistry: number;
  deptEndocrinology: number;
  deptGeneral: number;
}

export const DailyTestFrequencyLineChart: React.FC<DailyTestFrequencyLineChartProps> = ({
  orders,
  reports,
  catalog,
  patients,
  onNavigateTab,
  onEnterResults,
  onViewReport
}) => {
  const [viewMode, setViewMode] = useState<'status' | 'departments' | 'ratio'>('status');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to latest day

  // Build catalog lookup for faster category resolution
  const catalogMap = useMemo(() => {
    const map = new Map<string, TestCatalogItem>();
    catalog.forEach(item => {
      map.set(item.code.toUpperCase(), item);
      map.set(item.name.toLowerCase(), item);
    });
    return map;
  }, [catalog]);

  // Compute 7 days ending on reference date (latest order date or current date)
  const days: TestFrequencyDayStat[] = useMemo(() => {
    const refDate = orders.reduce((latest, o) => {
      const d = new Date(o.bookingDate);
      return !isNaN(d.getTime()) && d > latest ? d : latest;
    }, new Date());

    const result: TestFrequencyDayStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(refDate.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const isToday = i === 0;
      const dayName = isToday ? 'Today' : d.toLocaleDateString('en-PK', { weekday: 'short' });
      const dateLabel = d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
      const fullDateLabel = d.toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const dayOrders = orders.filter(o => o.bookingDate && o.bookingDate.startsWith(dateKey));

      let totalTests = 0;
      let completedTests = 0;
      let pendingTests = 0;
      const testCounts: Record<string, number> = {};
      let deptHematology = 0;
      let deptBiochemistry = 0;
      let deptEndocrinology = 0;
      let deptGeneral = 0;

      dayOrders.forEach(order => {
        const isOrderComplete =
          order.sampleStatus === 'Completed' ||
          order.sampleStatus === 'Delivered' ||
          reports.some(r => r.orderId === order.id && r.isApproved);

        const testCount = order.tests ? order.tests.length : 0;
        totalTests += testCount;

        if (isOrderComplete) {
          completedTests += testCount;
        } else {
          pendingTests += testCount;
        }

        order.tests.forEach(testCode => {
          const upper = testCode.toUpperCase();
          testCounts[upper] = (testCounts[upper] || 0) + 1;

          // Classify into department
          const item = catalogMap.get(upper);
          const category = item?.category?.toLowerCase() || '';
          const name = item?.name?.toLowerCase() || '';

          if (
            category.includes('hematol') ||
            upper === 'CBC' ||
            upper === 'ESR' ||
            name.includes('blood count')
          ) {
            deptHematology++;
          } else if (
            category.includes('biochem') ||
            category.includes('chem') ||
            category.includes('liver') ||
            category.includes('renal') ||
            upper === 'LFT' ||
            upper === 'RFT' ||
            upper === 'LIPID' ||
            upper === 'URIC-ACID'
          ) {
            deptBiochemistry++;
          } else if (
            category.includes('endocrine') ||
            category.includes('diabet') ||
            category.includes('immuno') ||
            upper === 'HBA1C' ||
            upper === 'TSH' ||
            upper.includes('VIT')
          ) {
            deptEndocrinology++;
          } else {
            deptGeneral++;
          }
        });
      });

      result.push({
        dateKey,
        dayName,
        dateLabel,
        fullDateLabel,
        isToday,
        totalTests,
        completedTests,
        pendingTests,
        ordersCount: dayOrders.length,
        dayOrders,
        testCounts,
        deptHematology,
        deptBiochemistry,
        deptEndocrinology,
        deptGeneral
      });
    }

    return result;
  }, [orders, reports, catalogMap]);

  // Aggregate stats across 7 days
  const total7DayTests = useMemo(() => days.reduce((sum, d) => sum + d.totalTests, 0), [days]);
  const total7DayCompleted = useMemo(() => days.reduce((sum, d) => sum + d.completedTests, 0), [days]);
  const total7DayOrders = useMemo(() => days.reduce((sum, d) => sum + d.ordersCount, 0), [days]);
  const avgDailyTests = useMemo(() => (total7DayTests / 7).toFixed(1), [total7DayTests]);

  // Peak testing day
  const peakDay = useMemo(() => {
    return days.reduce((max, d) => (d.totalTests > max.totalTests ? d : max), days[0]);
  }, [days]);

  // Overall most requested test across 7 days
  const topOverallTest = useMemo(() => {
    const combined: Record<string, number> = {};
    days.forEach(d => {
      Object.entries(d.testCounts).forEach(([code, count]) => {
        combined[code] = (combined[code] || 0) + count;
      });
    });

    let bestCode = 'CBC';
    let bestCount = 0;
    Object.entries(combined).forEach(([code, count]) => {
      if (count > bestCount) {
        bestCount = count;
        bestCode = code;
      }
    });

    const item = catalogMap.get(bestCode);
    return {
      code: bestCode,
      name: item?.name || bestCode,
      count: bestCount
    };
  }, [days, catalogMap]);

  // Currently selected day (clamped to bounds)
  const activeDay = days[Math.min(Math.max(0, selectedDayIndex), days.length - 1)] || days[0];

  // Sorted tests for active day
  const activeDaySortedTests = useMemo(() => {
    return Object.entries(activeDay.testCounts).sort((a, b) => b[1] - a[1]);
  }, [activeDay]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TestFrequencyDayStat = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs min-w-[220px] space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-100">{data.fullDateLabel}</span>
            {data.isToday && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-teal-500 text-slate-950 rounded uppercase tracking-wider">
                Today
              </span>
            )}
            {data.totalTests === peakDay.totalTests && peakDay.totalTests > 0 && !data.isToday && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
                Peak
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Tests Performed:</span>
              <span className="font-bold font-mono text-teal-400 text-sm">
                {data.totalTests} tests
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Completed / Verified:
              </span>
              <span className="font-mono text-emerald-300 font-semibold">{data.completedTests}</span>
            </div>
            {data.pendingTests > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  In Progress / Pending:
                </span>
                <span className="font-mono text-amber-300 font-semibold">{data.pendingTests}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800 text-slate-400">
              <span>Patient Orders Booked:</span>
              <span className="font-mono text-slate-200">{data.ordersCount} orders</span>
            </div>
          </div>

          {Object.keys(data.testCounts).length > 0 && (
            <div className="pt-1.5 border-t border-slate-800 text-[10px] space-y-1">
              <div className="text-slate-400 font-semibold uppercase">Daily Investigations:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.testCounts)
                  .slice(0, 5)
                  .map(([code, count]) => (
                    <span
                      key={code}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-medium"
                    >
                      {code}: {count}
                    </span>
                  ))}
                {Object.keys(data.testCounts).length > 5 && (
                  <span className="text-slate-400 self-center">
                    +{Object.keys(data.testCounts).length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="text-[10px] text-teal-400 pt-1 text-center border-t border-slate-800 font-medium">
            Click line point to inspect detailed tests
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Daily Test Frequency Trend (Last 7 Days)
            </h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Line Chart
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Workload volume of laboratory tests ordered and performed per day across diagnostic departments
          </p>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('status')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'status'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total vs Completed
            </button>
            <button
              onClick={() => setViewMode('departments')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'departments'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Department
            </button>
            <button
              onClick={() => setViewMode('ratio')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'ratio'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tests vs Orders
            </button>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('results')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
            >
              Results Worklist →
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">7-Day Tests Performed</div>
          <div className="text-lg font-bold font-mono text-teal-900 mt-0.5">
            {total7DayTests} <span className="text-xs font-normal text-slate-500 font-sans">tests</span>
          </div>
          <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
            Across {total7DayOrders} patient orders
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Daily Average Throughput</div>
          <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
            {avgDailyTests} <span className="text-xs font-normal text-slate-500 font-sans">tests/day</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            ~{(total7DayOrders / 7).toFixed(1)} orders / day
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Peak Testing Day</div>
          <div className="text-lg font-bold font-mono text-amber-700 mt-0.5 truncate">
            {peakDay.totalTests} <span className="text-xs font-normal text-slate-500 font-sans">tests</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            {peakDay.dayName}, {peakDay.dateLabel} ({peakDay.ordersCount} orders)
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Top Investigation</div>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5 truncate">
            {topOverallTest.code}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5" title={topOverallTest.name}>
            {topOverallTest.count} performed in 7 days
          </div>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="relative pt-2 pb-2">
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={days}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
              onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                  const idx = Number(state.activeTooltipIndex);
                  if (!isNaN(idx)) {
                    setSelectedDayIndex(idx);
                  }
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="dayName"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const item = days[payload.index];
                  const isSelected = selectedDayIndex === payload.index;
                  const isPeak = item && item.totalTests === peakDay.totalTests && peakDay.totalTests > 0;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={14}
                        textAnchor="middle"
                        fill={isSelected ? '#0f766e' : item?.isToday ? '#0d9488' : '#475569'}
                        fontSize={11}
                        fontWeight={isSelected || item?.isToday ? 700 : 500}
                      >
                        {payload.value}
                      </text>
                      <text
                        x={0}
                        y={0}
                        dy={26}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={9}
                        fontFamily="monospace"
                      >
                        {item?.dateLabel}
                      </text>
                      {isPeak && (
                        <text
                          x={0}
                          y={0}
                          dy={-240}
                          textAnchor="middle"
                          fill="#d97706"
                          fontSize={9}
                          fontWeight={800}
                        >
                          ★ PEAK
                        </text>
                      )}
                    </g>
                  );
                }}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                width={38}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: 'rgba(20, 184, 166, 0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={32}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-700">{value}</span>
                )}
              />

              {viewMode === 'status' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="totalTests"
                    name="Total Tests Performed"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#0f766e' }}
                    activeDot={{ r: 7, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedTests"
                    name="Completed & Approved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="4 2"
                    dot={{ r: 3.5, strokeWidth: 2, fill: '#ffffff', stroke: '#10b981' }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pendingTests"
                    name="Pending in Queue"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff', stroke: '#f59e0b' }}
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </>
              )}

              {viewMode === 'departments' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="deptHematology"
                    name="Hematology (CBC, ESR)"
                    stroke="#e11d48"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 1.5, fill: '#ffffff', stroke: '#e11d48' }}
                    activeDot={{ r: 6, fill: '#e11d48' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deptBiochemistry"
                    name="Biochemistry (LFT, RFT, Lipid)"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, strokeWidth: 1.5, fill: '#ffffff', stroke: '#2563eb' }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deptEndocrinology"
                    name="Endocrinology (HbA1c, TSH)"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff', stroke: '#9333ea' }}
                    activeDot={{ r: 5, fill: '#9333ea' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deptGeneral"
                    name="Urine & General"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1.5, fill: '#ffffff', stroke: '#059669' }}
                    activeDot={{ r: 5, fill: '#059669' }}
                  />
                </>
              )}

              {viewMode === 'ratio' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="totalTests"
                    name="Tests Frequency"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#0f766e' }}
                    activeDot={{ r: 7, fill: '#0f766e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersCount"
                    name="Patient Orders"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#6366f1' }}
                    activeDot={{ r: 6, fill: '#6366f1' }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Day Selector Quick Buttons Bar below chart */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 overflow-x-auto text-xs pb-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-2 shrink-0">
            Select Day:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {days.map((day, idx) => {
              const isSelected = selectedDayIndex === idx;
              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-teal-700 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day.dayName}
                  <span className="ml-1 opacity-80 font-mono text-[10px]">
                    ({day.totalTests} tests)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Deep-Dive Drawer */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {activeDay.fullDateLabel}
              </span>
              {activeDay.isToday && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-teal-600 text-white rounded-md uppercase tracking-wider">
                  Today
                </span>
              )}
              {activeDay.totalTests === peakDay.totalTests && peakDay.totalTests > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase tracking-wider">
                  Peak Day
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of {activeDay.totalTests} test(s) performed across {activeDay.dayOrders.length} order(s)
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Tests Performed
              </div>
              <div className="text-xl font-bold font-mono text-teal-800">
                {activeDay.totalTests} <span className="text-xs font-normal text-slate-500 font-sans">tests</span>
              </div>
            </div>
            <div className="pl-3 border-l border-slate-200">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">
                Completed
              </div>
              <div className="text-sm font-bold font-mono text-emerald-700">
                {activeDay.completedTests}
              </div>
            </div>
            {activeDay.pendingTests > 0 && (
              <div className="pl-3 border-l border-slate-200">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">
                  Pending
                </div>
                <div className="text-sm font-bold font-mono text-amber-700">
                  {activeDay.pendingTests}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specific Investigation Breakdown Chips for selected day */}
        <div className="py-3">
          <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <span>Tests Performed on This Day:</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({activeDaySortedTests.length} unique test profile{activeDaySortedTests.length === 1 ? '' : 's'})
            </span>
          </div>

          {activeDaySortedTests.length === 0 ? (
            <div className="py-2 text-xs text-slate-400 italic">
              No tests were booked or performed on this date.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeDaySortedTests.map(([code, count]) => {
                const item = catalogMap.get(code);
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium shadow-2xs"
                  >
                    <span className="font-bold text-teal-800 font-mono">{code}</span>
                    {item?.name && item.name !== code && (
                      <span className="text-slate-500 text-[11px] truncate max-w-[140px]" title={item.name}>
                        · {item.name}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono font-bold text-[10px]">
                      ×{count}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Day Orders list */}
        {activeDay.dayOrders.length > 0 && (
          <div className="mt-2 overflow-x-auto bg-white rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Order ID / Barcode</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Investigations Run</th>
                  <th className="py-2.5 px-3">Sample Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDay.dayOrders.map(order => {
                  const pat = patients.find(p => p.id === order.patientId);
                  const isDone =
                    order.sampleStatus === 'Completed' ||
                    order.sampleStatus === 'Delivered' ||
                    reports.some(r => r.orderId === order.id && r.isApproved);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-teal-800">{order.id}</div>
                        <div className="text-[10px] font-mono text-slate-400">{order.sampleBarcode}</div>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {pat?.name || 'Walk-in Patient'}
                        <div className="text-[10px] text-slate-400">
                          {pat?.age}y · {pat?.gender}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {order.tests.map(t => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.sampleStatus === 'In Processing'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.sampleStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isDone && onViewReport ? (
                          <button
                            onClick={() => onViewReport(order)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded transition-colors"
                          >
                            View Report
                          </button>
                        ) : onEnterResults ? (
                          <button
                            onClick={() => onEnterResults(order)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50 border border-sky-200 rounded transition-colors"
                          >
                            Enter Results
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
