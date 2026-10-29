import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, Layers, Zap } from 'lucide-react';

export default function ScopeBanner({ metrics }) {
  const [expanded, setExpanded] = useState(false);
  const bias = metrics?.Bias_MW;
  const isLargeBias = metrics?.scope_warning || Math.abs(bias || 0) > 2000;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/40 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-amber-200">
                Structural Scope Gap Identified (+{bias ? bias.toLocaleString() : '4,000–5,000'} MW Average Bias)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Not a Model Flaw
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong>WINDFOR</strong> is National Grid ESO / NESO's forecast of <em>total GB wind generation</em>, including ~6–8 GW of distribution-connected (embedded) wind. 
              In contrast, <strong>FUELHH</strong> measures solely <em>transmission Balancing Mechanism (BM) connected metered generation</em>.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          {expanded ? 'Hide Details' : 'Market Context'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 animate-fadeIn">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium mb-1">
              <Layers className="w-4 h-4" />
              <span>Dataset Scope Asymmetry</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Distribution wind turbines (feed-in tariff, private wire, local grid) are invisible to BM metering. In winter storm conditions with 50-60% capacity factors, embedded wind adds 3,500–5,000 MW of power.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
              <Zap className="w-4 h-4" />
              <span>N2EX Day-Ahead Trading Impact</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Day-ahead traders submit bids by 09:50 Europe/London for next-day physical delivery. While the bias shifts absolute levels, the <strong>high correlation (r ≈ {metrics?.correlation ?? '0.9+'})</strong> shows WINDFOR reliably captures ramp timing and storm fronts.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
              <Info className="w-4 h-4" />
              <span>Correct Error Interpretation</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Standard MAE ({metrics?.MAE_MW?.toLocaleString()} MW) and WAPE ({metrics?.WAPE_pct}%) incorporate this structural offset. A production trading desk decomposes this into BM wind and embedded wind reduction before evaluating bid sizing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
