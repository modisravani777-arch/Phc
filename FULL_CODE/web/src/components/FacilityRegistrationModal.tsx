import React, { useState } from 'react';
import { Building2, MapPin, ShieldAlert } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/Toast';
import { getErrorMessage } from '../lib/api';

interface FacilityRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FacilityRegistrationModal: React.FC<FacilityRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerFacility, role } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [block, setBlock] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phcCode, setPhcCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !district.trim() || !state.trim()) {
      setErrorMsg('Name, District, and State are required');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      await registerFacility({
        name: name.trim(),
        facility_type: role || 'SUBCENTRE',
        district: district.trim(),
        state: state.trim(),
        block: block.trim(),
        address: address.trim(),
        location: location.trim(),
        phone: phone.trim(),
        email: email.trim(),
        phc_code: phcCode.trim(),
      });
      success(`Facility "${name.trim()}" registered successfully!`);
      onClose();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to register facility');
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Healthcare Facility"
      subtitle="Add the details for your health centre."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200/60 rounded-xl animate-fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">
          {role === 'PHC' ? 'Primary Health Centre profile' : 'Sub-Centre profile'}
        </div>

        {/* Facility Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Facility Official Name *
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="e.g. Rampur Primary Health Centre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-slate-50/50 hover:bg-white"
            />
          </div>
        </div>

        {/* Location Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              District *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-300 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. Alwar"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              State *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Rajasthan"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-slate-50/50 hover:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Block
            </label>
            <input
              type="text"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Mobile
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Address
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Location
            </label>
            <input
              type="text"
              placeholder="Village or locality"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
            />
          </div>
        </div>
        {role === 'SUBCENTRE' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              PHC identification code
            </label>
            <input
              type="text"
              placeholder="Enter the code provided by your PHC"
              value={phcCode}
              onChange={(e) => setPhcCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none bg-slate-50/50 hover:bg-white"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Register & Activate
          </Button>
        </div>
      </form>
    </Modal>
  );
};
