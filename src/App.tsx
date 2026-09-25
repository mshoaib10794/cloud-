/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  INITIAL_TEST_CATALOG,
  INITIAL_PATIENTS,
  INITIAL_ORDERS,
  INITIAL_REPORTS
} from './data/initialCatalog';
import {
  Patient,
  LabOrder,
  TestCatalogItem,
  OrderResultReport,
  SampleStatus,
  PaymentMethod,
  LabProfile,
  UserAccount,
  INITIAL_STAFF_ACCOUNTS
} from './types/lims';
import { DashboardOverview } from './components/DashboardOverview';
import { PatientsView } from './components/PatientsView';
import { LabOrdersView } from './components/LabOrdersView';
import { BillingView } from './components/BillingView';
import { TestCatalogView } from './components/TestCatalogView';
import { TestResultsView } from './components/TestResultsView';
import { NewOrderModal } from './components/NewOrderModal';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';
import { BillingReceiptModal } from './components/BillingReceiptModal';
import { LabSettingsModal } from './components/LabSettingsModal';
import { LoginView } from './components/LoginView';
import { StaffManagementModal } from './components/StaffManagementModal';

type NavTab = 'dashboard' | 'patients' | 'orders' | 'billing' | 'catalog' | 'results';

const DEFAULT_LAB_PROFILE: LabProfile = {
  labName: 'Lab-Portal-App',
  tagline: 'ISO 15189:2022 Certified · Healthcare Commission Registered (PHC/SHC-9201)',
  phone: '+92 42 3588 9100 / 0300-1234567',
  email: 'info@lab-portal-app.pk',
  address: 'Suite #4B, Main Boulevard, Gulberg III, Lahore, Pakistan',
  registrationNumber: 'PHC-LAB-9201',
  chiefPathologist: 'Prof. Dr. Tariq Mahmood',
  pathologistQualification: 'MBBS, M.Phil (Pathology), FRCPath · PMDC #18290-P',
  headerType: 'standard',
  logoPosition: 'left',
  logoWidth: 80,
  logoUrl: '/logo.png',
  websiteUrl: 'https://lab-portal-app.pk'
};

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [importNotification, setImportNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence in LocalStorage with safe JSON parsing
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('hcloud_patients');
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  const [orders, setOrders] = useState<LabOrder[]>(() => {
    try {
      const saved = localStorage.getItem('hcloud_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [catalog, setCatalog] = useState<TestCatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('hcloud_catalog');
      return saved ? JSON.parse(saved) : INITIAL_TEST_CATALOG;
    } catch {
      return INITIAL_TEST_CATALOG;
    }
  });

  const [reports, setReports] = useState<OrderResultReport[]>(() => {
    try {
      const saved = localStorage.getItem('hcloud_reports');
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [labProfile, setLabProfile] = useState<LabProfile>(() => {
    try {
      const saved = localStorage.getItem('hcloud_lab_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.labName || parsed.labName.toLowerCase() === 'hcloud diagnostics & clinical lab' || parsed.labName.toLowerCase() === 'hcloud diagnostics' || parsed.labName.toLowerCase() === 'lab-portal-app') {
          parsed.labName = 'Lab-Portal-App';
        }
        if (!parsed.email || parsed.email.includes('hcloud') || parsed.email.includes('labportal.pk')) {
          parsed.email = 'info@lab-portal-app.pk';
        }
        if (!parsed.logoUrl || parsed.logoUrl.includes('placeholder')) {
          parsed.logoUrl = '/logo.png';
        }
        return parsed;
      }
      return DEFAULT_LAB_PROFILE;
    } catch {
      return DEFAULT_LAB_PROFILE;
    }
  });

  // Staff Accounts & Authentication
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('hcloud_staff_accounts');
      if (!saved) return INITIAL_STAFF_ACCOUNTS;
      const parsed: any[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_STAFF_ACCOUNTS;
      return parsed.map(acc => ({
        ...acc,
        role: acc.role === 'pathologist' ? 'technologist' : acc.role
      }));
    } catch {
      return INITIAL_STAFF_ACCOUNTS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('hcloud_current_user');
      if (!saved) return INITIAL_STAFF_ACCOUNTS[0];
      const parsed: any = JSON.parse(saved);
      if (!parsed || !parsed.id) return INITIAL_STAFF_ACCOUNTS[0];
      return {
        ...parsed,
        role: parsed.role === 'pathologist' ? 'technologist' : parsed.role
      };
    } catch {
      return INITIAL_STAFF_ACCOUNTS[0];
    }
  });

  const [showStaffModal, setShowStaffModal] = useState(false);

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('hcloud_staff_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.error('Failed to save staff accounts', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('hcloud_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('hcloud_current_user');
      }
    } catch (e) {
      console.error('Failed to save current user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('hcloud_patients', JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patients', e);
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('hcloud_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('hcloud_catalog', JSON.stringify(catalog));
    } catch (e) {
      console.error('Failed to save catalog', e);
    }
  }, [catalog]);

  useEffect(() => {
    try {
      localStorage.setItem('hcloud_reports', JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports', e);
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem('hcloud_lab_profile', JSON.stringify(labProfile));
    } catch (e) {
      console.error('Failed to save lab profile', e);
    }
  }, [labProfile]);

  // Global Modals State
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeReportOrder, setActiveReportOrder] = useState<LabOrder | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LabOrder | null>(null);

  // Handlers for Orders & Patients
  const handleSaveNewOrder = (newOrder: LabOrder, newPatient?: Patient) => {
    if (newPatient) {
      setPatients(prev => [newPatient, ...prev]);
    }
    setOrders(prev => [newOrder, ...prev]);
    setActiveReceiptOrder(newOrder);
  };

  const handleAddPatient = (newPatient: Patient) => {
    setPatients(prev => [newPatient, ...prev]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleUpdateOrderStatus = (orderId: string, status: SampleStatus, collectedBy?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          sampleStatus: status,
          collectedBy: collectedBy || o.collectedBy,
          collectedAt: status === 'Sample Collected' ? new Date().toISOString() : o.collectedAt
        };
      })
    );
  };

  const handleUpdatePayment = (orderId: string, paidAmount: number, paymentMethod: PaymentMethod) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const newPaid = paidAmount;
        let pStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
        if (newPaid >= o.netAmount) {
          pStatus = 'Paid';
        } else if (newPaid > 0) {
          pStatus = 'Partial';
        }
        return {
          ...o,
          paidAmount: newPaid,
          paymentStatus: pStatus,
          paymentMethod
        };
      })
    );

    if (activeReceiptOrder && activeReceiptOrder.id === orderId) {
      setActiveReceiptOrder(prev => {
        if (!prev) return null;
        let pStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
        if (paidAmount >= prev.netAmount) pStatus = 'Paid';
        else if (paidAmount > 0) pStatus = 'Partial';
        return {
          ...prev,
          paidAmount,
          paymentStatus: pStatus,
          paymentMethod
        };
      });
    }
  };

  // Test Catalog Handlers
  const handleAddTest = (newTest: TestCatalogItem) => {
    setCatalog(prev => [...prev, newTest]);
  };

  const handleUpdateTest = (updatedTest: TestCatalogItem) => {
    setCatalog(prev => prev.map(t => t.code === updatedTest.code ? updatedTest : t));
  };

  const handleDeleteTest = (code: string) => {
    setCatalog(prev => prev.filter(t => t.code !== code));
  };

  // Reports Handlers
  const handleSaveReport = (savedReport: OrderResultReport) => {
    setReports(prev => {
      const existingIdx = prev.findIndex(r => r.orderId === savedReport.orderId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = savedReport;
        return next;
      }
      return [...prev, savedReport];
    });

    if (savedReport.isApproved) {
      handleUpdateOrderStatus(savedReport.orderId, 'Completed');
    }
  };

  // Import Backup Handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.patients && Array.isArray(data.patients)) setPatients(data.patients);
        if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
        if (data.catalog && Array.isArray(data.catalog)) setCatalog(data.catalog);
        if (data.reports && Array.isArray(data.reports)) setReports(data.reports);
        if (data.labProfile) setLabProfile(data.labProfile);
        if (data.accounts && Array.isArray(data.accounts)) setAccounts(data.accounts);

        setImportNotification(`✓ Successfully restored database from backup (${data.patients?.length || 0} patients, ${data.orders?.length || 0} orders)!`);
        setTimeout(() => setImportNotification(null), 5000);
      } catch (err) {
        setImportNotification('⚠ Failed to import backup file: Invalid JSON structure.');
        setTimeout(() => setImportNotification(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    setAccounts(prev => prev.map(a => a.id === user.id ? { ...a, lastLogin: new Date().toISOString() } : a));
  };

  const handleRegister = (newUser: UserAccount) => {
    setAccounts(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setShowStaffModal(false);
  };

  const handleAddStaff = (newStaff: UserAccount) => {
    setAccounts(prev => [newStaff, ...prev]);
  };

  const handleToggleStaffStatus = (userId: string) => {
    setAccounts(prev => prev.map(a => a.id === userId ? { ...a, isActive: !a.isActive } : a));
  };

  // Reset to Demo Data
  const handleResetData = () => {
    if (confirm('Reset system to default sample data? All newly added orders/patients will be reset.')) {
      setPatients(INITIAL_PATIENTS);
      setOrders(INITIAL_ORDERS);
      setCatalog(INITIAL_TEST_CATALOG);
      setReports(INITIAL_REPORTS);
      setLabProfile(DEFAULT_LAB_PROFILE);
      setAccounts(INITIAL_STAFF_ACCOUNTS);
      setCurrentUser(INITIAL_STAFF_ACCOUNTS[0]);
      localStorage.clear();
    }
  };

  // If user is not logged in, show the Sign In / Sign Up Screen
  if (!currentUser) {
    return (
      <LoginView
        accounts={accounts}
        onLogin={handleLogin}
        onRegister={handleRegister}
        labName={labProfile.labName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between no-print">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5">
          <img
            src={labProfile.logoUrl || '/logo.png'}
            alt={labProfile.labName || 'Lab-Portal-App'}
            className="h-9 w-9 object-contain rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 hover:text-teal-700 transition-colors text-left"
          >
            {labProfile.labName || 'Lab-Portal-App'}
          </button>
          <span className="hidden md:inline-block text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-medium">
            Lab-Portal-App
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'dashboard' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('patients')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'patients' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            1. Patients ({patients.length})
          </button>
          <button
            onClick={() => setCurrentTab('orders')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'orders' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            4. Lab Orders & Barcodes ({orders.length})
          </button>
          <button
            onClick={() => setCurrentTab('billing')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'billing' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            2. Billing (PKR)
          </button>
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'catalog' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            3. Test Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setCurrentTab('results')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentTab === 'results' ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            5. Test Results
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for Backup Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import/Restore database from a previous JSON backup"
            className="hidden md:flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>

          <button
            onClick={() => {
              const fullBackup = {
                exportDate: new Date().toISOString(),
                system: 'Lab-Portal-App Clinical LIMS',
                patients,
                orders,
                catalog,
                reports,
                labProfile,
                accounts
              };
              const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Lab_Portal_App_Backup_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            title="Download full database backup (JSON)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup
          </button>

          {currentUser.role === 'admin' ? (
            <button
              onClick={() => setShowSettingsModal(true)}
              title="Admin: Configure Laboratory Profile, Custom Logo & Letterhead Header"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-lg shadow-2xs transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Branding & Logo</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSettingsModal(true)}
              title="View Laboratory Profile & Settings"
              className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* Current Staff Account & Switcher */}
          <button
            onClick={() => setShowStaffModal(true)}
            title={`Logged in: ${currentUser.name} (${currentUser.role}). Click to view or switch account.`}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-white transition-all text-left"
          >
            <div className="w-6 h-6 rounded-md bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden xl:block leading-tight">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                {currentUser.name.split(' ')[0]} {currentUser.name.split(' ')[1] || ''}
              </div>
              <div className="text-[9px] text-teal-700 font-bold uppercase tracking-wider">
                {currentUser.role}
              </div>
            </div>
          </button>

          {/* Direct Sign Out button */}
          <button
            onClick={handleSignOut}
            title={`Sign Out (${currentUser.name})`}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="px-3 sm:px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Lab Order</span>
            <span className="sm:hidden">Order</span>
          </button>
          <button
            onClick={handleResetData}
            title="Reset to default demo data"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      {/* Import Notification Banner */}
      {importNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between no-print">
          <span>{importNotification}</span>
          <button onClick={() => setImportNotification(null)} className="text-white hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-1.5 text-xs font-medium no-print">
        {(['dashboard', 'patients', 'orders', 'billing', 'catalog', 'results'] as NavTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              currentTab === tab
                ? 'bg-teal-700 text-white font-bold'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            {tab === 'dashboard' ? 'Overview' : tab === 'catalog' ? '3. Catalog' : tab === 'billing' ? '2. Billing' : tab === 'orders' ? '4. Orders' : tab === 'patients' ? '1. Patients' : '5. Results'}
          </button>
        ))}
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <DashboardOverview
            orders={orders}
            patients={patients}
            catalog={catalog}
            reports={reports}
            currentUser={currentUser}
            profile={labProfile}
            onOpenSettings={() => setShowSettingsModal(true)}
            onOpenNewOrder={() => setShowNewOrderModal(true)}
            onOpenNewPatient={() => setCurrentTab('patients')}
            onNavigateTab={(tab) => setCurrentTab(tab as NavTab)}
            onViewReceipt={(order) => setActiveReceiptOrder(order)}
            onViewReport={(order) => setActiveReportOrder(order)}
            onEnterResults={(order) => {
              setCurrentTab('results');
            }}
          />
        )}

        {currentTab === 'patients' && (
          <PatientsView
            patients={patients}
            orders={orders}
            catalog={catalog}
            reports={reports}
            currentUser={currentUser}
            onAddPatient={handleAddPatient}
            onUpdatePatient={handleUpdatePatient}
            onBookOrderForPatient={(patient) => {
              setShowNewOrderModal(true);
            }}
            onViewOrderReceipt={(order) => setActiveReceiptOrder(order)}
            onViewOrderReport={(order) => setActiveReportOrder(order)}
          />
        )}

        {currentTab === 'orders' && (
          <LabOrdersView
            orders={orders}
            patients={patients}
            catalog={catalog}
            reports={reports}
            currentUser={currentUser}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onOpenNewOrder={() => setShowNewOrderModal(true)}
            onViewReceipt={(order) => setActiveReceiptOrder(order)}
            onViewReport={(order) => setActiveReportOrder(order)}
            onEnterResults={(order) => {
              setCurrentTab('results');
            }}
          />
        )}

        {currentTab === 'billing' && (
          <BillingView
            orders={orders}
            patients={patients}
            catalog={catalog}
            currentUser={currentUser}
            onUpdatePayment={handleUpdatePayment}
            onViewReceipt={(order) => setActiveReceiptOrder(order)}
            onViewReport={(order) => setActiveReportOrder(order)}
          />
        )}

        {currentTab === 'catalog' && (
          <TestCatalogView
            catalog={catalog}
            currentUser={currentUser}
            onAddTest={handleAddTest}
            onUpdateTest={handleUpdateTest}
            onDeleteTest={handleDeleteTest}
          />
        )}

        {currentTab === 'results' && (
          <TestResultsView
            orders={orders}
            patients={patients}
            catalog={catalog}
            reports={reports}
            currentUser={currentUser}
            onSaveReport={handleSaveReport}
            onViewDiagnosticReport={(order) => setActiveReportOrder(order)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <div>
            <span className="font-semibold text-slate-700">{labProfile.labName || 'Lab-Portal-App'} · Clinical LIMS</span> · All amounts in Pakistani Rupees (PKR)
          </div>
          <div className="text-[11px] text-slate-400">
            Compliant with Healthcare Commission Guidelines & ISO 15189 Standards
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {showNewOrderModal && (
        <NewOrderModal
          patients={patients}
          catalog={catalog}
          onSaveOrder={handleSaveNewOrder}
          onClose={() => setShowNewOrderModal(false)}
        />
      )}

      {/* Diagnostic Report Printable Modal */}
      {activeReportOrder && (
        <DiagnosticReportModal
          order={activeReportOrder}
          patient={patients.find(p => p.id === activeReportOrder.patientId) || {
            id: activeReportOrder.patientId,
            name: 'Patient',
            age: 30,
            gender: 'Male',
            phone: '0300-0000000',
            cnic: '',
            address: '',
            createdAt: ''
          }}
          catalog={catalog}
          report={reports.find(r => r.orderId === activeReportOrder.id)}
          profile={labProfile}
          currentUser={currentUser || undefined}
          onClose={() => setActiveReportOrder(null)}
        />
      )}

      {/* Billing Receipt & Invoice Modal */}
      {activeReceiptOrder && (
        <BillingReceiptModal
          order={activeReceiptOrder}
          patient={patients.find(p => p.id === activeReceiptOrder.patientId) || {
            id: activeReceiptOrder.patientId,
            name: 'Patient',
            age: 30,
            gender: 'Male',
            phone: '0300-0000000',
            cnic: '',
            address: '',
            createdAt: ''
          }}
          catalog={catalog}
          profile={labProfile}
          onUpdatePayment={handleUpdatePayment}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {/* Lab Settings Modal */}
      {showSettingsModal && (
        <LabSettingsModal
          profile={labProfile}
          currentUser={currentUser}
          onSave={(newProfile) => setLabProfile(newProfile)}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Staff Management & Account Modal */}
      {showStaffModal && currentUser && (
        <StaffManagementModal
          currentUser={currentUser}
          accounts={accounts}
          onAddStaff={handleAddStaff}
          onToggleStaffStatus={handleToggleStaffStatus}
          onSwitchAccount={(user) => {
            setCurrentUser(user);
          }}
          onSignOut={handleSignOut}
          onClose={() => setShowStaffModal(false)}
        />
      )}
    </div>
  );
}
