import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend
} from 'recharts';
import { LabOrder, Patient } from '../types/lims';
import { formatPKR } from '../utils/formatters';

interface DailyRevenueBarChartProps {
  orders: LabOrder[];
  patients: Patient[];
  onViewReceipt?: (order: LabOrder) => void;
  onNavigateToBilling?: () => void;
}

interface DayStat {
  dateKey: string;
  dayName: string;
  dateLabel: string;
  fullDateLabel: string;
  isToday: boolean;
  revenue: number;
  totalBilled: number;
  pendingDues: number;
  txnCount: number;
  completedTxns: LabOrder[];
  pendingTxns: LabOrder[];
  paymentBreakdown: {
    Cash: number;
    JazzCash: number;
    EasyPaisa: number;
    'Bank Card / Transfer': number;
  };
}

// Abbreviated PKR formatter (e.g. Rs. 14.5k)
const formatShortPKR = (amount: number): string => {
  if (amount === 0) return 'Rs. 0';
  if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `Rs. ${amount}`;
};

export const DailyRevenueBarChart: React.FC<DailyRevenueBarChartProps> = ({
  orders,
  patients,
  onViewReceipt,
  onNavigateToBilling
}) => {
  const [viewMode, setViewMode] = useState<'revenue' | 'stacked' | 'volume'>('revenue');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to last day (today)

  // Compute 7 days ending on reference date (latest order date or current date)
  const days: DayStat[] = useMemo(() => {
    const refDate = orders.reduce((latest, o) => {
      const d = new Date(o.bookingDate);
      return !isNaN(d.getTime()) && d > latest ? d : latest;
    }, new Date());

    const result: DayStat[] = [];
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
      // Completed billing transactions = orders where revenue was collected (paidAmount > 0)
      const completedTxns = dayOrders.filter(o => o.paidAmount > 0);
      const pendingTxns = dayOrders.filter(o => o.paidAmount === 0);

      const revenue = completedTxns.reduce((sum, o) => sum + o.paidAmount, 0);
      const totalBilled = dayOrders.reduce((sum, o) => sum + o.netAmount, 0);
      const pendingDues = Math.max(0, totalBilled - revenue);

      const paymentBreakdown = {
        Cash: 0,
        JazzCash: 0,
        EasyPaisa: 0,
        'Bank Card / Transfer': 0
      };

      completedTxns.forEach(o => {
        if (o.paymentMethod && o.paymentMethod in paymentBreakdown) {
          paymentBreakdown[o.paymentMethod] += o.paidAmount;
        } else {
          paymentBreakdown.Cash += o.paidAmount;
        }
      });

      result.push({
        dateKey,
        dayName,
        dateLabel,
        fullDateLabel,
        isToday,
        revenue,
        totalBilled,
        pendingDues,
        txnCount: completedTxns.length,
        completedTxns,
        pendingTxns,
        paymentBreakdown
      });
    }
    return result;
  }, [orders]);

  // 7-day aggregates
  const total7DayRevenue = useMemo(() => days.reduce((sum, d) => sum + d.revenue, 0), [days]);
  const total7DayTxns = useMemo(() => days.reduce((sum, d) => sum + d.txnCount, 0), [days]);
  const avgDailyRevenue = Math.round(total7DayRevenue / 7);

  // Peak revenue day
  const peakDay = useMemo(() => {
    return days.reduce((max, d) => (d.revenue > max.revenue ? d : max), days[0]);
  }, [days]);

  // Currently selected day (clamped to bounds)
  const activeDay = days[Math.min(Math.max(0, selectedDayIndex), days.length - 1)] || days[0];

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayStat = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-xs min-w-[210px] space-y-2 pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>{data.fullDateLabel}</span>
            </span>
            {data.isToday && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-teal-500 text-slate-950 rounded uppercase tracking-wider">
                Today
              </span>
            )}
            {data.revenue === peakDay.revenue && peakDay.revenue > 0 && !data.isToday && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
                Peak
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Collected Revenue:</span>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                {formatPKR(data.revenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Transactions:</span>
              <span className="font-mono text-slate-200">
                {data.txnCount} completed ({data.completedTxns.length + data.pendingTxns.length} total)
              </span>
            </div>
            {data.pendingDues > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pending Dues:</span>
                <span className="font-mono text-rose-400 font-semibold">
                  {formatPKR(data.pendingDues)}
                </span>
              </div>
            )}
          </div>

          {data.revenue > 0 && (
            <div className="pt-1.5 border-t border-slate-800 text-[11px] space-y-0.5">
              <div className="text-slate-400 font-semibold text-[10px] uppercase">Payment Breakdown:</div>
              {data.paymentBreakdown.Cash > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Cash:</span>
                  <span className="font-mono font-medium">{formatPKR(data.paymentBreakdown.Cash)}</span>
                </div>
              )}
              {data.paymentBreakdown.JazzCash > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>JazzCash:</span>
                  <span className="font-mono font-medium">{formatPKR(data.paymentBreakdown.JazzCash)}</span>
                </div>
              )}
              {data.paymentBreakdown.EasyPaisa > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>EasyPaisa:</span>
                  <span className="font-mono font-medium">{formatPKR(data.paymentBreakdown.EasyPaisa)}</span>
                </div>
              )}
              {data.paymentBreakdown['Bank Card / Transfer'] > 0 && (
                <div className="flex justify-between text-sky-300">
                  <span>Bank Card / Trf:</span>
                  <span className="font-mono font-medium">{formatPKR(data.paymentBreakdown['Bank Card / Transfer'])}</span>
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] text-teal-400 pt-1 text-center border-t border-slate-800 font-medium">
            Click bar to inspect day transactions
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Daily Revenue Trend (Current Week)
            </h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Recharts Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time daily cash & digital collections from verified patient billing transactions
          </p>
        </div>

        {/* View mode toggle & quick actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'revenue'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue (PKR)
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'stacked'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Collected vs Dues
            </button>
            <button
              onClick={() => setViewMode('volume')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'volume'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transactions (Count)
            </button>
          </div>

          {onNavigateToBilling && (
            <button
              onClick={onNavigateToBilling}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
            >
              Billing Ledger →
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Mini-Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">7-Day Total Revenue</div>
          <div className="text-lg font-bold font-mono text-teal-900 mt-0.5">
            {formatPKR(total7DayRevenue)}
          </div>
          <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
            {total7DayTxns} completed billing transactions
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Daily Average</div>
          <div className="text-lg font-bold font-mono text-slate-800 mt-0.5">
            {formatPKR(avgDailyRevenue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            ~{(total7DayTxns / 7).toFixed(1)} orders / day
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Peak Collection Day</div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5 truncate">
            {formatPKR(peakDay.revenue)}
          </div>
          <div className="text-[10px] text-slate-500 truncate mt-0.5">
            {peakDay.dayName}, {peakDay.dateLabel} ({peakDay.txnCount} txns)
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Today's Collections</div>
          <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
            {formatPKR(days[6]?.revenue || 0)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {days[6]?.txnCount || 0} transactions completed today
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="relative pt-2 pb-2">
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={days}
              margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
              onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                  const idx = Number(state.activeTooltipIndex);
                  if (!isNaN(idx)) {
                    setSelectedDayIndex(idx);
                  }
                }
              }}
            >
              <defs>
                {/* Standard teal gradient */}
                <linearGradient id="revenueTealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
                </linearGradient>

                {/* Selected active bar gradient */}
                <linearGradient id="selectedBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
                </linearGradient>

                {/* Peak revenue bar gradient */}
                <linearGradient id="peakBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.8} />
                </linearGradient>

                {/* Pending dues gradient */}
                <linearGradient id="duesRoseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#fb7185" stopOpacity={0.65} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="dayName"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const item = days[payload.index];
                  const isSelected = selectedDayIndex === payload.index;
                  const isPeak = item && item.revenue === peakDay.revenue && peakDay.revenue > 0;
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
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => (viewMode === 'volume' ? `${val}` : formatShortPKR(val))}
                width={56}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(20, 184, 166, 0.08)', radius: 8 }}
              />

              {viewMode === 'stacked' && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={32}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                />
              )}

              {viewMode === 'revenue' && (
                <Bar
                  dataKey="revenue"
                  name="Collected Revenue"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  className="cursor-pointer transition-all duration-200"
                >
                  {days.map((entry, index) => {
                    const isSelected = selectedDayIndex === index;
                    const isPeak = entry.revenue === peakDay.revenue && peakDay.revenue > 0;
                    return (
                      <Cell
                        key={`cell-${entry.dateKey}`}
                        fill={
                          isSelected
                            ? 'url(#selectedBarGradient)'
                            : isPeak
                            ? 'url(#peakBarGradient)'
                            : 'url(#revenueTealGradient)'
                        }
                        stroke={isSelected ? '#0f766e' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              )}

              {viewMode === 'stacked' && (
                <>
                  <Bar
                    dataKey="revenue"
                    name="Collected Revenue (PKR)"
                    stackId="billing"
                    fill="url(#revenueTealGradient)"
                    maxBarSize={48}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="pendingDues"
                    name="Uncollected Dues (PKR)"
                    stackId="billing"
                    fill="url(#duesRoseGradient)"
                    maxBarSize={48}
                    radius={[8, 8, 0, 0]}
                  />
                </>
              )}

              {viewMode === 'volume' && (
                <Bar
                  dataKey="txnCount"
                  name="Transactions Count"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  className="cursor-pointer"
                >
                  {days.map((entry, index) => {
                    const isSelected = selectedDayIndex === index;
                    return (
                      <Cell
                        key={`cell-vol-${entry.dateKey}`}
                        fill={isSelected ? '#0f766e' : '#14b8a6'}
                      />
                    );
                  })}
                </Bar>
              )}
            </BarChart>
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
                  <span className="ml-1 opacity-75 font-mono text-[10px]">
                    ({day.completedTxns.length})
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
              {activeDay.revenue === peakDay.revenue && peakDay.revenue > 0 && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-400 text-slate-950 rounded-md uppercase tracking-wider">
                  Peak Day
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of {activeDay.completedTxns.length} completed billing transaction(s)
            </p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                Daily Revenue Collected
              </div>
              <div className="text-xl font-bold font-mono text-teal-800">
                {formatPKR(activeDay.revenue)}
              </div>
            </div>
            {activeDay.pendingDues > 0 && (
              <div className="pl-3 border-l border-slate-200">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-500">
                  Uncollected Dues
                </div>
                <div className="text-sm font-bold font-mono text-rose-600">
                  {formatPKR(activeDay.pendingDues)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution Chips */}
        <div className="py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Payment Modes:</span>
          <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Cash: <strong className="font-mono text-slate-900">{formatPKR(activeDay.paymentBreakdown.Cash)}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            JazzCash: <strong className="font-mono text-slate-900">{formatPKR(activeDay.paymentBreakdown.JazzCash)}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            EasyPaisa: <strong className="font-mono text-slate-900">{formatPKR(activeDay.paymentBreakdown.EasyPaisa)}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Bank Transfer: <strong className="font-mono text-slate-900">{formatPKR(activeDay.paymentBreakdown['Bank Card / Transfer'])}</strong>
          </span>
        </div>

        {/* Transaction Records for this day */}
        {activeDay.completedTxns.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
            No completed billing transactions recorded for this day.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 mt-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Tests</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Paid Amount (PKR)</th>
                  {onViewReceipt && <th className="py-2.5 px-3 text-right">Receipt</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDay.completedTxns.map(order => {
                  const pat = patients.find(p => p.id === order.patientId);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-teal-800">
                        {order.id}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {pat?.name || 'Walk-in Patient'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {order.tests.join(', ')}
                      </td>
                      <td className="py-2 px-3 text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatPKR(order.paidAmount)}
                      </td>
                      {onViewReceipt && (
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => onViewReceipt(order)}
                            className="px-2 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 border border-teal-200 rounded transition-colors"
                          >
                            Receipt
                          </button>
                        </td>
                      )}
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
