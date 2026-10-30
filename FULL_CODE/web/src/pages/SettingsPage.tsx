import React, { useEffect, useState } from 'react';
import { BadgeCheck, Building, Mail, MapPin, Phone, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { facility, role, saveFacility } = useAuth();
  const { success, error: toastError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    location: '',
    block: '',
    district: '',
    state: '',
    phone: '',
    email: '',
    phc_code: '',
  });

  useEffect(() => {
    if (!facility) return;
    setForm({
      name: facility.name,
      address: facility.address || '',
      location: facility.location || '',
      block: facility.block || '',
      district: facility.district,
      state: facility.state,
      phone: facility.phone || '',
      email: facility.email || '',
      phc_code: facility.phc_code || '',
    });
  }, [facility]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      await saveFacility({
        ...form,
        phc_code: form.phc_code.trim().toUpperCase(),
      });
      success('Facility profile saved');
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Unable to save facility profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!facility) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card">
        <Building className="mx-auto mb-3 h-10 w-10 text-brand-500" />
        <h1 className="text-xl font-extrabold text-navy-900">Complete your facility profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add the contact and location details for this health centre.
        </p>
      </div>
    );
  }

  const Field = ({
    label,
    value,
    field,
    type = 'text',
  }: {
    label: string;
    value: string;
    field: keyof typeof form;
    type?: string;
  }) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => update(field, event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12 animate-fade-in">
      <header className="border-b border-slate-200/70 pb-5">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-brand-600">
          {role === 'PHC' ? 'Primary Health Centre' : 'Sub-Centre'}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy-900">Facility profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the contact and location details shown to your health network.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-navy-900">{facility.name}</h2>
              <p className="text-xs text-slate-500">
                {role === 'PHC' ? 'Primary Health Centre' : 'Sub-Centre'}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Identification code
            </div>
            <div className="font-mono text-sm font-bold text-navy-800">{facility.code}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facility name" value={form.name} field="name" />
            <Field label="Block" value={form.block} field="block" />
            <Field label="District" value={form.district} field="district" />
            <Field label="State" value={form.state} field="state" />
            <Field label="Location" value={form.location} field="location" />
            <Field label="Mobile" value={form.phone} field="phone" type="tel" />
            <Field label="Email" value={form.email} field="email" type="email" />
            {role === 'SUBCENTRE' && (
              <Field label="Affiliated PHC code" value={form.phc_code} field="phc_code" />
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Address
            </span>
            <textarea
              rows={3}
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>

          {role === 'SUBCENTRE' && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                facility.phc_code ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <BadgeCheck className="h-4 w-4 shrink-0" />
              {facility.phc_code
                ? `Connected to ${facility.phc_name} (${facility.phc_code})`
                : 'Enter a PHC identification code to connect this Sub-Centre.'}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>All updates will reflect across clinical registers and staff directories.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              className="px-7 py-3 font-extrabold rounded-2xl text-xs sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all self-end sm:self-auto shrink-0"
              icon={<Save className="h-4 w-4 mr-1.5" />}
            >
              Save Profile
            </Button>
          </div>
        </form>

        <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-500" />
            {facility.location || facility.district}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand-500" />
            {facility.phone || 'Mobile not added'}
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-500" />
            {facility.email || 'Email not added'}
          </div>
        </div>
      </div>
    </div>
  );
};
