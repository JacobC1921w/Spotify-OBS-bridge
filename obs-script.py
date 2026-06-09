from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run

api = FastAPI()

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keep track of active OBS browser connections
activeConnections: list[WebSocket] = []

@api.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    activeConnections.append(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        activeConnections.remove(websocket)

@api.get("/lyric")
async def receiveLyricInfo(ar: str="", al: str="", ac: str="", t: str="", cl: str="", pl: str="", nl: str="", p: int=0, tl: int=0):
    if ar == "": return "Empty"
    
    payload = {
        "ar": ar, "al": al, "ac": ac, "t": t,
        "cl": cl, "pl": pl, "nl": nl, "p": p, "tl": tl
    }
    
    for connection in activeConnections:
        try:
            await connection.send_json(payload)
        except Exception:
            pass # Handle dead connections safely
            
    return "OK"

@api.get("/", response_class=HTMLResponse)
def overlayPage():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Segoe UI', sans-serif;
                color: white;
                background-color: rgba(0, 0, 0, 0.5);
                margin: 20px;
                display: flex;
                align-items: center;
                gap: 20px;
            }
            .cover { width: 120px; height: 120px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            .info { display: flex; flex-direction: column; gap: 5px; }
            .track { font-weight: bold; font-size: 24px; }
            .artist { color: #b3b3b3; font-size: 18px; }
            .lyrics { margin-top: 10px; }
            .current-lyric { font-size: 20px; font-weight: bold; color: #1DB954; transition: all 0.2s ease; }
            .other-lyric { font-size: 16px; color: #a7a7a7; opacity: 0.7; }
        </style>
    </head>
    <body>
        <img id="cover" class="cover" src="" alt="">
        <div class="info">
            <div id="track" class="track">Waiting for Spotify...</div>
            <div id="artist" class="artist"></div>
            <div class="lyrics">
                <div id="pl" class="other-lyric"></div>
                <div id="cl" class="current-lyric"></div>
                <div id="nl" class="other-lyric"></div>
            </div>
        </div>

        <script>
            // Connect to the Python WebSocket server
            const ws = new WebSocket(`ws://${window.location.host}/ws`);
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                document.getElementById('track').innerText = data.t;
                document.getElementById('artist').innerText = data.ar;
                document.getElementById('cl').innerText = data.cl;
                document.getElementById('pl').innerText = data.pl;
                document.getElementById('nl').innerText = data.nl;
                
                const img = document.getElementById('cover');
                if (img.src !== data.ac) img.src = data.ac;
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected. Retrying in 2 seconds...");
                setTimeout(() => { location.reload(); }, 2000);
            };
        </script>
    </body>
    </html>
    """

if __name__ == "__main__":
    run(api, host="127.0.0.1", port=5005)