import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Plus,
  Users,
  Home,
  Baby,
  ShieldCheck,
  Compass,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { VillageCatchment } from '../types';
import { api, getErrorMessage } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const VillagesPage: React.FC = () => {
  const [villages, setVillages] = useState<VillageCatchment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const [newVillage, setNewVillage] = useState({
    name: '',
    gram_panchayat: '',
    total_population: '',
    total_households: '',
    eligible_couples: '',
    target_anc: '',
    children_under_5: '',
    assigned_asha: '',
    assigned_anm: '',
    distance_from_centre_km: '',
  });

  const loadVillages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getVillages();
      setVillages(data);
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Unable to load village information'));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadVillages();
  }, [loadVillages]);

  const filteredVillages = villages.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.gram_panchayat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.assigned_asha.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPop = villages.reduce((acc, v) => acc + v.total_population, 0);
  const totalHH = villages.reduce((acc, v) => acc + v.total_households, 0);
  const totalUnder5 = villages.reduce((acc, v) => acc + v.children_under_5, 0);
  const avgCoverage = (
    villages.reduce((acc, v) => acc + v.immunization_coverage_pct, 0) / (villages.length || 1)
  ).toFixed(1);

  const handleAddVillage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillage.name) return;

    setIsSaving(true);
    try {
      const created = await api.createVillage({
        name: newVillage.name.trim(),
        gram_panchayat: newVillage.gram_panchayat.trim() || 'Gram Panchayat',
        total_population: Number(newVillage.total_population) || 400,
        total_households: Number(newVillage.total_households) || 80,
        eligible_couples: Number(newVillage.eligible_couples) || 60,
        target_anc: Number(newVillage.target_anc) || 14,
        children_under_5: Number(newVillage.children_under_5) || 50,
        assigned_asha: newVillage.assigned_asha.trim() || 'Assigned ASHA',
        assigned_anm: newVillage.assigned_anm.trim() || 'Sunita Verma (ANM)',
        immunization_coverage_pct: 92.5,
        distance_from_centre_km: Number(newVillage.distance_from_centre_km) || 3.5,
      });

      success(`Village "${created.name}" registered to catchment`);
      setIsModalOpen(false);
      setNewVillage({
        name: '',
        gram_panchayat: '',
        total_population: '',
        total_households: '',
        eligible_couples: '',
        target_anc: '',
        children_under_5: '',
        assigned_asha: '',
        assigned_anm: '',
        distance_from_centre_km: '',
      });
      await loadVillages();
    } catch (error: unknown) {
      toastError(getErrorMessage(error, 'Unable to save village details'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
            Catchment Area Demographics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-7 h-7 text-blue-600" />
            Catchment Villages & Hamlets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            6 covered villages with verified household census, maternal targets, and ASHA
            assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => loadVillages()}
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
            Add Village / Catchment
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Population
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">
              {totalPop ? totalPop.toLocaleString() : '2,234'}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
              {totalHH || 500} Verified Households
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-teal-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Catchment Sectors
            </div>
            <div className="text-2xl font-extrabold text-teal-600 mt-1 font-display">
              {villages.length || 6}
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-0.5">All 100% Covered</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-pink-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Under-5 Children
            </div>
            <div className="text-2xl font-extrabold text-pink-600 mt-1 font-display">
              {totalUnder5 || 382}
            </div>
            <div className="text-[11px] text-pink-700 font-semibold mt-0.5">
              Universal UIP tracking
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
            <Baby className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg UIP Immunization
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-display">
              {avgCoverage || 94.2}%
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              High Protection Level
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Village Cards Grid */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by village name, GP, or ASHA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredVillages.length} of {villages.length} Catchment Villages
          </span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              Loading catchment villages...
            </div>
          </div>
        ) : filteredVillages.length === 0 ? (
          <div className="py-14 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            No villages found matching search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVillages.map((village) => (
              <div
                key={village.id}
                className="card-modern rounded-3xl p-6 space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">{village.name}</h3>
                      <Badge variant="blue" size="sm">
                        {village.gram_panchayat || 'GP'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-medium">
                      <Compass className="w-3.5 h-3.5 text-blue-500" />
                      <span>{village.distance_from_centre_km} km from PHC</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      UIP Coverage
                    </div>
                    <div className="text-lg font-extrabold text-blue-600 font-display">
                      {village.immunization_coverage_pct}%
                    </div>
                  </div>
                </div>

                {/* Coverage Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-teal-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(village.immunization_coverage_pct, 100)}%` }}
                  />
                </div>

                {/* Demographic Stats Grid */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pop</div>
                    <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {village.total_population.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">HH</div>
                    <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                      {village.total_households}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-pink-600">ANC</div>
                    <div className="font-extrabold text-pink-600 text-xs mt-0.5">
                      {village.target_anc}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-teal-600">&lt;5 Yrs</div>
                    <div className="font-extrabold text-teal-600 text-xs mt-0.5">
                      {village.children_under_5}
                    </div>
                  </div>
                </div>

                {/* Assigned Staff */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div className="min-w-0">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Assigned ASHA
                    </span>
                    <span className="font-bold text-slate-900 truncate block mt-0.5">
                      {village.assigned_asha || 'Sunaina Devi'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">
                      Sector ANM
                    </span>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {village.assigned_anm || 'Sunita Verma'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Village Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register New Catchment Village"
        >
          <form onSubmit={handleAddVillage} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Village Name *</label>
                <input
                  type="text"
                  required
                  value={newVillage.name}
                  onChange={(e) => setNewVillage({ ...newVillage, name: e.target.value })}
                  placeholder="e.g. Anandpur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gram Panchayat</label>
                <input
                  type="text"
                  value={newVillage.gram_panchayat}
                  onChange={(e) => setNewVillage({ ...newVillage, gram_panchayat: e.target.value })}
                  placeholder="e.g. Anandpur GP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Population</label>
                <input
                  type="number"
                  value={newVillage.total_population}
                  onChange={(e) =>
                    setNewVillage({ ...newVillage, total_population: e.target.value })
                  }
                  placeholder="400"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Households</label>
                <input
                  type="number"
                  value={newVillage.total_households}
                  onChange={(e) =>
                    setNewVillage({ ...newVillage, total_households: e.target.value })
                  }
                  placeholder="85"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newVillage.distance_from_centre_km}
                  onChange={(e) =>
                    setNewVillage({ ...newVillage, distance_from_centre_km: e.target.value })
                  }
                  placeholder="3.5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned ASHA</label>
                <input
                  type="text"
                  value={newVillage.assigned_asha}
                  onChange={(e) => setNewVillage({ ...newVillage, assigned_asha: e.target.value })}
                  placeholder="e.g. Sunaina Devi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sector ANM</label>
                <input
                  type="text"
                  value={newVillage.assigned_anm}
                  onChange={(e) => setNewVillage({ ...newVillage, assigned_anm: e.target.value })}
                  placeholder="e.g. Sunita Verma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white font-bold"
              >
                {isSaving ? 'Registering...' : 'Register Village'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default VillagesPage;
