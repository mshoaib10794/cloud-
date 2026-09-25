import React, { useState } from 'react';
import { Patient, TestCatalogItem, LabAppointment, VisitType, Gender } from '../types/lims';
import { formatPKR, formatPakistaniPhone } from '../utils/formatters';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  catalog: TestCatalogItem[];
  initialPatientId?: string;
  onSaveAppointment: (appointment: LabAppointment, newPatient?: Patient) => void;
}

const POPULAR_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM'
];

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  catalog,
  initialPatientId,
  onSaveAppointment
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Patient Selection Mode: 'existing' or 'new'
  const [patientMode, setPatientMode] = useState<'existing' | 'new'>(
    initialPatientId ? 'existing' : 'existing'
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );
  const [patientSearch, setPatientSearch] = useState('');

  // New Patient Registration State
  const autoPatientId = `PAT-2026-${String(patients.length + 1).padStart(4, '0')}`;
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState<number>(30);
  const [newGender, setNewGender] = useState<Gender>('Male');
  const [newPhone, setNewPhone] = useState('0300-');
  const [newAddress, setNewAddress] = useState('Lahore, Pakistan');
  const [referredBy, setReferredBy] = useState('');

  // Appointment Details State
  const [appointmentDate, setAppointmentDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM');
  const [visitType, setVisitType] = useState<VisitType>('Lab Visit / Walk-in');
  const [selectedTests, setSelectedTests] = useState<string[]>(['CBC']);
  const [testSearch, setTestSearch] = useState('');
  const [fastingRequired, setFastingRequired] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered patients for dropdown/search
  const filteredPatients = patients.filter(
    p =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
  );

  const selectedPatientObj = patients.find(p => p.id === selectedPatientId);

  // Filtered tests catalog
  const filteredCatalog = catalog.filter(
    t =>
      t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(testSearch.toLowerCase())
  );

  // Toggle test selection
  const handleToggleTest = (code: string) => {
    setSelectedTests(prev => {
      const exists = prev.includes(code);
      const updated = exists ? prev.filter(c => c !== code) : [...prev, code];

      // Auto-suggest fasting if metabolic tests selected
      const fastingCodes = ['LIPID', 'FBS', 'GLUCOSE', 'LFT', 'RFT', 'INSULIN'];
      if (!exists && fastingCodes.some(fc => code.toUpperCase().includes(fc))) {
        setFastingRequired(true);
      }
      return updated;
    });
  };

  // Estimated tests fee
  const estimatedFee = selectedTests.reduce((acc, code) => {
    const item = catalog.find(t => t.code === code);
    return acc + (item?.fee || 0);
  }, 0);

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let finalPatientId = selectedPatientId;
    let newPatientCreated: Patient | undefined;

    if (patientMode === 'new') {
      if (!newName.trim()) {
        setFormError('Please enter the patient full name.');
        return;
      }
      if (!newPhone.trim() || newPhone.trim() === '0300-') {
        setFormError('Please provide a valid Pakistani contact phone number.');
        return;
      }

      newPatientCreated = {
        id: autoPatientId,
        name: newName.trim(),
        age: Number(newAge) || 30,
        gender: newGender,
        phone: formatPakistaniPhone(newPhone),
        cnic: '',
        address: newAddress.trim() || 'Lahore, Pakistan',
        referredBy: referredBy.trim() || 'Self / Walk-in',
        createdAt: new Date().toISOString()
      };
      finalPatientId = newPatientCreated.id;
    } else {
      if (!finalPatientId) {
        setFormError('Please select a registered patient from the directory.');
        return;
      }
    }

    if (!appointmentDate) {
      setFormError('Please select a valid appointment date.');
      return;
    }

    if (!timeSlot) {
      setFormError('Please select a preferred appointment time slot.');
      return;
    }

    const generatedId = `APT-2026-${String(Math.floor(100 + Math.random() * 900))}`;

    const newAppointment: LabAppointment = {
      id: generatedId,
      patientId: finalPatientId,
      appointmentDate,
      timeSlot,
      visitType,
      requestedTests: selectedTests,
      fastingRequired,
      status: 'Scheduled',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'Front Desk / Online Booking'
    };

    onSaveAppointment(newAppointment, newPatientCreated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 border border-teal-200 font-bold">
              <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Book Lab Visit / Advance Appointment
              </h2>
              <p className="text-xs text-slate-500">
                Schedule a diagnostic visit or phlebotomy home collection linked to patient MRN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Patient Selection */}
          <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                1. Patient Identity (Direct Record Link)
              </span>

              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPatientMode('existing')}
                  className={`px-3 py-1 rounded-md transition-all font-semibold ${
                    patientMode === 'existing'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Select Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientMode('new')}
                  className={`px-3 py-1 rounded-md transition-all font-semibold ${
                    patientMode === 'new'
                      ? 'bg-white text-teal-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Register New Patient
                </button>
              </div>
            </div>

            {patientMode === 'existing' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search existing patient by Name, MRN, or Phone..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-teal-600"
                />

                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:outline-teal-600"
                >
                  {filteredPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}Y/{p.gender}) · MRN: {p.id} · Phone: {p.phone}
                    </option>
                  ))}
                </select>

                {selectedPatientObj && (
                  <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg flex items-center justify-between text-[11px] text-teal-900">
                    <div>
                      <span className="font-bold">{selectedPatientObj.name}</span> · {selectedPatientObj.age} Yrs / {selectedPatientObj.gender}
                      <span className="text-teal-700 block font-mono">MRN: {selectedPatientObj.id} · {selectedPatientObj.phone}</span>
                    </div>
                    <span className="text-[10px] text-teal-700 bg-white border border-teal-300 px-2 py-0.5 rounded font-semibold">
                      Linked to Medical Record
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Auto MRN
                  </label>
                  <input
                    type="text"
                    disabled
                    value={autoPatientId}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-mono text-slate-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zainab Bibi"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-teal-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Age (Years) & Gender *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={125}
                      value={newAge}
                      onChange={e => setNewAge(Number(e.target.value))}
                      className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-teal-600"
                    />
                    <select
                      value={newGender}
                      onChange={e => setNewGender(e.target.value as Gender)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-teal-600"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:outline-teal-600"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    placeholder="Sector / House / Street Address"
                    value={newAddress}
                    onChange={e => setNewAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-teal-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Date, Time & Visit Type */}
          <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              2. Appointment Schedule & Modality
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={e => setAppointmentDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-mono focus:outline-teal-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Visit Modality *
                </label>
                <select
                  value={visitType}
                  onChange={e => setVisitType(e.target.value as VisitType)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium focus:outline-teal-600"
                >
                  <option value="Lab Visit / Walk-in">🏥 Lab Visit / Walk-in</option>
                  <option value="Home Sample Collection">🏠 Home Sample Collection</option>
                </select>
              </div>
            </div>

            {/* Time Slot Quick Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Preferred Time Slot * (Current: <strong className="text-teal-800">{timeSlot}</strong>)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {POPULAR_TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      timeSlot === slot
                        ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Fasting Toggle Checkbox */}
            <div className="pt-1">
              <label className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={fastingRequired}
                    onChange={e => setFastingRequired(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Fasting Required (10–12 Hours Overnight)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Water allowed. Advise patient to skip breakfast and morning medications unless cleared.
                    </span>
                  </div>
                </div>
                {fastingRequired && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Fasting Flagged
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Section 3: Requested Tests & Package */}
          <div className="space-y-3 bg-slate-50/70 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                3. Requested Tests / Investigations ({selectedTests.length})
              </span>

              <span className="font-mono font-bold text-teal-800 text-xs">
                Estimated: {formatPKR(estimatedFee)}
              </span>
            </div>

            <input
              type="text"
              placeholder="Search tests to add..."
              value={testSearch}
              onChange={e => setTestSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-teal-600"
            />

            <div className="max-h-36 overflow-y-auto space-y-1 bg-white p-2 border border-slate-200 rounded-lg divide-y divide-slate-100">
              {filteredCatalog.map(test => {
                const isChecked = selectedTests.includes(test.code);
                return (
                  <label
                    key={test.code}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                      isChecked ? 'bg-teal-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTest(test.code)}
                        className="text-teal-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">{test.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({test.code})</span>
                    </div>
                    <span className="font-mono text-slate-700 font-medium">{formatPKR(test.fee)}</span>
                  </label>
                );
              })}
            </div>

            {/* Special Instructions & Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Clinical Instructions or Phlebotomy Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Home phlebotomy address directions, wheelchair requirement, special clinical indications..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:outline-teal-600"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Directly linked to patient ID and ready for 1-click order conversion on visit day
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Confirm Appointment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
