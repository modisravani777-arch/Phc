import type { Dispatch, SetStateAction } from 'react';
import { COLOR_SWATCHES, type GridConfig, type GridSettingsTab } from './fractalGridConfig';
import { FractalGridSettingsNav } from './FractalGridSettingsNav';

type UpdateGridConfig = <Key extends keyof GridConfig>(key: Key, value: GridConfig[Key]) => void;

interface FractalGridSettingsProps {
  config: GridConfig;
  activeTab: GridSettingsTab;
  setActiveTab: Dispatch<SetStateAction<GridSettingsTab>>;
  updateConfig: UpdateGridConfig;
}

export const FractalGridSettings = ({
  config,
  activeTab,
  setActiveTab,
  updateConfig,
}: FractalGridSettingsProps) => (
  <>
    {/* Interactive Parameters Studio Tabs */}
    <div className="rounded-3xl border border-white/[0.08] bg-slate-900/50 backdrop-blur-xl p-6 space-y-6 shadow-xl">
      <FractalGridSettingsNav activeTab={activeTab} setActiveTab={setActiveTab} config={config} />

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
                    config.dotColor === hex
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent hover:scale-105'
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
                <div className="text-[10px] text-slate-400">
                  Dispersion energy and mouse proximity color
                </div>
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
                    config.glowColor === hex
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent hover:scale-105'
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
              <span className="text-[10px] text-slate-500 block">
                Vertical amplitude displacement
              </span>
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
              <span className="text-[10px] text-slate-500 block">
                Radial distance of mouse gravity pull
              </span>
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
              <span className="text-[10px] text-slate-500 block">
                Harmonic frequency velocity factor
              </span>
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
              <span className="font-mono text-xs font-bold text-indigo-400">
                {config.dotSize}px
              </span>
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
            <span className="text-[10px] text-slate-500 block">
              Pixel radius of individual lattice nodes
            </span>
          </div>

          {/* Dot Spacing */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Dot Spacing (Density)</label>
              <span className="font-mono text-xs font-bold text-sky-400">
                {config.dotSpacing}px
              </span>
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
            <span className="text-[10px] text-slate-500 block">
              Pitch grid distance between neighbors
            </span>
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
            <span className="text-[10px] text-slate-500 block">
              Baseline visibility of undisturbed dots
            </span>
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
              <span className="text-[10px] text-slate-400 block">
                Radiant gradient spotlight tracking cursor
              </span>
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
              <span className="text-[10px] text-slate-400 block">
                Generates kinetic ripples upon canvas clicks
              </span>
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
              <span className="text-[10px] text-slate-400 block">
                Dynamic vector lines connecting excited dots
              </span>
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
              <span className="text-[10px] text-slate-400 block">
                Analogue tactile texture overlay
              </span>
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
                    {tier === 'high'
                      ? 'High Fidelity'
                      : tier === 'medium'
                        ? 'Balanced'
                        : 'Low Power'}
                  </span>
                  {isSelected && (
                    <span className="text-xs font-bold text-indigo-400">● Active</span>
                  )}
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
  </>
);
