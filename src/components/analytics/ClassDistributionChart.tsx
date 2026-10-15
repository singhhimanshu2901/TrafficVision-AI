import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ClassCounts } from '../../types';

interface ClassDistributionChartProps {
  counts: ClassCounts;
  isCumulative?: boolean;
}

export const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({
  counts,
  isCumulative = false,
}) => {
  const data = [
    { name: 'Car', count: counts.car, color: '#10b981' },
    { name: 'Bus', count: counts.bus, color: '#38bdf8' },
    { name: 'Truck', count: counts.truck, color: '#818cf8' },
    { name: 'Motorcycle', count: counts.motorcycle, color: '#f59e0b' },
    { name: 'Bicycle', count: counts.bicycle, color: '#ec4899' },
    { name: 'Pedestrian', count: counts.pedestrian, color: '#34d399' },
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
            {isCumulative ? 'Cumulative Unique Detections' : 'Live Visible Distribution'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Class-wise breakdown mapped from COCO labels
          </p>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
