import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/lims';

interface StaffManagementModalProps {
  currentUser: UserAccount;
  accounts: UserAccount[];
  onAddStaff: (newStaff: UserAccount) => void;
  onToggleStaffStatus: (userId: string) => void;
  onSwitchAccount: (user: UserAccount) => void;
  onSignOut: () => void;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  currentUser,
  accounts,
  onAddStaff,
  onToggleStaffStatus,
  onSwitchAccount,
  onSignOut,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'all-staff' | 'create'>('profile');

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('technologist');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedUsername = newUsername.trim().toLowerCase();
    if (!newName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (accounts.some(a => a.username.toLowerCase() === trimmedUsername)) {
      setErrorMsg(`Username "${trimmedUsername}" is already in use.`);
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    const created: UserAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: trimmedUsername,
      name: newName.trim(),
      role: newRole,
      password: newPassword,
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      designation: newDesignation.trim() || undefined,
      isActive: true,
      lastLogin: undefined
    };

    onAddStaff(created);
    setSuccessMsg(`Staff account for ${created.name} (${created.username}) created successfully!`);
    setNewName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewPhone('');
    setNewDesignation('');
    setTimeout(() => {
      setActiveTab('all-staff');
      setSuccessMsg(null);
    }, 1200);
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return { label: '1. Administrator (Full Access)', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'receptionist':
        return { label: '2. Reception (Patients, Invoices, Print Reports)', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'technologist':
      case 'technician':
        return { label: '3. Lab Technician (Samples, Results, Validate & Print Reports)', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'pathologist':
        return { label: 'Consultant Pathologist', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: role ? String(role) : 'Staff Account', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Staff & Account Management</h3>
              <p className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('all-staff')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'all-staff'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Staff Accounts</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
              {accounts.length}
            </span>
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'border-teal-600 text-teal-800 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>+ Create Staff Account</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-xs space-y-4">
          {/* TAB 1: MY PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-xl flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-base font-bold text-slate-900">{currentUser.name}</h4>
                    {(() => {
                      const userBadge = getRoleBadge(currentUser?.role);
                      return (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${userBadge?.bg || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {userBadge?.label || 'Staff Member'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-slate-600 text-xs font-medium">
                    {currentUser.designation || 'Lab Personnel'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    Username: @{currentUser.username} · ID: {currentUser.id}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div>
                  <span className="text-slate-500 font-medium block">Email Address</span>
                  <span className="font-semibold text-slate-800">{currentUser.email || 'Not configured'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Phone / Mobile</span>
                  <span className="font-semibold text-slate-800">{currentUser.phone || 'Not configured'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Role Permissions</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {currentUser.role === 'admin'
                      ? 'Full System & Medical Access'
                      : currentUser.role === 'receptionist'
                      ? 'Patient Registration, Invoices & Reports'
                      : 'Sample Collection, Results & Validation'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Account Status</span>
                  <span className="text-emerald-700 font-bold">● Active & Logged In</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out / Log Out</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ALL STAFF ACCOUNTS */}
          {activeTab === 'all-staff' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-500">
                <span>Click "Switch To" to instantly log in as that staff member:</span>
              </div>

              <div className="space-y-2">
                {accounts.map(acc => {
                  const badge = getRoleBadge(acc.role);
                  const isCurrent = acc.id === currentUser.id;

                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'border-teal-500 bg-teal-50/40'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                          {acc.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{acc.name}</span>
                            <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border ${badge?.bg || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                              {badge?.label || 'Staff Account'}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            @{acc.username} · {acc.designation || 'Staff'} · Pass: {acc.password}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchAccount(acc);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-2xs"
                          >
                            Switch To
                          </button>
                        )}
                        {currentUser.role === 'admin' && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => onToggleStaffStatus(acc.id)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded border ${
                              acc.isActive
                                ? 'border-slate-200 text-slate-500 hover:bg-slate-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                            }`}
                          >
                            {acc.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE STAFF ACCOUNT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateStaff} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-semibold text-xs">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-xs">
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Hamza Malik"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. drhamza"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role / Privilege *</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                  >
                    <option value="receptionist">2. Reception (Patients, Invoices, Print Reports)</option>
                    <option value="technologist">3. Lab Technician (Collect Samples, Results, Validate & Print Reports)</option>
                    <option value="admin">1. Administrator (All Kinds of Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Account Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="At least 4 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Medical Technologist"
                    value={newDesignation}
                    onChange={e => setNewDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="staff@lab.pk"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="0300-1234567"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('all-staff')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
