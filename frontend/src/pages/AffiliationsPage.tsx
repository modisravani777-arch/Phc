import React, { useState, useEffect } from 'react';
import {
  Network,
  PlusCircle,
  Building,
  AlertCircle,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Affiliation } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

export const AffiliationsPage: React.FC = () => {
  const { facility } = useAuth();
  const { success, error: toastError } = useToast();

  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [phcId, setPhcId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'maternal_referrals',
    'monthly_supervision',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'REJECT';
    affiliation: Affiliation | null;
  }>({
    isOpen: false,
    type: 'APPROVE',
    affiliation: null,
  });
  const [decisionReason, setDecisionReason] = useState('');
  const [isDeciding, setIsDeciding] = useState(false);

  const isSubCentre = facility?.facility_type === 'SUBCENTRE';
  const isPHC = facility?.facility_type === 'PHC';

  const loadAffiliations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAffiliations();
      setAffiliations(data);
    } catch (err: any) {
      toastError(err?.message || 'Failed to load affiliations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliations();
  }, []);

  const filteredAffiliations = affiliations.filter((a) => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  const handleCreateAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phcId.trim()) {
      setRequestError('PHC identification code is required');
      return;
    }

    setIsSubmitting(true);
    setRequestError(null);
    try {
      await api.createAffiliation({
        phc_id: phcId.trim(),
        permissions: selectedPermissions,
      });
      success('Affiliation request submitted to parent PHC');
      setIsRequestModalOpen(false);
      setPhcId('');
      loadAffiliations();
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit affiliation request';
      setRequestError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal.affiliation) return;

    setIsDeciding(true);
    try {
      if (decisionModal.type === 'APPROVE') {
        await api.approveAffiliation(decisionModal.affiliation.id, decisionReason.trim());
        success(`Affiliation request approved for ${decisionModal.affiliation.subcentre}`);
      } else {
        await api.rejectAffiliation(decisionModal.affiliation.id, decisionReason.trim());
        success(`Affiliation request rejected for ${decisionModal.affiliation.subcentre}`);
      }
      setDecisionModal({ isOpen: false, type: 'APPROVE', affiliation: null });
      setDecisionReason('');
      loadAffiliations();
    } catch (err: any) {
      toastError(err?.message || 'Failed to process decision');
    } finally {
      setIsDeciding(false);
    }
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
            Care Network & Supervision
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Facility Affiliations & Referrals
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hierarchical linkage between PHC hubs and Sub-Centre spokes
          </p>
        </div>

        {isSubCentre && (
          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => {
              setRequestError(null);
              setIsRequestModalOpen(true);
            }}
          >
            Request Affiliation
          </Button>
        )}
      </div>

      {/* Role Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/60 shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-navy-900">
              Facility Classification:{' '}
              <span className="text-brand-600">
                {facility ? facility.facility_type : 'Unconfigured'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {isPHC
                ? 'As a PHC, you review incoming affiliation requests from sub-centres.'
                : 'As a Sub-Centre, you submit affiliation requests to your parent PHC.'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm w-fit text-xs font-bold">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              statusFilter === s
                ? 'bg-gradient-to-r from-navy-800 to-navy-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s === 'ALL' ? 'All Linkages' : s}
          </button>
        ))}
      </div>

      {/* Affiliations List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-purple-50 mx-auto mb-3 flex items-center justify-center">
              <Network className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            <p className="text-sm text-slate-400">Loading facility affiliations...</p>
          </div>
        ) : filteredAffiliations.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/60 shadow-card">
            <Network className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="font-bold text-base text-navy-900">No affiliations recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isSubCentre
                ? 'Connect your Sub-Centre to a parent PHC by submitting an affiliation request.'
                : 'No pending or approved sub-centre affiliations found.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 stagger-children">
            {filteredAffiliations.map((aff) => (
              <div
                key={aff.id}
                className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Facility Affiliation
                      </div>
                      <div className="text-base font-extrabold text-navy-900 mt-1 flex items-center gap-2">
                        <span>{aff.subcentre}</span>
                        <ArrowRight className="w-4 h-4 text-brand-400" />
                        <span>{aff.phc}</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        aff.status === 'APPROVED' ? 'teal'
                        : aff.status === 'PENDING' ? 'amber'
                        : 'rose'
                      }
                      dot
                    >
                      {aff.status}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Permissions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {aff.permissions && aff.permissions.length > 0 ? (
                        aff.permissions.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-mono border border-slate-100">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-300 italic">Standard access</span>
                      )}
                    </div>
                  </div>

                  {aff.decision_reason && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                      <span className="font-bold text-navy-900">Decision: </span>
                      {aff.decision_reason}
                    </div>
                  )}
                </div>

                {isPHC && aff.status === 'PENDING' && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<X className="w-3.5 h-3.5" />}
                      onClick={() => setDecisionModal({ isOpen: true, type: 'REJECT', affiliation: aff })}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => setDecisionModal({ isOpen: true, type: 'APPROVE', affiliation: aff })}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request PHC Linkage"
        subtitle="Sub-Centres request parent PHC supervision and referral validation"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAffiliation} className="space-y-4">
          {requestError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200/60 rounded-xl animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{requestError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              PHC identification code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
              value={phcId}
              onChange={(e) => setPhcId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-slate-50/50 hover:bg-white"
            />
            <span className="text-[11px] text-slate-300 mt-1 block">Enter the code shown in the PHC profile.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Requested Permissions
            </label>
            <div className="space-y-2 text-xs">
              {[
                { id: 'maternal_referrals', label: 'Maternal & High-Risk Referrals' },
                { id: 'monthly_supervision', label: 'Monthly Supervision & Quality Review' },
                { id: 'supply_requisitions', label: 'Vaccine & Medical Supply Requisitions' },
                { id: 'vital_statistics', label: 'Birth & Death Vital Registration' },
              ].map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/60 hover:bg-brand-50/30 hover:border-brand-200 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-navy-900 font-medium">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Submit Affiliation</Button>
          </div>
        </form>
      </Modal>

      {/* Decision Modal */}
      {decisionModal.isOpen && (
        <Modal
          isOpen={decisionModal.isOpen}
          onClose={() => setDecisionModal({ isOpen: false, type: 'APPROVE', affiliation: null })}
          title={decisionModal.type === 'APPROVE' ? 'Approve Affiliation' : 'Reject Affiliation'}
          subtitle={`Sub-centre: ${decisionModal.affiliation?.subcentre}`}
          maxWidth="sm"
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Decision Reason / Notes
              </label>
              <textarea
                rows={3}
                placeholder={decisionModal.type === 'APPROVE' ? 'Optional approval comments...' : 'Reason for rejection...'}
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setDecisionModal({ isOpen: false, type: 'APPROVE', affiliation: null })} disabled={isDeciding}>Cancel</Button>
              <Button type="submit" variant={decisionModal.type === 'APPROVE' ? 'success' : 'danger'} size="sm" isLoading={isDeciding}>
                Confirm {decisionModal.type === 'APPROVE' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
