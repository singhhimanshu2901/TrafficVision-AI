import os
import cv2
import time
import base64
import asyncio
from typing import Optional, Dict, Any, Tuple
from app.services.detection_service import detection_service
from app.services.counting_service import SessionCounter
from app.utils.drawing import draw_annotations
from app.websocket.manager import manager
from app.core.logging import logger
from app.db.session import SessionLocal
from app.db.repository import SessionRepository

class ProcessingWorker:
    def __init__(self, session_id: str, source_type: str, source_name: str, config: Dict[str, Any]):
        self.session_id = session_id
        self.source_type = source_type
        self.source_name = source_name
        self.config = config
        self.is_running = False
        self.is_paused = False
        self._stop_event = asyncio.Event()

        # Config extraction
        self.conf_thresh = config.get("confidence_threshold", 0.35)
        self.imgsz = config.get("inference_size", 416)
        line_cfg = config.get("virtual_line", {})
        if line_cfg and line_cfg.get("enabled", True):
            self.virtual_line = (
                line_cfg.get("x1", 0.1),
                line_cfg.get("y1", 0.5),
                line_cfg.get("x2", 0.9),
                line_cfg.get("y2", 0.5),
                line_cfg.get("direction", "bidirectional")
            )
        else:
            self.virtual_line = (0.1, 0.5, 0.9, 0.5, "bidirectional")

        self.counter = SessionCounter(self.virtual_line)

        # Performance tracking
        self.total_frames = 0
        self.fps_history = []
        self.latency_history = []
        self.start_time = time.time()

    async def start(self):
        self.is_running = True
        self.is_paused = False
        self._stop_event.clear()

        await manager.broadcast_json(self.session_id, {
            "type": "session_started",
            "session_id": self.session_id,
            "source_type": self.source_type,
            "timestamp": time.time()
        })

        if self.source_type == "upload":
            asyncio.create_task(self._process_video_file())
        elif self.source_type in ["local_camera", "ip_camera"]:
            asyncio.create_task(self._process_camera_stream())
        elif self.source_type == "browser_webcam":
            # Handled via incoming client frames
            pass

    async def pause(self):
        self.is_paused = True
        await manager.broadcast_json(self.session_id, {
            "type": "session_status",
            "session_id": self.session_id,
            "status": "paused"
        })

    async def resume(self):
        self.is_paused = False
        await manager.broadcast_json(self.session_id, {
            "type": "session_status",
            "session_id": self.session_id,
            "status": "running"
        })

    async def stop(self):
        self.is_running = False
        self._stop_event.set()
        await self._persist_final_state("stopped")
        await manager.broadcast_json(self.session_id, {
            "type": "session_stopped",
            "session_id": self.session_id,
            "timestamp": time.time()
        })

    async def process_external_frame(self, frame_bgr, frame_idx: int):
        """Processes a frame received from browser webcam"""
        if not self.is_running or self.is_paused:
            return

        t_start = time.perf_counter()
        detections, latency_ms = detection_service.run_detection_and_tracking(
            frame_bgr,
            conf_threshold=self.conf_thresh,
            imgsz=self.imgsz
        )

        visible, cumulative, crossing_events = self.counter.process_frame_tracks(detections)
        t_end = time.perf_counter()
        frame_time = t_end - t_start
        fps = 1.0 / frame_time if frame_time > 0 else 30.0

        self.total_frames += 1
        self.fps_history.append(fps)
        self.latency_history.append(latency_ms)

        # Annotate
        annotated = draw_annotations(
            frame_bgr,
            detections,
            virtual_line=(self.virtual_line[0], self.virtual_line[1], self.virtual_line[2], self.virtual_line[3]),
            current_visible=visible.model_dump(),
            cumulative_unique=cumulative.model_dump(),
            fps=fps
        )

        # Encode JPEG
        _, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')

        await manager.broadcast_json(self.session_id, {
            "type": "frame_result",
            "session_id": self.session_id,
            "frame_index": frame_idx,
            "timestamp": time.time(),
            "frame_image": f"data:image/jpeg;base64,{jpg_as_text}",
            "inference_latency_ms": round(latency_ms, 1),
            "fps": round(fps, 1),
            "current_visible": visible.model_dump(),
            "cumulative_unique": cumulative.model_dump(),
            "inbound_count": self.counter.line_counter.inbound_count,
            "outbound_count": self.counter.line_counter.outbound_count,
            "detections": detections
        })

        if crossing_events:
            for ev in crossing_events:
                await manager.broadcast_json(self.session_id, {
                    "type": "counting_event",
                    "session_id": self.session_id,
                    "track_id": ev[0],
                    "object_class": ev[1],
                    "direction": ev[2],
                    "confidence": ev[3],
                    "timestamp": time.time()
                })

    async def _process_video_file(self):
        file_path = self.source_name
        if not os.path.exists(file_path):
            await manager.broadcast_json(self.session_id, {
                "type": "error",
                "session_id": self.session_id,
                "message": f"Video file not found: {file_path}"
            })
            return

        cap = cv2.VideoCapture(file_path)
        frame_idx = 0
        target_fps = self.config.get("max_stream_fps", 15)
        delay = 1.0 / target_fps if target_fps > 0 else 0.05

        try:
            while self.is_running and cap.isOpened():
                if self._stop_event.is_set():
                    break

                if self.is_paused:
                    await asyncio.sleep(0.1)
                    continue

                ret, frame = cap.read()
                if not ret or frame is None:
                    # Video ended
                    break

                frame_idx += 1
                t_frame_start = time.perf_counter()

                detections, latency_ms = detection_service.run_detection_and_tracking(
                    frame,
                    conf_threshold=self.conf_thresh,
                    imgsz=self.imgsz
                )

                visible, cumulative, crossing_events = self.counter.process_frame_tracks(detections)
                proc_time = time.perf_counter() - t_frame_start
                fps = 1.0 / proc_time if proc_time > 0 else 30.0

                self.total_frames += 1
                self.fps_history.append(fps)
                self.latency_history.append(latency_ms)

                # Annotate frame
                annotated = draw_annotations(
                    frame,
                    detections,
                    virtual_line=(self.virtual_line[0], self.virtual_line[1], self.virtual_line[2], self.virtual_line[3]),
                    current_visible=visible.model_dump(),
                    cumulative_unique=cumulative.model_dump(),
                    fps=fps
                )

                # Encode to base64 JPEG
                _, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')

                await manager.broadcast_json(self.session_id, {
                    "type": "frame_result",
                    "session_id": self.session_id,
                    "frame_index": frame_idx,
                    "timestamp": time.time(),
                    "frame_image": f"data:image/jpeg;base64,{jpg_as_text}",
                    "inference_latency_ms": round(latency_ms, 1),
                    "fps": round(fps, 1),
                    "current_visible": visible.model_dump(),
                    "cumulative_unique": cumulative.model_dump(),
                    "inbound_count": self.counter.line_counter.inbound_count,
                    "outbound_count": self.counter.line_counter.outbound_count,
                    "detections": detections
                })

                if crossing_events:
                    db = SessionLocal()
                    try:
                        for ev in crossing_events:
                            SessionRepository.add_counting_event(
                                db, self.session_id, ev[0], ev[1], ev[2], ev[3], frame_idx
                            )
                            await manager.broadcast_json(self.session_id, {
                                "type": "counting_event",
                                "session_id": self.session_id,
                                "track_id": ev[0],
                                "object_class": ev[1],
                                "direction": ev[2],
                                "confidence": ev[3],
                                "timestamp": time.time()
                            })
                    finally:
                        db.close()

                # Controlled frame delay
                elapsed = time.perf_counter() - t_frame_start
                if elapsed < delay:
                    await asyncio.sleep(delay - elapsed)
                else:
                    await asyncio.sleep(0.001)

        finally:
            cap.release()
            await self._persist_final_state("completed")
            await manager.broadcast_json(self.session_id, {
                "type": "session_stopped",
                "session_id": self.session_id,
                "timestamp": time.time()
            })

    async def _process_camera_stream(self):
        source = int(self.source_name) if self.source_name.isdigit() else self.source_name
        cap = cv2.VideoCapture(source)
        frame_idx = 0

        try:
            while self.is_running and cap.isOpened():
                if self._stop_event.is_set():
                    break

                if self.is_paused:
                    await asyncio.sleep(0.1)
                    continue

                ret, frame = cap.read()
                if not ret or frame is None:
                    await asyncio.sleep(0.05)
                    continue

                frame_idx += 1
                t0 = time.perf_counter()

                detections, latency_ms = detection_service.run_detection_and_tracking(
                    frame,
                    conf_threshold=self.conf_thresh,
                    imgsz=self.imgsz
                )

                visible, cumulative, crossing_events = self.counter.process_frame_tracks(detections)
                fps = 1.0 / (time.perf_counter() - t0)

                self.total_frames += 1
                self.fps_history.append(fps)
                self.latency_history.append(latency_ms)

                annotated = draw_annotations(
                    frame,
                    detections,
                    virtual_line=(self.virtual_line[0], self.virtual_line[1], self.virtual_line[2], self.virtual_line[3]),
                    current_visible=visible.model_dump(),
                    cumulative_unique=cumulative.model_dump(),
                    fps=fps
                )

                _, buffer = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
                jpg_as_text = base64.b64encode(buffer).decode('utf-8')

                await manager.broadcast_json(self.session_id, {
                    "type": "frame_result",
                    "session_id": self.session_id,
                    "frame_index": frame_idx,
                    "timestamp": time.time(),
                    "frame_image": f"data:image/jpeg;base64,{jpg_as_text}",
                    "inference_latency_ms": round(latency_ms, 1),
                    "fps": round(fps, 1),
                    "current_visible": visible.model_dump(),
                    "cumulative_unique": cumulative.model_dump(),
                    "inbound_count": self.counter.line_counter.inbound_count,
                    "outbound_count": self.counter.line_counter.outbound_count,
                    "detections": detections
                })

                await asyncio.sleep(0.03)
        finally:
            cap.release()
            await self._persist_final_state("completed")

    async def _persist_final_state(self, status: str):
        db = SessionLocal()
        try:
            avg_fps = sum(self.fps_history) / len(self.fps_history) if self.fps_history else 0.0
            avg_lat = sum(self.latency_history) / len(self.latency_history) if self.latency_history else 0.0
            SessionRepository.update_session_metrics(
                db,
                session_id=self.session_id,
                frames_processed=self.total_frames,
                avg_fps=avg_fps,
                avg_latency=avg_lat,
                unique_counts=self.counter.cumulative.model_dump(),
                inbound=self.counter.line_counter.inbound_count,
                outbound=self.counter.line_counter.outbound_count,
                status=status
            )
        except Exception as e:
            logger.error(f"Error persisting session metrics: {e}")
        finally:
            db.close()
