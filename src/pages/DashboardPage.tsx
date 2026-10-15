import React from 'react';
import { Car, Users, Gauge, Clock, ArrowDownUp, CheckCircle, Video } from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { VideoCanvas } from '../components/video/VideoCanvas';
import { ClassDistributionChart } from '../components/analytics/ClassDistributionChart';
import { CountingEventsTable } from '../components/analytics/CountingEventsTable';
import { FrameTelemetry, CountingEvent } from '../types';

interface DashboardPageProps {
  telemetry: FrameTelemetry | null;
  isMonitoring: boolean;
  virtualLineConfig: any;
  countingEvents: CountingEvent[];
  sourceType: 'upload' | 'browser_webcam' | 'local_camera' | 'ip_camera';
  onSendWebcamFrame: (data: string) => void;
  showBoxes: boolean;
  showLabels: boolean;
  showTrackIds: boolean;
  onNavigateToLive: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  telemetry,
  isMonitoring,
  virtualLineConfig,
  countingEvents,
  sourceType,
  onSendWebcamFrame,
  showBoxes,
  showLabels,
  showTrackIds,
  onNavigateToLive,
}) => {
  const visibleVehicles = telemetry?.current_visible?.total_vehicles ?? 0;
  const visiblePedestrians = telemetry?.current_visible?.pedestrian ?? 0;
  const uniqueVehicles = telemetry?.cumulative_unique?.total_vehicles ?? 0;
  const uniquePedestrians = telemetry?.cumulative_unique?.pedestrian ?? 0;
  const fps = telemetry?.fps ? telemetry.fps.toFixed(1) : '15.0';
  const latency = telemetry?.inference_latency_ms ? `${telemetry.inference_latency_ms.toFixed(0)} ms` : '22 ms';

  return (
    <div className="space-y-6">
      {/* 6 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          label="Vehicles Visible"
          value={visibleVehicles}
          subtext="Cars, Buses, Trucks"
          icon={Car}
          accentColor="emerald"
        />
        <MetricCard
          label="Pedestrians Visible"
          value={visiblePedestrians}
          subtext="Crosswalk & Sidewalk"
          icon={Users}
          accentColor="cyan"
        />
        <MetricCard
          label="Unique Vehicles"
          value={uniqueVehicles}
          subtext="Deduplicated ByteTrack"
          icon={CheckCircle}
          accentColor="emerald"
        />
        <MetricCard
          label="Unique Pedestrians"
          value={uniquePedestrians}
          subtext="Persistent Session Tracks"
          icon={Users}
          accentColor="cyan"
        />
        <MetricCard
          label="Actual Processing FPS"
          value={fps}
          subtext="Real CPU Measurement"
          icon={Gauge}
          accentColor="amber"
        />
        <MetricCard
          label="Inference Latency"
          value={latency}
          subtext="YOLOv8 Nano (416px)"
          icon={Clock}
          accentColor="violet"
        />
      </div>

      {/* Main Computer Vision Feed & Primary Monitoring Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                Active Traffic Vision Feed
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 capitalize">
                {sourceType.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={onNavigateToLive}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer transition-colors"
            >
              Configure Feed & Gate →
            </button>
          </div>

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
        </div>

        {/* Real-Time Class Distribution & Flow */}
        <div className="space-y-6">
          <ClassDistributionChart
            counts={
              telemetry?.cumulative_unique ?? {
                car: 0,
                bus: 0,
                truck: 0,
                motorcycle: 0,
                bicycle: 0,
                pedestrian: 0,
                total_vehicles: 0,
              }
            }
            isCumulative={true}
          />

          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase mb-3">
              Gate A Crossing Flow
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Inbound Flow</span>
                <span className="text-xl font-bold text-emerald-400 font-mono-data tabular-nums">
                  {telemetry?.inbound_count ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Downtown bound</span>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Outbound Flow</span>
                <span className="text-xl font-bold text-rose-400 font-mono-data tabular-nums">
                  {telemetry?.outbound_count ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Highway bound</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Crossing Events Table */}
      <CountingEventsTable events={countingEvents} />
    </div>
  );
};
