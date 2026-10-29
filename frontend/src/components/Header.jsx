import React from 'react';
import { Wind, Activity, Clock, ShieldCheck } from 'lucide-react';

export default function Header({ health, cutoff, onResetCutoff }) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Wind className="w-5 h-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                WindPulse
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                UK Day-Ahead Market Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Elexon BMRS Forecast (WINDFOR) vs Metered Actuals (FUELHH) | Trading Jan 1–31, 2026
            </p>
          </div>
        </div>

        {/* Status Indicators & Metadata */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>N2EX Gate Cutoff:</span>
            <span className="font-mono font-semibold text-cyan-300">{cutoff} Europe/London</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-slate-300 font-medium">
              {isHealthy ? 'Elexon Feed Live' : 'Connecting...'}
            </span>
            {health?.total_expected_intervals && (
              <span className="text-slate-500 font-mono">({health.total_expected_intervals} intervals)</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
