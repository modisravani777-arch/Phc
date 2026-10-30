import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Radio, ShieldCheck } from 'lucide-react';
import { FractalDotGrid } from '../ui/FractalDotGrid';
import type { GridConfig } from './fractalGridConfig';

type ViewMode = 'studio' | 'hero' | 'code';

interface FractalGridHeroPreviewProps {
  config: GridConfig;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
}

export const FractalGridHeroPreview = ({
  config,
  viewMode,
  setViewMode,
}: FractalGridHeroPreviewProps) => (
  <>
    {/* VIEW 1: HERO MOCKUP PREVIEW */}
    {viewMode === 'hero' && (
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-slate-950 shadow-2xl min-h-[580px] flex items-center justify-center p-8 sm:p-14 animate-fade-in">
        {/* Live Interactive Grid Behind Hero */}
        <div className="absolute inset-0 z-0">
          <FractalDotGrid {...config} />
        </div>

        {/* Subtle radial shading for text contrast */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950/60 to-slate-950/90 pointer-events-none z-1" />

        {/* Hero Interactive Foreground Content */}
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.15] text-xs font-bold text-sky-300 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Next-Gen Healthcare Autonomous Telemetry</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Frontline Health{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-fuchsia-400">
              Intelligent Matrix
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Real-time ANC maternal vitals, sub-zero cold chain vaccine trackers, and verified HMIS
            analytics orchestrated seamlessly on a unified reactive interface.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/app/dashboard"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-600 hover:from-indigo-400 hover:to-sky-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              Enter Facility Dashboard
            </Link>

            <button
              onClick={() => setViewMode('studio')}
              className="px-6 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white font-bold text-sm backdrop-blur-md transition-all"
            >
              Configure Wave Physics
            </button>
          </div>

          {/* Floating Glass Telemetry Cards */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.1] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Cold-Chain Status</span>
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              </div>
              <div className="text-xl font-black text-emerald-400">2.4°C / Optimal</div>
              <div className="text-[10px] text-slate-400">14 Vaccine vials monitored</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.1] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>Maternal ANC Registry</span>
                <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <div className="text-xl font-black text-pink-400">81 Registered</div>
              <div className="text-[10px] text-slate-400">Zero active high-risk alerts</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.1] space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>HMIS Synchronization</span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl font-black text-sky-400">100% Synced</div>
              <div className="text-[10px] text-slate-400">Neon Postgres cloud ledger</div>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
