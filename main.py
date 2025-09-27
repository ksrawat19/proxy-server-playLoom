from fastapi import FastAPI, Response
from telethon.sync import TelegramClient
from dotenv import load_dotenv
import os

load_dotenv()
api_id = int(os.getenv("API_ID"))
api_hash = os.getenv("API_HASH")
session_name = "playloom_session"

client = TelegramClient(session_name, api_id, api_hash)
client.start()

app = FastAPI()

@app.get("/")
def health():
    return {"status": "PlayLoom Stream is alive"}

@app.get("/stream/{file_id}")
async def stream(file_id: str):
    file = await client.download_media(file_id)
    return Response(content=file, media_type="video/mp4")

@app.get("/download/{file_id}")
async def download(file_id: str):
    file = await client.download_media(file_id)
    return Response(content=file, media_type="application/octet-stream")
