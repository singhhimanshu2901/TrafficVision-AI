import json
import asyncio
from typing import Dict, List, Set
from fastapi import WebSocket
from app.core.logging import logger

class ConnectionManager:
    def __init__(self):
        # Map of session_id -> Set[WebSocket]
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            if session_id not in self.active_connections:
                self.active_connections[session_id] = set()
            self.active_connections[session_id].add(websocket)
        logger.info(f"WebSocket client connected to session {session_id}")

    async def disconnect(self, session_id: str, websocket: WebSocket):
        async with self.lock:
            if session_id in self.active_connections:
                self.active_connections[session_id].discard(websocket)
                if not self.active_connections[session_id]:
                    del self.active_connections[session_id]
        logger.info(f"WebSocket client disconnected from session {session_id}")

    async def broadcast_json(self, session_id: str, data: dict):
        if session_id not in self.active_connections:
            return

        dead_connections = set()
        message_str = json.dumps(data)

        for connection in list(self.active_connections[session_id]):
            try:
                await connection.send_text(message_str)
            except Exception:
                dead_connections.add(connection)

        if dead_connections:
            async with self.lock:
                for dead in dead_connections:
                    self.active_connections[session_id].discard(dead)

manager = ConnectionManager()
