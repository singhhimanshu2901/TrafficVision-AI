import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  trend?: string;
  accentColor?: 'emerald' | 'cyan' | 'amber' | 'violet';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  accentColor = 'emerald',
}) => {
  const accentBorder = {
    emerald: 'border-emerald-500/20 group-hover:border-emerald-500/40',
    cyan: 'border-cyan-500/20 group-hover:border-cyan-500/40',
    amber: 'border-amber-500/20 group-hover:border-amber-500/40',
    violet: 'border-violet-500/20 group-hover:border-violet-500/40',
  }[accentColor];

  const iconColor = {
    emerald: 'text-emerald-400 bg-emerald-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  }[accentColor];

  return (
    <div
      className={`group bg-[#111827] border ${accentBorder} rounded-xl p-4 transition-all duration-200 relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-400 tracking-wide">{label}</div>
          <div className="mt-2 text-2xl font-bold text-white font-mono-data tabular-nums tracking-tight">
            {value}
          </div>
          {subtext && (
            <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono-data">
              {subtext}
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
