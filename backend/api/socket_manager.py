from fastapi import WebSocket
from typing import List
import json

class ConnectionManager:
    def __init__(self):
        # List of active WebSocket connections
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send a message to all connected clients."""
        payload = json.dumps(message)
        # Iterate over a copy to avoid concurrent modification issues
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(payload)
            except Exception:
                # Connection might be closed, clean up
                self.disconnect(connection)

# Global manager instance
manager = ConnectionManager()
