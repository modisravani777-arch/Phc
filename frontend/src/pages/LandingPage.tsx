import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  HeartPulse,
  Users,
  ShieldCheck,
  Package,
  Baby,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: Users,
    title: 'Catchment Demographics & Families',
    description: 'Real-time census covering 2,234 verified citizens and 500 households across 6 rural sectors.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: HeartPulse,
    title: 'Maternal & Child Health (RMNCH+A)',
    description: 'Track 81 active pregnancies with LMP, EDD calculations, TT vaccination, and Hb testing.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: Baby,
    title: 'Universal Immunization (UIP)',
    description: 'Monitor 382 infants and children with cold-chain vaccine history (BCG, OPV, Penta, MR) and MUAC nutritional status.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: Package,
    title: 'Cold-Chain & Pharmacy Logistics',
    description: 'Centralized drug inventory tracking Essential Medicines, 2°C–8°C vaccines, buffer thresholds, and expiry alerts.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Activity,
    title: 'NCD & Chronic Care Surveillance',
    description: 'Hypertension and Diabetes screening clinics with BP and blood glucose tracking for 95 high-risk patients.',
    color: 'bg-indigo-50 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'National Health Mission HMIS Reporting',
    description: 'Automated periodic returns, monthly M-1 summary reports, and verified Sub-Centre linkage audits.',
    color: 'bg-emerald-50 text-emerald-600',
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, facility } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-blue-500/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 text-xl font-black text-white shadow-lg shadow-blue-500/30">
              ✚
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                ArogyaSathi
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                Primary Healthcare Platform
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/app/dashboard' : '/login'}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30"
            >
              {isAuthenticated ? 'Open Clinic Workspace' : 'Sign in to Facility'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28 border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/20 to-slate-50">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Connected Rural Primary Healthcare</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Frontline Health Teams,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                  Fully Connected.
                </span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto">
                A unified operational workspace connecting Sub-Centres and Primary Health Centres — tracking maternal ANC, childhood vaccines, chronic diseases, and emergency danger escalations in real time.
              </p>

              {facility && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected to {facility.name}</span>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
                <Link
                  to={isAuthenticated ? '/app/dashboard' : '/login'}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:-translate-y-0.5"
                >
                  {isAuthenticated ? 'Go to Command Dashboard' : 'Sign in to Health Facility'} <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  className="rounded-xl border border-slate-200/90 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 shadow-xs"
                >
                  Explore Capabilities
                </a>
              </div>
            </div>

            {/* Live Operational Metrics Showcase Card */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-3xl bg-white/90 border border-slate-200/90 shadow-xl backdrop-blur-sm max-w-4xl mx-auto">
              <div className="p-4 text-center">
                <div className="text-3xl font-extrabold text-blue-600 font-display">2,234</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">Catchment Members</div>
              </div>
              <div className="p-4 text-center border-l border-slate-100">
                <div className="text-3xl font-extrabold text-pink-600 font-display">81</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">Active ANC Pregnancies</div>
              </div>
              <div className="p-4 text-center border-l border-slate-100">
                <div className="text-3xl font-extrabold text-teal-600 font-display">382</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">Children Immunized</div>
              </div>
              <div className="p-4 text-center border-l border-slate-100">
                <div className="text-3xl font-extrabold text-amber-600 font-display">6</div>
                <div className="text-xs font-bold text-slate-500 mt-0.5">Villages Covered</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">
              Clinical Workflows
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Complete Digital Health Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Built specifically for the operational demands of Indian Primary Healthcare Centres and Sub-Centres.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="card-modern rounded-3xl p-7 space-y-4 relative"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} shadow-xs`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">ArogyaSathi Health Platform</span>
            <span>· National Rural Health Network</span>
          </div>
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Facility Sign In →
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
