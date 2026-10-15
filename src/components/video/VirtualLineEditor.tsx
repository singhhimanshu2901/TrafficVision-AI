import React from 'react';
import { SlidersHorizontal, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

interface VirtualLineEditorProps {
  lineConfig: {
    enabled: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    direction: string;
  };
  onChange: (newConfig: any) => void;
}

export const VirtualLineEditor: React.FC<VirtualLineEditorProps> = ({ lineConfig, onChange }) => {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
            Virtual Counting Gate
          </h3>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
          <input
            type="checkbox"
            checked={lineConfig.enabled}
            onChange={(e) => onChange({ ...lineConfig, enabled: e.target.checked })}
            className="rounded border-slate-700 bg-slate-900 text-emerald-400 focus:ring-0"
          />
          <span>Active</span>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
            <span>Gate Y-Position</span>
            <span>{Math.round(lineConfig.y1 * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={lineConfig.y1}
            disabled={!lineConfig.enabled}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onChange({ ...lineConfig, y1: val, y2: val });
            }}
            className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="text-xs text-slate-400 mb-1.5">Traffic Counting Flow Direction</div>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onChange({ ...lineConfig, direction: 'bidirectional' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                lineConfig.direction === 'bidirectional'
                  ? 'bg-slate-800 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Two-Way</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...lineConfig, direction: 'inbound' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                lineConfig.direction === 'inbound'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Inbound</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...lineConfig, direction: 'outbound' })}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                lineConfig.direction === 'outbound'
                  ? 'bg-slate-800 text-rose-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Outbound</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
