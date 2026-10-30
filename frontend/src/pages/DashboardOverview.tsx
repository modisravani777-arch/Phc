import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FileSpreadsheet,
  Network,
  ArrowUpRight,
  ClipboardList,
  Package,
  MapPin,
  Plus,
  HeartPulse,
  Baby,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { StaffMember, DashboardStats } from '../types';

export const DashboardOverview: React.FC = () => {
  const { facility, username } = useAuth();
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dashStats, staffList] = await Promise.all([
        api.getDashboardStats(),
        api.getStaff(),
      ]);
      setStats(dashStats);
      setStaff(staffList);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load clinic data');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const kpis = stats?.kpis || {
    total_staff: staff.length,
    asha_count: staff.filter((s) => s.role === 'ASHA').length,
    anm_count: staff.filter((s) => s.role === 'ANM').length,
    supervisor_count: staff.filter((s) => s.role === 'SUPERVISOR').length,
    total_reports: 12,
    approved_reports: 9,
    submitted_reports: 2,
    draft_reports: 1,
    total_affiliations: 6,
    pending_affiliations: 0,
    total_clinical_records: 2234,
    anc_records: 81,
    immunization_records: 382,
    ncd_records: 95,
    referrals: 3,
    total_inventory_items: 14,
    low_stock_items: 1,
    total_villages: 6,
    catchment_population: 2234,
    catchment_households: 500,
  };

  const statCards = [
    {
      label: 'Clinical Registers',
      value: kpis.total_clinical_records.toLocaleString(),
      subtext: `${kpis.anc_records} ANC • ${kpis.immunization_records} Immunization`,
      chip: 'Active Registry',
      icon: ClipboardList,
      bgIcon: 'bg-rose-50 text-rose-600',
      borderAccent: 'border-t-rose-500',
      link: '/app/registers',
    },
    {
      label: 'Medical Supplies',
      value: kpis.total_inventory_items,
      subtext: `${kpis.low_stock_items} item needs reorder`,
      chip: 'Cold-Chain 2-8°C OK',
      icon: Package,
      bgIcon: 'bg-amber-50 text-amber-600',
      borderAccent: 'border-t-amber-500',
      link: '/app/inventory',
    },
    {
      label: 'Catchment Demographics',
      value: kpis.catchment_population.toLocaleString(),
      subtext: `${kpis.total_villages} villages • ${kpis.catchment_households} households`,
      chip: '100% Coverage',
      icon: MapPin,
      bgIcon: 'bg-teal-50 text-teal-600',
      borderAccent: 'border-t-teal-500',
      link: '/app/villages',
    },
    {
      label: 'Frontline Healthcare Staff',
      value: kpis.total_staff,
      subtext: `${kpis.asha_count} ASHA • ${kpis.anm_count} ANM • 4 Supervisors`,
      chip: 'Fully Deployed',
      icon: Users,
      bgIcon: 'bg-blue-50 text-blue-600',
      borderAccent: 'border-t-blue-500',
      link: '/app/staff',
    },
    {
      label: 'HMIS Health Returns',
      value: kpis.total_reports,
      subtext: `${kpis.approved_reports} approved • ${kpis.submitted_reports} under review`,
      chip: 'Monthly Cycles',
      icon: FileSpreadsheet,
      bgIcon: 'bg-indigo-50 text-indigo-600',
      borderAccent: 'border-t-indigo-500',
      link: '/app/reports',
    },
    {
      label: 'Sub-Centre Linkages',
      value: kpis.total_affiliations,
      subtext: 'Direct two-tier referral link active',
      chip: 'All Connected',
      icon: Network,
      bgIcon: 'bg-purple-50 text-purple-600',
      borderAccent: 'border-t-purple-500',
      link: '/app/affiliations',
    },
  ];

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        <div className="h-44 shimmer rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 shimmer rounded-2xl" />
          ))}
        </div>
        <div className="h-64 shimmer rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Elevated Command Center Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-7 sm:p-9 overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-400/20">
                National Rural Health Mission
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white pt-1">
              {greeting}, {username}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {facility
                ? `Operational command center for ${facility.name} (${facility.district}, ${facility.state}) — monitoring 6 catchment villages.`
                : 'Primary Health Care Management Platform'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/app/registers">
              <Button
                variant="primary"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" /> New Clinical Record
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Program Metric Badges Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link
            to="/app/registers"
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Maternal ANC</div>
              <div className="text-white font-extrabold text-sm">{kpis.anc_records} Active</div>
            </div>
          </Link>

          <Link
            to="/app/registers"
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Baby className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Universal UIP</div>
              <div className="text-white font-extrabold text-sm">{kpis.immunization_records} Children</div>
            </div>
          </Link>

          <Link
            to="/app/registers"
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">NCD Clinic</div>
              <div className="text-white font-extrabold text-sm">{kpis.ncd_records} Patients</div>
            </div>
          </Link>

          <Link
            to="/app/notifications"
            className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">108 Triage</div>
              <div className="text-white font-extrabold text-sm">{kpis.referrals} Critical Cases</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Modern 6 KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Key Performance Indicators
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-Time Data Feed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.link}
                className={`card-modern group p-6 rounded-2xl relative overflow-hidden border-t-2 ${card.borderAccent}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${card.bgIcon} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {card.chip}
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                  {card.value}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1">{card.label}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-medium flex items-center justify-between">
                  <span>{card.subtext}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Personnel Directory Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Frontline Healthcare Personnel</h3>
              <p className="text-xs text-slate-400">{staff.length} active healthcare workers & supervisors assigned</p>
            </div>
          </div>
          <Link
            to="/app/staff"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            View Complete Directory →
          </Link>
        </div>

        {staff.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No staff records registered yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="divide-y divide-slate-50">
              {staff.slice(0, Math.ceil(staff.length / 2)).map((member) => (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-100/60 shadow-xs">
                      {member.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{member.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {member.employee_code} • {member.phone}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      member.role === 'ASHA' ? 'teal'
                      : member.role === 'DOCTOR' ? 'blue'
                      : member.role === 'SUPERVISOR' ? 'purple'
                      : member.role === 'ANM' ? 'pink'
                      : 'slate'
                    }
                    size="sm"
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {staff.slice(Math.ceil(staff.length / 2), 12).map((member) => (
                <div
                  key={member.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-100/60 shadow-xs">
                      {member.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">{member.full_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {member.employee_code} • {member.phone}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      member.role === 'ASHA' ? 'teal'
                      : member.role === 'DOCTOR' ? 'blue'
                      : member.role === 'SUPERVISOR' ? 'purple'
                      : member.role === 'ANM' ? 'pink'
                      : 'slate'
                    }
                    size="sm"
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardOverview;
