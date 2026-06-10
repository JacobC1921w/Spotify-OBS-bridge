#region Imports
# I like to import individual components due to speed, although it makes the code a little less easier to read sometimes
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
from json import loads
#endregion Imports

#region FastAPI setup
api = FastAPI()

# We love CORS in this household
api.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)
#endregion FastAPI setup

#region WebSocket handling
listeners: list[WebSocket] = []

@api.websocket("/ws")
async def websocketEndpoint(websocket: WebSocket):
    await websocket.accept()
    isListener = True 
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = loads(data)
            
            if payload.get("type") == "lyricUpdate":
                if isListener:
                    isListener = False
                    if websocket in listeners:
                        listeners.remove(websocket)

                payload.pop("type", None) 
                
                for connection in list(listeners):
                    try:
                        await connection.send_json(payload)
                    except Exception:
                        listeners.remove(connection)
            
            elif payload.get("type") == "registerListener":
                isListener = True
                if websocket not in listeners:
                    listeners.append(websocket)

    except WebSocketDisconnect:
        if websocket in listeners:
            listeners.remove(websocket)
#endregion WebSocket handling

#region Widget rendering
@api.get('/', response_class=HTMLResponse)
def overlayPage():
    with open("./widget.html", 'r') as widget:
        # Any edits you want to make to the widget that displays in OBS can be done so by editing ./widget.html
        return widget.read()
#endregion Widget rendering

if __name__ == "__main__":
    run(api, host="127.0.0.1", port=5005) # So we can run uvicorn without typing the command everytime