import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Patient, LabOrder, OrderResultReport } from '../types/lims';

interface DemographicSummaryWidgetProps {
  patients: Patient[];
  orders: LabOrder[];
  reports: OrderResultReport[];
  onNavigateTab?: (tab: string) => void;
  onOpenNewPatient?: () => void;
}

export type AgeCohortTier = '3tier' | '4tier';

interface CohortBreakdown {
  id: string;
  label: string;
  sublabel: string;
  minAge: number;
  maxAge: number;
  total: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  avgAge: number;
  patients: Patient[];
  frequentTests: string[];
}

export const DemographicSummaryWidget: React.FC<DemographicSummaryWidgetProps> = ({
  patients,
  orders,
  reports,
  onNavigateTab,
  onOpenNewPatient
}) => {
  const [tierMode, setTierMode] = useState<AgeCohortTier>('3tier');
  const [selectedCohortId, setSelectedCohortId] = useState<string | null>(null);

  // General Demographic Metrics
  const totalPatients = patients.length;

  const {
    malePatients,
    femalePatients,
    otherPatients,
    averageAge,
    medianAge,
    minAge,
    maxAge
  } = useMemo(() => {
    let male = 0;
    let female = 0;
    let other = 0;
    let sumAge = 0;
    const ages: number[] = [];

    patients.forEach(p => {
      if (p.gender === 'Male') male++;
      else if (p.gender === 'Female') female++;
      else other++;

      const a = Number(p.age) || 0;
      sumAge += a;
      ages.push(a);
    });

    ages.sort((a, b) => a - b);
    const median = ages.length > 0 ? ages[Math.floor(ages.length / 2)] : 0;
    const min = ages.length > 0 ? ages[0] : 0;
    const max = ages.length > 0 ? ages[ages.length - 1] : 0;

    return {
      malePatients: male,
      femalePatients: female,
      otherPatients: other,
      averageAge: totalPatients > 0 ? (sumAge / totalPatients).toFixed(1) : '0',
      medianAge: median,
      minAge: min,
      maxAge: max
    };
  }, [patients, totalPatients]);

  const malePercent = totalPatients > 0 ? Math.round((malePatients / totalPatients) * 100) : 0;
  const femalePercent = totalPatients > 0 ? Math.round((femalePatients / totalPatients) * 100) : 0;
  const otherPercent = totalPatients > 0 ? Math.max(0, 100 - malePercent - femalePercent) : 0;

  // Cohort Definition and Calculation
  const cohorts: CohortBreakdown[] = useMemo(() => {
    const definitions: {
      id: string;
      label: string;
      sublabel: string;
      minAge: number;
      maxAge: number;
    }[] =
      tierMode === '3tier'
        ? [
            {
              id: 'pediatric',
              label: 'Pediatric',
              sublabel: '0 – 17 yrs',
              minAge: 0,
              maxAge: 17
            },
            {
              id: 'adult',
              label: 'Adult',
              sublabel: '18 – 59 yrs',
              minAge: 18,
              maxAge: 59
            },
            {
              id: 'senior',
              label: 'Senior',
              sublabel: '60+ yrs',
              minAge: 60,
              maxAge: 150
            }
          ]
        : [
            {
              id: 'pediatric',
              label: 'Pediatric',
              sublabel: '0 – 17 yrs',
              minAge: 0,
              maxAge: 17
            },
            {
              id: 'young_adult',
              label: 'Young Adult',
              sublabel: '18 – 35 yrs',
              minAge: 18,
              maxAge: 35
            },
            {
              id: 'middle_adult',
              label: 'Middle-Aged',
              sublabel: '36 – 59 yrs',
              minAge: 36,
              maxAge: 59
            },
            {
              id: 'senior',
              label: 'Senior (60+)',
              sublabel: '60+ yrs',
              minAge: 60,
              maxAge: 150
            }
          ];

    return definitions.map(def => {
      const cohortPatients = patients.filter(
        p => p.age >= def.minAge && p.age <= def.maxAge
      );

      let male = 0;
      let female = 0;
      let other = 0;
      let sumAge = 0;

      cohortPatients.forEach(p => {
        if (p.gender === 'Male') male++;
        else if (p.gender === 'Female') female++;
        else other++;
        sumAge += Number(p.age) || 0;
      });

      // Find top investigations ordered for patients in this cohort
      const testCounts: Record<string, number> = {};
      const cohortPatientIds = new Set(cohortPatients.map(p => p.id));
      orders.forEach(o => {
        if (cohortPatientIds.has(o.patientId)) {
          o.tests.forEach(t => {
            testCounts[t] = (testCounts[t] || 0) + 1;
          });
        }
      });

      const frequentTests = Object.entries(testCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([code]) => code);

      return {
        id: def.id,
        label: def.label,
        sublabel: def.sublabel,
        minAge: def.minAge,
        maxAge: def.maxAge,
        total: cohortPatients.length,
        maleCount: male,
        femaleCount: female,
        otherCount: other,
        avgAge: cohortPatients.length > 0 ? Math.round(sumAge / cohortPatients.length) : 0,
        patients: cohortPatients,
        frequentTests
      };
    });
  }, [tierMode, patients, orders]);

  // Chart data formatted for Recharts BarChart
  const chartData = useMemo(() => {
    return cohorts.map(c => ({
      name: c.label,
      sublabel: c.sublabel,
      Male: c.maleCount,
      Female: c.femaleCount,
      Other: c.otherCount,
      Total: c.total,
      cohortId: c.id
    }));
  }, [cohorts]);

  // Currently active or selected cohort
  const activeCohort = cohorts.find(c => c.id === selectedCohortId) || null;

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalPatients > 0 ? Math.round((data.Total / totalPatients) * 100) : 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[190px] pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 font-bold">
            <span>{data.name}</span>
            <span className="text-slate-400 font-normal font-mono text-[10px]">{data.sublabel}</span>
          </div>
          <div className="flex justify-between items-center text-teal-300 font-semibold pt-0.5">
            <span>Cohort Total:</span>
            <span className="font-mono text-sm">{data.Total} ({pct}%)</span>
          </div>
          <div className="flex justify-between items-center text-sky-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Male Patients:
            </span>
            <span className="font-mono font-bold">{data.Male}</span>
          </div>
          <div className="flex justify-between items-center text-rose-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Female Patients:
            </span>
            <span className="font-mono font-bold">{data.Female}</span>
          </div>
          {data.Other > 0 && (
            <div className="flex justify-between items-center text-purple-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Other:
              </span>
              <span className="font-mono font-bold">{data.Other}</span>
            </div>
          )}
          <div className="text-[10px] text-teal-400 pt-1 text-center border-t border-slate-800">
            Click bar to view cohort patient list
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Patient Demographic Analytics & Clinical Cohorts
            </h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
              Age & Gender
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Population distribution by age brackets (Pediatric, Adult, Senior) and gender to assist diagnostic reference ranges and workload profiling
          </p>
        </div>

        {/* View Mode Controls & Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => {
                setTierMode('3tier');
                setSelectedCohortId(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                tierMode === '3tier'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3-Tier (Pediatric/Adult/Senior)
            </button>
            <button
              onClick={() => {
                setTierMode('4tier');
                setSelectedCohortId(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                tierMode === '4tier'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4-Tier (Granular)
            </button>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('patients')}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline px-2 py-1"
            >
              Directory →
            </button>
          )}
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Registered Patients */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Total Registered Patients</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
            {totalPatients} <span className="text-xs font-normal text-slate-500 font-sans">patients</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Active in pathology database
          </div>
        </div>

        {/* Average Age */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Average Patient Age</div>
          <div className="text-xl font-bold font-mono text-teal-800 mt-0.5">
            {averageAge} <span className="text-xs font-normal text-slate-500 font-sans">yrs</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Median: {medianAge} yrs (Range: {minAge}–{maxAge} yrs)
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Gender Ratio (M : F)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 flex items-center gap-1.5">
            <span className="text-sky-700">{malePatients}</span>
            <span className="text-slate-300 font-sans">:</span>
            <span className="text-rose-700">{femalePatients}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {femalePatients > 0 ? (malePatients / femalePatients).toFixed(2) : malePatients} : 1 Male-to-Female
          </div>
        </div>

        {/* Pediatric & Senior Share */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-500">Pediatric & Senior Share</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-0.5">
            {totalPatients > 0
              ? Math.round(
                  ((cohorts.find(c => c.id === 'pediatric')?.total || 0) +
                    (cohorts.find(c => c.id === 'senior')?.total || 0)) /
                    totalPatients *
                    100
                )
              : 0}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Specialized range cohorts
          </div>
        </div>
      </div>

      {/* Gender Proportion Bar */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-800">Overall Gender Breakdown:</span>
            <span className="flex items-center gap-1 text-sky-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Male: {malePatients} ({malePercent}%)
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Female: {femalePatients} ({femalePercent}%)
            </span>
            {otherPatients > 0 && (
              <span className="flex items-center gap-1 text-purple-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Other: {otherPatients} ({otherPercent}%)
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalPatients} Total
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 flex">
          <div
            className="bg-sky-500 hover:bg-sky-600 transition-all duration-300"
            style={{ width: `${malePercent}%` }}
            title={`Male: ${malePatients} (${malePercent}%)`}
          />
          <div
            className="bg-rose-500 hover:bg-rose-600 transition-all duration-300"
            style={{ width: `${femalePercent}%` }}
            title={`Female: ${femalePatients} (${femalePercent}%)`}
          />
          {otherPercent > 0 && (
            <div
              className="bg-purple-500 hover:bg-purple-600 transition-all duration-300"
              style={{ width: `${otherPercent}%` }}
              title={`Other: ${otherPatients} (${otherPercent}%)`}
            />
          )}
        </div>
      </div>

      {/* Main Grid: Recharts Bar Chart on Left, Interactive Cohort Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Recharts Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider block">
                Age Brackets by Gender Distribution
              </span>
              <span className="text-[11px] text-slate-500">
                Number of male and female patients per clinical age bracket
              </span>
            </div>
            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              Grouped Comparison
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const cId = e.activePayload[0].payload.cohortId;
                    setSelectedCohortId(prev => (prev === cId ? null : cId));
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  width={32}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={28}
                  iconType="circle"
                  formatter={(val) => (
                    <span className="text-xs font-semibold text-slate-700">{val} Patients</span>
                  )}
                />
                <Bar
                  dataKey="Male"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  cursor="pointer"
                />
                <Bar
                  dataKey="Female"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                  cursor="pointer"
                />
                {otherPatients > 0 && (
                  <Bar
                    dataKey="Other"
                    fill="#9333ea"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                    cursor="pointer"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Tip: Click any bar or category card to inspect patients in that group.</span>
            {selectedCohortId && (
              <button
                onClick={() => setSelectedCohortId(null)}
                className="text-teal-700 font-bold hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Right: Cohort Breakdown Cards */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Clinical Age Groups ({cohorts.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Select to inspect
            </span>
          </div>

          {cohorts.map(c => {
            const isSelected = selectedCohortId === c.id;
            const pct = totalPatients > 0 ? Math.round((c.total / totalPatients) * 100) : 0;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCohortId(prev => (prev === c.id ? null : c.id))}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-500/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{c.label}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] text-slate-600 font-semibold">
                      {c.sublabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold font-mono text-slate-900">
                      {c.total}
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Male / Female sub-counts */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-sky-700 font-semibold flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      {c.maleCount} Male
                    </span>
                    <span className="text-rose-700 font-semibold flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      {c.femaleCount} Female
                    </span>
                    {c.otherCount > 0 && (
                      <span className="text-purple-700 font-semibold flex items-center gap-1 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        {c.otherCount} Other
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    Avg: {c.avgAge} yrs
                  </span>
                </div>

                {/* Common Investigations in this cohort */}
                {c.frequentTests.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 pt-1 text-[10px] text-slate-500">
                    <span className="text-slate-400">Common:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.frequentTests.map(t => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Cohort Patient Drawer / Drill-down */}
      {activeCohort && (
        <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-4 transition-all space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {activeCohort.label} Patients ({activeCohort.sublabel})
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-600 text-white font-mono text-[10px] font-bold">
                  {activeCohort.total} Patients
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed clinical registry of patients falling within this diagnostic age cohort
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenNewPatient && (
                <button
                  onClick={onOpenNewPatient}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
                >
                  + Add Patient
                </button>
              )}
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('patients')}
                  className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Open in Patients Directory →
                </button>
              )}
            </div>
          </div>

          {activeCohort.patients.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400 italic">
              No registered patients currently in this age cohort.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">MRN / ID</th>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="py-2.5 px-3">Age / Gender</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Referred By</th>
                    <th className="py-2.5 px-3 text-right">Orders History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCohort.patients.map(p => {
                    const patientOrders = orders.filter(o => o.patientId === p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-teal-800 text-[11px]">
                          {p.id}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono">{p.age} yrs</span> ·{' '}
                          <span
                            className={
                              p.gender === 'Male'
                                ? 'text-sky-700 font-semibold'
                                : p.gender === 'Female'
                                ? 'text-rose-700 font-semibold'
                                : 'text-purple-700 font-semibold'
                            }
                          >
                            {p.gender}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                          {p.phone}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[180px]">
                          {p.referredBy || 'Self / Walk-in'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                            {patientOrders.length} order{patientOrders.length === 1 ? '' : 's'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
