import { FrameTelemetry, CountingEvent } from '../types';

export type WebSocketMessageHandler = {
  onFrame?: (data: FrameTelemetry) => void;
  onCountingEvent?: (event: CountingEvent) => void;
  onStatusChange?: (status: string) => void;
  onError?: (err: any) => void;
};

export class SessionWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private handlers: WebSocketMessageHandler;
  private pingInterval: any = null;
  private shouldReconnect = true;

  constructor(sessionId: string, handlers: WebSocketMessageHandler) {
    this.sessionId = sessionId;
    this.handlers = handlers;
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/sessions/${this.sessionId}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.handlers.onStatusChange?.('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frame_result') {
            this.handlers.onFrame?.(data as FrameTelemetry);
          } else if (data.type === 'counting_event') {
            this.handlers.onCountingEvent?.(data as CountingEvent);
          } else if (data.type === 'session_status') {
            this.handlers.onStatusChange?.(data.status);
          } else if (data.type === 'session_stopped') {
            this.handlers.onStatusChange?.('stopped');
          } else if (data.type === 'error') {
            this.handlers.onError?.(data.message || data.error || 'Server error');
          }
        } catch {
          /* ignore parse errors */
        }
      };

      this.ws.onerror = (err) => {
        this.handlers.onError?.(err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.handlers.onStatusChange?.('disconnected');
        if (this.shouldReconnect) {
          setTimeout(() => this.connect(), 2000);
        }
      };
    } catch (e) {
      this.handlers.onError?.(e);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public sendFrame(frameData: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'webcam_frame',
          frame_data: frameData,
        })
      );
    }
  }

  public disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
