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
  Zap,
  Code2,
  Dices,
  Camera,
  ArrowLeft,
  MonitorPlay,
} from 'lucide-react';
import { FractalDotGrid, type WaveMode } from './ui/FractalDotGrid';
import { FractalGridCodePanel } from './fractal/FractalGridCodePanel';
import { FractalGridHeroPreview } from './fractal/FractalGridHeroPreview';
import { FractalGridSettings } from './fractal/FractalGridSettings';
import {
  COLOR_SWATCHES,
  initialConfig,
  PRESETS,
  type GridConfig,
  type GridSettingsTab,
} from './fractal/fractalGridConfig';
import { useToast } from './ui/Toast';

export const ConfigurableFractalDotGridDemo: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<GridSettingsTab>('presets');
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
      canvasContainerRef.current.requestFullscreen?.().catch((error: unknown) => {
        console.warn('Unable to enter fullscreen mode.', error);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((error: unknown) => {
        console.warn('Unable to exit fullscreen mode.', error);
      });
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
        <FractalGridHeroPreview config={config} viewMode={viewMode} setViewMode={setViewMode} />

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
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* HUD Kinetic Tip (Bottom Center) */}
            <div className="absolute bottom-4 inset-x-0 mx-auto max-w-fit px-4 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/[0.1] pointer-events-none z-20 text-[11px] font-semibold text-slate-300 flex items-center gap-2 shadow-xl">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Hover cursor to bend space-time • Click anywhere to discharge kinetic shockwaves
              </span>
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

          <FractalGridSettings
            config={config}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            updateConfig={updateConfig}
          />
        </div>

        <FractalGridCodePanel
          config={config}
          viewMode={viewMode}
          isCopied={isCopied}
          onCopy={copyConfigToClipboard}
        />
      </main>
    </div>
  );
};

export default ConfigurableFractalDotGridDemo;
