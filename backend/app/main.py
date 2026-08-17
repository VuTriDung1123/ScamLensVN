import os
from dotenv import load_dotenv

# Tải biến môi trường từ file .env trước khi import các thư viện khác
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from app.services.ai_service import analyze_content, chat_with_assistant
from app.schemas.scam_schema import ScamAnalysisResult
from pydantic import BaseModel
import uvicorn
import io
import time
from collections import defaultdict

app = FastAPI(title="ScamLens VN API", description="API for ScamLens VN - AI Riser Vietnam 2026")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả (cần thiết khi deploy Frontend lên Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Rate Limiting ---
# Maps IP address to a list of timestamps (in seconds)
ip_requests = defaultdict(list)
MAX_REQUESTS_PER_DAY = 10
SECONDS_IN_DAY = 24 * 60 * 60

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    
    # Filter out requests older than 24 hours
    ip_requests[client_ip] = [timestamp for timestamp in ip_requests[client_ip] if now - timestamp < SECONDS_IN_DAY]
    
    if len(ip_requests[client_ip]) >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(
            status_code=429,
            detail="Bạn đã vượt quá giới hạn 10 lần phân tích/ngày. Vui lòng quay lại vào ngày mai!"
        )
    
    ip_requests[client_ip].append(now)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to ScamLens VN API"}

@app.post("/api/analyze", response_model=ScamAnalysisResult)
async def analyze_endpoint(
    request: Request,
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    check_rate_limit(request)
    
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
async def chat_endpoint(request: Request, chat_req: ChatRequest):
    check_rate_limit(request)
    try:
        reply = await chat_with_assistant(
            context_result=chat_req.context_result,
            user_message=chat_req.user_message,
            chat_history=chat_req.chat_history
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
