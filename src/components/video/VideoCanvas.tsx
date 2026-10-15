import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Maximize2, Minimize2, Eye, ShieldAlert, Sparkles, Volume2, VolumeX, Download } from 'lucide-react';
import { Detection, FrameTelemetry } from '../../types';

interface VideoCanvasProps {
  telemetry: FrameTelemetry | null;
  isMonitoring: boolean;
  virtualLineConfig?: {
    enabled: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    direction: string;
  };
  showBoundingBoxes?: boolean;
  showLabels?: boolean;
  showTrackingIds?: boolean;
  onSendWebcamFrame?: (base64Frame: string) => void;
  sourceType?: 'upload' | 'browser_webcam' | 'local_camera' | 'ip_camera';
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  telemetry,
  isMonitoring,
  virtualLineConfig = { enabled: true, x1: 0.1, y1: 0.5, x2: 0.9, y2: 0.5, direction: 'bidirectional' },
  showBoundingBoxes = true,
  showLabels = true,
  showTrackingIds = true,
  onSendWebcamFrame,
  sourceType = 'upload',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Road background canvas for simulated traffic camera feed
  const roadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize road texture on background canvas
  useEffect(() => {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 1280;
    bgCanvas.height = 720;
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      // Dark asphalt
      ctx.fillStyle = '#1e2430';
      ctx.fillRect(0, 0, 1280, 720);

      // Sidewalk curbs
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(0, 0, 140, 720);
      ctx.fillRect(1140, 0, 140, 720);

      // Curb edge lines
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 0);
      ctx.lineTo(140, 720);
      ctx.moveTo(1140, 0);
      ctx.lineTo(1140, 720);
      ctx.stroke();

      // Road lanes dividers (dashed)
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      // Double yellow center divider
      ctx.beginPath();
      ctx.moveTo(636, 0);
      ctx.lineTo(636, 720);
      ctx.moveTo(644, 0);
      ctx.lineTo(644, 720);
      ctx.stroke();

      // White lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      [388, 892].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      });

      // Pedestrian crosswalk zebra stripes at y = 330..390
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([]);
      for (let x = 150; x < 1130; x += 40) {
        ctx.fillRect(x, 340, 24, 40);
      }
    }
    roadCanvasRef.current = bgCanvas;
  }, []);

  // Browser Webcam activation
  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameCaptureInterval: any = null;

    if (sourceType === 'browser_webcam' && isMonitoring) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false })
        .then((s) => {
          stream = s;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = s;
            webcamVideoRef.current.play();
          }
          setWebcamActive(true);
          setWebcamError(null);

          // Periodically capture and send frame to backend
          const captureCanvas = document.createElement('canvas');
          captureCanvas.width = 640;
          captureCanvas.height = 360;
          const capCtx = captureCanvas.getContext('2d');

          frameCaptureInterval = setInterval(() => {
            if (webcamVideoRef.current && onSendWebcamFrame && capCtx) {
              capCtx.drawImage(webcamVideoRef.current, 0, 0, 640, 360);
              const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.65);
              onSendWebcamFrame(dataUrl);
            }
          }, 100);
        })
        .catch((err) => {
          console.error('Camera permission denied or error:', err);
          setWebcamError('Camera access was denied or no webcam detected. Please grant browser camera permissions.');
          setWebcamActive(false);
        });
    } else {
      setWebcamActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (frameCaptureInterval) {
        clearInterval(frameCaptureInterval);
      }
    };
  }, [sourceType, isMonitoring, onSendWebcamFrame]);

  // Main Render Loop onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background: Either webcam video, backend frame image, or simulated road
    if (sourceType === 'browser_webcam' && webcamActive && webcamVideoRef.current) {
      ctx.drawImage(webcamVideoRef.current, 0, 0, w, h);
    } else if (telemetry?.frame_image) {
      const img = new Image();
      img.src = telemetry.frame_image;
      if (img.complete) {
        ctx.drawImage(img, 0, 0, w, h);
      }
    } else if (roadCanvasRef.current) {
      ctx.drawImage(roadCanvasRef.current, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Draw Virtual Counting Line
    if (virtualLineConfig.enabled) {
      const lx1 = virtualLineConfig.x1 * w;
      const ly1 = virtualLineConfig.y1 * h;
      const lx2 = virtualLineConfig.x2 * w;
      const ly2 = virtualLineConfig.y2 * h;

      // Glow backdrop
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();

      // Sharp line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx1, ly1);
      ctx.lineTo(lx2, ly2);
      ctx.stroke();

      // Line Endpoints
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(lx1, ly1, 5, 0, Math.PI * 2);
      ctx.arc(lx2, ly2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Virtual Line Label
      ctx.fillStyle = '#f59e0b';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText('VIRTUAL COUNTING LINE [GATE A]', lx1 + 8, ly1 - 8);
    }

    // 3. Render Simulated Vehicle Bodies (if not using webcam)
    if (telemetry?.detections && sourceType !== 'browser_webcam') {
      telemetry.detections.forEach((det) => {
        const bx = det.bbox.x1 * w;
        const by = det.bbox.y1 * h;
        const bw = (det.bbox.x2 - det.bbox.x1) * w;
        const bh = (det.bbox.y2 - det.bbox.y1) * h;

        // Vehicle silhouette body
        const isPed = det.class_name === 'Pedestrian';
        ctx.fillStyle = isPed ? '#38bdf8' : '#334155';
        ctx.fillRect(bx, by, bw, bh);

        // Windshield / roof detail
        if (!isPed && bw > 20 && bh > 30) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(bx + bw * 0.15, by + bh * 0.2, bw * 0.7, bh * 0.4);
        }
      });
    }

    // 4. Draw Detection Bounding Boxes & Badges
    if (showBoundingBoxes && telemetry?.detections) {
      telemetry.detections.forEach((det) => {
        const bx = det.bbox.x1 * w;
        const by = det.bbox.y1 * h;
        const bw = (det.bbox.x2 - det.bbox.x1) * w;
        const bh = (det.bbox.y2 - det.bbox.y1) * h;

        // Bounding box: crisp green
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Corner accents
        const cornerLen = Math.min(10, bw / 4, bh / 4);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;

        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(bx, by + cornerLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cornerLen, by);
        ctx.stroke();

        // Label Badge
        if (showLabels) {
          const clsName = det.class_name.toUpperCase();
          const confStr = det.confidence.toFixed(2);
          const labelText =
            showTrackingIds && det.track_id !== undefined && det.track_id !== null
              ? `${clsName} #${det.track_id} ${confStr}`
              : `${clsName} ${confStr}`;

          ctx.font = '700 11px "JetBrains Mono", monospace';
          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const badgeHeight = 18;
          const badgeY = Math.max(0, by - badgeHeight);

          // Green badge background
          ctx.fillStyle = '#10b981';
          ctx.fillRect(bx, badgeY, textWidth + 10, badgeHeight);

          // Black high-contrast text
          ctx.fillStyle = '#051b11';
          ctx.fillText(labelText, bx + 5, badgeY + 13);
        }
      });
    }

    // 5. Draw Top-Left HUD Telemetry Overlay
    ctx.fillStyle = 'rgba(11, 15, 23, 0.85)';
    ctx.fillRect(16, 16, 320, 84);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 320, 84);

    const visVeh = telemetry?.current_visible?.total_vehicles ?? 0;
    const visPed = telemetry?.current_visible?.pedestrian ?? 0;
    const cumVeh = telemetry?.cumulative_unique?.total_vehicles ?? 0;
    const cumPed = telemetry?.cumulative_unique?.pedestrian ?? 0;
    const currentFps = telemetry?.fps ? telemetry.fps.toFixed(1) : '15.0';
    const latency = telemetry?.inference_latency_ms ? `${telemetry.inference_latency_ms.toFixed(0)}ms` : '22ms';

    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`TRAFFICVISION AI · ${currentFps} FPS (${latency})`, 28, 38);

    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(`Visible Now:  ${visVeh} Vehicles  ·  ${visPed} Pedestrians`, 28, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Total Unique: ${cumVeh} Vehicles  ·  ${cumPed} Pedestrians`, 28, 82);
  }, [telemetry, isMonitoring, virtualLineConfig, showBoundingBoxes, showLabels, showTrackingIds, webcamActive, sourceType]);

  // Snapshot capture handler
  const handleCaptureSnapshot = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `trafficvision_snapshot_${Date.now()}.png`;
    a.click();
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-[#0b0f17] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center select-none"
    >
      {/* Hidden webcam video stream element */}
      <video ref={webcamVideoRef} autoPlay playsInline muted className="hidden" />

      {/* Main Computer Vision Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full object-contain block bg-slate-950"
      />

      {/* Error state if webcam permission failed */}
      {webcamError && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
          <ShieldAlert className="w-10 h-10 text-rose-400 mb-3" />
          <div className="text-sm font-semibold text-white mb-1">Camera Permission Required</div>
          <div className="text-xs text-slate-400 max-w-md mb-4">{webcamError}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg cursor-pointer"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* Standby State when not monitoring */}
      {!isMonitoring && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Camera className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">Camera Feed Standby</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            YOLOv8 Nano model initialized. Click <span className="text-emerald-400 font-medium">Start Monitoring</span> in the top bar to begin live object detection and tracking.
          </p>
        </div>
      )}

      {/* Viewport Overlay Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={handleCaptureSnapshot}
          title="Capture Snapshot"
          className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer backdrop-blur"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer backdrop-blur"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom-left telemetry pills */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 text-[11px] font-mono-data text-slate-400 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="text-emerald-400">ByteTrack Active</span>
        <span className="text-slate-600">·</span>
        <span>Line In: {telemetry?.inbound_count ?? 0}</span>
        <span className="text-slate-600">·</span>
        <span>Line Out: {telemetry?.outbound_count ?? 0}</span>
      </div>
    </div>
  );
};
