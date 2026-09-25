import React, { useState, useRef } from 'react';
import { LabProfile, UserAccount } from '../types/lims';

interface LabSettingsModalProps {
  profile: LabProfile;
  currentUser?: UserAccount;
  onSave: (profile: LabProfile) => void;
  onClose: () => void;
}

// Built-in professional medical sample logos (SVG Data URIs) for quick 1-click preview
const SAMPLE_LOGOS = [
  {
    name: 'Emerald Medical Shield',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%230f766e"/><path d="M50 16 C68 28, 80 30, 80 48 C80 70, 50 86, 50 86 C50 86, 20 70, 20 48 C20 30, 32 28, 50 16 Z" fill="%2314b8a6"/><path d="M50 32 V62 M35 47 H65" stroke="white" stroke-width="8" stroke-linecap="round"/></svg>'
  },
  {
    name: 'Clinical DNA Helix',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="48" fill="%230284c7"/><path d="M30 30 Q50 45 70 30 M30 50 Q50 65 70 50 M30 70 Q50 85 70 70" stroke="white" stroke-width="6" stroke-linecap="round"/><circle cx="50" cy="50" r="12" fill="%2338bdf8"/></svg>'
  },
  {
    name: 'Diagnostic Health Cross',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="22" fill="%23dc2626"/><rect x="40" y="20" width="20" height="60" rx="6" fill="white"/><rect x="20" y="40" width="60" height="20" rx="6" fill="white"/></svg>'
  },
  {
    name: 'Microscope Research Crest',
    dataUri:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="20" fill="%231e293b"/><circle cx="50" cy="50" r="36" stroke="%232dd4bf" stroke-width="4"/><path d="M50 25 V45 M40 45 H60 M45 45 L38 65 H62 L55 45" stroke="white" stroke-width="5" stroke-linecap="round"/><rect x="35" y="68" width="30" height="7" rx="3" fill="%232dd4bf"/></svg>'
  }
];

export const LabSettingsModal: React.FC<LabSettingsModalProps> = ({
  profile,
  currentUser,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'logo-header' | 'info' | 'pathologist'>('logo-header');
  const [formData, setFormData] = useState<LabProfile>({
    headerType: 'standard',
    logoPosition: 'left',
    logoWidth: 80,
    ...profile
  });

  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Handle Logo file upload (Convert to base64 data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit to max 2MB before client compression
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size is too large (max 2MB). Please select a smaller logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({
        ...prev,
        logoUrl: result
      }));
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Header Banner Graphic upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file for the header banner.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({
        ...prev,
        headerBannerUrl: result,
        headerType: 'custom_banner'
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              ⚙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Laboratory Branding & Header Settings
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Customise manual logo, letterhead banner, and official lab credentials for reports and invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('logo-header')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'logo-header'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>1. Custom Logo & Header Options</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'info'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>2. Clinic Info & Contact</span>
          </button>

          <button
            onClick={() => setActiveTab('pathologist')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'pathologist'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>3. Pathologist Signature</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl font-semibold flex items-center gap-2">
              <span className="text-base">✓</span>
              <span>Lab Profile & Custom Branding updated successfully! Changes applied across all reports and invoices.</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl font-semibold">
              {uploadError}
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl font-medium">
              Note: You are logged in as <strong>{currentUser?.name}</strong> ({currentUser?.role}). Only Administrator accounts can alter clinic branding and diagnostic letterheads.
            </div>
          )}

          {/* TAB 1: LOGO & HEADER SETTINGS */}
          {activeTab === 'logo-header' && (
            <div className="space-y-6">
              {/* Header Style Mode */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="block text-slate-800 font-bold mb-2">
                  Header Style for Diagnostic Reports & Invoices:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.headerType !== 'custom_banner'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headerType"
                      value="standard"
                      checked={formData.headerType !== 'custom_banner'}
                      onChange={() => setFormData({ ...formData, headerType: 'standard' })}
                      className="mt-0.5 text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Standard Letterhead with Logo</div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-tight">
                        Displays custom logo alongside clinic name, address, phone, and ISO/PHC certification.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.headerType === 'custom_banner'
                        ? 'border-teal-600 bg-white ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 bg-white/60 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headerType"
                      value="custom_banner"
                      checked={formData.headerType === 'custom_banner'}
                      onChange={() => setFormData({ ...formData, headerType: 'custom_banner' })}
                      className="mt-0.5 text-teal-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Full-Width Graphic Letterhead Banner</div>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-tight">
                        Upload your pre-designed letterhead graphic image across the full top of printed documents.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* LOGO CUSTOMIZATION (When in standard mode) */}
              {formData.headerType !== 'custom_banner' && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Laboratory Logo</h4>
                        <p className="text-slate-500 text-xs">
                          Upload your laboratory logo (PNG, JPG, SVG). Appears on reports, receipts & navbar.
                        </p>
                      </div>
                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                          className="px-2.5 py-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                    />

                    {/* Logo upload and preview area */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                      {/* Logo Preview Box */}
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-2 shrink-0 overflow-hidden relative group">
                        {formData.logoUrl ? (
                          <img
                            src={formData.logoUrl}
                            alt="Lab Logo Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400">
                            <span className="text-2xl block">🖼️</span>
                            <span className="text-[10px] font-semibold">No Logo</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons & URL input */}
                      <div className="flex-1 space-y-2.5 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Upload Logo Image</span>
                          </button>

                          <span className="text-slate-400 font-mono text-[11px]">or enter URL below</span>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="https://example.com/logo.png or data:image/..."
                            value={formData.logoUrl || ''}
                            onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-teal-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Preset Samples */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600 block mb-2">
                        Quick 1-Click Medical Sample Logos:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {SAMPLE_LOGOS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormData({ ...formData, logoUrl: sample.dataUri })}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                              formData.logoUrl === sample.dataUri
                                ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-500'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={sample.dataUri}
                              alt={sample.name}
                              className="w-7 h-7 object-contain shrink-0"
                            />
                            <span className="text-[10px] font-semibold text-slate-800 leading-tight">
                              {sample.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Display Tuning: Size & Position */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Logo Size on Reports:
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { label: 'Small (60px)', val: 60 },
                            { label: 'Medium (80px)', val: 80 },
                            { label: 'Large (110px)', val: 110 }
                          ].map(s => (
                            <button
                              key={s.val}
                              type="button"
                              onClick={() => setFormData({ ...formData, logoWidth: s.val })}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                formData.logoWidth === s.val
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Logo Position:
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { label: 'Left Aligned', val: 'left' as const },
                            { label: 'Centered', val: 'center' as const }
                          ].map(p => (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() => setFormData({ ...formData, logoPosition: p.val })}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                                formData.logoPosition === p.val
                                  ? 'bg-teal-600 text-white border-teal-600'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FULL WIDTH BANNER UPLOAD (When in banner mode) */}
              {formData.headerType === 'custom_banner' && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Full-Width Header Graphic Banner</h4>
                      <p className="text-slate-500 text-xs">
                        Upload your clinic's designed letterhead header banner (Recommended: 800x120px to 1000x180px PNG/JPG)
                      </p>
                    </div>
                    {formData.headerBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, headerBannerUrl: undefined })}
                        className="px-2.5 py-1 text-[11px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold"
                      >
                        Remove Banner
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Banner Preview Box */}
                  <div className="w-full h-28 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-2">
                    {formData.headerBannerUrl ? (
                      <img
                        src={formData.headerBannerUrl}
                        alt="Header Banner Preview"
                        className="max-h-full w-auto object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <span className="text-2xl block">🖼️</span>
                        <span className="text-xs font-semibold">No Header Banner Uploaded</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Click below to upload your custom clinic letterhead banner graphic
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Upload Banner Image</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Or enter Banner Image URL..."
                      value={formData.headerBannerUrl || ''}
                      onChange={e => setFormData({ ...formData, headerBannerUrl: e.target.value })}
                      className="flex-1 min-w-[200px] px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-teal-600"
                    />
                  </div>
                </div>
              )}

              {/* LIVE LETTERHEAD PREVIEW BOX */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span>👁️</span> Real-time Letterhead Header Preview (A4 Report)
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold font-mono">
                    Live WYSIWYG
                  </span>
                </div>

                <div className="p-4 sm:p-6 bg-white">
                  {formData.headerType === 'custom_banner' && formData.headerBannerUrl ? (
                    <div className="border-b-2 border-teal-700 pb-3 mb-3">
                      <img
                        src={formData.headerBannerUrl}
                        alt="Header Banner"
                        className="w-full max-h-28 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border-b-2 border-teal-700 pb-4 mb-3">
                      <div
                        className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${
                          formData.logoPosition === 'center' ? 'text-center' : ''
                        }`}
                      >
                        <div
                          className={`flex items-center gap-3.5 ${
                            formData.logoPosition === 'center' ? 'flex-col sm:flex-row justify-center w-full' : ''
                          }`}
                        >
                          {formData.logoUrl ? (
                            <img
                              src={formData.logoUrl}
                              alt={formData.labName}
                              style={{ width: `${formData.logoWidth || 80}px` }}
                              className="max-h-20 object-contain shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                              LP
                            </div>
                          )}

                          <div>
                            <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                              {formData.labName || 'Lab-Portal-App'}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                              {formData.tagline || 'ISO 15189:2022 Certified · Healthcare Commission Registered (PHC-9201)'}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {formData.address || 'Main Campus: Medical Avenue, Lahore'} | UAN: {formData.phone || '+92 42 3588 9100'}
                            </p>
                          </div>
                        </div>

                        {formData.logoPosition !== 'center' && (
                          <div className="hidden sm:block text-right font-mono text-[10px] text-slate-400 shrink-0">
                            <div className="font-bold text-teal-800 text-xs">SAMPLE BC-849102</div>
                            <div>ORDER: ORD-9401</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-[11px]">
                    ↓ Patient Demographics & Investigation Results appear here ↓
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLINIC INFO & CONTACT */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Laboratory / Hospital Name *</label>
                <input
                  type="text"
                  value={formData.labName}
                  onChange={e => setFormData({ ...formData, labName: e.target.value })}
                  required
                  placeholder="e.g. Lab-Portal-App"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tagline & Accreditations</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. ISO 15189:2022 Certified · Registered with Punjab Healthcare Commission"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Contact Phone / UAN</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +92 (42) 3588-9100 / 0300-1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Healthcare Commission Reg #</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="e.g. PHC-LAB-9201"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@yourlab.pk"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Website URL</label>
                  <input
                    type="text"
                    value={formData.websiteUrl || ''}
                    onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="www.yourlab.pk"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Complete Physical Center Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Suite #4B, Main Boulevard, Gulberg III, Lahore, Pakistan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PATHOLOGIST & SIGNATURES */}
          {activeTab === 'pathologist' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                <span className="font-bold">Clinical Validation Signatures:</span> The credentials below appear at the foot of every printed diagnostic report with PMDC medical license verification.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Chief Consultant Pathologist</label>
                <input
                  type="text"
                  value={formData.chiefPathologist}
                  onChange={e => setFormData({ ...formData, chiefPathologist: e.target.value })}
                  placeholder="e.g. Prof. Dr. Tariq Mahmood"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Medical Qualifications & Registration</label>
                <input
                  type="text"
                  value={formData.pathologistQualification}
                  onChange={e => setFormData({ ...formData, pathologistQualification: e.target.value })}
                  placeholder="e.g. MBBS, M.Phil (Pathology), FRCPath · PMDC #18290-P"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-teal-600"
                />
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Lab Branding & Header</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
