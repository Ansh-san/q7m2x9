import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';

export default function DaySelector({ calendarDays, selectedDate, onSelectDate }) {
  return (
    <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">
            Delivery Date Selector (January 2026 Trading Window)
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Showing: <span className="font-semibold text-cyan-300">{selectedDate || 'Full Month (All 31 Delivery Days)'}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {/* Full Month Button */}
        <button
          onClick={() => onSelectDate(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedDate === null
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          All 31 Days (Jan 2 – Feb 1)
        </button>

        {calendarDays.map((day) => {
          const isSelected = selectedDate === day.delivery_date;
          const dayNum = day.delivery_date.split('-')[2];
          const monthShort = day.delivery_date.startsWith('2026-02') ? 'Feb' : 'Jan';
          const pubTimeOnly = day.da_snapshot_publishTime ? day.da_snapshot_publishTime.split('T')[1]?.slice(0, 5) : null;

          return (
            <button
              key={day.delivery_date}
              onClick={() => onSelectDate(day.delivery_date)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs text-left transition-all border ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/20 font-semibold'
                  : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700/50 text-slate-300'
              }`}
              title={`Delivery: ${day.delivery_date} | Traded: ${day.trading_date} | Snapshot: ${pubTimeOnly || 'N/A'}`}
            >
              <div className="flex items-center space-x-1">
                <span className="font-mono text-cyan-300 font-bold">{monthShort} {dayNum}</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                {pubTimeOnly ? `snap ${pubTimeOnly}Z` : '24h'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
