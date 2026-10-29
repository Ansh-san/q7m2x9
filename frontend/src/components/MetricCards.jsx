import React from 'react';
import { Target, TrendingUp, BarChart2, CheckCircle2, Percent, ArrowUpDown } from 'lucide-react';

export default function MetricCards({ metrics, selectedDate }) {
  if (!metrics) return null;

  const cards = [
    {
      title: 'MAE',
      subtitle: 'Mean Absolute Error',
      value: `${metrics.MAE_MW ? metrics.MAE_MW.toLocaleString() : '0'} MW`,
      icon: Target,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      detail: 'Average magnitude of forecast deviation'
    },
    {
      title: 'RMSE',
      subtitle: 'Root Mean Squared Error',
      value: `${metrics.RMSE_MW ? metrics.RMSE_MW.toLocaleString() : '0'} MW`,
      icon: TrendingUp,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      detail: 'Penalizes large outlier forecast errors'
    },
    {
      title: 'Mean Bias',
      subtitle: 'Forecast − Actual',
      value: `${metrics.Bias_MW > 0 ? '+' : ''}${metrics.Bias_MW ? metrics.Bias_MW.toLocaleString() : '0'} MW`,
      icon: ArrowUpDown,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      detail: 'Operational telemetry vs BM settlement difference'
    },
    {
      title: 'WAPE',
      subtitle: 'Weighted Abs % Error',
      value: `${metrics.WAPE_pct ?? '0'}%`,
      icon: Percent,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      detail: 'Total absolute error / total actual output'
    },
    {
      title: 'Correlation (r)',
      subtitle: 'Profile Trajectory Tracking',
      value: `${metrics.correlation ?? '0'}`,
      icon: BarChart2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      detail: 'Shape & timing agreement (1.0 = perfect)'
    },
    {
      title: 'Intervals (N)',
      subtitle: selectedDate ? `Delivery: ${selectedDate}` : '31 Delivery Days',
      value: `${metrics.N} / ${metrics.N + (metrics.missing_intervals || 0)}`,
      icon: CheckCircle2,
      color: 'text-slate-300',
      bgColor: 'bg-slate-800/60',
      borderColor: 'border-slate-700/60',
      detail: `${metrics.missing_intervals === 0 ? '100% paired coverage' : `${metrics.missing_intervals} missing intervals`}`
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl bg-slate-900/70 border ${card.borderColor} backdrop-blur-sm hover:border-slate-600 transition-all shadow-sm flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                  {card.title}
                </span>
                <div className={`p-1 rounded-md ${card.bgColor} ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-bold tracking-tight ${card.color} font-mono`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {card.subtitle}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80 leading-tight">
              {card.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}
