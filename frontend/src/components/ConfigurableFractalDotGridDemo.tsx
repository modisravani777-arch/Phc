import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2,
  RotateCcw,
  Waves,
  Zap,
  Code2,
  Palette,
  Layers,
  Dices,
  Camera,
  ArrowLeft,
  Activity,
  HeartPulse,
  ShieldCheck,
  Radio,
  MonitorPlay,
} from 'lucide-react';
import { FractalDotGrid, FractalDotGridProps, WaveMode } from './ui/FractalDotGrid';
import { useToast } from './ui/Toast';

export interface GridConfig extends FractalDotGridProps {
  dotSize: number;
  dotSpacing: number;
  dotOpacity: number;
  waveIntensity: number;
  waveRadius: number;
  waveSpeed: number;
  waveMode: WaveMode;
  dotColor: string;
  glowColor: string;
  enableNoise: boolean;
  noiseOpacity: number;
  enableMouseGlow: boolean;
  enableClickRipples: boolean;
  enableLines: boolean;
  initialPerformance: 'low' | 'medium' | 'high';
}

const initialConfig: GridConfig = {
  dotSize: 5.5,
  dotSpacing: 15,
  dotOpacity: 0.8,
  waveIntensity: 85,
  waveRadius: 240,
  waveSpeed: 1.0,
  waveMode: 'harmonic',
  dotColor: '#6366f1',
  glowColor: '#38bdf8',
  enableNoise: false,
  noiseOpacity: 0.04,
  enableMouseGlow: true,
  enableClickRipples: true,
  enableLines: false,
  initialPerformance: 'high',
};

interface Preset {
  name: string;
  subtitle: string;
  badge: string;
  gradient: string;
  glowBorder: string;
  config: Partial<GridConfig>;
}

const PRESETS: Preset[] = [
  {
    name: 'Quantum Cyan',
    subtitle: 'Deep space harmonic field',
    badge: '🌌 Deep Space',
    gradient: 'from-cyan-500/20 via-sky-500/10 to-transparent',
    glowBorder: 'border-cyan-500/40 hover:border-cyan-400',
    config: {
      dotSize: 5.2,
      dotSpacing: 15,
      dotOpacity: 0.85,
      waveIntensity: 88,
      waveRadius: 260,
      waveSpeed: 1.1,
      waveMode: 'harmonic',
      dotColor: '#38bdf8',
      glowColor: '#818cf8',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: false,
      enableNoise: false,
    },
  },
  {
    name: 'Cyberpunk Neon',
    subtitle: 'Ultraviolet kinetic pulse',
    badge: '💜 Synthwave',
    gradient: 'from-fuchsia-500/20 via-purple-500/10 to-transparent',
    glowBorder: 'border-fuchsia-500/40 hover:border-fuchsia-400',
    config: {
      dotSize: 6.0,
      dotSpacing: 14,
      dotOpacity: 0.9,
      waveIntensity: 96,
      waveRadius: 280,
      waveSpeed: 1.3,
      waveMode: 'pulse',
      dotColor: '#ec4899',
      glowColor: '#a855f7',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: true,
      enableNoise: true,
      noiseOpacity: 0.04,
    },
  },
  {
    name: 'Neural Emerald',
    subtitle: 'Bioluminescent clinic mesh',
    badge: '🌿 Health Bio',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    glowBorder: 'border-emerald-500/40 hover:border-emerald-400',
    config: {
      dotSize: 4.8,
      dotSpacing: 16,
      dotOpacity: 0.8,
      waveIntensity: 75,
      waveRadius: 230,
      waveSpeed: 0.95,
      waveMode: 'harmonic',
      dotColor: '#10b981',
      glowColor: '#14b8a6',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: true,
      enableNoise: false,
    },
  },
  {
    name: 'Solar Flare',
    subtitle: 'Thermonuclear radiant gold',
    badge: '☀️ Radiant',
    gradient: 'from-amber-500/20 via-rose-500/10 to-transparent',
    glowBorder: 'border-amber-500/40 hover:border-amber-400',
    config: {
      dotSize: 5.6,
      dotSpacing: 14,
      dotOpacity: 0.85,
      waveIntensity: 90,
      waveRadius: 250,
      waveSpeed: 1.2,
      waveMode: 'vortex',
      dotColor: '#f59e0b',
      glowColor: '#f43f5e',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: false,
      enableNoise: false,
    },
  },
  {
    name: 'Obsidian Diamond',
    subtitle: 'Monochrome luxury glass',
    badge: '💎 Pure Lux',
    gradient: 'from-slate-400/20 via-slate-600/10 to-transparent',
    glowBorder: 'border-slate-400/40 hover:border-slate-300',
    config: {
      dotSize: 4.5,
      dotSpacing: 15,
      dotOpacity: 0.7,
      waveIntensity: 65,
      waveRadius: 210,
      waveSpeed: 0.85,
      waveMode: 'harmonic',
      dotColor: '#94a3b8',
      glowColor: '#ffffff',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: false,
      enableNoise: false,
    },
  },
  {
    name: 'Matrix Cascade',
    subtitle: 'Digital cyber stream',
    badge: '⚡ Digital Rain',
    gradient: 'from-lime-500/20 via-emerald-500/10 to-transparent',
    glowBorder: 'border-lime-500/40 hover:border-lime-400',
    config: {
      dotSize: 5.0,
      dotSpacing: 13,
      dotOpacity: 0.9,
      waveIntensity: 92,
      waveRadius: 250,
      waveSpeed: 1.35,
      waveMode: 'matrix',
      dotColor: '#84cc16',
      glowColor: '#22c55e',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: false,
      enableNoise: true,
      noiseOpacity: 0.05,
    },
  },
];

const COLOR_SWATCHES = [
  '#38bdf8', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#10b981', // emerald
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#ffffff', // white
  '#94a3b8', // slate
];

export const ConfigurableFractalDotGridDemo: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'presets' | 'waves' | 'dots' | 'effects' | 'engine'>('presets');
  const [viewMode, setViewMode] = useState<'studio' | 'hero' | 'code'>('studio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const { success: toastSuccess, info: toastInfo } = useToast();

  const updateConfig = <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (index: number) => {
    setActivePresetIndex(index);
    setConfig((prev) => ({ ...prev, ...PRESETS[index].config }));
    toastSuccess(`Applied ${PRESETS[index].name} theme preset`);
  };

  const randomizeAll = () => {
    const waveModes: WaveMode[] = ['harmonic', 'vortex', 'pulse', 'matrix'];
    const randomMode = waveModes[Math.floor(Math.random() * waveModes.length)];
    const randomColor1 = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    let randomColor2 = COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)];
    if (randomColor1 === randomColor2) randomColor2 = '#ffffff';

    setConfig({
      dotSize: parseFloat((Math.random() * 4 + 3.5).toFixed(1)),
      dotSpacing: Math.floor(Math.random() * 10 + 12),
      dotOpacity: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)),
      waveIntensity: Math.floor(Math.random() * 40 + 60),
      waveRadius: Math.floor(Math.random() * 160 + 160),
      waveSpeed: parseFloat((Math.random() * 0.8 + 0.7).toFixed(2)),
      waveMode: randomMode,
      dotColor: randomColor1,
      glowColor: randomColor2,
      enableNoise: Math.random() > 0.6,
      noiseOpacity: 0.04,
      enableMouseGlow: true,
      enableClickRipples: true,
      enableLines: Math.random() > 0.5,
      initialPerformance: 'high',
    });

    toastInfo('Generated mathematical wave matrix');
  };

  const copyConfigToClipboard = () => {
    const configString = `// Generated with ArogyaSathi Fractal Dot Grid Studio
import { FractalDotGrid } from "@/components/ui/FractalDotGrid";

export function HeroInteractiveGrid() {
  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-3xl bg-slate-950">
      <FractalDotGrid
        dotSize={${config.dotSize}}
        dotSpacing={${config.dotSpacing}}
        dotOpacity={${config.dotOpacity}}
        waveIntensity={${config.waveIntensity}}
        waveRadius={${config.waveRadius}}
        waveSpeed={${config.waveSpeed}}
        waveMode="${config.waveMode}"
        dotColor="${config.dotColor}"
        glowColor="${config.glowColor}"
        enableNoise={${config.enableNoise}}
        noiseOpacity={${config.noiseOpacity}}
        enableMouseGlow={${config.enableMouseGlow}}
        enableClickRipples={${config.enableClickRipples}}
        enableLines={${config.enableLines}}
        initialPerformance="${config.initialPerformance}"
      />
    </div>
  );
}`;

    navigator.clipboard.writeText(configString).then(() => {
      setIsCopied(true);
      toastSuccess('Component code copied to clipboard');
      setTimeout(() => setIsCopied(false), 2400);
    });
  };

  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const takeSnapshot = () => {
    const canvas = canvasContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `fractal-grid-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toastSuccess('Canvas snapshot exported as PNG');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Top Glass Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Brand Left */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-400 hover:text-white transition-all mr-1"
              title="Return to Clinic Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                    Fractal Dynamics Studio
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-xs">
                    v2.5 PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  High-Fidelity Math Canvas Engine for Next-Gen User Experiences
                </p>
              </div>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="hidden md:flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setViewMode('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'studio'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Canvas Studio</span>
            </button>

            <button
              onClick={() => setViewMode('hero')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'hero'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              <span>Live Hero Mockup</span>
            </button>

            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'code'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Export Code</span>
            </button>
          </div>

          {/* Quick Action Tools Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={randomizeAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-200 hover:text-white transition-all shadow-xs"
              title="Generate harmonious random wave configuration"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Randomize</span>
            </button>

            <button
              onClick={takeSnapshot}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-slate-300 hover:text-white transition-all"
              title="Download Canvas Snapshot PNG"
            >
              <Camera className="w-4 h-4 text-sky-400" />
            </button>

            <button
              onClick={copyConfigToClipboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
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
                Real-time ANC maternal vitals, sub-zero cold chain vaccine trackers, and verified HMIS analytics orchestrated seamlessly on a unified reactive interface.
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

        {/* VIEW 2: INTERACTIVE CANVAS STUDIO */}
        <div className={`space-y-6 ${viewMode === 'hero' ? 'hidden' : ''}`}>
          {/* Main Visualizer Window */}
          <div
            ref={canvasContainerRef}
            className={`relative rounded-3xl overflow-hidden border border-white/[0.12] bg-[#050914] shadow-2xl transition-all ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[520px] sm:h-[580px] w-full'
            }`}
          >
            {/* Ambient Background Aura */}
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-40 transition-colors duration-700"
              style={{ backgroundColor: config.glowColor }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-30 transition-colors duration-700"
              style={{ backgroundColor: config.dotColor }}
            />

            {/* The Live Interactive Canvas Component */}
            <FractalDotGrid {...config} className="w-full h-full" />

            {/* HUD Telemetry Overlay (Top Left) */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/[0.1] flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-slate-300">60 FPS</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/[0.1] flex items-center gap-2 shadow-lg">
                <span className="text-[11px] font-mono text-slate-400">Wave Style:</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                  {config.waveMode}
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/[0.1] hidden sm:flex items-center gap-2 shadow-lg">
                <span className="text-[11px] font-mono text-slate-400">Density:</span>
                <span className="text-[11px] font-mono font-bold text-indigo-300">
                  {config.dotSpacing}px pitch
                </span>
              </div>
            </div>

            {/* HUD Controls (Top Right) */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setConfig(initialConfig)}
                className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/[0.1] text-slate-400 hover:text-white backdrop-blur-md transition-all shadow-lg"
                title="Reset to Factory Defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-white/[0.1] text-slate-400 hover:text-white backdrop-blur-md transition-all shadow-lg"
                title="Toggle Fullscreen Canvas"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* HUD Kinetic Tip (Bottom Center) */}
            <div className="absolute bottom-4 inset-x-0 mx-auto max-w-fit px-4 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/[0.1] pointer-events-none z-20 text-[11px] font-semibold text-slate-300 flex items-center gap-2 shadow-xl">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Hover cursor to bend space-time • Click anywhere to discharge kinetic shockwaves</span>
            </div>
          </div>

          {/* Preset Cards Rack */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  Artistic Presets
                </h3>
              </div>
              <span className="text-xs text-slate-500">Click any card for instant styling</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRESETS.map((preset, idx) => {
                const isActive = activePresetIndex === idx;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(idx)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden group ${
                      isActive
                        ? `${preset.glowBorder} bg-gradient-to-b ${preset.gradient} ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20`
                        : 'border-white/[0.08] bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {preset.badge}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-sky-400 shadow-xs shadow-sky-400" />
                      )}
                    </div>
                    <div className="text-xs font-black text-white group-hover:text-sky-300 transition-colors">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {preset.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Parameters Studio Tabs */}
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-xl p-6 space-y-6 shadow-xl">
            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-4 gap-3">
              <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'presets'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Colors & Theme</span>
                </button>

                <button
                  onClick={() => setActiveTab('waves')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'waves'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Wave Physics</span>
                </button>

                <button
                  onClick={() => setActiveTab('dots')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'dots'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grid & Dots</span>
                </button>

                <button
                  onClick={() => setActiveTab('effects')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'effects'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Sensory FX</span>
                </button>

                <button
                  onClick={() => setActiveTab('engine')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'engine'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Engine</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Active: <span className="text-sky-400 font-bold">{config.waveMode.toUpperCase()}</span> wave @{' '}
                <span className="text-indigo-400 font-bold">{config.waveSpeed}x speed</span>
              </div>
            </div>

            {/* TAB CONTENT: COLORS & THEME */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {/* Dot Base Color */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Base Dot Pigment</div>
                      <div className="text-[10px] text-slate-400">Ambient lattice resting color</div>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: config.dotColor }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.dotColor}
                      onChange={(e) => updateConfig('dotColor', e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-white/10"
                    />
                    <input
                      type="text"
                      value={config.dotColor}
                      onChange={(e) => updateConfig('dotColor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs font-mono font-bold text-slate-200"
                    />
                  </div>

                  {/* Swatches */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={`dot-${hex}`}
                        onClick={() => updateConfig('dotColor', hex)}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          config.dotColor === hex ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Glow Halo Color */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Kinetic Glow & Wave Halo</div>
                      <div className="text-[10px] text-slate-400">Dispersion energy and mouse proximity color</div>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: config.glowColor }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.glowColor}
                      onChange={(e) => updateConfig('glowColor', e.target.value)}
                      className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-white/10"
                    />
                    <input
                      type="text"
                      value={config.glowColor}
                      onChange={(e) => updateConfig('glowColor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-white/[0.1] text-xs font-mono font-bold text-slate-200"
                    />
                  </div>

                  {/* Swatches */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={`glow-${hex}`}
                        onClick={() => updateConfig('glowColor', hex)}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          config.glowColor === hex ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: WAVE PHYSICS */}
            {activeTab === 'waves' && (
              <div className="space-y-6 animate-fade-in">
                {/* Wave Mode Selector */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="text-xs font-bold text-white">Mathematical Wave Algorithm</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        { id: 'harmonic', label: 'Harmonic Flow', desc: 'Smooth sine dispersion' },
                        { id: 'vortex', label: 'Gravity Vortex', desc: 'Spiral swirl attraction' },
                        { id: 'pulse', label: 'Systolic Pulse', desc: 'Heartbeat rhythm' },
                        { id: 'matrix', label: 'Matrix Cascade', desc: 'Vertical falling rain' },
                      ] as const
                    ).map((m) => {
                      const isSel = config.waveMode === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => updateConfig('waveMode', m.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500'
                              : 'bg-slate-950/40 border-white/[0.08] text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{m.label}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Wave Intensity */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Wave Intensity</label>
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {config.waveIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="1"
                      value={config.waveIntensity}
                      onChange={(e) => updateConfig('waveIntensity', parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-500 block">Vertical amplitude displacement</span>
                  </div>

                  {/* Wave Radius */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Interaction Radius</label>
                      <span className="font-mono text-xs font-bold text-sky-400">
                        {config.waveRadius}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="500"
                      step="10"
                      value={config.waveRadius}
                      onChange={(e) => updateConfig('waveRadius', parseFloat(e.target.value))}
                      className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-500 block">Radial distance of mouse gravity pull</span>
                  </div>

                  {/* Wave Speed */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">Temporal Speed</label>
                      <span className="font-mono text-xs font-bold text-fuchsia-400">
                        {config.waveSpeed.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.05"
                      value={config.waveSpeed}
                      onChange={(e) => updateConfig('waveSpeed', parseFloat(e.target.value))}
                      className="w-full accent-fuchsia-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <span className="text-[10px] text-slate-500 block">Harmonic frequency velocity factor</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GRID & DOTS */}
            {activeTab === 'dots' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* Dot Size */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Dot Size (Diameter)</label>
                    <span className="font-mono text-xs font-bold text-indigo-400">{config.dotSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="12"
                    step="0.5"
                    value={config.dotSize}
                    onChange={(e) => updateConfig('dotSize', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 block">Pixel radius of individual lattice nodes</span>
                </div>

                {/* Dot Spacing */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Dot Spacing (Density)</label>
                    <span className="font-mono text-xs font-bold text-sky-400">{config.dotSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="1"
                    value={config.dotSpacing}
                    onChange={(e) => updateConfig('dotSpacing', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 block">Pitch grid distance between neighbors</span>
                </div>

                {/* Dot Opacity */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Base Lattice Opacity</label>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {Math.round(config.dotOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={config.dotOpacity}
                    onChange={(e) => updateConfig('dotOpacity', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-500 block">Baseline visibility of undisturbed dots</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SENSORY FX */}
            {activeTab === 'effects' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {/* Mouse Aura */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-white">Mouse Glow Aura</label>
                      <span className="text-xs">{config.enableMouseGlow ? '🟢' : '⚪'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Radiant gradient spotlight tracking cursor</span>
                  </div>
                  <button
                    onClick={() => updateConfig('enableMouseGlow', !config.enableMouseGlow)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      config.enableMouseGlow
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.enableMouseGlow ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Click Shockwaves */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-white">Click Shockwaves</label>
                      <span className="text-xs">{config.enableClickRipples ? '🟢' : '⚪'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Generates kinetic ripples upon canvas clicks</span>
                  </div>
                  <button
                    onClick={() => updateConfig('enableClickRipples', !config.enableClickRipples)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      config.enableClickRipples
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.enableClickRipples ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Constellation Lines */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-white">Constellation Mesh</label>
                      <span className="text-xs">{config.enableLines ? '🟢' : '⚪'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Dynamic vector lines connecting excited dots</span>
                  </div>
                  <button
                    onClick={() => updateConfig('enableLines', !config.enableLines)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      config.enableLines
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.enableLines ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Noise Grain */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-white">Procedural Film Grain</label>
                      <span className="text-xs">{config.enableNoise ? '🟢' : '⚪'}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Analogue tactile texture overlay</span>
                  </div>
                  <button
                    onClick={() => updateConfig('enableNoise', !config.enableNoise)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      config.enableNoise
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.enableNoise ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: ENGINE */}
            {activeTab === 'engine' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {(['high', 'medium', 'low'] as const).map((tier) => {
                  const isSelected = config.initialPerformance === tier;
                  return (
                    <div
                      key={tier}
                      onClick={() => updateConfig('initialPerformance', tier)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-500/20 to-indigo-950/40 border-indigo-500/60 ring-2 ring-indigo-500/30'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.08]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-sm uppercase tracking-wider text-white">
                          {tier === 'high' ? 'High Fidelity' : tier === 'medium' ? 'Balanced' : 'Low Power'}
                        </span>
                        {isSelected && <span className="text-xs font-bold text-indigo-400">● Active</span>}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {tier === 'high'
                          ? 'Full 2x/3x Retina DPI scaling, 60fps render loop with sub-pixel interpolation.'
                          : tier === 'medium'
                          ? '1.15x pitch spacing for portable laptops to conserve battery life.'
                          : '1.4x pitch spacing and fixed 1x canvas DPI rendering for low-powered mobile devices.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* VIEW 3: CODE SNIPPET INSPECTOR */}
        <div className={`space-y-4 ${viewMode === 'code' ? 'block' : 'hidden md:block'}`}>
          <div className="rounded-3xl border border-white/[0.08] bg-slate-950/90 backdrop-blur-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  Ready-to-Use React Component
                </span>
              </div>
              <button
                onClick={copyConfigToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-bold transition-all border border-sky-500/20"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied to Clipboard' : 'Copy Snippet'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-black/60 border border-white/[0.06] text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{`<FractalDotGrid
  dotSize={${config.dotSize}}
  dotSpacing={${config.dotSpacing}}
  dotOpacity={${config.dotOpacity}}
  waveIntensity={${config.waveIntensity}}
  waveRadius={${config.waveRadius}}
  waveSpeed={${config.waveSpeed}}
  waveMode="${config.waveMode}"
  dotColor="${config.dotColor}"
  glowColor="${config.glowColor}"
  enableNoise={${config.enableNoise}}
  noiseOpacity={${config.noiseOpacity}}
  enableMouseGlow={${config.enableMouseGlow}}
  enableClickRipples={${config.enableClickRipples}}
  enableLines={${config.enableLines}}
  initialPerformance="${config.initialPerformance}"
/>`}</code>
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfigurableFractalDotGridDemo;
