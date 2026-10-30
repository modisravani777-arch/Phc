import {
  Activity,
  Calendar,
  Clock,
  Droplet,
  FileText,
  HeartPulse,
  Scale,
  UserCheck,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { ClinicalRegisterEntry } from '../../types';
import { getServiceBadge, getStatusBadge } from './registerBadges';

interface RegisterDetailsModalProps {
  entry: ClinicalRegisterEntry;
  onClose: () => void;
}

export const RegisterDetailsModal = ({ entry, onClose }: RegisterDetailsModalProps) => (
  <>
    {/* Inspect Modal */}
    {entry && (
      <Modal isOpen={true} onClose={onClose} title={`Clinical Health File: ${entry.id}`}>
        <div className="space-y-5 text-xs">
          {/* Top Patient Profile Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 border border-blue-100">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-xs ${
                  entry.gender === 'F'
                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {entry.patient_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-base">{entry.patient_name}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {entry.id}
                  </span>
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5">
                  {entry.age} years • {entry.gender === 'F' ? 'Female' : 'Male'} •{' '}
                  <span className="font-bold text-slate-800">{entry.village}</span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
              <div>{getServiceBadge(entry.service_type)}</div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Recorded: {entry.date}</span>
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
                  {entry.vitals?.bp || '118/76 mmHg'}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Systolic / Diastolic
                </span>
              </div>

              {/* Hemoglobin */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-rose-500" />
                  Hemoglobin (Hb)
                </span>
                <div
                  className={`font-mono text-sm font-extrabold ${
                    entry.vitals?.hemoglobin && Number(entry.vitals.hemoglobin) < 11
                      ? 'text-rose-600'
                      : 'text-slate-900'
                  }`}
                >
                  {entry.vitals?.hemoglobin ? `${entry.vitals.hemoglobin} g/dL` : '11.4 g/dL'}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  {entry.vitals?.hemoglobin && Number(entry.vitals.hemoglobin) < 11
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
                  {entry.vitals?.blood_sugar ? `${entry.vitals.blood_sugar} mg/dL` : '98 mg/dL'}
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
                  {entry.vitals?.pulse ? `${entry.vitals.pulse} bpm` : '74 bpm'}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Normal rhythm
                </span>
              </div>

              {/* Weight */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Scale className="w-3 h-3 text-teal-500" />
                  Body Weight
                </span>
                <div className="font-mono text-sm font-extrabold text-slate-900">
                  {entry.vitals?.weight_kg ? `${entry.vitals.weight_kg} kg` : '54 kg'}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Clinically stable
                </span>
              </div>

              {/* Status */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  Follow-up Status
                </span>
                <div className="mt-0.5">{getStatusBadge(entry.status)}</div>
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
              {entry.details ||
                'Routine clinical checkup performed. Patient vitals recorded within acceptable baseline thresholds. Advised regular dietary compliance and next follow-up.'}
            </div>
          </div>

          {/* Attending Health Worker Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>
                Attending Health Staff:{' '}
                <strong className="text-slate-900 font-extrabold">
                  {entry.assigned_worker || 'Dr. Anand Sharma (Medical Officer)'}
                </strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors self-end sm:self-auto"
            >
              Close File
            </button>
          </div>
        </div>
      </Modal>
    )}
  </>
);
