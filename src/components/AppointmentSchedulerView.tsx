import React, { useState, useMemo } from 'react';
import {
  LabAppointment,
  Patient,
  TestCatalogItem,
  LabOrder,
  UserAccount,
  AppointmentStatus,
  VisitType,
  LabProfile
} from '../types/lims';
import { formatPKR, formatLabDate } from '../utils/formatters';
import { downloadCSV } from '../utils/downloadHelpers';

interface AppointmentSchedulerViewProps {
  appointments: LabAppointment[];
  patients: Patient[];
  catalog: TestCatalogItem[];
  orders: LabOrder[];
  currentUser?: UserAccount;
  profile?: LabProfile;
  onOpenNewAppointment: (patientId?: string) => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onCheckInToOrder: (appointment: LabAppointment) => void;
  onNavigateToPatient?: (patientId: string) => void;
}

export const AppointmentSchedulerView: React.FC<AppointmentSchedulerViewProps> = ({
  appointments,
  patients,
  catalog,
  orders,
  currentUser,
  profile,
  onOpenNewAppointment,
  onUpdateAppointmentStatus,
  onCheckInToOrder,
  onNavigateToPatient
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter States
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'past'>('all');
  const [statusFilter, setStatusFilter] = useState<'All' | AppointmentStatus>('All');
  const [visitTypeFilter, setVisitTypeFilter] = useState<'All' | VisitType>('All');
  const [search, setSearch] = useState('');

  // Slip Print Modal State
  const [printingAppointment, setPrintingAppointment] = useState<LabAppointment | null>(null);

  // Catalog Map for test names
  const catalogMap = useMemo(() => {
    const map = new Map<string, TestCatalogItem>();
    catalog.forEach(item => map.set(item.code.toUpperCase(), item));
    return map;
  }, [catalog]);

  // Key KPI Metrics
  const todayAppointments = useMemo(() => {
    return appointments.filter(a => a.appointmentDate === todayStr);
  }, [appointments, todayStr]);

  const upcomingAppointments = useMemo(() => {
    return appointments.filter(a => a.appointmentDate >= todayStr && a.status !== 'Completed' && a.status !== 'Cancelled');
  }, [appointments, todayStr]);

  const homeCollectionCount = useMemo(() => {
    return appointments.filter(a => a.visitType === 'Home Sample Collection' && a.appointmentDate >= todayStr).length;
  }, [appointments, todayStr]);

  const completedCount = useMemo(() => {
    return appointments.filter(a => a.status === 'Completed').length;
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(apt => {
        const patient = patients.find(p => p.id === apt.patientId);

        // Date Filter
        if (dateFilter === 'today' && apt.appointmentDate !== todayStr) return false;
        if (dateFilter === 'tomorrow' && apt.appointmentDate !== tomorrowStr) return false;
        if (dateFilter === 'upcoming' && apt.appointmentDate < todayStr) return false;
        if (dateFilter === 'past' && apt.appointmentDate >= todayStr) return false;

        // Status Filter
        if (statusFilter !== 'All' && apt.status !== statusFilter) return false;

        // Visit Type Filter
        if (visitTypeFilter !== 'All' && apt.visitType !== visitTypeFilter) return false;

        // Search Filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchesId = apt.id.toLowerCase().includes(q);
          const matchesPatientName = patient?.name.toLowerCase().includes(q) || false;
          const matchesMRN = apt.patientId.toLowerCase().includes(q);
          const matchesPhone = patient?.phone.includes(q) || false;
          const matchesTests = apt.requestedTests.some(t => t.toLowerCase().includes(q));
          if (!matchesId && !matchesPatientName && !matchesMRN && !matchesPhone && !matchesTests) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date, then time slot
        if (a.appointmentDate !== b.appointmentDate) {
          return a.appointmentDate.localeCompare(b.appointmentDate);
        }
        return a.timeSlot.localeCompare(b.timeSlot);
      });
  }, [appointments, patients, dateFilter, statusFilter, visitTypeFilter, search, todayStr, tomorrowStr]);

  // Export CSV of Appointments
  const handleExportCSV = () => {
    const headers = [
      'Appointment ID',
      'Appointment Date',
      'Time Slot',
      'Visit Modality',
      'Patient ID (MRN)',
      'Patient Name',
      'Age',
      'Gender',
      'Contact Phone',
      'Address',
      'Requested Tests',
      'Fasting Required',
      'Status',
      'Converted Order ID',
      'Notes',
      'Booked Date'
    ];

    const rows = filteredAppointments.map(apt => {
      const patient = patients.find(p => p.id === apt.patientId);
      const testNames = apt.requestedTests
        .map(t => catalogMap.get(t.toUpperCase())?.name || t)
        .join('; ');

      return [
        apt.id,
        apt.appointmentDate,
        apt.timeSlot,
        apt.visitType,
        apt.patientId,
        patient?.name || 'Unknown Patient',
        patient?.age ? `${patient.age} Yrs` : '',
        patient?.gender || '',
        patient?.phone || '',
        patient?.address || '',
        testNames,
        apt.fastingRequired ? 'Yes (10-12 hrs)' : 'No',
        apt.status,
        apt.convertedToOrderId || 'N/A',
        apt.notes || '',
        apt.createdAt?.slice(0, 10) || ''
      ];
    });

    downloadCSV(`Lab_Appointments_Schedule_${todayStr}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Lab Visit & Phlebotomy Appointment Scheduler
            </h1>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full">
              Direct Record Link
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage advance patient bookings, home sample collections, fasting alerts, and 1-click order check-in
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Export filtered appointments to CSV spreadsheet"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>

          <button
            onClick={() => onOpenNewAppointment()}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Book New Appointment</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today's Bookings</span>
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {todayAppointments.length}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">scheduled</span>
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            {todayAppointments.filter(a => a.status === 'Confirmed').length} confirmed · {todayAppointments.filter(a => a.status === 'Completed').length} checked in
          </div>
        </div>

        {/* Upcoming Advance Visits */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Active Upcoming Queue</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {upcomingAppointments.length}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">patients</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Advance bookings across this week
          </div>
        </div>

        {/* Home Sample Collections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Home Collections</span>
            <span className="text-xs">🏠</span>
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-900 mt-1">
            {homeCollectionCount}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">phlebotomy requests</span>
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Assigned for mobile phlebotomist
          </div>
        </div>

        {/* Total Completed / Check-In Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="text-xs text-slate-500">Checked-in & Converted</div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {completedCount}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">lab orders</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Samples drawn & registered in LIMS
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date range tab selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'all' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Dates ({appointments.length})
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'today' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Today ({todayAppointments.length})
            </button>
            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'tomorrow' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setDateFilter('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'upcoming' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setDateFilter('past')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFilter === 'past' ? 'bg-white text-teal-800 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Past / Completed
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search by Patient, MRN, Phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium focus:outline-teal-600"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Secondary filters: Status and Visit Type */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-teal-600"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No Show">No Show</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Modality:</span>
              <select
                value={visitTypeFilter}
                onChange={e => setVisitTypeFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-teal-600"
              >
                <option value="All">All Modalities</option>
                <option value="Lab Visit / Walk-in">🏥 Lab Visit / Walk-in</option>
                <option value="Home Sample Collection">🏠 Home Sample Collection</option>
              </select>
            </div>
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing <strong className="text-slate-800">{filteredAppointments.length}</strong> of {appointments.length} appointments
          </span>
        </div>
      </div>

      {/* Appointments List / Grid */}
      <div className="space-y-3">
        {filteredAppointments.map(apt => {
          const patient = patients.find(p => p.id === apt.patientId);
          const isToday = apt.appointmentDate === todayStr;
          const isPast = apt.appointmentDate < todayStr;
          const isCompleted = apt.status === 'Completed';
          const isCancelled = apt.status === 'Cancelled';

          const testsDetailed = apt.requestedTests.map(code => {
            const item = catalogMap.get(code.toUpperCase());
            return { code, name: item?.name || code, fee: item?.fee || 0 };
          });

          const totalEstimatedPKR = testsDetailed.reduce((sum, t) => sum + t.fee, 0);

          return (
            <div
              key={apt.id}
              className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs transition-all ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isCancelled
                  ? 'border-slate-200 opacity-60 bg-slate-50/50'
                  : isToday
                  ? 'border-teal-500/60 ring-1 ring-teal-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Patient and Slot Identity */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                      {apt.id}
                    </span>

                    {/* Date and Time Badge */}
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${
                        isToday
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {apt.appointmentDate} · {apt.timeSlot}
                      {isToday && <span className="ml-1 text-[10px] font-sans font-extrabold uppercase">TODAY</span>}
                    </span>

                    {/* Modality Badge */}
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      {apt.visitType === 'Home Sample Collection' ? '🏠 Home Collection' : '🏥 Lab Visit'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        apt.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : apt.status === 'Confirmed'
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : apt.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {apt.status}
                    </span>

                    {apt.fastingRequired && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ⚠️ Fasting Required (10–12h)
                      </span>
                    )}
                  </div>

                  {/* Patient Name & Demographics */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {patient?.name || 'Unknown Patient'}
                      </span>
                      {patient && (
                        <span className="text-xs text-slate-500">
                          ({patient.age} Yrs · {patient.gender})
                        </span>
                      )}
                      <span className="font-mono text-xs text-slate-500">
                        MRN: <strong className="text-slate-700">{apt.patientId}</strong>
                      </span>
                      {patient?.phone && (
                        <span className="font-mono text-xs text-slate-500">
                          · Phone: <strong className="text-slate-700">{patient.phone}</strong>
                        </span>
                      )}
                    </div>

                    {patient?.address && apt.visitType === 'Home Sample Collection' && (
                      <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <span className="text-slate-400">Home Address:</span> {patient.address}
                      </p>
                    )}
                  </div>

                  {/* Requested Tests & Estimate */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Tests ({apt.requestedTests.length}):</span>
                    {testsDetailed.map(t => (
                      <span
                        key={t.code}
                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-medium"
                      >
                        {t.name}
                      </span>
                    ))}
                    {totalEstimatedPKR > 0 && (
                      <span className="text-xs font-mono font-bold text-teal-800 ml-1">
                        Est. {formatPKR(totalEstimatedPKR)}
                      </span>
                    )}
                  </div>

                  {/* Special Notes */}
                  {apt.notes && (
                    <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200/60 mt-1">
                      <span className="font-semibold text-slate-700">Instructions:</span> {apt.notes}
                    </div>
                  )}

                  {apt.convertedToOrderId && (
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1 mt-1">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Checked-in and converted to Lab Order: <span className="font-mono font-bold">{apt.convertedToOrderId}</span>
                    </div>
                  )}
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex flex-row lg:flex-col items-end justify-between lg:justify-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
                  {/* Primary Action: Check In & Convert to Order */}
                  {!isCompleted && !isCancelled && (
                    <button
                      onClick={() => onCheckInToOrder(apt)}
                      className="w-full sm:w-auto px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5"
                      title="Check in patient and create a registered Lab Order"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check-In & Order
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Status Toggles */}
                    {apt.status === 'Scheduled' && (
                      <button
                        onClick={() => onUpdateAppointmentStatus(apt.id, 'Confirmed')}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 rounded-lg text-xs font-semibold"
                        title="Mark appointment as confirmed"
                      >
                        Confirm
                      </button>
                    )}

                    {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                      <button
                        onClick={() => onUpdateAppointmentStatus(apt.id, 'Cancelled')}
                        className="px-2 py-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs"
                        title="Cancel appointment"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Print Slip Voucher */}
                    <button
                      onClick={() => setPrintingAppointment(apt)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                      title="Print Appointment Confirmation Slip"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Slip
                    </button>

                    {/* View Patient Details */}
                    {onNavigateToPatient && (
                      <button
                        onClick={() => onNavigateToPatient(apt.patientId)}
                        className="px-2.5 py-1 text-teal-700 hover:underline font-semibold text-xs"
                      >
                        Patient Record →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAppointments.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <svg className="w-10 h-10 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-semibold text-slate-600">No appointments match the selected filter</p>
            <p className="text-xs text-slate-400">Try changing the date filter or schedule a new lab visit above.</p>
            <button
              onClick={() => onOpenNewAppointment()}
              className="mt-2 text-xs font-bold text-teal-700 hover:underline"
            >
              + Book an appointment now →
            </button>
          </div>
        )}
      </div>

      {/* Appointment Confirmation Voucher / Slip Modal */}
      {printingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Modal Controls Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between no-print">
              <span className="text-xs font-bold text-slate-700">Appointment Confirmation Voucher</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Print Voucher
                </button>
                <button
                  onClick={() => setPrintingAppointment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-base"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-6 text-slate-900 text-xs space-y-4 printable-area">
              {/* Lab Header */}
              <div className="text-center border-b-2 border-teal-700 pb-3">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
                  <img src="/logo.png" alt="Lab Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-base font-bold tracking-tight text-slate-900">
                  {profile?.labName || 'Lab-Portal-App'}
                </h2>
                <p className="text-[10px] text-slate-500">
                  {profile?.tagline || 'ISO 15189 Certified Clinical Pathology & Phlebotomy'}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  {profile?.address} | UAN: {profile?.phone}
                </p>
              </div>

              {/* Appointment Reference & Date */}
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-teal-800">Confirmed Booking Slot</div>
                <div className="text-lg font-bold font-mono text-teal-950">
                  {printingAppointment.appointmentDate} · {printingAppointment.timeSlot}
                </div>
                <div className="text-[11px] font-mono font-bold text-teal-700">
                  Booking Ref: {printingAppointment.id}
                </div>
                <div className="text-[10px] text-teal-900 font-semibold">
                  Modality: {printingAppointment.visitType}
                </div>
              </div>

              {/* Patient Demographics */}
              {(() => {
                const pat = patients.find(p => p.id === printingAppointment.patientId);
                return (
                  <div className="border border-slate-200 rounded-xl p-3 space-y-1 bg-slate-50">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient Name:</span>
                      <span className="font-bold text-slate-900">{pat?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient MRN:</span>
                      <span className="font-mono font-semibold text-slate-800">{printingAppointment.patientId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age / Gender:</span>
                      <span>{pat?.age} Yrs / {pat?.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-mono">{pat?.phone}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Fasting Instructions */}
              {printingAppointment.fastingRequired ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    ⚠️ Fasting Instructions (Mandatory):
                  </div>
                  <p>
                    Please observe 10 to 12 hours of overnight fasting prior to your appointment. Plain drinking water is permitted. Avoid breakfast, sweetened drinks, and morning tea/coffee.
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px]">
                  <strong>Routine Visit:</strong> Normal diet permitted. No strict overnight fasting required for these tests.
                </div>
              )}

              {/* Requested Investigations */}
              <div>
                <span className="font-bold text-slate-800 block mb-1">Scheduled Tests:</span>
                <div className="space-y-1 divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-white">
                  {printingAppointment.requestedTests.map(code => {
                    const item = catalogMap.get(code.toUpperCase());
                    return (
                      <div key={code} className="flex justify-between pt-1 text-[11px]">
                        <span className="font-medium text-slate-800">{item?.name || code}</span>
                        <span className="font-mono text-slate-600">{formatPKR(item?.fee || 0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                Present this slip or SMS confirmation at reception upon arrival for instant priority check-in.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
