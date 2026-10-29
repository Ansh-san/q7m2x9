import React from 'react';
import { Download, Table as TableIcon } from 'lucide-react';

export default function DataTable({ data, selectedDate }) {
  if (!data || data.length === 0) return null;

  const exportToCSV = () => {
    const headers = [
      'startTime',
      'trading_date',
      'delivery_date',
      'cutoff_utc',
      'forecast_publishTime',
      'forecast_age_at_cutoff_minutes',
      'forecast_lead_time_hours',
      'forecast_mw',
      'actual_mw',
      'error_mw'
    ];

    const rows = data.map((r) => [
      r.startTime,
      r.trading_date,
      r.delivery_date,
      r.cutoff_utc,
      r.forecast_publishTime,
      r.forecast_age_at_cutoff_minutes,
      r.forecast_lead_time_hours,
      r.forecast_mw,
      r.actual_mw,
      r.error_mw
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `windpulse_${selectedDate || 'january_2026'}_trading.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Limit display to 24 rows if all month is selected to prevent DOM overload
  const displayRows = selectedDate ? data : data.slice(0, 24);

  return (
    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Interval Audit Record {selectedDate ? `(${selectedDate})` : `(Showing first 24 of ${data.length} intervals)`}
          </h3>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-400 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-800/80 text-slate-400 sticky top-0 z-10 border-b border-slate-700">
            <tr>
              <th className="px-3 py-2">Start Time (UTC)</th>
              <th className="px-3 py-2">Traded / Cutoff</th>
              <th className="px-3 py-2">Snapshot PubTime</th>
              <th className="px-3 py-2 text-right">Age (min)</th>
              <th className="px-3 py-2 text-right">Lead (hr)</th>
              <th className="px-3 py-2 text-right text-cyan-400">Forecast (MW)</th>
              <th className="px-3 py-2 text-right text-emerald-400">Actual (MW)</th>
              <th className="px-3 py-2 text-right">Delta (MW)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {displayRows.map((row, idx) => {
              const err = row.error_mw;
              const isOver = err > 0;
              const pubShort = row.forecast_publishTime
                ? row.forecast_publishTime.split('T')[1]?.slice(0, 5) + 'Z'
                : 'N/A';
              const timeShort = row.startTime ? row.startTime.replace('T', ' ').slice(5, 16) + 'Z' : '';

              return (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{timeShort}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {row.trading_date}
                  </td>
                  <td className="px-3 py-2 text-cyan-300 whitespace-nowrap">{pubShort}</td>
                  <td className="px-3 py-2 text-right text-slate-300">
                    {row.forecast_age_at_cutoff_minutes ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-300">
                    {row.forecast_lead_time_hours ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-cyan-300">
                    {row.forecast_mw !== null ? row.forecast_mw.toLocaleString() : 'NaN'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-300">
                    {row.actual_mw !== null ? row.actual_mw.toLocaleString() : 'NaN'}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${isOver ? 'text-amber-400' : 'text-rose-400'}`}>
                    {err !== null ? `${isOver ? '+' : ''}${err.toLocaleString()}` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
