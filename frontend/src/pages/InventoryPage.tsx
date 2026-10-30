import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertOctagon,
  CheckCircle2,
  Thermometer,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { InventoryItem } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { success, error: toastError } = useToast();

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'MEDICINE' as InventoryItem['category'],
    batch_number: '',
    current_stock: '',
    unit: 'Tablets',
    min_reorder_level: '',
    expiry_date: '',
    storage_location: '',
  });

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getInventory(activeCategory, searchQuery);
      setItems(data);
    } catch (err: any) {
      toastError(err?.message || 'Unable to load supplies');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadInventory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.current_stock) return;

    setIsSaving(true);
    try {
      const stock = Number(newItem.current_stock);
      const minLevel = Number(newItem.min_reorder_level) || 50;

      const created = await api.createInventory({
        name: newItem.name.trim(),
        category: newItem.category,
        batch_number: newItem.batch_number.trim(),
        current_stock: stock,
        unit: newItem.unit,
        min_reorder_level: minLevel,
        expiry_date: newItem.expiry_date || undefined,
        storage_location: newItem.storage_location.trim(),
      });

      success(`Item "${created.name}" added to supplies`);
      setIsModalOpen(false);
      setNewItem({
        name: '',
        category: 'MEDICINE',
        batch_number: '',
        current_stock: '',
        unit: 'Tablets',
        min_reorder_level: '',
        expiry_date: '',
        storage_location: '',
      });
      await loadInventory();
    } catch (err: any) {
      toastError(err?.message || 'Unable to save supply item');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: InventoryItem['status']) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge variant="green" dot>Adequate</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="amber" dot>Low Buffer</Badge>;
      case 'CRITICAL':
        return <Badge variant="red" dot>Critical Shortage</Badge>;
      case 'EXPIRED':
        return <Badge variant="red">Expired</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: InventoryItem['category']) => {
    switch (category) {
      case 'MEDICINE':
        return <Badge variant="blue">Medicine</Badge>;
      case 'VACCINE':
        return <Badge variant="teal">Cold-Chain Vaccine</Badge>;
      case 'CONSUMABLE':
        return <Badge variant="purple">Consumable</Badge>;
      case 'DIAGNOSTIC_KIT':
        return <Badge variant="pink">Diagnostic Kit</Badge>;
      default:
        return <Badge variant="slate">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
            Pharmacy & Cold-Chain Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-600" />
            Medical Supplies & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cold-chain vaccines (2°C–8°C), essential primary medicines, and diagnostics with buffer tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/25 font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Receive / Register Item
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-blue-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stock Items</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-display">{items.length}</div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Catalogued SKUs</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-teal-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cold-Chain Vaccines</div>
            <div className="text-2xl font-extrabold text-teal-600 mt-1 font-display">
              {items.filter((i) => i.category === 'VACCINE').length}
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-teal-500" /> ILR 2°C–8°C Stable
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-amber-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reorder Alerts</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1 font-display">
              {items.filter((i) => i.status === 'LOW_STOCK' || i.status === 'CRITICAL').length}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">Below buffer threshold</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="card-modern p-5 rounded-2xl flex items-center justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Readiness</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1 font-display">
              {items.length > 0
                ? `${Math.round(((items.length - items.filter((i) => i.status === 'CRITICAL').length) / items.length) * 100)}%`
                : '100%'}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Readiness index</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl">
            {[
              { id: 'ALL', label: 'All Supplies' },
              { id: 'MEDICINE', label: 'Essential Medicines' },
              { id: 'VACCINE', label: 'Vaccines (2-8°C)' },
              { id: 'DIAGNOSTIC_KIT', label: 'Diagnostic Kits' },
              { id: 'CONSUMABLE', label: 'Consumables' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeCategory === tab.id
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
              placeholder="Search drug name, batch, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Medicine / Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Batch & Storage</th>
                <th className="py-3.5 px-4">Available Stock</th>
                <th className="py-3.5 px-4">Reorder Buffer</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Loading medical supplies...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No items recorded matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const stockPct = Math.min(100, Math.round((item.current_stock / (item.min_reorder_level * 2 || 100)) * 100));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{item.item_code}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getCategoryBadge(item.category)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-700 text-xs font-semibold">
                          {item.batch_number || 'BATCH-01'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.storage_location}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900 text-sm">
                          {item.current_stock.toLocaleString()}{' '}
                          <span className="text-slate-500 font-sans text-xs font-normal">{item.unit}</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'CRITICAL'
                                ? 'bg-rose-500'
                                : item.status === 'LOW_STOCK'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(10, stockPct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {item.min_reorder_level.toLocaleString()} {item.unit}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {item.expiry_date || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Receive & Register Supply Shipment"
        >
          <form onSubmit={handleAddItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Item / Medicine Name *</label>
              <input
                type="text"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg Capsules"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="MEDICINE">Essential Medicine</option>
                  <option value="VACCINE">Cold-Chain Vaccine (2-8°C)</option>
                  <option value="DIAGNOSTIC_KIT">Diagnostic Test Kit</option>
                  <option value="CONSUMABLE">Medical Consumable</option>
                  <option value="EQUIPMENT">Clinical Equipment</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={newItem.batch_number}
                  onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })}
                  placeholder="e.g. BATCH-2024A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  value={newItem.current_stock}
                  onChange={(e) => setNewItem({ ...newItem, current_stock: e.target.value })}
                  placeholder="500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit</label>
                <select
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  <option value="Tablets">Tablets</option>
                  <option value="Capsules">Capsules</option>
                  <option value="Vials">Vials</option>
                  <option value="Ampoules">Ampoules</option>
                  <option value="Sachets">Sachets</option>
                  <option value="Tests">Tests</option>
                  <option value="Units">Units</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Buffer Level</label>
                <input
                  type="number"
                  value={newItem.min_reorder_level}
                  onChange={(e) => setNewItem({ ...newItem, min_reorder_level: e.target.value })}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newItem.expiry_date}
                  onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Storage Location</label>
                <input
                  type="text"
                  value={newItem.storage_location}
                  onChange={(e) => setNewItem({ ...newItem, storage_location: e.target.value })}
                  placeholder="e.g. ILR Unit 1 or Shelf B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white font-bold">
                {isSaving ? 'Registering...' : 'Register Item'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
export default InventoryPage;
