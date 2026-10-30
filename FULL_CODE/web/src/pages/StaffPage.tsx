import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Filter,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { StaffMember, StaffRole } from '../types';
import { api, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const StaffPage: React.FC = () => {
  const { facility } = useAuth();
  const { success, error: toastError } = useToast();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>('ASHA');
  const [phone, setPhone] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStaff();
      setStaff(data);
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Failed to load staff list'));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.employee_code.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search);
      const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !employeeCode.trim()) {
      setFormError('All fields are required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const created = await api.createStaff({
        full_name: fullName.trim(),
        role,
        phone: phone.trim(),
        employee_code: employeeCode.trim(),
      });
      success(`Added ${created.full_name} (${created.role}) to facility directory`);
      setIsModalOpen(false);
      setFullName('');
      setPhone('');
      setEmployeeCode('');
      loadStaff();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to create staff record');
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleIcons: Record<string, React.ReactNode> = {
    ASHA: <HeartPulse className="w-4 h-4 text-emerald-600" />,
    SUPERVISOR: <Shield className="w-4 h-4 text-purple-600" />,
    DOCTOR: <Stethoscope className="w-4 h-4 text-teal-600" />,
    ANM: <Stethoscope className="w-4 h-4 text-blue-600" />,
    ALL: <Users className="w-4 h-4 text-indigo-600" />,
    OTHER: <Users className="w-4 h-4 text-indigo-600" />,
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: staff.length };
    staff.forEach((s) => {
      counts[s.role] = (counts[s.role] || 0) + 1;
    });
    return counts;
  }, [staff]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
            Healthcare Workforce
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            Care Team & Personnel Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {facility ? facility.name : 'Facility'} · {staff.length} Active Frontline Personnel
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadStaff}
            disabled={isLoading}
            className="text-xs px-3.5 py-2 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setFormError(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/25 font-bold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Role Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        {[
          {
            id: 'ASHA',
            label: 'ASHA Workers',
            count: roleCounts['ASHA'] || 0,
            bg: 'bg-emerald-50',
          },
          {
            id: 'SUPERVISOR',
            label: 'Health Supervisors',
            count: roleCounts['SUPERVISOR'] || 0,
            bg: 'bg-purple-50',
          },
          {
            id: 'DOCTOR',
            label: 'Medical Officers',
            count: roleCounts['DOCTOR'] || 0,
            bg: 'bg-teal-50',
          },
          { id: 'ALL', label: 'All Health Personnel', count: staff.length, bg: 'bg-indigo-50' },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => setRoleFilter(item.id)}
            className={`card-modern p-5 rounded-2xl cursor-pointer transition-all ${
              roleFilter === item.id ? 'ring-2 ring-blue-600 shadow-md bg-blue-50/20' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.bg}`}>
                {roleIcons[item.id]}
              </span>
              <span className="text-2xl font-extrabold text-slate-900 font-display">
                {item.count}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-700">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, phone, or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['ALL', 'ASHA', 'SUPERVISOR', 'DOCTOR', 'ANM'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === r
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {r === 'ALL'
                  ? 'All Personnel'
                  : r === 'SUPERVISOR'
                    ? 'Supervisors'
                    : r === 'DOCTOR'
                      ? 'Doctors'
                      : r}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-4">Role Classification</th>
                <th className="py-3.5 px-4">Employee Code</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Coverage Area</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading staff directory...
                    </div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No staff members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-100 to-blue-50 text-blue-700 font-extrabold flex items-center justify-center shrink-0 text-xs border border-blue-100">
                          {member.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{member.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {member.id.slice(0, 10)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          member.role === 'ASHA'
                            ? 'teal'
                            : member.role === 'DOCTOR'
                              ? 'blue'
                              : member.role === 'SUPERVISOR'
                                ? 'purple'
                                : member.role === 'ANM'
                                  ? 'pink'
                                  : 'slate'
                        }
                      >
                        {member.role}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 font-mono font-semibold border border-slate-100">
                        {member.employee_code}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <a
                        href={`tel:${member.phone}`}
                        className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </a>
                    </td>

                    <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {member.villages || facility?.name || 'Catchment Area'}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Onboard Healthcare Personnel"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200/60 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Suman Devi"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Classification *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white font-semibold"
              >
                <option value="ASHA">ASHA (Accredited Social Health Activist)</option>
                <option value="SUPERVISOR">Supervisor / Public Health Officer</option>
                <option value="DOCTOR">Medical Officer (Doctor)</option>
                <option value="ANM">ANM (Auxiliary Nurse Midwife)</option>
                <option value="OTHER">Other Clinical Personnel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employee Code / ASHA ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ASHA-NEW1"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Save Staff Member'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default StaffPage;
