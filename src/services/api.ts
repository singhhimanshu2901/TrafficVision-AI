import { Session, VideoItem, CameraSource, AppSettings, SystemStatus, AnalyticsSummary } from '../types';

const BASE_URL = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.detail) errorMsg = errData.detail;
      else if (errData.error) errorMsg = errData.error;
    } catch {
      /* ignore */
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health & System
  getHealth: () => fetchJson<{ status: string; service: string; environment: string; uptime_seconds: number }>('/api/health'),
  getSystemStatus: () => fetchJson<SystemStatus>('/api/system/status'),
  getModelStatus: () => fetchJson<{ model_name: string; weights_path: string; device: string; is_loaded: boolean; error: string | null; supported_classes: string[] }>('/api/models/status'),

  // Sessions
  createSession: (payload: {
    source_type: string;
    source_name: string;
    confidence_threshold?: number;
    inference_size?: number;
    virtual_line?: any;
    counting_mode?: string;
  }) => fetchJson<Session>('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  listSessions: () => fetchJson<Session[]>('/api/sessions'),
  getSession: (id: string) => fetchJson<Session>(`/api/sessions/${id}`),
  pauseSession: (id: string) => fetchJson<{ session_id: string; status: string }>(`/api/sessions/${id}/pause`, { method: 'POST' }),
  resumeSession: (id: string) => fetchJson<{ session_id: string; status: string }>(`/api/sessions/${id}/resume`, { method: 'POST' }),
  stopSession: (id: string) => fetchJson<{ session_id: string; status: string }>(`/api/sessions/${id}/stop`, { method: 'POST' }),

  // Videos
  uploadVideo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/videos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || err.error || 'Upload failed');
    }
    return res.json();
  },
  listVideos: () => fetchJson<VideoItem[]>('/api/videos'),
  deleteVideo: (id: string) => fetchJson<{ status: string; video_id: string }>(`/api/videos/${id}`, { method: 'DELETE' }),

  // Cameras
  listCameras: () => fetchJson<CameraSource[]>('/api/cameras'),
  testCamera: (source: string) => fetchJson<{ success: boolean; source: string; width: number; height: number; fps: number; message: string }>('/api/cameras/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  }),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/api/settings'),
  updateSettings: (settings: AppSettings) => fetchJson<AppSettings>('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  }),

  // Analytics
  getAnalyticsSummary: () => fetchJson<AnalyticsSummary>('/api/analytics/summary'),
  getSessionAnalytics: (id: string) => fetchJson<any>(`/api/analytics/sessions/${id}`),
  getExportUrl: (id: string) => `/api/analytics/sessions/${id}/export`,
};
