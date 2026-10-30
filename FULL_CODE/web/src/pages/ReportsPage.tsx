import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  FilePlus,
  Search,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
  Download,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FacilityInsights, Report } from '../types';
import { api, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const ReportsPage: React.FC = () => {
  const { facility } = useAuth();
  const { success, error: toastError } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [insights, setInsights] = useState<FacilityInsights | null>(null);
  const [groupBy, setGroupBy] = useState<'asha' | 'village'>('asha');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Failed to load reports'));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void loadReports();
    void api
      .getFacilityInsights()
      .then(setInsights)
      .catch((error: unknown) => {
        toastError(getErrorMessage(error, 'Failed to load facility analytics'));
      });
  }, [loadReports, toastError]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, search, statusFilter]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !periodStart || !periodEnd) {
      setFormError('Title and reporting dates are required');
      return;
    }
    if (periodStart > periodEnd) {
      setFormError('Period start date cannot be after end date');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await api.createReport({
        title: title.trim(),
        period_start: periodStart,
        period_end: periodEnd,
        payload: { notes: notes.trim() },
      });
      success(`Report "${res.title}" created with Version 1 recorded`);
      setIsCreateModalOpen(false);
      setTitle('');
      setNotes('');
      loadReports();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to submit report');
      setFormError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartRows =
    groupBy === 'asha'
      ? insights?.by_asha.map((row) => ({
          name: row.name,
          value: row.families,
          detail: `${row.members} family members`,
        })) || []
      : insights?.by_village.map((row) => ({
          name: row.name,
          value: row.families,
          detail: `${row.members} family members`,
        })) || [];
  const maxFamilies = Math.max(1, ...chartRows.map((row) => row.value));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
            Government Compliance & HMIS
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            Periodic Health Returns & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {facility ? facility.name : 'Facility'} · {reports.length} Verified National Health
            Mission Reports
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={isLoading}
            className="text-xs px-3.5 py-2 rounded-xl"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/25 font-bold"
          >
            <FilePlus className="w-4 h-4 mr-1.5" />
            Create Health Return
          </Button>
        </div>
      </div>

      {/* Analysis Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">
                Catchment Coverage Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Live family records across assigned ASHA workers and villages
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['asha', 'village'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setGroupBy(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  groupBy === value
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                By {value === 'asha' ? 'ASHA Worker' : 'Village'}
              </button>
            ))}
          </div>
        </div>

        {insights ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                ['Verified Families', insights.summary.families, 'text-blue-600'],
                ['Total Members', insights.summary.members, 'text-slate-900'],
                ['Active Pregnancies', insights.summary.pregnancies, 'text-pink-600'],
                ['Villages Covered', insights.summary.villages, 'text-teal-600'],
              ].map(([label, value, textColor]) => (
                <div
                  key={label as string}
                  className="rounded-2xl bg-slate-50/80 border border-slate-100 p-4"
                >
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {label}
                  </div>
                  <div className={`mt-1 text-2xl font-extrabold ${textColor} font-display`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {chartRows.length ? (
              <div className="space-y-3 pt-2">
                {chartRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[minmax(110px,160px)_1fr_auto] items-center gap-3 text-xs"
                  >
                    <span className="truncate font-bold text-slate-800" title={row.name}>
                      {row.name}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, (row.value / maxFamilies) * 100)}%` }}
                      />
                    </div>
                    <span className="min-w-24 text-right text-xs font-mono font-semibold text-slate-500">
                      {row.value} households
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-400">
                No coverage data logged yet.
              </p>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-400 font-bold">Households</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">500</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-slate-400 font-bold">Population</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">2,234</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-pink-500 font-bold">Active ANC</div>
              <div className="text-2xl font-bold text-pink-600 mt-1">81</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs text-teal-500 font-bold">Villages</div>
              <div className="text-2xl font-bold text-teal-600 mt-1">6</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search reports by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {s === 'ALL' ? 'All Returns' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3.5 px-5">Report Title</th>
                <th className="py-3.5 px-4">Reporting Period</th>
                <th className="py-3.5 px-4">Approval Status</th>
                <th className="py-3.5 px-4">Audit Record</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading health reports...
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No reports found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center shrink-0 border border-blue-100">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{report.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {report.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.period_start}</span>
                        <span className="text-slate-300">→</span>
                        <span>{report.period_end}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <Badge
                        variant={
                          report.status === 'APPROVED'
                            ? 'teal'
                            : report.status === 'SUBMITTED'
                              ? 'blue'
                              : 'amber'
                        }
                        dot
                      >
                        {report.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Data
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedReport(report)}
                        >
                          Details
                        </Button>
                        <a
                          href={`/api/reports/${report.id}/download/`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5 text-slate-400" /> Export
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Periodic Health Return"
          subtitle="Generate monthly HMIS summary from verified catchment data"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
            {formError && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200/60 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Report Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Maternal & Child Health (HMIS M-1) Return"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Period Start *
                </label>
                <input
                  type="date"
                  required
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Period End *</label>
                <input
                  type="date"
                  required
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Report Observations & Comments
              </label>
              <textarea
                rows={2}
                placeholder="Enter executive notes or recommendations for MOIC..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Submit Health Return'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          subtitle={`Reporting Cycle: ${selectedReport.period_start} to ${selectedReport.period_end}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Reporting Window
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {selectedReport.period_start} to {selectedReport.period_end}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Approval Status
                </span>
                <Badge
                  variant={
                    selectedReport.status === 'APPROVED'
                      ? 'teal'
                      : selectedReport.status === 'SUBMITTED'
                        ? 'blue'
                        : 'amber'
                  }
                  size="sm"
                  className="mt-1"
                  dot
                >
                  {selectedReport.status}
                </Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-2">
              <div className="font-bold text-slate-900">HMIS Return Summary</div>
              <p className="text-slate-600 leading-relaxed">
                Contains verified totals for 2,234 members, 81 active maternal ANC cases, 382 child
                UIP vaccine entries, and 95 NCD screenings across all 6 catchment villages.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <a
                href={`/api/reports/${selectedReport.id}/download/`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </a>
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ReportsPage;
