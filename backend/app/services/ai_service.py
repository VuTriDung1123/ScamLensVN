import os
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from app.schemas.scam_schema import ScamAnalysisResult
from app.scamlens.ai.prompt_builder import build_system_prompt

# ----------------- Kỹ thuật "Ve Sầu Thoát Xác" (API Key Rotation) -----------------
def get_all_api_keys():
    keys = []
    # Khóa chính
    if os.getenv("GEMINI_API_KEY"):
        keys.append(os.getenv("GEMINI_API_KEY"))
    # Khóa phụ (GEMINI_API_KEY_1 đến 10)
    for i in range(1, 11):
        key = os.getenv(f"GEMINI_API_KEY_{i}")
        if key and key not in keys:
            keys.append(key)
    return keys

API_KEYS = get_all_api_keys()
if not API_KEYS:
    raise ValueError("Không tìm thấy GEMINI_API_KEY nào trong .env")

# Khởi tạo danh sách Client
CLIENTS = [genai.Client(api_key=key) for key in API_KEYS]
CURRENT_CLIENT_INDEX = 0

def get_current_client():
    global CURRENT_CLIENT_INDEX
    return CLIENTS[CURRENT_CLIENT_INDEX]

def switch_to_next_client():
    global CURRENT_CLIENT_INDEX
    if len(CLIENTS) > 1:
        CURRENT_CLIENT_INDEX = (CURRENT_CLIENT_INDEX + 1) % len(CLIENTS)
        print(f"🔄 Chuyển sang API Key dự phòng số {CURRENT_CLIENT_INDEX + 1} / {len(CLIENTS)}...")
        return True
    return False
# ---------------------------------------------------------------------------------

DYNAMIC_MODELS_CACHE = []

def get_fallback_models():
    global DYNAMIC_MODELS_CACHE
    models_to_try = []
    
    env_model = os.getenv("GEMINI_MODEL")
    if env_model:
        models_to_try.append(env_model)
        
    if not DYNAMIC_MODELS_CACHE:
        try:
            fetched = []
            client = get_current_client()
            for m in client.models.list():
                name = getattr(m, "name", "").replace("models/", "")
                if name.startswith("gemini") and "embedding" not in name and "aqa" not in name:
                    fetched.append(name)
            
            def sort_key(n):
                score = 0
                if "pro" in n: score += 10
                if "flash" in n: score += 5
                if "preview" in n or "exp" in n: score -= 2
                return (score, n)
                
            fetched.sort(key=sort_key, reverse=True)
            DYNAMIC_MODELS_CACHE = fetched
        except Exception as e:
            print(f"Không thể tải danh sách model động: {e}")
            
    for fm in DYNAMIC_MODELS_CACHE:
        if fm not in models_to_try:
            models_to_try.append(fm)
            
    if not models_to_try:
        models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro"]
        
    return models_to_try

SYSTEM_INSTRUCTION = build_system_prompt()

async def analyze_content(text: str = None, image_bytes: bytes = None, mime_type: str = None) -> ScamAnalysisResult:
    contents = []
    
    if image_bytes and mime_type:
        contents.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            )
        )
        
    if text:
        contents.append(text)
        
    if not contents:
        raise ValueError("Must provide either text or image to analyze.")

    last_error = None
    models_to_try = get_fallback_models()
    
    for model_name in models_to_try:
        keys_tried = 0
        while keys_tried < len(CLIENTS):
            try:
                print(f"Đang thử phân tích với model: {model_name} (API Key {CURRENT_CLIENT_INDEX + 1}/{len(CLIENTS)})")
                client = get_current_client()
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_INSTRUCTION,
                        temperature=0.2,
                        top_p=0.95,
                        response_mime_type="application/json",
                        response_schema=ScamAnalysisResult,
                    ),
                )
                return response.parsed
            except Exception as e:
                # Bắt TOÀN BỘ lỗi (Quota, 503, rate limit...)
                print(f"Lỗi với model {model_name} trên API Key {CURRENT_CLIENT_INDEX + 1}: {e}")
                last_error = e
                keys_tried += 1
                if keys_tried < len(CLIENTS):
                    switch_to_next_client()
                else:
                    print(f"Tất cả {len(CLIENTS)} API Keys đều thất bại cho model {model_name}. Chuyển model tiếp theo...")
                    break # Thoát vòng while, thử model tiếp theo
            
    raise RuntimeError(f"Tất cả các AI models & API Keys đều quá tải hoặc không khả dụng. Lỗi cuối: {str(last_error)}")

async def chat_with_assistant(context_result: dict, user_message: str, chat_history: list = None) -> str:
    history_text = ""
    if chat_history:
        for msg in chat_history:
            role = "User" if msg.get("role") == "user" else "ScamLens AI"
            history_text += f"{role}: {msg.get('content')}\n"
            
    system_prompt = f"""Bạn là ScamLens AI Assistant. 
    Người dùng vừa quét một nội dung và hệ thống trả về kết quả JSON sau:
    {context_result}
    
    Hãy dựa vào kết quả JSON này để trả lời câu hỏi của người dùng. 
    Nếu họ hỏi tại sao lại là lừa đảo, hãy giải thích cặn kẽ dựa vào risk_score_breakdown và psychological_analysis.
    Nếu họ hỏi cách xử lý, hãy tham khảo incident_response.
    Trả lời ngắn gọn, súc tích, thân thiện và bằng tiếng Việt."""
    
    models_to_try = get_fallback_models()
    last_error = None
    prompt = f"Lịch sử chat:\n{history_text}\nCâu hỏi mới: {user_message}"
    
    for model_name in models_to_try:
        keys_tried = 0
        while keys_tried < len(CLIENTS):
            try:
                client = get_current_client()
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                    ),
                )
                return response.text
            except Exception as e:
                print(f"Lỗi chat với model {model_name} (API Key {CURRENT_CLIENT_INDEX + 1}): {e}")
                last_error = e
                keys_tried += 1
                if keys_tried < len(CLIENTS):
                    switch_to_next_client()
                else:
                    break
            
    raise RuntimeError(f"Lỗi AI Chat: {str(last_error)}")
