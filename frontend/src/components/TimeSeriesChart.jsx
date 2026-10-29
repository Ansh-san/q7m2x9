import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush
} from 'recharts';
import { Clock, Eye, Layers } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const st = new Date(data.startTime);
  const formattedTime = st.toUTCString().replace('GMT', 'UTC');
  const error = data.error_mw;
  const isOver = error > 0;

  return (
    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs min-w-[260px]">
      <div className="font-mono font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
        <span>{formattedTime}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
          Delivery: {data.delivery_date}
        </span>
      </div>

      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            WINDFOR DA Forecast:
          </span>
          <span className="font-bold text-white">
            {data.forecast_mw !== null ? `${data.forecast_mw.toLocaleString()} MW` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            FUELHH Actual Metered:
          </span>
          <span className="font-bold text-white">
            {data.actual_mw !== null ? `${data.actual_mw.toLocaleString()} MW` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span className="text-slate-400">Difference (Forecast − Actual):</span>
          <span className={`font-bold ${isOver ? 'text-amber-400' : 'text-rose-400'}`}>
            {error !== null ? `${isOver ? '+' : ''}${error.toLocaleString()} MW` : 'N/A'}
          </span>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5 font-sans">
        <div className="flex items-center justify-between">
          <span>Trading Date Cutoff:</span>
          <span className="font-mono text-slate-300">
            {data.trading_date} (cutoff {data.cutoff_utc ? data.cutoff_utc.split('T')[1]?.slice(0, 5) : '09:50'}Z)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Snapshot Published:</span>
          <span className="font-mono text-cyan-300">
            {data.forecast_publishTime ? data.forecast_publishTime.replace('T', ' ').slice(0, 16) + 'Z' : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Forecast Age at Cutoff:</span>
          <span className="font-mono text-emerald-300">
            {data.forecast_age_at_cutoff_minutes !== null ? `${data.forecast_age_at_cutoff_minutes} mins` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Lead Time to Delivery:</span>
          <span className="font-mono text-slate-300">
            {data.forecast_lead_time_hours !== null ? `${data.forecast_lead_time_hours} hours` : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function TimeSeriesChart({ data, selectedDate }) {
  const [showActual, setShowActual] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showError, setShowError] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500">
        Loading timeseries data...
      </div>
    );
  }

  const formatXAxis = (tickItem) => {
    if (!tickItem) return '';
    const d = new Date(tickItem);
    if (selectedDate) {
      return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
    }
    return `${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}`;
  };

  const formatYAxis = (val) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k MW`;
    return `${val} MW`;
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>Day-Ahead Forecast vs Metered Generation Profile</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {data.length} hourly intervals
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly resolution. Actuals require both half-hour SPs. Forecast chosen as latest snapshot ≤ cutoff on trading day.
          </p>
        </div>

        {/* Series Visibility Toggles */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showForecast
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-medium'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showForecast ? 'bg-cyan-400' : 'bg-slate-600'}`} />
            <span>WINDFOR Forecast</span>
          </button>

          <button
            onClick={() => setShowActual(!showActual)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showActual
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showActual ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>FUELHH Actual</span>
          </button>

          <button
            onClick={() => setShowError(!showError)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              showError
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                : 'bg-slate-800/60 border-slate-700 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showError ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span>Delta (Error)</span>
          </button>
        </div>
      </div>

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="startTime"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={25}
            />

            <YAxis
              tickFormatter={formatYAxis}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Actual Area */}
            {showActual && (
              <Area
                type="monotone"
                dataKey="actual_mw"
                name="FUELHH Actual"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#actualGradient)"
                isAnimationActive={false}
              />
            )}

            {/* Forecast Line */}
            {showForecast && (
              <Line
                type="monotone"
                dataKey="forecast_mw"
                name="WINDFOR Forecast"
                stroke="#38bdf8"
                strokeWidth={2.2}
                dot={selectedDate ? { r: 3, fill: '#38bdf8' } : false}
                activeDot={{ r: 5, fill: '#38bdf8', stroke: '#090d16', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            )}

            {/* Error Bars if toggled */}
            {showError && (
              <Bar
                dataKey="error_mw"
                name="Error (MW)"
                fill="#f59e0b"
                opacity={0.4}
                isAnimationActive={false}
              />
            )}

            {!selectedDate && data.length > 48 && (
              <Brush
                dataKey="startTime"
                tickFormatter={formatXAxis}
                height={26}
                stroke="#38bdf8"
                fill="#0f172a"
                startIndex={0}
                endIndex={Math.min(data.length - 1, 168)} // default to first 7 days zoom
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
            <span>FUELHH (Balancing Mechanism Metered)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span>WINDFOR (Total GB Incl. Embedded)</span>
          </span>
        </div>
        <div className="font-mono">Timezone: UTC (London GMT)</div>
      </div>
    </div>
  );
}
