import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/lims';

interface LoginViewProps {
  accounts: UserAccount[];
  onLogin: (user: UserAccount) => void;
  onRegister: (newUser: UserAccount) => void;
  labName?: string;
  initialMode?: 'signin' | 'signup';
}

export const LoginView: React.FC<LoginViewProps> = ({
  accounts,
  onLogin,
  onRegister,
  labName = 'Lab-Portal-App',
  initialMode = 'signin'
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('receptionist');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpDesignation, setSignUpDesignation] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    const input = loginUsername.trim().toLowerCase();
    const matched = accounts.find(
      acc =>
        (acc.username.toLowerCase() === input || (acc.email && acc.email.toLowerCase() === input)) &&
        acc.password === loginPassword
    );

    if (!matched) {
      setSignInError('Invalid username or password. Please try again or use 1-click login below.');
      return;
    }

    if (!matched.isActive) {
      setSignInError('This staff account is deactivated. Please contact the Lab Director.');
      return;
    }

    onLogin(matched);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    const trimmedUsername = signUpUsername.trim().toLowerCase();

    if (!signUpName.trim()) {
      setSignUpError('Please provide your full name.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setSignUpError('Username must be at least 3 characters.');
      return;
    }

    if (accounts.some(a => a.username.toLowerCase() === trimmedUsername)) {
      setSignUpError(`Username "${trimmedUsername}" is already taken. Please choose another.`);
      return;
    }

    if (signUpPassword.length < 4) {
      setSignUpError('Password must be at least 4 characters.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match. Please re-enter.');
      return;
    }

    const newAccount: UserAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: trimmedUsername,
      name: signUpName.trim(),
      role: signUpRole,
      password: signUpPassword,
      email: signUpEmail.trim() || undefined,
      phone: signUpPhone.trim() || undefined,
      designation:
        signUpDesignation.trim() ||
        (signUpRole === 'technologist'
          ? 'Medical Lab Technologist'
          : 'Front Desk Officer'),
      isActive: true,
      lastLogin: new Date().toISOString()
    };

    onRegister(newAccount);
    setSignUpSuccess(`Account registered successfully! Welcome, ${newAccount.name}.`);
    setTimeout(() => {
      onLogin(newAccount);
    }, 600);
  };

  const handleQuickLogin = (role: UserRole) => {
    const acc = accounts.find(a => a.role === role && a.isActive);
    if (acc) {
      setLoginUsername(acc.username);
      setLoginPassword(acc.password);
      onLogin(acc);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          label: '1. Administrator Account',
          desc: 'All kinds of access (Settings, Pricing, Catalog, Reports, Billing & Clinical Validation)',
          bg: 'bg-rose-100 text-rose-800 border-rose-200'
        };
      case 'receptionist':
        return {
          label: '2. Reception Account',
          desc: 'Add patients, make invoices, print receipts & print completed reports',
          bg: 'bg-teal-100 text-teal-800 border-teal-200'
        };
      case 'technologist':
      case 'technician':
        return {
          label: '3. Lab Technician Account',
          desc: 'Collect samples, enter results, validate findings & generate report prints',
          bg: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'pathologist':
        return {
          label: 'Consultant Pathologist',
          desc: 'Specimen testing, result validation & clinical impressions',
          bg: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      default:
        return {
          label: role ? String(role) : 'Staff Member',
          desc: 'Authorized clinical laboratory staff member',
          bg: 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-teal-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-lg">
        {/* Top Lab Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-teal-500/20 mb-3 border border-teal-300/40 p-1.5 overflow-hidden">
            <img
              src="/logo.png"
              alt={labName}
              className="w-full h-full object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">{labName}</h1>
          <p className="text-xs text-teal-200/80 font-medium mt-1">
            Clinical Laboratory Information Management System (LIMS)
          </p>
        </div>

        {/* Main Card with Sign In / Sign Up Switch */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 bg-slate-100/80 p-1.5 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setSignInError(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'signin'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignUpError(null);
                setSignUpSuccess(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                authMode === 'signup'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Sign Up (New Account)</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* SIGN IN FORM */}
            {authMode === 'signin' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">Sign In to Your Account</h2>
                  <p className="text-xs text-slate-500">Access laboratory counter, billing, and pathology results</p>
                </div>

                {signInError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{signInError}</span>
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. admin or reception"
                        value={loginUsername}
                        onChange={e => {
                          setLoginUsername(e.target.value);
                          setSignInError(null);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={loginPassword}
                        onChange={e => {
                          setLoginPassword(e.target.value);
                          setSignInError(null);
                        }}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showLoginPassword ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs text-slate-600">Remember session</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className="text-[11px] text-teal-700 font-bold hover:underline"
                    >
                      Need an account? Sign Up
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    <span>Sign In to System</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>

                {/* Quick 1-Click Role Login for instant testing */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Instant 1-Click Role Login
                    </span>
                    <span className="text-[10px] text-teal-700 font-semibold">Select an account below</span>
                  </div>

                  <div className="space-y-2">
                    {accounts.map(acc => {
                      const badge = getRoleBadge(acc.role);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleQuickLogin(acc.role)}
                          className="w-full flex items-start justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all text-left group"
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge?.bg || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                                {badge?.label || 'Staff Account'}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{acc.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {badge?.desc || 'Authorized Clinical Staff'}
                            </p>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                              Login: <strong className="text-slate-700">{acc.username}</strong> / Password: <strong className="text-slate-700">{acc.password}</strong>
                            </div>
                          </div>
                          <div className="pt-1 text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform shrink-0 text-sm">
                            →
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <div>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-slate-900">Sign Up / Register Staff Account</h2>
                  <p className="text-xs text-slate-500">Create an Administrator, Reception, or Lab Technician account</p>
                </div>

                {signUpError && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{signUpError}</span>
                  </div>
                )}

                {signUpSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{signUpSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Hamza Malik or Sadia Bibi"
                      value={signUpName}
                      onChange={e => setSignUpName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. drhamza"
                        value={signUpUsername}
                        onChange={e => setSignUpUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Role / Privilege *
                      </label>
                      <select
                        value={signUpRole}
                        onChange={e => setSignUpRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      >
                        <option value="receptionist">2. Reception (Patients, Invoices, Print Reports)</option>
                        <option value="technologist">3. Lab Technician (Collect Samples, Results, Validate)</option>
                        <option value="admin">1. Administrator (Full System Access)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="staff@lab.pk"
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Phone / Mobile
                      </label>
                      <input
                        type="text"
                        placeholder="0300-1234567"
                        value={signUpPhone}
                        onChange={e => setSignUpPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Professional Qualification / Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MBBS, M.Phil or B.Sc Medical Lab Tech"
                      value={signUpDesignation}
                      onChange={e => setSignUpDesignation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Password *
                      </label>
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 4 chars"
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={signUpConfirmPassword}
                        onChange={e => setSignUpConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showSignUpPassword}
                        onChange={e => setShowSignUpPassword(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-slate-600">Show passwords</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signin')}
                      className="text-teal-700 font-bold hover:underline"
                    >
                      Already have an account? Sign In
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded-xl shadow-md shadow-teal-600/20 transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Create Account & Sign In</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>{labName} · Compliant with ISO 15189 & PHC Regulations</p>
          <p className="text-[10px] text-slate-500 mt-1">Ready for live patient booking & lab processing</p>
        </div>
      </div>
    </div>
  );
};
