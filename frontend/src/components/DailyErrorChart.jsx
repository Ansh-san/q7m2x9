import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

export default function DailyErrorChart({ byDay, selectedDate, onSelectDate }) {
  if (!byDay || byDay.length === 0) return null;

  const CustomDailyTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs font-mono space-y-1">
        <div className="font-bold text-white border-b border-slate-800 pb-1 mb-1">
          Delivery Date: {d.date} (Traded: {d.trading_date})
        </div>
        <div className="text-cyan-400">Mean Forecast: {d.mean_forecast_mw?.toLocaleString()} MW</div>
        <div className="text-emerald-400">Mean Actual: {d.mean_actual_mw?.toLocaleString()} MW</div>
        <div className="text-amber-400">Mean Bias: +{d.Bias_MW?.toLocaleString()} MW</div>
        <div className="text-rose-400">Daily MAE: {d.MAE_MW?.toLocaleString()} MW</div>
        <div className="text-indigo-400">WAPE: {d.WAPE_pct}%</div>
        <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800 font-sans">
          Click bar to focus this day
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Daily Mean Bias & Error Profile (January 2026 Decisions)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Daily average difference (WINDFOR − FUELHH). Click any bar to inspect the 24 hourly intervals.
          </p>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => {
                const parts = d.split('-');
                return parts[1] === '02' ? `Feb ${parts[2]}` : `Jan ${parts[2]}`;
              }}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k MW`}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
            />
            <Tooltip content={<CustomDailyTooltip />} />
            <Bar
              dataKey="Bias_MW"
              name="Mean Bias (MW)"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry) => onSelectDate(entry.date)}
            >
              {byDay.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.date === selectedDate ? '#38bdf8' : '#0284c7'}
                  opacity={entry.date === selectedDate ? 1 : 0.65}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
