import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, Layers, Zap } from 'lucide-react';

export default function ScopeBanner({ metrics }) {
  const [expanded, setExpanded] = useState(false);
  const bias = metrics?.Bias_MW;
  const isLargeBias = metrics?.scope_warning || Math.abs(bias || 0) > 1500;

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
                Dataset Scope & Telemetry Context (+{bias ? bias.toLocaleString() : '1,730'} MW Mean Bias)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Operational vs Settlement Metering
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              <strong>WINDFOR</strong> is National Grid ESO / NESO's operational forecast covering wind farms visible to the ESO via operational metering on the GB Transmission Network.
              In contrast, <strong>FUELHH</strong> records actual half-hourly outturn specifically from registered Balancing Mechanism (BM) settlement units.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          {expanded ? 'Hide Details' : 'Market Context & Limitations'}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 animate-fadeIn">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium mb-1">
              <Layers className="w-4 h-4" />
              <span>Operational vs Settlement Boundaries</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Per Elexon documentation, WINDFOR forecasts wind generation visible to the ESO with operational telemetry. FUELHH aggregates outturn strictly from BM settlement meters. Differences in telemetered vs BM-registered capacity contribute to this structural offset.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium mb-1">
              <Zap className="w-4 h-4" />
              <span>Balancing Actions & Transmission Curtailment</span>
            </div>
            <p className="text-slate-400 leading-normal">
              WINDFOR represents expected unconstrained wind generation. During high-wind winter events, transmission bottlenecks (e.g. Scottish export boundaries) trigger Bid-Offer Acceptances (BOAs) to curtail wind, widening the gap with metered outturn.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
              <Info className="w-4 h-4" />
              <span>Analytical Limitations</span>
            </div>
            <p className="text-slate-400 leading-normal">
              Do not assume the gap is purely embedded wind without authoritative generator-by-generator data. Despite the level offset, the strong correlation (r ≈ {metrics?.correlation ?? '0.93'}) demonstrates that WINDFOR reliably tracks generation ramp trajectories and storm fronts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
