import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Baby,
  Syringe,
  RefreshCw,
  Eye,
  HeartPulse,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { ClinicalRegisterEntry, StaffMember } from '../types';
import { api, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { RegisterDetailsModal } from './registers/RegisterDetailsModal';
import { RegisterEntryModal } from './registers/RegisterEntryModal';
import {
  createInitialRegisterFormData,
  type RegisterFormData,
} from './registers/registerFormTypes';
import { getServiceBadge, getStatusBadge } from './registers/registerBadges';

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
  const [formData, setFormData] = useState<RegisterFormData>(createInitialRegisterFormData);

  const loadRegisters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getRegisters(activeTab, searchQuery);
      setEntries(data);
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Unable to load health records'));
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
    const loadStaff = async () => {
      try {
        setStaffList(await api.getStaff());
      } catch (error: unknown) {
        toastError(getErrorMessage(error, 'Unable to load assigned health workers'));
      }
    };
    void loadStaff();
  }, [toastError]);

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
      setFormData(createInitialRegisterFormData());
      await loadRegisters();
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Unable to save health record'));
    } finally {
      setIsSaving(false);
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
            Universal health registry across 6 catchment villages — tracking ANC, child vaccines,
            and NCD surveillance.
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
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Health Files
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">2,234</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Catchment Members</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-pink-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Maternal ANC Care
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">81</div>
            <div className="text-[11px] text-pink-600 font-semibold mt-0.5">Active Pregnancies</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Baby className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-teal-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Universal UIP Vaccines
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">382</div>
            <div className="text-[11px] text-teal-600 font-semibold mt-0.5">Children Immunized</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Syringe className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-amber-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              NCD Chronic Care
            </div>
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
                        <div className="font-bold text-slate-600 text-sm">
                          No clinical records found
                        </div>
                        <p className="text-xs text-slate-400">
                          Try adjusting your search query or filter tab.
                        </p>
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
                              {item.age} yrs •{' '}
                              {item.gender === 'F'
                                ? 'Female'
                                : item.gender === 'M'
                                  ? 'Male'
                                  : item.gender}{' '}
                              • <span className="font-bold text-slate-700">{item.village}</span>
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
                      <td className="py-4 px-5 whitespace-nowrap">{getStatusBadge(item.status)}</td>

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

      {selectedEntry && (
        <RegisterDetailsModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}

      <RegisterEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEntry}
        formData={formData}
        setFormData={setFormData}
        staffList={staffList}
        isSaving={isSaving}
      />
    </div>
  );
};
export default RegistersPage;
