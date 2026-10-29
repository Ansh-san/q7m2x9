import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ScopeBanner from './components/ScopeBanner';
import MetricCards from './components/MetricCards';
import CutoffControl from './components/CutoffControl';
import DaySelector from './components/DaySelector';
import TimeSeriesChart from './components/TimeSeriesChart';
import DailyErrorChart from './components/DailyErrorChart';
import DataTable from './components/DataTable';
import {
  fetchHealth,
  fetchCalendar,
  fetchMetrics,
  fetchTimeseries
} from './api/client';
import { RefreshCw, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function App() {
  const [cutoff, setCutoff] = useState('09:50');
  const [selectedDate, setSelectedDate] = useState(null);
  const [health, setHealth] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [allMetrics, setAllMetrics] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial load & health check
  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend not ready yet:', err.message));
  }, []);

  // Fetch data whenever cutoff or selectedDate changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchCalendar(cutoff),
      fetchMetrics(cutoff, selectedDate),
      fetchMetrics(cutoff, null), // whole month for daily chart
      fetchTimeseries(cutoff, selectedDate)
    ])
      .then(([cal, met, fullMet, ts]) => {
        if (!isCancelled) {
          setCalendarDays(cal);
          setMetrics(met);
          setAllMetrics(fullMet);
          setTimeseries(ts);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cutoff, selectedDate]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <Header
        health={health}
        cutoff={cutoff}
        onResetCutoff={() => setCutoff('09:50')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Cutoff Controller */}
        <CutoffControl cutoff={cutoff} onCutoffChange={setCutoff} />

        {/* Scope Banner: Embedded vs Transmission BM-connected Wind */}
        <ScopeBanner metrics={metrics || allMetrics} />

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 font-medium"
            >
              Reset View
            </button>
          </div>
        )}

        {/* Metrics KPI Cards */}
        <MetricCards metrics={metrics} selectedDate={selectedDate} />

        {/* Day Selector Pill Navigation */}
        <DaySelector
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Main Timeseries Graph */}
        <TimeSeriesChart data={timeseries} selectedDate={selectedDate} />

        {/* Daily Error Distribution Chart */}
        <DailyErrorChart
          byDay={allMetrics?.by_day || []}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Interval Inspection and Audit Table */}
        <DataTable data={timeseries} selectedDate={selectedDate} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">WindPulse</span>
            <span>—</span>
            <span>Gridbricks Hiring Challenge Prototype</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <span>Market: N2EX UK Day-Ahead (EPEX SPOT / Nord Pool)</span>
            <span>•</span>
            <span>Data: Elexon BMRS APIv1 (FUELHH & WINDFOR streams)</span>
            <span>•</span>
            <span className="text-cyan-400">Strict D-1 Lookback Guard</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
