import React, { useState, useEffect } from 'react';
import { Patient, LabOrder, Gender, UserAccount, TestCatalogItem, OrderResultReport } from '../types/lims';
import { formatPKR, formatCNIC, formatPakistaniPhone, formatLabDate } from '../utils/formatters';
import { downloadCSV } from '../utils/downloadHelpers';
import { MedicalHistoryView } from './MedicalHistoryView';

interface PatientsViewProps {
  patients: Patient[];
  orders: LabOrder[];
  catalog?: TestCatalogItem[];
  reports?: OrderResultReport[];
  currentUser?: UserAccount;
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onBookOrderForPatient: (patient: Patient) => void;
  onViewOrderReceipt: (order: LabOrder) => void;
  onViewOrderReport: (order: LabOrder) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  orders,
  catalog = [],
  reports = [],
  currentUser,
  onAddPatient,
  onUpdatePatient,
  onBookOrderForPatient,
  onViewOrderReceipt,
  onViewOrderReport
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'directory' | 'medical-history'>('directory');
  const [selectedHistoryPatient, setSelectedHistoryPatient] = useState<Patient | null>(patients[0] || null);
  const [drawerTab, setDrawerTab] = useState<'history' | 'orders'>('history');

  const [search, setSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePatientDrawer, setActivePatientDrawer] = useState<Patient | null>(null);

  useEffect(() => {
    if (!selectedHistoryPatient && patients.length > 0) {
      setSelectedHistoryPatient(patients[0]);
    } else if (selectedHistoryPatient && !patients.some(p => p.id === selectedHistoryPatient.id) && patients.length > 0) {
      setSelectedHistoryPatient(patients[0]);
    }
  }, [patients, selectedHistoryPatient]);

  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist';
  const isAdmin = currentUser?.role === 'admin';

  const handleExportCSV = () => {
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Phone', 'CNIC', 'Address', 'Referred By', 'Registered Date'];
    const rows = filteredPatients.map(p => [
      p.id,
      p.name,
      p.age,
      p.gender,
      p.phone,
      p.cnic,
      p.address,
      p.referredBy || 'Self',
      p.createdAt
    ]);
    downloadCSV(`Patients_Directory_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  // New / Edit Patient Form state
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const nextIdNumber = patients.length + 1;
  const generatedId = `PAT-2026-${String(nextIdNumber).padStart(4, '0')}`;

  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState<number>(35);
  const [formGender, setFormGender] = useState<Gender>('Male');
  const [formPhone, setFormPhone] = useState('0300-');
  const [formCnic, setFormCnic] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formReferredBy, setFormReferredBy] = useState('');

  const openAddModal = () => {
    setEditingPatient(null);
    setFormName('');
    setFormAge(32);
    setFormGender('Male');
    setFormPhone('0300-');
    setFormCnic('');
    setFormAddress('Lahore, Pakistan');
    setFormReferredBy('');
    setShowAddModal(true);
  };

  const openEditModal = (p: Patient) => {
    setEditingPatient(p);
    setFormName(p.name);
    setFormAge(p.age);
    setFormGender(p.gender);
    setFormPhone(p.phone);
    setFormCnic(p.cnic || '');
    setFormAddress(p.address || '');
    setFormReferredBy(p.referredBy || '');
    setShowAddModal(true);
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingPatient) {
      const updated: Patient = {
        ...editingPatient,
        name: formName.trim(),
        age: Number(formAge),
        gender: formGender,
        phone: formPhone,
        cnic: formCnic,
        address: formAddress,
        referredBy: formReferredBy
      };
      onUpdatePatient(updated);
    } else {
      const newPat: Patient = {
        id: generatedId,
        name: formName.trim(),
        age: Number(formAge),
        gender: formGender,
        phone: formPhone,
        cnic: formCnic,
        address: formAddress,
        referredBy: formReferredBy || 'Self',
        createdAt: new Date().toISOString()
      };
      onAddPatient(newPat);
    }
    setShowAddModal(false);
  };

  // Filtered list
  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.cnic.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase());

    const matchesGender = selectedGender === 'All' || p.gender === selectedGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher: Patients Directory vs Medical History & Health Trends */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('directory')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeMainTab === 'directory'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          1. Patients Directory ({patients.length})
        </button>

        <button
          onClick={() => setActiveMainTab('medical-history')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeMainTab === 'medical-history'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          2. Medical History & Longitudinal Trends
          <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] rounded-full font-bold">New</span>
        </button>
      </div>

      {/* TAB 2: MEDICAL HISTORY & LONGITUDINAL TRENDS */}
      {activeMainTab === 'medical-history' && (
        <MedicalHistoryView
          patient={selectedHistoryPatient || patients[0]}
          patients={patients}
          orders={orders}
          reports={reports}
          catalog={catalog}
          currentUser={currentUser}
          onSelectPatient={(p) => setSelectedHistoryPatient(p)}
          onViewOrderReport={onViewOrderReport}
          onViewOrderReceipt={onViewOrderReceipt}
          onBookOrder={onBookOrderForPatient}
        />
      )}

      {/* TAB 1: PATIENTS DIRECTORY */}
      {activeMainTab === 'directory' && (
        <>
          {/* Role specific notification banner */}
          {isReceptionist && (
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <span className="font-bold px-2 py-0.5 bg-teal-600 text-white rounded text-[10px]">
                  Reception Desk
                </span>
                <span>
                  <strong>Patient Onboarding & Records:</strong> Register walk-in patients, update CNIC/contact details, book tests, and review patient medical histories.
                </span>
              </div>
            </div>
          )}

          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Patients Registry
              </h1>
              <p className="text-xs text-slate-500">
                Auto-assigned System Patient IDs (MRN) with Pakistani CNIC, contact & medical history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Register New Patient
              </button>
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
                placeholder="Search by Patient Name, ID, CNIC or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">Gender:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {['All', 'Male', 'Female'].map((gen) => (
                  <button
                    key={gen}
                    onClick={() => setSelectedGender(gen)}
                    className={`px-3 py-1 rounded-md transition-colors ${
                      selectedGender === gen ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {gen}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Patient ID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-3">Age / Gender</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">CNIC No.</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-3">Total Orders</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((pat) => {
                    const patientOrders = orders.filter(o => o.patientId === pat.id);
                    return (
                      <tr key={pat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                            {pat.id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{pat.name}</div>
                          {pat.referredBy && (
                            <div className="text-[10px] text-slate-400">Ref: {pat.referredBy}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700">
                          {pat.age} yrs · {pat.gender}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {pat.phone}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {pat.cnic || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                          {pat.address}
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {patientOrders.length} {patientOrders.length === 1 ? 'order' : 'orders'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedHistoryPatient(pat);
                                setActiveMainTab('medical-history');
                              }}
                              title="View Medical History & Longitudinal Trends"
                              className="px-2.5 py-1 text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded font-semibold transition-colors flex items-center gap-1 text-[11px]"
                            >
                              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              Medical History
                            </button>
                            <button
                              onClick={() => {
                                setDrawerTab('orders');
                                setActivePatientDrawer(pat);
                              }}
                              title="View Patient Details & Orders"
                              className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded font-medium transition-colors text-[11px]"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => onBookOrderForPatient(pat)}
                              title="Book new test"
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold transition-colors text-[11px]"
                            >
                              + Order
                            </button>
                            <button
                              onClick={() => openEditModal(pat)}
                              title="Edit Patient"
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                  </tr>
                );
              })}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No patients found matching the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingPatient ? `Edit Patient: ${editingPatient.id}` : 'Register New Patient'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    System Patient ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingPatient ? editingPatient.id : generatedId}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-teal-800"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Patient Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={formAge}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(formatPakistaniPhone(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    CNIC (xxxxx-xxxxxxx-x)
                  </label>
                  <input
                    type="text"
                    placeholder="35201-1234567-1"
                    value={formCnic}
                    onChange={(e) => setFormCnic(formatCNIC(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Referred By</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Salman / Self"
                    value={formReferredBy}
                    onChange={(e) => setFormReferredBy(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Complete Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, Area, City"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  {editingPatient ? 'Update Patient' : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )}

      {/* Patient Profile & History Drawer */}
      {activePatientDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <div className="text-xs font-mono font-bold text-teal-700">
                  {activePatientDrawer.id}
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {activePatientDrawer.name}
                </h3>
              </div>
              <button
                onClick={() => setActivePatientDrawer(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Demographics card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Age / Gender</span>
                  <span className="font-semibold">{activePatientDrawer.age} Yrs / {activePatientDrawer.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Contact Phone</span>
                  <span className="font-mono font-semibold">{activePatientDrawer.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">CNIC</span>
                  <span className="font-mono">{activePatientDrawer.cnic || 'N/A'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Address</span>
                  <span>{activePatientDrawer.address || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Referred By</span>
                  <span>{activePatientDrawer.referredBy || 'Self'}</span>
                </div>
              </div>

              {/* Order History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Diagnostic Orders & History
                  </h4>
                  <button
                    onClick={() => {
                      const p = activePatientDrawer;
                      setActivePatientDrawer(null);
                      onBookOrderForPatient(p);
                    }}
                    className="text-xs font-bold text-teal-700 hover:underline"
                  >
                    + Book New Test
                  </button>
                </div>

                <div className="space-y-2">
                  {orders
                    .filter(o => o.patientId === activePatientDrawer.id)
                    .map(order => (
                      <div
                        key={order.id}
                        className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-teal-700">{order.id}</span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-500 text-[11px]">{order.sampleBarcode}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{formatLabDate(order.bookingDate)}</span>
                          </div>
                          <div className="font-semibold text-slate-800 mt-1">
                            Tests: {order.tests.join(', ')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Net: <span className="font-mono font-bold text-slate-800">{formatPKR(order.netAmount)}</span> · Status: <span className="font-semibold text-teal-700">{order.sampleStatus}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewOrderReceipt(order)}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
                          >
                            Receipt
                          </button>
                          <button
                            onClick={() => onViewOrderReport(order)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    ))}
                  {orders.filter(o => o.patientId === activePatientDrawer.id).length === 0 && (
                    <div className="p-4 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No past lab orders for this patient.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
