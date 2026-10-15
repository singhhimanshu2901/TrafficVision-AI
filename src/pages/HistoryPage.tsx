import React, { useEffect, useState } from 'react';
import { History, Download, RefreshCw, Clock, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Session } from '../types';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await api.listSessions();
      setSessions(data);
    } catch (e) {
      console.error('Failed to load session history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Session Monitoring History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Archived processing records, unique object tallies, and downloadable CSV analytics
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-12 text-center">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Recorded Sessions Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Start a live monitoring session from the dashboard or live monitoring page to record vehicle tracking data.
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0f17]/80 text-slate-400 uppercase text-[10px] font-medium tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Unique Vehicles</th>
                  <th className="py-3 px-4 text-right">Unique Pedestrians</th>
                  <th className="py-3 px-4 text-right">Gate Crossings</th>
                  <th className="py-3 px-4 text-right">Avg FPS</th>
                  <th className="py-3 px-4 text-right">Recorded Date</th>
                  <th className="py-3 px-4 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-data">
                {sessions.map((s) => {
                  const dateStr = new Date(s.start_time).toLocaleString();
                  const crossings = (s.inbound_count || 0) + (s.outbound_count || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        {s.id.slice(0, 10)}...
                      </td>
                      <td className="py-3 px-4 text-slate-300 capitalize">
                        {s.source_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.status === 'running'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : s.status === 'completed' || s.status === 'stopped'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-white font-medium">
                        {s.unique_vehicles}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-cyan-400">
                        {s.unique_pedestrians}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-amber-400">
                        {crossings} ({s.inbound_count} In / {s.outbound_count} Out)
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                        {s.avg_fps ? s.avg_fps.toFixed(1) : '15.0'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 tabular-nums">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={api.getExportUrl(s.id)}
                          download
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-200 hover:text-emerald-400 transition-colors"
                          title="Download CSV"
                        >
                          <Download className="w-3 h-3" />
                          <span>CSV</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
