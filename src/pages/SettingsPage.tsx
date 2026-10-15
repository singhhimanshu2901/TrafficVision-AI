import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { AppSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleReset = () => {
    setSettings({
      confidence_threshold: 0.35,
      inference_image_size: 416,
      processing_interval_ms: 66,
      max_stream_fps: 15,
      bounding_box_visible: true,
      confidence_label_visible: true,
      tracking_id_visible: true,
      counting_mode: 'both',
      line_x1: 0.1,
      line_y1: 0.5,
      line_x2: 0.9,
      line_y2: 0.5,
      counting_direction: 'bidirectional',
      max_upload_mb: 250,
      session_retention_days: 7,
    });
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 font-mono-data">
        Loading system configuration...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">System Configuration & Parameters</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune computer vision pipeline, tracking filters, and retention policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? 'Saved' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Computer Vision & Model */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            YOLOv8 Nano Inference Engine
          </h3>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
              <span>Confidence Threshold</span>
              <span className="text-emerald-400">{settings.confidence_threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.confidence_threshold}
              onChange={(e) => setSettings({ ...settings, confidence_threshold: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
              <span>Inference Resolution</span>
              <span className="text-cyan-400">{settings.inference_image_size} px</span>
            </div>
            <select
              value={settings.inference_image_size}
              onChange={(e) => setSettings({ ...settings, inference_image_size: parseInt(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono-data"
            >
              <option value="320">320 × 320 px (Ultra-fast CPU)</option>
              <option value="416">416 × 416 px (Balanced Recommended)</option>
              <option value="640">640 × 640 px (High Detail)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
              <span>Max Streaming FPS</span>
              <span className="text-amber-400">{settings.max_stream_fps} FPS</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={settings.max_stream_fps}
              onChange={(e) => setSettings({ ...settings, max_stream_fps: parseInt(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Display & Annotation Options */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Visual Overlays & HUD Display
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <label className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg cursor-pointer">
              <span>Render Green Bounding Boxes</span>
              <input
                type="checkbox"
                checked={settings.bounding_box_visible}
                onChange={(e) => setSettings({ ...settings, bounding_box_visible: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-emerald-400 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg cursor-pointer">
              <span>Display Object Class Labels</span>
              <input
                type="checkbox"
                checked={settings.confidence_label_visible}
                onChange={(e) => setSettings({ ...settings, confidence_label_visible: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-emerald-400 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-lg cursor-pointer">
              <span>Display ByteTrack ID Badges (#ID)</span>
              <input
                type="checkbox"
                checked={settings.tracking_id_visible}
                onChange={(e) => setSettings({ ...settings, tracking_id_visible: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-emerald-400 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Retention & Storage */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            Storage & File Restrictions
          </h3>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
              <span>Max Upload Size Limit</span>
              <span className="text-slate-200">{settings.max_upload_mb} MB</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="25"
              value={settings.max_upload_mb}
              onChange={(e) => setSettings({ ...settings, max_upload_mb: parseInt(e.target.value) })}
              className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono-data tabular-nums">
              <span>Session History Retention</span>
              <span className="text-slate-200">{settings.session_retention_days} Days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={settings.session_retention_days}
              onChange={(e) => setSettings({ ...settings, session_retention_days: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* ByteTrack Parameters */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
            ByteTrack Tracking Configuration
          </h3>
          <p className="text-xs text-slate-400">
            ByteTrack keeps object identity across temporary occlusions by associating both high-confidence and low-confidence detection boxes through Kalman filter motion state.
          </p>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono-data">
            <div className="flex justify-between text-slate-400">
              <span>Match Threshold:</span>
              <span className="text-white">0.80</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Track Buffer:</span>
              <span className="text-white">30 frames</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trajectory Deduplication:</span>
              <span className="text-emerald-400">Active</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
