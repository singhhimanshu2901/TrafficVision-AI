import React from 'react';
import { LayoutDashboard, Video, BarChart3, Database, History, Sliders, Cpu, HardDrive } from 'lucide-react';
import { SystemStatus } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemStatus: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, systemStatus }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Monitoring', icon: Video },
    { id: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { id: 'sources', label: 'Video Feeds', icon: Database },
    { id: 'history', label: 'Session Records', icon: History },
    { id: 'settings', label: 'System Settings', icon: Sliders },
  ];

  return (
    <aside className="w-60 bg-[#0e1420] border-r border-slate-800/80 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Hardware Status Widget */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0a0f18]/60 space-y-3">
        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
          <span>Engine Telemetry</span>
          <span className="font-mono-data text-emerald-400 text-[10px]">CPU ONLY</span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono-data tabular-nums">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3 h-3 text-slate-500" /> CPU Load
              </span>
              <span>{systemStatus?.cpu_usage_percent ?? 24}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, systemStatus?.cpu_usage_percent ?? 24)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono-data tabular-nums">
              <span className="flex items-center gap-1.5 text-slate-400">
                <HardDrive className="w-3 h-3 text-slate-500" /> Memory
              </span>
              <span>{systemStatus?.memory_percent ?? 38}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, systemStatus?.memory_percent ?? 38)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/40 text-[10px] text-slate-400 flex justify-between font-mono-data">
          <span>Resolution: 416px</span>
          <span>YOLOv8 Nano</span>
        </div>
      </div>
    </aside>
  );
};
