import type { Dispatch, SetStateAction } from 'react';
import { Activity, Layers, Palette, Waves, Zap } from 'lucide-react';
import type { GridConfig, GridSettingsTab } from './fractalGridConfig';

interface FractalGridSettingsNavProps {
  activeTab: GridSettingsTab;
  setActiveTab: Dispatch<SetStateAction<GridSettingsTab>>;
  config: GridConfig;
}

export const FractalGridSettingsNav = ({
  activeTab,
  setActiveTab,
  config,
}: FractalGridSettingsNavProps) => (
  <>
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
        Active: <span className="text-sky-400 font-bold">{config.waveMode.toUpperCase()}</span> wave
        @ <span className="text-indigo-400 font-bold">{config.waveSpeed}x speed</span>
      </div>
    </div>
  </>
);
