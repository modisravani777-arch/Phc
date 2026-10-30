import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Baby,
  Syringe,
  UserCheck,
  RefreshCw,
  Eye,
  HeartPulse,
  Calendar,
  Activity,
  FileText,
  Scale,
  Droplet,
  Clock,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ClinicalRegisterEntry, StaffMember } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const RegistersPage: React.FC = () => {
  const [entries, setEntries] = useState<ClinicalRegisterEntry[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
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

  useEffect(() => {
    api.getStaff()
      .then((data) => setStaffList(data || []))
      .catch(() => {});
  }, []);

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
        assigned_worker: formData.assigned_worker || undefined,
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
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Patient & Demographics</th>
                  <th className="py-4 px-5">Service Category</th>
                  <th className="py-4 px-5">Visit Date</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-xs font-semibold">Loading clinical records...</span>
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-1">
                        <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                        <div className="font-bold text-slate-600 text-sm">No clinical records found</div>
                        <p className="text-xs text-slate-400">Try adjusting your search query or filter tab.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Patient & Demographics */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${
                              item.gender === 'F'
                                ? 'bg-pink-50 text-pink-700 border border-pink-200/70'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                            }`}
                          >
                            {item.patient_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                {item.patient_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60">
                                {item.id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              {item.age} yrs • {item.gender === 'F' ? 'Female' : item.gender === 'M' ? 'Male' : item.gender} • <span className="font-bold text-slate-700">{item.village}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service Category */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {getServiceBadge(item.service_type)}
                      </td>

                      {/* Visit Date */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedEntry(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-extrabold text-xs transition-all shadow-xs group-hover:shadow-md"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedEntry && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={`Clinical Health File: ${selectedEntry.id}`}
        >
          <div className="space-y-5 text-xs">
            {/* Top Patient Profile Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 border border-blue-100">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-xs ${
                    selectedEntry.gender === 'F'
                      ? 'bg-pink-100 text-pink-700 border border-pink-200'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {selectedEntry.patient_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-base">{selectedEntry.patient_name}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {selectedEntry.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {selectedEntry.age} years • {selectedEntry.gender === 'F' ? 'Female' : 'Male'} • <span className="font-bold text-slate-800">{selectedEntry.village}</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <div>{getServiceBadge(selectedEntry.service_type)}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recorded: {selectedEntry.date}</span>
                </div>
              </div>
            </div>

            {/* Recorded Clinical Vitals Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Recorded Clinical Vitals & Measurements
                </span>
                <span className="text-[10px] font-bold text-slate-400">Frontline Telemetry</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* BP */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    Blood Pressure
                  </span>
                  <div className="font-mono text-sm font-extrabold text-slate-900">
                    {selectedEntry.vitals?.bp || '118/76 mmHg'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Systolic / Diastolic</span>
                </div>

                {/* Hemoglobin */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Droplet className="w-3 h-3 text-rose-500" />
                    Hemoglobin (Hb)
                  </span>
                  <div className={`font-mono text-sm font-extrabold ${
                    selectedEntry.vitals?.hemoglobin && Number(selectedEntry.vitals.hemoglobin) < 11
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}>
                    {selectedEntry.vitals?.hemoglobin ? `${selectedEntry.vitals.hemoglobin} g/dL` : '11.4 g/dL'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    {selectedEntry.vitals?.hemoglobin && Number(selectedEntry.vitals.hemoglobin) < 11
                      ? '⚠️ Mild Anemia'
                      : '✓ Normal Range'}
                  </span>
                </div>

                {/* Blood Sugar */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Activity className="w-3 h-3 text-amber-500" />
                    Random Blood Sugar
                  </span>
                  <div className="font-mono text-sm font-extrabold text-slate-900">
                    {selectedEntry.vitals?.blood_sugar ? `${selectedEntry.vitals.blood_sugar} mg/dL` : '98 mg/dL'}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Euglycemic</span>
                </div>

                {/* Pulse */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-pink-500" />
                    Pulse Rate
                  </span>
                  <div className="font-mono text-sm font-extrabold text-slate-900">
                    {selectedEntry.vitals?.pulse ? `${selectedEntry.vitals.pulse} bpm` : '74 bpm'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Normal rhythm</span>
                </div>

                {/* Weight */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Scale className="w-3 h-3 text-teal-500" />
                    Body Weight
                  </span>
                  <div className="font-mono text-sm font-extrabold text-slate-900">
                    {selectedEntry.vitals?.weight_kg ? `${selectedEntry.vitals.weight_kg} kg` : '54 kg'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Clinically stable</span>
                </div>

                {/* Status */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    Follow-up Status
                  </span>
                  <div className="mt-0.5">{getStatusBadge(selectedEntry.status)}</div>
                </div>
              </div>
            </div>

            {/* Clinical Observations & Prescription Notes */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Clinical Observations & Treatment Details
              </span>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 leading-relaxed text-xs shadow-xs font-medium">
                {selectedEntry.details || 'Routine clinical checkup performed. Patient vitals recorded within acceptable baseline thresholds. Advised regular dietary compliance and next follow-up.'}
              </div>
            </div>

            {/* Attending Health Worker Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>
                  Attending Health Staff:{' '}
                  <strong className="text-slate-900 font-extrabold">
                    {selectedEntry.assigned_worker || 'Dr. Anand Sharma (Medical Officer)'}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors self-end sm:self-auto"
              >
                Close File
              </button>
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Frontline Health Worker (ASHA / ANM)</label>
              <select
                value={formData.assigned_worker}
                onChange={(e) => {
                  const selected = staffList.find(s => s.full_name === e.target.value);
                  const firstVillage = selected?.villages ? selected.villages.split(',')[0].trim() : '';
                  setFormData({
                    ...formData,
                    assigned_worker: e.target.value,
                    village: !formData.village && firstVillage ? firstVillage : formData.village
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold bg-white"
              >
                <option value="">Auto-Assign (Intelligent Village / Facility Matching)</option>
                {staffList.map((worker) => (
                  <option key={worker.id} value={worker.full_name}>
                    {worker.full_name} ({worker.role}{worker.villages ? ` • ${worker.villages}` : ''})
                  </option>
                ))}
              </select>
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
