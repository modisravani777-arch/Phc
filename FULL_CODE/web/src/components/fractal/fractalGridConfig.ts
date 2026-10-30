import type { FractalDotGridProps, WaveMode } from '../ui/FractalDotGrid';

export type GridSettingsTab = 'presets' | 'waves' | 'dots' | 'effects' | 'engine';

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

export const initialConfig: GridConfig = {
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

export interface Preset {
  name: string;
  subtitle: string;
  badge: string;
  gradient: string;
  glowBorder: string;
  config: Partial<GridConfig>;
}

export const PRESETS: Preset[] = [
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

export const COLOR_SWATCHES = [
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
