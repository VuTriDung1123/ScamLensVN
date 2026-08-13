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
Người dùng sẽ cung cấp hình ảnh chụp màn hình (tin nhắn, email, quảng cáo, website) hoặc văn bản đáng ngờ. Bạn phải phân tích chi tiết dữ liệu đầu vào để đánh giá rủi ro lừa đảo và bóc tách các thông tin quan trọng.

PHƯƠNG PHÁP PHÂN TÍCH (Hãy chú ý các Red Flags sau):
Tính khẩn cấp/Đe dọa (Urgency/Fear): Yêu cầu xử lý ngay lập tức, dọa khóa tài khoản, dọa báo công an.
Đánh vào lòng tham (Greed): Trúng thưởng lớn, việc nhẹ lương cao, hoa hồng khủng.
Bất thường về định dạng: Lỗi chính tả, sai tên miền (phishing domain), email gửi từ địa chỉ cá nhân nhưng mạo danh tổ chức lớn.
Yêu cầu rủi ro cao: Yêu cầu chuyển khoản phí trả trước (Advance-fee), yêu cầu cung cấp OTP, mật khẩu, CCCD.

NGUYÊN TẮC TRẢ LỜI:
Tuyệt đối không bịa đặt (hallucinate) thông tin không có trong hình ảnh/văn bản.
Giải thích logic, khách quan, sử dụng tiếng Việt thân thiện, dễ hiểu cho người lớn tuổi.
Dữ liệu trả về PHẢI tuân thủ nghiêm ngặt cấu trúc JSON được yêu cầu."""

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
