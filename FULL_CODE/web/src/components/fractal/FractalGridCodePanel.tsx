import { Check, Code2, Copy } from 'lucide-react';
import type { GridConfig } from './fractalGridConfig';

type ViewMode = 'studio' | 'hero' | 'code';

interface FractalGridCodePanelProps {
  config: GridConfig;
  viewMode: ViewMode;
  isCopied: boolean;
  onCopy: () => void;
}

export const FractalGridCodePanel = ({
  config,
  viewMode,
  isCopied,
  onCopy,
}: FractalGridCodePanelProps) => (
  <>
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
            onClick={onCopy}
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
  </>
);
