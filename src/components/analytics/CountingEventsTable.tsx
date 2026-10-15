import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CountingEvent } from '../../types';

interface CountingEventsTableProps {
  events: CountingEvent[];
}

export const CountingEventsTable: React.FC<CountingEventsTableProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-xs text-slate-400">
          No virtual line crossing events recorded yet. Vehicles crossing Gate A will appear here in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
            Recent Line Crossing Events
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Deduplicated unique trajectory crossings
          </p>
        </div>
        <span className="text-xs font-mono-data text-slate-400">
          {events.length} Events Logged
        </span>
      </div>

      <div className="overflow-x-auto max-h-72">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0f17]/80 text-slate-400 uppercase text-[10px] font-medium tracking-wider sticky top-0 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Track ID</th>
              <th className="py-2.5 px-4">Class</th>
              <th className="py-2.5 px-4">Direction</th>
              <th className="py-2.5 px-4 text-right">Confidence</th>
              <th className="py-2.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono-data">
            {events.slice(0, 15).map((ev) => {
              const isInbound = ev.direction === 'inbound';
              const timeStr = new Date(ev.timestamp).toLocaleTimeString();

              return (
                <tr key={`${ev.id}-${ev.track_id}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-emerald-400">
                    #{ev.track_id}
                  </td>
                  <td className="py-2.5 px-4 text-white">
                    {ev.object_class}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      isInbound ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isInbound ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {isInbound ? 'Inbound' : 'Outbound'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-slate-300">
                    {(ev.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-400 tabular-nums">
                    {timeStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
