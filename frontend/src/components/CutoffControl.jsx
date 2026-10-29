import React, { useState } from 'react';
import { Sliders, Clock, RotateCcw, Check } from 'lucide-react';

export default function CutoffControl({ cutoff, onCutoffChange }) {
  const [customTime, setCustomTime] = useState(cutoff);
  const presets = ['09:00', '09:30', '09:50', '10:00', '11:00'];

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (/^\d{2}:\d{2}$/.test(customTime)) {
      onCutoffChange(customTime);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-white">Day-Ahead Trading Cutoff: </span>
          <span className="font-mono text-cyan-300 font-bold">{cutoff} Europe/London</span>
          <span className="text-slate-400 ml-1.5 hidden sm:inline">
            (Bids submitted on trading day D for delivery on D+1)
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-slate-400 font-medium hidden md:inline">Presets:</span>
        <div className="flex items-center space-x-1">
          {presets.map((time) => {
            const isActive = cutoff === time;
            const isOfficial = time === '09:50';
            return (
              <button
                key={time}
                onClick={() => {
                  setCustomTime(time);
                  onCutoffChange(time);
                }}
                className={`px-2.5 py-1 rounded-md font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title={isOfficial ? 'Official N2EX Auction Gate-Close' : ''}
              >
                {time}
                {isOfficial && <span className="ml-1 text-[9px] opacity-80">(N2EX)</span>}
              </button>
            );
          })}
        </div>

        {/* Custom time input */}
        <form onSubmit={handleApplyCustom} className="flex items-center space-x-1 pl-2 border-l border-slate-700">
          <input
            type="text"
            pattern="\d{2}:\d{2}"
            placeholder="HH:MM"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="w-16 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 text-center"
          />
          <button
            type="submit"
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/50"
            title="Apply custom cutoff"
          >
            Apply
          </button>
        </form>

        {cutoff !== '09:50' && (
          <button
            onClick={() => {
              setCustomTime('09:50');
              onCutoffChange('09:50');
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
            title="Reset to 09:50 default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
