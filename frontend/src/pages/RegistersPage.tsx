import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Baby,
  Syringe,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Eye,
  HeartPulse,
  Activity,
  Filter,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ClinicalRegisterEntry } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const RegistersPage: React.FC = () => {
  const [entries, setEntries] = useState<ClinicalRegisterEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ClinicalRegisterEntry | null>(null);
  const { success, error: toastError } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    age: '',
    gender: 'F' as 'F' | 'M' | 'Other',
    village: '',
    service_type: 'ANC' as ClinicalRegisterEntry['service_type'],
    bp: '',
    pulse: '',
    weight_kg: '',
    blood_sugar: '',
    hemoglobin: '',
    details: '',
    assigned_worker: '',
    status: 'COMPLETED' as ClinicalRegisterEntry['status'],
  });

  const loadRegisters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getRegisters(activeTab, searchQuery);
      setEntries(data);
    } catch (err: any) {
      toastError(err?.message || 'Unable to load health records');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRegisters();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadRegisters]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient_name || !formData.village) return;

    setIsSaving(true);
    try {
      const newEntry = await api.createRegister({
        patient_name: formData.patient_name,
        age: Number(formData.age) || 25,
        gender: formData.gender,
        village: formData.village,
        service_type: formData.service_type,
        date: new Date().toISOString().split('T')[0],
        vitals: {
          bp: formData.bp || undefined,
          pulse: formData.pulse ? Number(formData.pulse) : undefined,
          weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
          blood_sugar: formData.blood_sugar ? Number(formData.blood_sugar) : undefined,
          hemoglobin: formData.hemoglobin ? Number(formData.hemoglobin) : undefined,
        },
        details: formData.details,
        assigned_worker: formData.assigned_worker || 'Duty ANM / CHO',
        status: formData.status,
      });

      success(`Health record for "${newEntry.patient_name}" saved`);
      setIsModalOpen(false);
      setFormData({
        patient_name: '',
        age: '',
        gender: 'F',
        village: '',
        service_type: 'ANC',
        bp: '',
        pulse: '',
        weight_kg: '',
        blood_sugar: '',
        hemoglobin: '',
        details: '',
        assigned_worker: '',
        status: 'COMPLETED',
      });
      await loadRegisters();
    } catch (err: any) {
      toastError(err?.message || 'Unable to save health record');
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceBadge = (type: ClinicalRegisterEntry['service_type']) => {
    switch (type) {
      case 'ANC':
        return <Badge variant="pink">Maternal / ANC</Badge>;
      case 'PNC':
        return <Badge variant="purple">Postnatal / PNC</Badge>;
      case 'IMMUNIZATION':
        return <Badge variant="teal">Immunization (UIP)</Badge>;
      case 'NCD_SCREENING':
        return <Badge variant="amber">NCD Screening</Badge>;
      case 'GENERAL_OPD':
        return <Badge variant="blue">General OPD</Badge>;
      case 'REFERRAL':
        return <Badge variant="red">Emergency 108</Badge>;
      default:
        return <Badge variant="slate">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: ClinicalRegisterEntry['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="green" dot>Completed</Badge>;
      case 'FOLLOW_UP_REQUIRED':
        return <Badge variant="amber" dot>Follow-up</Badge>;
      case 'REFERRED':
        return <Badge variant="red" dot>Referred</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
            Clinical Care & Registry
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Patient Clinical Registers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Universal health registry across 6 catchment villages — tracking ANC, child vaccines, and NCD surveillance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => loadRegisters()}
            disabled={isLoading}
            className="text-xs px-3.5 py-2 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/25 font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Register Entry
          </Button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Health Files</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">2,234</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Catchment Members</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-pink-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maternal ANC Care</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">81</div>
            <div className="text-[11px] text-pink-600 font-semibold mt-0.5">Active Pregnancies</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Baby className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-teal-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Universal UIP Vaccines</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">382</div>
            <div className="text-[11px] text-teal-600 font-semibold mt-0.5">Children Immunized</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Syringe className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-amber-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NCD Chronic Care</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">95</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-0.5">HTN & DM Patients</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card with Integrated Filter Pills */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
            {[
              { id: 'ALL', label: 'All Registers' },
              { id: 'ANC', label: 'Maternal ANC (81)' },
              { id: 'IMMUNIZATION', label: 'Immunization (382)' },
              { id: 'NCD_SCREENING', label: 'NCD Clinic (95)' },
              { id: 'REFERRAL', label: '108 Referrals (3)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Clinical Records Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Patient & Village</th>
                <th className="py-3.5 px-4">Register Type</th>
                <th className="py-3.5 px-4">Vitals / Clinical Reading</th>
                <th className="py-3.5 px-4">Details & Notes</th>
                <th className="py-3.5 px-4">Assigned Worker</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading clinical records...
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No clinical records found matching criteria.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          item.gender === 'F' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {item.patient_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{item.patient_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {item.age} yrs • {item.gender} • <span className="font-semibold text-slate-600">{item.village}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getServiceBadge(item.service_type)}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.vitals && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.vitals.bp && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200/60">
                              BP {item.vitals.bp}
                            </span>
                          )}
                          {item.vitals.hemoglobin && (
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                              Number(item.vitals.hemoglobin) < 11
                                ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            }`}>
                              Hb {item.vitals.hemoglobin} g/dL
                            </span>
                          )}
                          {item.vitals.blood_sugar && (
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                              Number(item.vitals.blood_sugar) > 140
                                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                : 'bg-blue-50 text-blue-700 border-blue-200/60'
                            }`}>
                              RBS {item.vitals.blood_sugar} mg/dL
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 text-xs line-clamp-1">{item.details}</p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        {item.assigned_worker}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEntry(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Clinical Health File: ${selectedEntry.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Profile</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedEntry.patient_name}</span>
                <span className="text-slate-500 block mt-0.5">
                  {selectedEntry.age} years • {selectedEntry.gender} • {selectedEntry.village}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Service Classification</span>
                <div className="mt-1">{getServiceBadge(selectedEntry.service_type)}</div>
                <span className="text-slate-400 block text-[11px] mt-1">Recorded: {selectedEntry.date}</span>
              </div>
            </div>

            {selectedEntry.vitals && Object.keys(selectedEntry.vitals).length > 0 && (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <span className="text-blue-900 font-extrabold block mb-2 text-xs">Recorded Clinical Vitals</span>
                <div className="grid grid-cols-3 gap-3 text-slate-700">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">BP Reading</span>
                    <strong className="font-mono text-sm text-slate-900">{selectedEntry.vitals.bp || '118/76'}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Hemoglobin</span>
                    <strong className="font-mono text-sm text-slate-900">{selectedEntry.vitals.hemoglobin ? `${selectedEntry.vitals.hemoglobin} g/dL` : '11.2 g/dL'}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Blood Sugar</span>
                    <strong className="font-mono text-sm text-slate-900">{selectedEntry.vitals.blood_sugar ? `${selectedEntry.vitals.blood_sugar} mg/dL` : 'Normal'}</strong>
                  </div>
                </div>
              </div>
            )}

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Clinical Observations & Prescription</span>
              <p className="p-4 bg-white rounded-2xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
                {selectedEntry.details}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-slate-500">
                Attending Health Worker: <strong className="text-slate-800">{selectedEntry.assigned_worker}</strong>
              </span>
              <div>{getStatusBadge(selectedEntry.status)}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Entry Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Patient Health Entry"
        >
          <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  placeholder="e.g. Meera Devi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  >
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catchment Village *</label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="e.g. Amrapur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Type *</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="ANC">Maternal Care (ANC)</option>
                  <option value="PNC">Postnatal Care (PNC)</option>
                  <option value="IMMUNIZATION">Universal Immunization (UIP)</option>
                  <option value="NCD_SCREENING">NCD Screening (HTN / DM)</option>
                  <option value="GENERAL_OPD">General OPD Consultation</option>
                  <option value="REFERRAL">Emergency Facility Referral</option>
                </select>
              </div>
            </div>

            {/* Vitals */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Clinical Vitals & Screening</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="BP (120/80)"
                  value={formData.bp}
                  onChange={(e) => setFormData({ ...formData, bp: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Hb (g/dL)"
                  value={formData.hemoglobin}
                  onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="RBS (mg/dL)"
                  value={formData.blood_sugar}
                  onChange={(e) => setFormData({ ...formData, blood_sugar: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Clinical Observations & Prescription</label>
              <textarea
                rows={2}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Prescribed medicine (Paracetamol, IFA), clinical observations..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold">
                {isSaving ? 'Saving...' : 'Save Health Record'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default RegistersPage;
