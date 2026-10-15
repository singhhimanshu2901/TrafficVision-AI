import React, { useState } from 'react';
import { Video, Camera, Globe, HardDrive, Play, Pause, Square, Sliders, Eye, EyeOff } from 'lucide-react';
import { VideoCanvas } from '../components/video/VideoCanvas';
import { VirtualLineEditor } from '../components/video/VirtualLineEditor';
import { FrameTelemetry } from '../types';

interface LiveMonitoringPageProps {
  telemetry: FrameTelemetry | null;
  isMonitoring: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  sourceType: 'upload' | 'browser_webcam' | 'local_camera' | 'ip_camera';
  setSourceType: (type: 'upload' | 'browser_webcam' | 'local_camera' | 'ip_camera') => void;
  virtualLineConfig: any;
  setVirtualLineConfig: (cfg: any) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (val: number) => void;
  showBoxes: boolean;
  setShowBoxes: (val: boolean) => void;
  showLabels: boolean;
  setShowLabels: (val: boolean) => void;
  showTrackIds: boolean;
  setShowTrackIds: (val: boolean) => void;
  onSendWebcamFrame: (data: string) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  telemetry,
  isMonitoring,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  sourceType,
  setSourceType,
  virtualLineConfig,
  setVirtualLineConfig,
  confidenceThreshold,
  setConfidenceThreshold,
  showBoxes,
  setShowBoxes,
  showLabels,
  setShowLabels,
  showTrackIds,
  setShowTrackIds,
  onSendWebcamFrame,
}) => {
  const sources = [
    { id: 'upload', label: 'Uploaded Video', icon: Video, desc: 'Highway & intersection traffic sample' },
    { id: 'browser_webcam', label: 'Browser Webcam', icon: Camera, desc: 'Real-time laptop / USB camera stream' },
    { id: 'local_camera', label: 'Local OpenCV Cam', icon: HardDrive, desc: 'Direct OpenCV device index 0' },
    { id: 'ip_camera', label: 'RTSP IP Camera', icon: Globe, desc: 'Municipal traffic stream (H.264/RTSP)' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Source Switcher Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sources.map((s) => {
          const Icon = s.icon;
          const isSelected = sourceType === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSourceType(s.id as any)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                  : 'bg-[#111827] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Main Viewport & Configuration Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <VideoCanvas
            telemetry={telemetry}
            isMonitoring={isMonitoring}
            virtualLineConfig={virtualLineConfig}
            showBoundingBoxes={showBoxes}
            showLabels={showLabels}
            showTrackingIds={showTrackIds}
            sourceType={sourceType}
            onSendWebcamFrame={onSendWebcamFrame}
          />

          {/* Player Operational Toolbar */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {!isMonitoring ? (
                <button
                  onClick={onStart}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Monitoring Session</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={onResume}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPause}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pause</span>
                    </button>
                  )}
                  <button
                    onClick={onStop}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-rose-200 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

            {/* Overlays Visibility Toggles */}
            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  showBoxes
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Boxes</span>
              </button>

              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  showLabels
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Labels</span>
              </button>

              <button
                onClick={() => setShowTrackIds(!showTrackIds)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  showTrackIds
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <span>Track IDs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Controls & Virtual Line Configuration */}
        <div className="space-y-6">
          <VirtualLineEditor lineConfig={virtualLineConfig} onChange={setVirtualLineConfig} />

          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                Model Detection Parameters
              </h3>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono-data tabular-nums">
                <span>Confidence Threshold</span>
                <span className="text-emerald-400 font-semibold">{confidenceThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.85"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono-data">
                <span>0.10 (Sensitive)</span>
                <span>0.85 (Strict)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Tracker Algorithm:</span>
                <span className="text-white font-mono-data font-medium">ByteTrack</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Model Architecture:</span>
                <span className="text-white font-mono-data font-medium">YOLOv8 Nano (CPU)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Dimension:</span>
                <span className="text-white font-mono-data font-medium">416 × 416 px</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
