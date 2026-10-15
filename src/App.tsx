import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMonitoringPage } from './pages/LiveMonitoringPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { VideoSourcesPage } from './pages/VideoSourcesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { SessionWebSocketClient } from './services/websocket';
import { FrameTelemetry, CountingEvent, SystemStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<FrameTelemetry | null>(null);
  const [countingEvents, setCountingEvents] = useState<CountingEvent[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // Video Source & Line Configurations
  const [sourceType, setSourceType] = useState<'upload' | 'browser_webcam' | 'local_camera' | 'ip_camera'>('upload');
  const [virtualLineConfig, setVirtualLineConfig] = useState({
    enabled: true,
    x1: 0.1,
    y1: 0.5,
    x2: 0.9,
    y2: 0.5,
    direction: 'bidirectional',
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.35);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showTrackIds, setShowTrackIds] = useState<boolean>(true);

  const wsClientRef = useRef<SessionWebSocketClient | null>(null);

  // Poll system hardware status periodically
  useEffect(() => {
    const fetchStatus = () => {
      api.getSystemStatus().then(setSystemStatus).catch(() => {});
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket message handlers
  const handleFrame = useCallback((frameData: FrameTelemetry) => {
    setTelemetry(frameData);
  }, []);

  const handleCountingEvent = useCallback((event: CountingEvent) => {
    setCountingEvents((prev) => [event, ...prev.slice(0, 49)]);
  }, []);

  // Start Monitoring
  const handleStart = async () => {
    try {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }

      const session = await api.createSession({
        source_type: sourceType,
        source_name: sourceType === 'browser_webcam' ? 'Browser Webcam Feed' : 'Urban Intersection Stream #1',
        confidence_threshold: confidenceThreshold,
        virtual_line: virtualLineConfig,
      });

      setCurrentSessionId(session.id);
      setIsMonitoring(true);
      setIsPaused(false);

      // Connect WebSocket for live telemetry stream
      wsClientRef.current = new SessionWebSocketClient(session.id, {
        onFrame: handleFrame,
        onCountingEvent: handleCountingEvent,
        onStatusChange: (status) => {
          if (status === 'paused') setIsPaused(true);
          else if (status === 'running') setIsPaused(false);
          else if (status === 'stopped') {
            setIsMonitoring(false);
            setIsPaused(false);
          }
        },
      });
    } catch (err) {
      console.error('Failed to start monitoring session:', err);
    }
  };

  // Pause Monitoring
  const handlePause = async () => {
    if (!currentSessionId) return;
    try {
      await api.pauseSession(currentSessionId);
      setIsPaused(true);
    } catch (err) {
      console.error('Error pausing session:', err);
    }
  };

  // Resume Monitoring
  const handleResume = async () => {
    if (!currentSessionId) return;
    try {
      await api.resumeSession(currentSessionId);
      setIsPaused(false);
    } catch (err) {
      console.error('Error resuming session:', err);
    }
  };

  // Stop Monitoring
  const handleStop = async () => {
    if (!currentSessionId) return;
    try {
      await api.stopSession(currentSessionId);
    } catch (err) {
      console.error('Error stopping session:', err);
    } finally {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      setIsMonitoring(false);
      setIsPaused(false);
    }
  };

  // Send webcam frame over WebSocket
  const handleSendWebcamFrame = useCallback((base64Frame: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendFrame(base64Frame);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar Contract (Wordmark, Nav links, Action) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMonitoring={isMonitoring}
        isPaused={isPaused}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        fps={telemetry?.fps ?? 0}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation & Engine Telemetry */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          systemStatus={systemStatus}
        />

        {/* Primary Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardPage
                telemetry={telemetry}
                isMonitoring={isMonitoring}
                virtualLineConfig={virtualLineConfig}
                countingEvents={countingEvents}
                sourceType={sourceType}
                onSendWebcamFrame={handleSendWebcamFrame}
                showBoxes={showBoxes}
                showLabels={showLabels}
                showTrackIds={showTrackIds}
                onNavigateToLive={() => setActiveTab('live')}
              />
            )}

            {activeTab === 'live' && (
              <LiveMonitoringPage
                telemetry={telemetry}
                isMonitoring={isMonitoring}
                isPaused={isPaused}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
                sourceType={sourceType}
                setSourceType={setSourceType}
                virtualLineConfig={virtualLineConfig}
                setVirtualLineConfig={setVirtualLineConfig}
                confidenceThreshold={confidenceThreshold}
                setConfidenceThreshold={setConfidenceThreshold}
                showBoxes={showBoxes}
                setShowBoxes={setShowBoxes}
                showLabels={showLabels}
                setShowLabels={setShowLabels}
                showTrackIds={showTrackIds}
                setShowTrackIds={setShowTrackIds}
                onSendWebcamFrame={handleSendWebcamFrame}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsPage />}

            {activeTab === 'sources' && <VideoSourcesPage />}

            {activeTab === 'history' && <HistoryPage />}

            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
