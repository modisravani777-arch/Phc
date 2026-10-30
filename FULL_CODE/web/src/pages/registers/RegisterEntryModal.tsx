import React, { type Dispatch, type SetStateAction } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import type { ClinicalRegisterEntry, StaffMember } from '../../types';
import type { RegisterFormData } from './registerFormTypes';

interface RegisterEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  formData: RegisterFormData;
  setFormData: Dispatch<SetStateAction<RegisterFormData>>;
  staffList: StaffMember[];
  isSaving: boolean;
}

export const RegisterEntryModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  staffList,
  isSaving,
}: RegisterEntryModalProps) => (
  <>
    {/* New Entry Modal */}
    {isOpen && (
      <Modal isOpen={isOpen} onClose={onClose} title="Add New Patient Health Entry">
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as ClinicalRegisterEntry['gender'],
                    })
                  }
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
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service_type: e.target.value as ClinicalRegisterEntry['service_type'],
                  })
                }
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
            <label className="block font-bold text-slate-700 mb-1">
              Assigned Frontline Health Worker (ASHA / ANM)
            </label>
            <select
              value={formData.assigned_worker}
              onChange={(e) => {
                const selected = staffList.find((s) => s.full_name === e.target.value);
                const firstVillage = selected?.villages
                  ? selected.villages.split(',')[0].trim()
                  : '';
                setFormData({
                  ...formData,
                  assigned_worker: e.target.value,
                  village: !formData.village && firstVillage ? firstVillage : formData.village,
                });
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold bg-white"
            >
              <option value="">Auto-Assign (Intelligent Village / Facility Matching)</option>
              {staffList.map((worker) => (
                <option key={worker.id} value={worker.full_name}>
                  {worker.full_name} ({worker.role}
                  {worker.villages ? ` • ${worker.villages}` : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Vitals */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <span className="font-bold text-slate-800 block text-xs">
              Clinical Vitals & Screening
            </span>
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
            <label className="block font-bold text-slate-700 mb-1">
              Clinical Observations & Prescription
            </label>
            <textarea
              rows={2}
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Prescribed medicine (Paracetamol, IFA), clinical observations..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold">
              {isSaving ? 'Saving...' : 'Save Health Record'}
            </Button>
          </div>
        </form>
      </Modal>
    )}
  </>
);
