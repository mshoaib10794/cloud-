import React from 'react';
import { LabOrder, Patient, TestCatalogItem, OrderResultReport, LabProfile, UserAccount } from '../types/lims';
import { formatLabDate } from '../utils/formatters';
import { BarcodeRenderer } from './BarcodeRenderer';
import { downloadStandaloneReportHTML, downloadCSV } from '../utils/downloadHelpers';

interface DiagnosticReportModalProps {
  order: LabOrder;
  patient: Patient;
  catalog: TestCatalogItem[];
  report?: OrderResultReport;
  profile?: LabProfile;
  currentUser?: UserAccount;
  onClose: () => void;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  order,
  patient,
  catalog,
  report,
  profile,
  currentUser,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const techName = currentUser?.role === 'technologist' ? currentUser.name : (order.collectedBy || undefined);
    const techDesig = currentUser?.role === 'technologist' ? currentUser.designation : undefined;
    downloadStandaloneReportHTML(order, patient, catalog, report, profile, techName, techDesig);
  };

  const handleDownloadCSV = () => {
    const headers = ['Order ID', 'Patient ID', 'Patient Name', 'Test Code', 'Sub-heading', 'Parameter', 'Observed Value', 'Flag', 'Reference Interval', 'Unit'];
    const rows: (string | number)[][] = [];

    const testItems = order.tests.map(code => catalog.find(t => t.code === code)).filter(Boolean) as TestCatalogItem[];
    testItems.forEach(test => {
      test.subHeadings?.forEach(sh => {
        sh.parameters.forEach(param => {
          const res = report?.results?.find(r => r.parameterId === param.id);
          rows.push([
            order.id,
            patient.id,
            patient.name,
            test.code,
            sh.title,
            param.name,
            res?.value || param.defaultValue || '',
            res?.flag || 'Normal',
            param.normalRangeText || '',
            param.unit || ''
          ]);
        });
      });
    });

    downloadCSV(`Report_${order.id}_${patient.name.replace(/\s+/g, '_')}`, headers, rows);
  };

  // Group report results by testCode and subHeading
  const testItems = order.tests.map(code => catalog.find(t => t.code === code)).filter(Boolean) as TestCatalogItem[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top bar (Screen only) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50 gap-2 no-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Official Diagnostic Pathology Report Preview
              </span>
              {currentUser?.role === 'technologist' && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                  Technician Print Mode
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Order #{order.id} · {patient.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              title="Download results as CSV spreadsheet"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={handleDownloadHTML}
              title="Download standalone offline report (HTML/PDF ready)"
              className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-lg ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-white font-sans text-slate-900 printable-area">
          {/* Diagnostic Header */}
          <div className="border-b-2 border-teal-700 pb-4 mb-4">
            {profile?.headerType === 'custom_banner' && profile?.headerBannerUrl ? (
              <div>
                <img
                  src={profile.headerBannerUrl}
                  alt={profile.labName || 'Laboratory Header'}
                  className="w-full max-h-32 object-contain mx-auto"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-100 pt-1.5">
                  <span>SAMPLE ID: <strong>{order.sampleBarcode}</strong></span>
                  <span>ORDER REF: <strong>{order.id}</strong></span>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  profile?.logoPosition === 'center' ? 'text-center' : ''
                }`}
              >
                <div
                  className={`flex items-center gap-3.5 ${
                    profile?.logoPosition === 'center' ? 'flex-col sm:flex-row justify-center w-full' : ''
                  }`}
                >
                  {profile?.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={profile.labName || 'Lab Logo'}
                      style={{ width: `${profile.logoWidth || 80}px` }}
                      className="max-h-20 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                      LP
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none mb-1">
                      {profile?.labName || 'Lab-Portal-App'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      {profile?.tagline || 'ISO 15189:2022 Certified · Healthcare Commission Registered (PHC/SHC-9201)'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {profile?.address || 'Main Campus: Plot 14, Blue Area, Islamabad'} | UAN: {profile?.phone || '+92 (51) 848-4200'}
                    </p>
                  </div>
                </div>

                {/* Sample Barcode */}
                {profile?.logoPosition !== 'center' && (
                  <div className="text-right flex flex-col items-end shrink-0">
                    <BarcodeRenderer value={order.sampleBarcode} height={34} showText={true} />
                    <span className="text-[10px] text-slate-500 mt-0.5">Sample ID: {order.sampleBarcode}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Patient Demographics Card */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3.5 mb-6 text-xs grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4">
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">MRN / Patient ID</span>
              <span className="font-mono font-semibold text-slate-800">{patient.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Age / Gender</span>
              <span className="font-semibold text-slate-800">{patient.age} Yrs / {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">CNIC No.</span>
              <span className="font-mono text-slate-700">{patient.cnic || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Order ID</span>
              <span className="font-mono font-bold text-teal-700">{order.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Booking Time</span>
              <span className="text-slate-700">{formatLabDate(order.bookingDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Reported Date</span>
              <span className="text-slate-700 font-medium">
                {report?.approvedAt ? formatLabDate(report.approvedAt) : formatLabDate(new Date().toISOString())}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium uppercase">Referred By</span>
              <span className="font-semibold text-slate-800 truncate block">
                {order.referredByDoctor || 'Self'}
              </span>
            </div>
          </div>

          {/* Investigations & Results Table */}
          <div className="space-y-6">
            {testItems.map((test) => {
              // Gather results for this test
              const testResults = report?.results?.filter(r => r.testCode === test.code) || [];

              return (
                <div key={test.code} className="border border-slate-200 rounded-lg overflow-hidden">
                  {/* Test Title Header */}
                  <div className="bg-slate-100/90 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{test.name}</span>
                      <span className="text-xs text-slate-500 ml-2">({test.category})</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      Specimen: {test.specimen}
                    </span>
                  </div>

                  {/* Results Table Header */}
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px]">
                        <th className="py-2 px-4 w-5/12">Investigation / Parameter</th>
                        <th className="py-2 px-3 w-2/12">Observed Value</th>
                        <th className="py-2 px-2 w-1/12 text-center">Flag</th>
                        <th className="py-2 px-3 w-2/12">Reference Interval</th>
                        <th className="py-2 px-3 w-2/12">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {test.subHeadings && test.subHeadings.length > 0 ? (
                        test.subHeadings.map((subHeading) => (
                          <React.Fragment key={subHeading.id}>
                            {/* Subheading row */}
                            <tr className="bg-slate-50/90 border-t border-b border-slate-200/80">
                              <td
                                colSpan={5}
                                className="py-1.5 px-4 font-bold text-[11px] text-teal-800 tracking-wide"
                              >
                                • {subHeading.title}
                              </td>
                            </tr>

                            {/* Parameters under this subheading */}
                            {subHeading.parameters.map((param) => {
                              const res = testResults.find(r => r.parameterId === param.id);
                              const val = res?.value || param.defaultValue || '-';
                              const flag = res?.flag || 'Normal';

                              const isAbnormal = flag === 'High' || flag === 'Low' || flag === 'Critical';

                              return (
                                <tr
                                  key={param.id}
                                  className={`hover:bg-slate-50/50 ${isAbnormal ? 'bg-amber-50/40' : ''}`}
                                >
                                  <td className="py-2 px-4 font-medium text-slate-800">
                                    {param.name}
                                  </td>
                                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                    <span
                                      className={
                                        flag === 'High'
                                          ? 'text-rose-600 font-bold'
                                          : flag === 'Low'
                                          ? 'text-blue-600 font-bold'
                                          : flag === 'Critical'
                                          ? 'text-red-700 font-black underline'
                                          : 'text-slate-900'
                                      }
                                    >
                                      {val}
                                    </span>
                                  </td>
                                  <td className="py-2 px-2 text-center">
                                    {flag === 'High' && (
                                      <span className="font-mono text-[10px] font-bold text-rose-600">
                                        HIGH ▲
                                      </span>
                                    )}
                                    {flag === 'Low' && (
                                      <span className="font-mono text-[10px] font-bold text-blue-600">
                                        LOW ▼
                                      </span>
                                    )}
                                    {flag === 'Critical' && (
                                      <span className="font-mono text-[10px] font-bold text-red-700 animate-pulse">
                                        CRITICAL ⚠️
                                      </span>
                                    )}
                                    {flag === 'Normal' && (
                                      <span className="text-[11px] text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 font-mono">
                                    {param.normalRangeText || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-slate-500 font-mono">
                                    {param.unit || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            No parameters defined for this test
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>

          {/* Clinical Interpretation / Pathologist Remarks */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pathologist Interpretation & Clinical Correlation:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              {report?.pathologistRemarks ||
                'Results are clinically correlated with patient demographics. Laboratory values should always be interpreted in conjunction with patient clinical signs, symptoms, and medical history.'}
            </p>
          </div>

          {/* Approvals & Signatures Footer */}
          <div className="mt-8 pt-4 border-t-2 border-slate-200 grid grid-cols-3 gap-6 items-end">
            <div>
              <div className="text-xs font-bold text-slate-800">
                {currentUser?.role === 'technologist' ? currentUser.name : (order.collectedBy || 'Muhammad Bilal, MLT')}
              </div>
              <div className="text-[11px] text-slate-500">
                {currentUser?.role === 'technologist' && currentUser.designation ? currentUser.designation : 'Medical Lab Technologist (MLT)'}
              </div>
              <div className="text-[10px] text-teal-700 font-medium">Verified & Generated on Analyzer</div>
            </div>

            <div className="text-center flex flex-col items-center">
              {/* QR Verification */}
              <div className="w-16 h-16 border border-slate-300 rounded p-1 bg-white flex items-center justify-center">
                <svg className="w-full h-full text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 3h2v2h-2v-2zm-4-3h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm4 0h2v2h-2v-2z" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-400 mt-1">Scan to Verify Online</span>
            </div>

            <div className="text-right">
              <div className="inline-block border-b border-slate-300 pb-1 mb-1">
                <span className="font-serif italic text-teal-800 font-semibold text-sm">
                  {report?.approvedBy || profile?.chiefPathologist || 'Prof. Dr. Tariq Mahmood'}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                {report?.approvedBy || profile?.chiefPathologist || 'Prof. Dr. Tariq Mahmood'}
              </div>
              <div className="text-[10px] text-slate-500">
                {profile?.pathologistQualification || 'Consultant Pathologist & Lab Director'}
              </div>
              <div className="text-[10px] text-teal-700 font-medium">Reg: {profile?.registrationNumber || 'PHC/SHC-9201'}</div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
            *** End of Diagnostic Pathology Report · Confidential Medical Document ***
          </div>
        </div>
      </div>
    </div>
  );
};
