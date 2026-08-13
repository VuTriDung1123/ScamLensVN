import os
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from app.schemas.scam_schema import ScamAnalysisResult

# Cache danh sách các model để không phải gọi API list() liên tục
DYNAMIC_MODELS_CACHE = []

def get_fallback_models():
    global DYNAMIC_MODELS_CACHE
    models_to_try = []
    
    # 1. Ưu tiên cao nhất: Model do người dùng ép cứng trong .env
    env_model = os.getenv("GEMINI_MODEL")
    if env_model:
        models_to_try.append(env_model)
        
    # 2. Lấy động toàn bộ danh sách model mà API key đang có quyền truy cập
    if not DYNAMIC_MODELS_CACHE:
        try:
            fetched = []
            for m in client.models.list():
                # Bỏ qua các thuộc tính không có trong SDK cũ, lọc bằng tên
                name = getattr(m, "name", "").replace("models/", "")
                if name.startswith("gemini") and "embedding" not in name and "aqa" not in name:
                    fetched.append(name)
            
            # Sắp xếp danh sách thông minh: Ưu tiên Pro > Flash, và phiên bản mới > cũ
            def sort_key(n):
                score = 0
                if "pro" in n: score += 10
                if "flash" in n: score += 5
                if "preview" in n or "exp" in n: score -= 2
                return (score, n)
                
            fetched.sort(key=sort_key, reverse=True)
            DYNAMIC_MODELS_CACHE = fetched
        except Exception as e:
            # Viết tiếng Việt không dấu để tránh lỗi UnicodeEncodeError trên Windows
            print(f"Khong the tai danh sach model dong: {e}")
            
    # Thêm các model lấy được vào danh sách thử nghiệm
    for fm in DYNAMIC_MODELS_CACHE:
        if fm not in models_to_try:
            models_to_try.append(fm)
            
    # 3. Chốt chặn cuối cùng phòng khi rớt mạng hoặc API lỗi
    if not models_to_try:
        models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro"]
        
    return models_to_try

# Initialize the client. It will automatically pick up GEMINI_API_KEY from the environment.
client = genai.Client()

SYSTEM_INSTRUCTION = """Bạn là ScamLens AI - một chuyên gia an ninh mạng, chống lừa đảo trực tuyến (Scam/Phishing) hàng đầu tại Việt Nam.

NHIỆM VỤ CỦA BẠN:
Phân tích hình ảnh chụp màn hình hoặc văn bản để đánh giá rủi ro lừa đảo, bóc tách thông tin và hướng dẫn xử lý sự cố.

PHƯƠNG PHÁP PHÂN TÍCH YÊU CẦU:
1. Đánh giá Mức độ Thao túng tâm lý (0-100 cho mỗi mục): 
   - Urgency: Thúc giục thời gian.
   - Fear: Dọa dẫm, gây sợ hãi.
   - Authority: Giả danh công an, ngân hàng, tòa án.
   - Reward: Lòng tham, trúng thưởng, việc nhẹ lương cao.
2. Xác định Mô hình lừa đảo Việt Nam (vietnam_scam_pattern).
3. Risk Score Breakdown: Chia tổng điểm rủi ro thành các hình phạt (Penalty).
4. Phân tầng Giải thích (3 cấp độ): simple_explanation, explanation, technical_explanation.
5. Incident Response: incident_response_not_clicked, incident_response_clicked.
6. URL Intelligence: Đánh giá chi tiết đường link (typosquatting, rút gọn, đuôi tên miền).
7. Entity Intelligence: Phát hiện thực thể (tên người, sđt, tài khoản) và đánh giá có bị mạo danh hay có tiền sử lừa đảo không.
8. Confidence Score (0-100): Đánh giá ĐỘ TỰ TIN của AI vào kết luận trên. YÊU CẦU KHẮT KHE:
   - KHÔNG ĐƯỢC bằng hoặc gần bằng Risk Score một cách ngẫu nhiên.
   - Nếu dữ liệu mờ, thiếu ngữ cảnh, không rõ ràng -> Confidence Score phải THẤP (dưới 60).
   - Nếu có đường link độc hại rõ ràng, hoặc số tài khoản lừa đảo đã biết -> Confidence Score CAO (trên 90).
   - Nếu chỉ dựa vào cảm tính hoặc vài từ khóa nhạy cảm -> Confidence Score Trung bình (60-80).

NGUYÊN TẮC TRẢ LỜI:
Tuyệt đối không bịa đặt (hallucinate) thông tin. Dữ liệu trả về PHẢI tuân thủ NGHIÊM NGẶT cấu trúc JSON Schema được yêu cầu."""

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
        try:
            print(f"Đang thử phân tích với model: {model_name}")
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
        except ClientError as e:
            # In tiếng Việt không dấu
            print(f"Model {model_name} that bai (Quota/Not Found). Chuyen sang model tiep theo...")
            last_error = e
            continue
        except Exception as e:
            print(f"Loi khong mong muon voi model {model_name}: {e}")
            raise e
            
    # Nếu chạy hết danh sách mà vẫn lỗi
    raise RuntimeError(f"Tat ca cac AI models deu qua tai hoac khong kha dung. Loi cuoi: {str(last_error)}")

async def chat_with_assistant(context_result: dict, user_message: str, chat_history: list = None) -> str:
    """Chat trực tiếp với kết quả phân tích hiện tại."""
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
        try:
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
            print(f"Lỗi chat với model {model_name}: {e}")
            last_error = e
            continue
            
    raise RuntimeError(f"Lỗi AI Chat: {str(last_error)}")
