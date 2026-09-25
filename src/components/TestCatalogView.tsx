import React, { useState } from 'react';
import { TestCatalogItem, TestSubHeading, TestParameterDef, UserAccount } from '../types/lims';
import { formatPKR } from '../utils/formatters';

interface TestCatalogViewProps {
  catalog: TestCatalogItem[];
  currentUser?: UserAccount;
  onAddTest: (test: TestCatalogItem) => void;
  onUpdateTest: (test: TestCatalogItem) => void;
  onDeleteTest: (code: string) => void;
}

export const TestCatalogView: React.FC<TestCatalogViewProps> = ({
  catalog,
  currentUser,
  onAddTest,
  onUpdateTest,
  onDeleteTest
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedTestCode, setExpandedTestCode] = useState<string | null>(catalog[0]?.code || null);

  const isAdmin = currentUser?.role === 'admin';
  const isReceptionist = currentUser?.role === 'receptionist';
  const isTechnician = currentUser?.role === 'technologist';

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Biochemistry');
  const [formFee, setFormFee] = useState<number>(1200);
  const [formSpecimen, setFormSpecimen] = useState('Serum (Yellow Gel Tube)');
  const [formTurnaround, setFormTurnaround] = useState<number>(6);
  const [formSubHeadings, setFormSubHeadings] = useState<TestSubHeading[]>([]);

  // Sub-heading input inside modal
  const [newSubHeadingTitle, setNewSubHeadingTitle] = useState('');

  // Categories list
  const categories = ['All', ...Array.from(new Set(catalog.map(c => c.category)))];

  const openAddModal = () => {
    setEditingCode(null);
    setFormCode('');
    setFormName('');
    setFormCategory('Biochemistry');
    setFormFee(1500);
    setFormSpecimen('Serum (Yellow Gel Tube)');
    setFormTurnaround(6);
    setFormSubHeadings([
      {
        id: `sh_${Date.now()}`,
        title: 'Primary Parameters',
        parameters: [
          {
            id: `param_${Date.now()}_1`,
            name: '',
            unit: 'mg/dL',
            normalRangeText: ''
          }
        ]
      }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (test: TestCatalogItem) => {
    setEditingCode(test.code);
    setFormCode(test.code);
    setFormName(test.name);
    setFormCategory(test.category);
    setFormFee(test.fee);
    setFormSpecimen(test.specimen);
    setFormTurnaround(test.turnaroundHours);
    setFormSubHeadings(JSON.parse(JSON.stringify(test.subHeadings || [])));
    setIsModalOpen(true);
  };

  // Subheading and Parameter helpers inside Modal
  const handleAddSubHeading = () => {
    if (!newSubHeadingTitle.trim()) return;
    const newSh: TestSubHeading = {
      id: `sh_${Date.now()}`,
      title: newSubHeadingTitle.trim(),
      parameters: []
    };
    setFormSubHeadings([...formSubHeadings, newSh]);
    setNewSubHeadingTitle('');
  };

  const handleRemoveSubHeading = (shId: string) => {
    setFormSubHeadings(formSubHeadings.filter(sh => sh.id !== shId));
  };

  const handleAddParameterToSubHeading = (shId: string) => {
    setFormSubHeadings(
      formSubHeadings.map(sh => {
        if (sh.id !== shId) return sh;
        const newParam: TestParameterDef = {
          id: `param_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          name: 'New Parameter',
          unit: 'mg/dL',
          normalRangeText: 'Normal range'
        };
        return {
          ...sh,
          parameters: [...sh.parameters, newParam]
        };
      })
    );
  };

  const handleUpdateParameter = (
    shId: string,
    paramId: string,
    updates: Partial<TestParameterDef>
  ) => {
    setFormSubHeadings(
      formSubHeadings.map(sh => {
        if (sh.id !== shId) return sh;
        return {
          ...sh,
          parameters: sh.parameters.map(p => {
            if (p.id !== paramId) return p;
            return { ...p, ...updates };
          })
        };
      })
    );
  };

  const handleRemoveParameter = (shId: string, paramId: string) => {
    setFormSubHeadings(
      formSubHeadings.map(sh => {
        if (sh.id !== shId) return sh;
        return {
          ...sh,
          parameters: sh.parameters.filter(p => p.id !== paramId)
        };
      })
    );
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    const testItem: TestCatalogItem = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      fee: Number(formFee),
      specimen: formSpecimen,
      turnaroundHours: Number(formTurnaround),
      subHeadings: formSubHeadings
    };

    if (editingCode) {
      onUpdateTest(testItem);
    } else {
      onAddTest(testItem);
    }
    setIsModalOpen(false);
  };

  // Filtering
  const filteredCatalog = catalog.filter(test => {
    const matchesSearch =
      test.name.toLowerCase().includes(search.toLowerCase()) ||
      test.code.toLowerCase().includes(search.toLowerCase()) ||
      test.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Role Notice Banner */}
      {isReceptionist && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-teal-600 text-white rounded text-[10px]">
              Reception Directory
            </span>
            <span>
              <strong>Price & Test Directory:</strong> Reference official PKR rates, turnaround times, and specimen requirements for patient inquiries at the counter. (Catalog editing is restricted to Admin).
            </span>
          </div>
        </div>
      )}

      {isTechnician && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-blue-600 text-white rounded text-[10px]">
              Laboratory Reference
            </span>
            <span>
              <strong>Clinical Parameter Specifications:</strong> Reference normal reference ranges, measurement units, and tube specimens. (Test profile modifications require Admin access).
            </span>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold px-2 py-0.5 bg-amber-400 text-slate-950 rounded text-[10px]">
              Admin Control
            </span>
            <span>
              Full administrative authority: Create new tests, update PKR pricing, configure multi-parameter sub-headings, or delete obsolete profiles.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Laboratory Test Catalog & Parameters
          </h1>
          <p className="text-xs text-slate-500">
            Configure investigation profiles, sub-headings, reference ranges, specimen tubes & PKR pricing
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            + Add New Test & Sub-headings
          </button>
        )}
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
            placeholder="Search test name, test code (e.g. CBC, LFT, RFT)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid / List with Interactive Sub-Headings Accordion */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCatalog.map((test) => {
          const isExpanded = expandedTestCode === test.code;
          const totalParams = (test.subHeadings || []).reduce(
            (acc, sh) => acc + (sh.parameters?.length || 0),
            0
          );

          return (
            <div
              key={test.code}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all hover:border-slate-300"
            >
              {/* Test Summary Strip */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="flex items-start gap-3">
                  <span className="w-12 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                    {test.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{test.name}</h3>
                      <span className="text-[11px] text-slate-500">· {test.category}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Specimen: <strong className="text-slate-700">{test.specimen}</strong></span>
                      <span>Turnaround: <strong className="text-slate-700">{test.turnaroundHours} hrs</strong></span>
                      <span>Structure: <strong className="text-teal-700">{test.subHeadings?.length || 0} Sub-headings</strong> ({totalParams} parameters)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Lab Fee (PKR)</span>
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      {formatPKR(test.fee)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpandedTestCode(isExpanded ? null : test.code)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? 'Hide Parameters ▲' : 'View Parameters ▼'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal(test)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 border border-slate-200 rounded-lg"
                        title="Edit test & sub-headings"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Sub-Headings & Parameters View */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Report Sub-Headings & Parameter Layout:
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => openEditModal(test)}
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        + Add / Modify Sub-Headings
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {test.subHeadings && test.subHeadings.length > 0 ? (
                      test.subHeadings.map((sh, shIdx) => (
                        <div key={sh.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          {/* Subheading banner */}
                          <div className="bg-slate-100 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-200">
                            <span className="font-bold text-xs text-teal-800">
                              {shIdx + 1}. Sub-Heading: {sh.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {sh.parameters?.length || 0} parameters
                            </span>
                          </div>

                          {/* Table of parameters */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                                  <th className="py-2 px-3">Parameter Name</th>
                                  <th className="py-2 px-3">Unit</th>
                                  <th className="py-2 px-3">Biological Normal Range</th>
                                  <th className="py-2 px-3">Min - Max Flag Rules</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sh.parameters && sh.parameters.length > 0 ? (
                                  sh.parameters.map((param) => (
                                    <tr key={param.id} className="hover:bg-slate-50/70">
                                      <td className="py-2 px-3 font-medium text-slate-800">
                                        {param.name}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-slate-600">
                                        {param.unit || '-'}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-slate-700">
                                        {param.normalRangeText || '-'}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                        {param.normalRangeMin !== undefined || param.normalRangeMax !== undefined
                                          ? `${param.normalRangeMin ?? 0} to ${param.normalRangeMax ?? '∞'}`
                                          : 'Qualitative / Textual'}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="py-3 text-center text-slate-400 italic">
                                      No parameters under this sub-heading yet. Click Edit to add.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                        No sub-headings configured. Click &quot;Add / Modify Sub-Headings&quot; to structure this test.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Test & Sub-Headings Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCode ? `Edit Test: ${editingCode}` : 'Configure New Investigation Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Test Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Test Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBC, LFT"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    disabled={!!editingCode}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Investigation Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Blood Count (CBC)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Serology & Immunology">Serology & Immunology</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="Molecular Diagnostics">Molecular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Lab Fee (PKR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formFee}
                    onChange={(e) => setFormFee(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-teal-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Required Specimen / Tube
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Whole Blood (EDTA Purple Top)"
                    value={formSpecimen}
                    onChange={(e) => setFormSpecimen(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Turnaround (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formTurnaround}
                    onChange={(e) => setFormTurnaround(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              {/* Sub-Headings & Parameters Builder (Manual Adding Sub Heading) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Report Sub-Headings & Parameters (Manual Builder)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Organize parameters into clean sections (e.g. &quot;Red Blood Cell Profile&quot;, &quot;Liver Enzymes&quot;)
                    </p>
                  </div>

                  {/* Add Subheading Input */}
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="New sub-heading title..."
                      value={newSubHeadingTitle}
                      onChange={(e) => setNewSubHeadingTitle(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs w-48"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubHeading}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
                    >
                      + Add Sub-Heading
                    </button>
                  </div>
                </div>

                {/* List of subheadings */}
                <div className="space-y-4">
                  {formSubHeadings.map((sh) => (
                    <div
                      key={sh.id}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50"
                    >
                      <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-800 text-xs">
                            Sub-Heading:
                          </span>
                          <input
                            type="text"
                            value={sh.title}
                            onChange={(e) => {
                              const newTitle = e.target.value;
                              setFormSubHeadings(
                                formSubHeadings.map(s => s.id === sh.id ? { ...s, title: newTitle } : s)
                              );
                            }}
                            className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddParameterToSubHeading(sh.id)}
                            className="text-xs text-teal-700 hover:underline font-semibold"
                          >
                            + Add Parameter
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubHeading(sh.id)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                          >
                            Remove Section
                          </button>
                        </div>
                      </div>

                      {/* Parameters Table */}
                      <div className="p-3">
                        <div className="space-y-2">
                          {sh.parameters.map((param) => (
                            <div
                              key={param.id}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center"
                            >
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                                  Parameter Name
                                </label>
                                <input
                                  type="text"
                                  value={param.name}
                                  placeholder="e.g. Hemoglobin"
                                  onChange={(e) => handleUpdateParameter(sh.id, param.id, { name: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                                  Unit
                                </label>
                                <input
                                  type="text"
                                  value={param.unit}
                                  placeholder="g/dL, /cumm"
                                  onChange={(e) => handleUpdateParameter(sh.id, param.id, { unit: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                                  Normal Range Text
                                </label>
                                <input
                                  type="text"
                                  value={param.normalRangeText}
                                  placeholder="e.g. 13.0 - 17.0"
                                  onChange={(e) => handleUpdateParameter(sh.id, param.id, { normalRangeText: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] text-slate-400 font-semibold uppercase">
                                  Min / Max (Flags)
                                </label>
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    placeholder="Min"
                                    value={param.normalRangeMin ?? ''}
                                    onChange={(e) =>
                                      handleUpdateParameter(sh.id, param.id, {
                                        normalRangeMin: e.target.value === '' ? undefined : Number(e.target.value)
                                      })
                                    }
                                    className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-mono"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Max"
                                    value={param.normalRangeMax ?? ''}
                                    onChange={(e) =>
                                      handleUpdateParameter(sh.id, param.id, {
                                        normalRangeMax: e.target.value === '' ? undefined : Number(e.target.value)
                                      })
                                    }
                                    className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs font-mono"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveParameter(sh.id, param.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                  title="Delete parameter"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}

                          {sh.parameters.length === 0 && (
                            <div className="p-3 text-center text-slate-400 text-xs italic">
                              No parameters in this sub-heading.{' '}
                              <button
                                type="button"
                                onClick={() => handleAddParameterToSubHeading(sh.id)}
                                className="text-teal-700 underline font-semibold"
                              >
                                Click here to add one
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {editingCode && isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete test ${editingCode}?`)) {
                        onDeleteTest(editingCode);
                        setIsModalOpen(false);
                      }
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold"
                  >
                    Delete Test Profile
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm text-xs"
                  >
                    Save Test & Sub-Headings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
