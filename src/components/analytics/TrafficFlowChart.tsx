import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrafficFlowChartProps {
  inbound: number;
  outbound: number;
  history?: Array<{ time: string; inbound: number; outbound: number }>;
}

export const TrafficFlowChart: React.FC<TrafficFlowChartProps> = ({ inbound, outbound, history }) => {
  // Generate sample trend data if history is short
  const chartData = history && history.length > 0 ? history : [
    { time: '0m', inbound: 0, outbound: 0 },
    { time: '1m', inbound: Math.max(0, Math.round(inbound * 0.2)), outbound: Math.max(0, Math.round(outbound * 0.15)) },
    { time: '2m', inbound: Math.max(0, Math.round(inbound * 0.5)), outbound: Math.max(0, Math.round(outbound * 0.45)) },
    { time: '3m', inbound: Math.max(0, Math.round(inbound * 0.8)), outbound: Math.max(0, Math.round(outbound * 0.75)) },
    { time: 'Now', inbound, outbound },
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
            Directional Traffic Flow
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Inbound vs. Outbound gate crossings over session duration
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono-data tabular-nums">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>In: {inbound}</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>Out: {outbound}</span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Area
              type="monotone"
              dataKey="inbound"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInbound)"
              name="Inbound Flow"
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOutbound)"
              name="Outbound Flow"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
