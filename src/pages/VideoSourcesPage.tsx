import React, { useState, useEffect } from 'react';
import { Upload, Video, Trash2, Camera, Globe, CheckCircle2, AlertCircle, FileVideo, HardDrive } from 'lucide-react';
import { api } from '../services/api';
import { VideoItem, CameraSource } from '../types';

export const VideoSourcesPage: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [cameras, setCameras] = useState<CameraSource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ipUrl, setIpUrl] = useState('rtsp://192.168.1.100:554/live');
  const [testResult, setTestResult] = useState<any>(null);
  const [testingCam, setTestingCam] = useState(false);

  const fetchSources = async () => {
    try {
      const [vList, cList] = await Promise.all([api.listVideos(), api.listCameras()]);
      setVideos(vList);
      setCameras(cList);
    } catch (e) {
      console.error('Error fetching sources:', e);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadVideo(file);
      await fetchSources();
    } catch (err: any) {
      setUploadError(err.message || 'Video upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await api.deleteVideo(id);
      setVideos(videos.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleTestCamera = async (source: string) => {
    setTestingCam(true);
    setTestResult(null);
    try {
      const res = await api.testCamera(source);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTestingCam(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">Video Ingestion & Camera Feeds</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure video files, browser webcam, local USB inputs, and RTSP stream endpoints
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Video Section */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Upload Traffic Video File
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Accepts standard MP4, AVI, MOV, or WEBM traffic recordings up to 250 MB. Frames are decoded incrementally without full-memory buffering.
          </p>

          <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/40">
            <FileVideo className="w-8 h-8 text-slate-500 mb-2" />
            <span className="text-xs font-medium text-white">Click or drag traffic video to upload</span>
            <span className="text-[11px] text-slate-500 mt-1">MP4, AVI, MOV, WEBM (Max 250MB)</span>
            <input
              type="file"
              accept=".mp4,.avi,.mov,.mkv,.webm"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {uploading && (
            <div className="text-xs text-emerald-400 font-mono-data animate-pulse text-center">
              Uploading & validating video codecs...
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Uploaded Videos List */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400">Available Video Files ({videos.length})</div>
            {videos.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                No custom videos uploaded. Using built-in synthetic & CCTV sample feeds.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
                {videos.map((v) => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between text-xs font-mono-data">
                    <div className="truncate pr-2">
                      <div className="text-white font-medium truncate">{v.original_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {v.resolution} · {v.fps} FPS · {v.size_mb} MB
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteVideo(v.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* IP Camera & Hardware Inputs */}
        <div className="space-y-6">
          {/* Browser Webcam Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Browser Webcam Ingestion
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Streams your live laptop or USB camera directly from the browser through standard <span className="text-slate-300 font-mono-data">navigator.mediaDevices.getUserMedia()</span> with real-time frame transmission.
            </p>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Webcam Permission Status</span>
              <span className="text-emerald-400 font-medium">Supported & Available</span>
            </div>
          </div>

          {/* Network IP Camera (RTSP) Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Authorized RTSP / IP Camera
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Configure network CCTV cameras. Credentials in RTSP URLs are automatically masked for security in logs and API responses.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">RTSP Stream URI</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ipUrl}
                  onChange={(e) => setIpUrl(e.target.value)}
                  placeholder="rtsp://user:pass@192.168.1.100:554/live"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono-data focus:outline-hidden focus:border-emerald-500"
                />
                <button
                  onClick={() => handleTestCamera(ipUrl)}
                  disabled={testingCam}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  {testingCam ? 'Testing...' : 'Test Feed'}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg border text-xs ${
                testResult.success
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
              }`}>
                <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{testResult.success ? 'Feed Verified' : 'Connection Failed'}</span>
                </div>
                <div className="text-[11px] opacity-90">{testResult.message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
