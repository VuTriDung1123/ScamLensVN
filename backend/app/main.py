import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env trước khi import các thư viện khác
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from app.services.ai_service import analyze_content, chat_with_assistant
from app.schemas.scam_schema import ScamAnalysisResult
from pydantic import BaseModel
import uvicorn
import io
from gtts import gTTS

app = FastAPI(title="ScamLens VN API", description="API for ScamLens VN - AI Riser Vietnam 2026")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả (cần thiết khi deploy Frontend lên Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to ScamLens VN API"}

@app.post("/api/analyze", response_model=ScamAnalysisResult)
async def analyze_endpoint(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    if not text and not image:
        raise HTTPException(status_code=400, detail="Must provide either text or image")
        
    image_bytes = None
    mime_type = None
    if image:
        image_bytes = await image.read()
        mime_type = image.content_type
        
    try:
        result = await analyze_content(text=text, image_bytes=image_bytes, mime_type=mime_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    context_result: dict
    user_message: str
    chat_history: list = []

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        reply = await chat_with_assistant(
            context_result=request.context_result,
            user_message=request.user_message,
            chat_history=request.chat_history
        )
        return {"reply": reply}
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
