import React, { useState } from 'react';
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
} from 'lucide-react';
import { FractalDotGrid, FractalDotGridProps } from './ui/FractalDotGrid';
import { useToast } from './ui/Toast';

export interface GridConfig extends FractalDotGridProps {
  dotSize: number;
  dotSpacing: number;
  dotOpacity: number;
  waveIntensity: number;
  waveRadius: number;
  waveSpeed: number;
  dotColor: string;
  glowColor: string;
  enableNoise: boolean;
  noiseOpacity: number;
  enableMouseGlow: boolean;
  enableClickRipples: boolean;
  initialPerformance: 'low' | 'medium' | 'high';
}

const initialConfig: GridConfig = {
  dotSize: 5.5,
  dotSpacing: 15,
  dotOpacity: 0.75,
  waveIntensity: 85,
  waveRadius: 240,
  waveSpeed: 1.0,
  dotColor: '#6366f1',
  glowColor: '#38bdf8',
  enableNoise: false,
  noiseOpacity: 0.04,
  enableMouseGlow: true,
  enableClickRipples: true,
  initialPerformance: 'high',
};

const PRESETS: Array<{
  name: string;
  badge: string;
  description: string;
  config: Partial<GridConfig>;
}> = [
  {
    name: 'Quantum Cyan',
    badge: '🌌 Deep Space',
    description: 'Electric cyan dots with reactive violet dispersion waves',
    config: {
      dotSize: 5.0,
      dotSpacing: 15,
      dotOpacity: 0.8,
      waveIntensity: 85,
      waveRadius: 260,
      waveSpeed: 1.1,
      dotColor: '#38bdf8',
      glowColor: '#818cf8',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableNoise: false,
    },
  },
  {
    name: 'Cyberpunk Neon',
    badge: '💜 Ultraviolet',
    description: 'Vibrant magenta and purple waves with harmonic shockwaves',
    config: {
      dotSize: 6.0,
      dotSpacing: 14,
      dotOpacity: 0.85,
      waveIntensity: 95,
      waveRadius: 280,
      waveSpeed: 1.25,
      dotColor: '#ec4899',
      glowColor: '#a855f7',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableNoise: true,
      noiseOpacity: 0.05,
    },
  },
  {
    name: 'Bio Emerald',
    badge: '🌿 Neural Mesh',
    description: 'Bioluminescent emerald grid tailored for health tech interfaces',
    config: {
      dotSize: 4.8,
      dotSpacing: 16,
      dotOpacity: 0.75,
      waveIntensity: 75,
      waveRadius: 220,
      waveSpeed: 0.9,
      dotColor: '#10b981',
      glowColor: '#06b6d4',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableNoise: false,
    },
  },
  {
    name: 'Solar Flare',
    badge: '🌅 Radiance',
    description: 'Warm gold and solar amber ripples with high wave excitation',
    config: {
      dotSize: 6.2,
      dotSpacing: 15,
      dotOpacity: 0.85,
      waveIntensity: 92,
      waveRadius: 250,
      waveSpeed: 1.15,
      dotColor: '#f59e0b',
      glowColor: '#ef4444',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableNoise: false,
    },
  },
  {
    name: 'Obsidian Minimal',
    badge: '⚪ Monochrome',
    description: 'Ultra-clean silver dots on obsidian for understated elegance',
    config: {
      dotSize: 4.2,
      dotSpacing: 17,
      dotOpacity: 0.65,
      waveIntensity: 65,
      waveRadius: 200,
      waveSpeed: 0.8,
      dotColor: '#e2e8f0',
      glowColor: '#94a3b8',
      enableMouseGlow: true,
      enableClickRipples: true,
      enableNoise: true,
      noiseOpacity: 0.03,
    },
  },
];

export const ConfigurableFractalDotGridDemo: React.FC = () => {
  const [config, setConfig] = useState<GridConfig>(initialConfig);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geometry' | 'waves' | 'effects' | 'engine'>('geometry');
  const [activePresetName, setActivePresetName] = useState<string>('Quantum Cyan');
  const { success } = useToast();

  const updateConfig = <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setConfig((prev) => ({ ...prev, ...preset.config }));
    setActivePresetName(preset.name);
    success(`Applied "${preset.name}" preset theme`);
  };

  const copyConfigToClipboard = () => {
    const configString = `// Interactive Animated Fractal Dot Grid Canvas
import { FractalDotGrid } from "@/components/ui/bg-animated-fractal-dot-grid";

export function HeroFractalBackground() {
  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-3xl bg-[#07090e]">
      <FractalDotGrid
        dotSize={${config.dotSize}}
        dotSpacing={${config.dotSpacing}}
        dotOpacity={${config.dotOpacity}}
        waveIntensity={${config.waveIntensity}}
        waveRadius={${config.waveRadius}}
        waveSpeed={${config.waveSpeed}}
        dotColor="${config.dotColor}"
        glowColor="${config.glowColor}"
        enableNoise={${config.enableNoise}}
        noiseOpacity={${config.noiseOpacity}}
        enableMouseGlow={${config.enableMouseGlow}}
        enableClickRipples={${config.enableClickRipples}}
        initialPerformance="${config.initialPerformance}"
      />
    </div>
  );
}`;

    navigator.clipboard.writeText(configString).then(() => {
      setIsCopied(true);
      success('Component configuration code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2400);
    });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 text-[11px] font-extrabold uppercase tracking-widest border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Procedural Canvas Studio
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-mono border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 dot-pulse" />
                60 FPS Physics Engine
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Fractal Dot Grid Engine
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Interactive kinetic mathematical wave dispersion grid with cursor proximity tracking, kinetic shockwaves, and harmonic frequency interference.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfig(initialConfig)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.1] text-xs font-semibold transition-all active:scale-95"
              title="Reset to default settings"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={copyConfigToClipboard}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'Copied Code!' : 'Copy Component Code'}
            </button>
          </div>
        </div>

        {/* Preset Showcase Pills */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" /> Curated Theme Presets
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRESETS.map((p) => {
              const isSelected = activePresetName === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-500/20 to-indigo-900/40 border-indigo-400/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-400/50'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-extrabold text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.badge}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Grid Canvas Section */}
        <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-[#090d16] shadow-2xl">
          {/* Top HUD Floating Bar */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-300 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 dot-pulse" />
              <span>Interactive Live Canvas</span>
              <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">• Click or drag to pulse waves</span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition-all shadow-xl"
                title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actual Canvas */}
          <div className={`relative transition-all duration-300 ${isFullscreen ? 'h-[80vh]' : 'h-[520px]'}`}>
            <FractalDotGrid {...config} />
          </div>

          {/* Bottom HUD Metadata */}
          <div className="px-6 py-3 bg-slate-950/70 backdrop-blur-md border-t border-white/[0.08] flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-3">
            <div className="flex items-center gap-4">
              <span>Spacing: <strong className="text-white">{config.dotSpacing}px</strong></span>
              <span>Radius: <strong className="text-white">{config.waveRadius}px</strong></span>
              <span>Speed: <strong className="text-white">{config.waveSpeed}x</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: config.dotColor }} />
              <span className="text-slate-300">{config.dotColor}</span>
              <span className="text-slate-600">→</span>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: config.glowColor }} />
              <span className="text-slate-300">{config.glowColor}</span>
            </div>
          </div>
        </div>

        {/* Configuration Studio Controls */}
        <div className="rounded-3xl border border-white/[0.1] bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">Dynamic Parameters Studio</h2>
                <p className="text-xs text-slate-400">Tweak real-time mathematical grid variables and physics interactions</p>
              </div>
            </div>

            {/* Parameter Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              {[
                { id: 'geometry', label: 'Geometry', icon: Layers },
                { id: 'waves', label: 'Wave Physics', icon: Waves },
                { id: 'effects', label: 'Effects & Noise', icon: Sparkles },
                { id: 'engine', label: 'Engine', icon: Zap },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Grid Geometry */}
          {activeTab === 'geometry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Dot Size */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Dot Size</label>
                  <span className="font-mono text-xs font-extrabold text-indigo-400">{config.dotSize}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={config.dotSize}
                  onChange={(e) => updateConfig('dotSize', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Radius of each individual mathematical dot node</span>
              </div>

              {/* Dot Spacing */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Grid Spacing</label>
                  <span className="font-mono text-xs font-extrabold text-indigo-400">{config.dotSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="35"
                  step="1"
                  value={config.dotSpacing}
                  onChange={(e) => updateConfig('dotSpacing', parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Density and pitch distance between adjacent nodes</span>
              </div>

              {/* Dot Base Opacity */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Base Opacity</label>
                  <span className="font-mono text-xs font-extrabold text-indigo-400">{Math.round(config.dotOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={config.dotOpacity}
                  onChange={(e) => updateConfig('dotOpacity', parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Alpha baseline transparency when at rest</span>
              </div>

              {/* Dot Color */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Dot Tint Color</label>
                  <span className="font-mono text-xs font-extrabold text-slate-400">{config.dotColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.dotColor}
                    onChange={(e) => updateConfig('dotColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={config.dotColor}
                    onChange={(e) => updateConfig('dotColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Wave Physics */}
          {activeTab === 'waves' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Wave Intensity */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Wave Intensity</label>
                  <span className="font-mono text-xs font-extrabold text-cyan-400">{config.waveIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={config.waveIntensity}
                  onChange={(e) => updateConfig('waveIntensity', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Amplitude of dynamic harmonic wave displacement</span>
              </div>

              {/* Wave Radius */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Wave Radius</label>
                  <span className="font-mono text-xs font-extrabold text-cyan-400">{config.waveRadius}px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="450"
                  step="10"
                  value={config.waveRadius}
                  onChange={(e) => updateConfig('waveRadius', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Spatial reach and wavelength of cursor ripple forces</span>
              </div>

              {/* Wave Speed */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Wave Speed</label>
                  <span className="font-mono text-xs font-extrabold text-cyan-400">{config.waveSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={config.waveSpeed}
                  onChange={(e) => updateConfig('waveSpeed', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-[10px] text-slate-500 block">Simulation time frequency multiplier</span>
              </div>

              {/* Glow Color */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Glow Wave Accent</label>
                  <span className="font-mono text-xs font-extrabold text-slate-400">{config.glowColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.glowColor}
                    onChange={(e) => updateConfig('glowColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={config.glowColor}
                    onChange={(e) => updateConfig('glowColor', e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Effects & Interactions */}
          {activeTab === 'effects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {/* Mouse Proximity Glow */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Proximity Glow</label>
                    <span className="text-xs">{config.enableMouseGlow ? '🟢 Active' : '⚪ Off'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Illuminates nodes adjacent to cursor trajectory</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig('enableMouseGlow', !config.enableMouseGlow)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    config.enableMouseGlow
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
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
                    <label className="text-xs font-bold text-slate-300">Click Shockwaves</label>
                    <span className="text-xs">{config.enableClickRipples ? '🟢 Active' : '⚪ Off'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Generates kinetic radial ripples upon canvas clicks</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig('enableClickRipples', !config.enableClickRipples)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    config.enableClickRipples
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {config.enableClickRipples ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Film Grain / Noise */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Procedural Noise</label>
                    <span className="text-xs">{config.enableNoise ? '🟢 Active' : '⚪ Off'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Simulates subtle analogue film grain texture</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateConfig('enableNoise', !config.enableNoise)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    config.enableNoise
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {config.enableNoise ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {/* Noise Opacity */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Noise Density</label>
                  <span className="font-mono text-xs font-extrabold text-purple-400">
                    {Math.round(config.noiseOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.1"
                  step="0.01"
                  disabled={!config.enableNoise}
                  value={config.noiseOpacity}
                  onChange={(e) => updateConfig('noiseOpacity', parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg disabled:opacity-40"
                />
                <span className="text-[10px] text-slate-500 block">Alpha intensity of film noise texture</span>
              </div>
            </div>
          )}

          {/* Tab 4: Engine Performance */}
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
                      {isSelected && <span className="text-xs font-bold text-indigo-400">● Selected</span>}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {tier === 'high'
                        ? 'Full Retina DPI scaling, 60fps render loop with multi-frequency mathematical harmonics.'
                        : tier === 'medium'
                        ? '1.15x spacing adjustment for laptops and portable displays to conserve battery.'
                        : '1.4x pitch spacing and fixed 1x DPI rendering for low-powered mobile devices.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Code Snippet Display Card */}
        <div className="rounded-3xl border border-white/[0.08] bg-slate-950/80 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Ready-to-Use Component Code
            </div>
            <button
              onClick={copyConfigToClipboard}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-black/50 border border-white/[0.06] text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
            <code>{`<FractalDotGrid
  dotSize={${config.dotSize}}
  dotSpacing={${config.dotSpacing}}
  dotOpacity={${config.dotOpacity}}
  waveIntensity={${config.waveIntensity}}
  waveRadius={${config.waveRadius}}
  waveSpeed={${config.waveSpeed}}
  dotColor="${config.dotColor}"
  glowColor="${config.glowColor}"
  enableNoise={${config.enableNoise}}
  noiseOpacity={${config.noiseOpacity}}
  enableMouseGlow={${config.enableMouseGlow}}
  enableClickRipples={${config.enableClickRipples}}
  initialPerformance="${config.initialPerformance}"
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ConfigurableFractalDotGridDemo;
