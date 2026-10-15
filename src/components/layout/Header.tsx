import React from 'react';
import { Activity, ShieldCheck, Play, Square, Pause } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMonitoring: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  fps: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMonitoring,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  fps,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'live', label: 'Live Monitoring' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'sources', label: 'Video Sources' },
    { id: 'history', label: 'Session History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0b0f17]/95 backdrop-blur border-b border-slate-800">
      {/* Zone 1: Single text element wordmark with brand emblem */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Activity className="w-4 h-4" />
        </div>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-base font-semibold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer text-left"
        >
          TrafficVision AI
        </button>
        <span className="hidden lg:inline text-xs text-slate-500">
          YOLOv8n · ByteTrack
        </span>
      </div>

      {/* Zone 2: 4-6 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === item.id
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Zone 3: Operational action and monitoring status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono-data tabular-nums">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>CPU Engine</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>{fps > 0 ? `${fps.toFixed(1)} FPS` : 'Ready'}</span>
        </div>

        {isMonitoring ? (
          <div className="flex items-center gap-2">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-rose-200 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm shadow-emerald-500/20 transition-all whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Monitoring</span>
          </button>
        )}
      </div>
    </header>
  );
};
