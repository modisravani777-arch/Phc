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
  Building2,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FractalDotGrid } from '../components/ui/FractalDotGrid';
import { openCookiePreferences } from '../components/CookieConsent';

const features = [
  {
    icon: Users,
    title: 'Catchment Demographics & Families',
    description:
      'Real-time census covering 2,234 verified citizens and 500 households across 6 rural sectors.',
    badge: 'Demographics',
    accent: 'from-blue-500/10 to-indigo-500/10 border-blue-200/60 text-blue-600',
  },
  {
    icon: HeartPulse,
    title: 'Maternal Care (RMNCH+A)',
    description:
      'Track 81 active pregnancies with LMP, EDD calculations, TT vaccination, and Hb testing.',
    badge: 'Maternal Care',
    accent: 'from-pink-500/10 to-rose-500/10 border-pink-200/60 text-pink-600',
  },
  {
    icon: Baby,
    title: 'Universal Immunization (UIP)',
    description:
      'Monitor 382 infants and children with cold-chain vaccine history (BCG, OPV, Penta, MR).',
    badge: 'Child Health',
    accent: 'from-teal-500/10 to-emerald-500/10 border-teal-200/60 text-teal-600',
  },
  {
    icon: Package,
    title: 'Cold-Chain & Pharmacy Logistics',
    description:
      'Centralized drug inventory tracking Essential Medicines, 2°C–8°C vaccines, and expiry alerts.',
    badge: 'Logistics',
    accent: 'from-amber-500/10 to-orange-500/10 border-amber-200/60 text-amber-600',
  },
  {
    icon: Activity,
    title: 'NCD & Chronic Care Surveillance',
    description:
      'Hypertension and Diabetes screening clinics with BP and blood glucose tracking for high-risk patients.',
    badge: 'Chronic Care',
    accent: 'from-indigo-500/10 to-purple-500/10 border-indigo-200/60 text-indigo-600',
  },
  {
    icon: BarChart3,
    title: 'HMIS Automated Reporting',
    description:
      'Automated periodic returns, monthly M-1 summary reports, and verified Sub-Centre linkage audits.',
    badge: 'National Reporting',
    accent: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/60 text-emerald-600',
  },
];

export const LandingPage: React.FC = () => {
  const { isAuthenticated, facility } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900 selection:bg-blue-500/20 antialiased md:pb-0">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <img
              src="/app_icon.svg"
              alt="ArogyaSathi logo"
              className="h-11 w-11 rounded-2xl shadow-lg shadow-teal-500/25"
            />
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                ArogyaSathi
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                Primary Healthcare Platform
              </div>
            </div>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link
              to={isAuthenticated ? '/app/dashboard' : '/login'}
              className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-2xl hover:shadow-blue-600/35 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{isAuthenticated ? 'Open Clinic Workspace' : 'Sign in to Facility'}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32 border-b border-slate-200/80 bg-gradient-to-b from-white via-blue-50/25 to-slate-50">
          {/* Live Subtle Kinetic Mathematical Background */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-auto">
            <FractalDotGrid
              dotSize={4.0}
              dotSpacing={18}
              dotOpacity={0.4}
              waveIntensity={65}
              waveRadius={240}
              waveSpeed={0.85}
              waveMode="harmonic"
              dotColor="#3b82f6"
              glowColor="#0ea5e9"
              enableMouseGlow={true}
              enableClickRipples={true}
              initialPerformance="high"
            />
          </div>

          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-1/4 w-[420px] h-[420px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[380px] h-[380px] bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Foreground */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm shadow-blue-100">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Verified Rural Health Information Architecture</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                Frontline Health Teams,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500">
                  Fully Connected.
                </span>
              </h1>

              {/* Subtext */}
              <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl mx-auto font-medium">
                A unified operational workspace connecting Sub-Centres and Primary Health Centres —
                tracking maternal ANC, childhood vaccines, chronic diseases, and field ASHA health
                workers in real time.
              </p>

              {facility && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs font-bold text-emerald-800 backdrop-blur-sm shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authenticated Session: {facility.name}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to={isAuthenticated ? '/app/dashboard' : '/login'}
                  className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-8 py-4 text-sm font-extrabold text-white shadow-2xl shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>
                    {isAuthenticated ? 'Go to Command Dashboard' : 'Sign in to Health Facility'}
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:-translate-y-0.5"
                >
                  <span>Explore Capabilities</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Live Operational Metrics Showcase Card */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-white/90 border border-slate-200/80 shadow-2xl shadow-slate-200/50 backdrop-blur-xl max-w-4xl mx-auto">
              <div className="p-4 text-center space-y-1">
                <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight">
                  2,234
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Catchment Citizens
                </div>
                <div className="text-[10px] text-slate-400">6 Rural Villages</div>
              </div>

              <div className="p-4 text-center space-y-1 border-l border-slate-100">
                <div className="text-3xl sm:text-4xl font-black text-pink-600 tracking-tight">
                  81
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Active ANC Pregnancies
                </div>
                <div className="text-[10px] text-slate-400">RMNCH+A Tracked</div>
              </div>

              <div className="p-4 text-center space-y-1 border-l border-slate-100">
                <div className="text-3xl sm:text-4xl font-black text-teal-600 tracking-tight">
                  382
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Immunized Children
                </div>
                <div className="text-[10px] text-slate-400">UIP Schedule OK</div>
              </div>

              <div className="p-4 text-center space-y-1 border-l border-slate-100">
                <div className="text-3xl sm:text-4xl font-black text-amber-600 tracking-tight">
                  14
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Cold-Chain Items
                </div>
                <div className="text-[10px] text-slate-400">2°C–8°C Controlled</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1 rounded-full">
              Full Spectrum Clinical Stack
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Purpose-Built for Frontline Primary Care
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              Eliminate paper registry bottlenecks with real-time field-to-facility record keeping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-lg shadow-slate-100/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${feature.accent}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Two-Tier Architecture Callout */}
        <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Two-Tier Care Architecture</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  Bridging Primary Health Centres & Rural Sub-Centres
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Medical Officers at the PHC maintain complete oversight over affiliated
                  Sub-Centres. Clinical visits, ASHA worker fieldwork, high-risk pregnancy alerts,
                  and vaccine distribution stay perfectly synchronized.
                </p>
                <div className="pt-2">
                  <Link
                    to={isAuthenticated ? '/app/dashboard' : '/login'}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-400 px-6 py-3.5 text-xs font-extrabold text-white shadow-xl shadow-blue-500/25 transition-all hover:from-blue-400 hover:to-teal-300 hover:-translate-y-0.5"
                  >
                    <span>Launch Clinical Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    PHC
                  </div>
                  <div className="text-sm font-extrabold text-white">Primary Health Centre</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Doctor consultations, cold-chain depot, HMIS aggregate reporting, and Sub-Centre
                    supervisory approvals.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    SC
                  </div>
                  <div className="text-sm font-extrabold text-white">Sub-Centre (Health Post)</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ANM field operations, weekly VHSND immunization camps, home ANC visits, and
                    real-time danger escalations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-slate-900">ArogyaSathi</span>
            <span>·</span>
            <span>National Rural Health Mission (NRHM) Standard Compliant</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-slate-600">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-blue-600 transition-colors">
              Terms
            </Link>
            <button
              type="button"
              onClick={openCookiePreferences}
              className="hover:text-blue-600 transition-colors"
            >
              Cookie preferences
            </button>
            <Link to="/login" className="hover:text-blue-600 transition-colors">
              Facility Login
            </Link>
            <Link to="/app/dashboard" className="hover:text-blue-600 transition-colors">
              Clinical Workspace
            </Link>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur md:hidden">
        <Link
          to={isAuthenticated ? '/app/dashboard' : '/login'}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white shadow-md transition hover:bg-teal-800"
        >
          {isAuthenticated ? 'Open Clinic Workspace' : 'Sign in to Facility'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
