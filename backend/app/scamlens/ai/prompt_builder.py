from app.scamlens.ai.system_prompt import ROLE, PRINCIPLES, OUTPUT_CONTRACT
from app.scamlens.analysis.ocr import OCR_RULES
from app.scamlens.analysis.url_analyzer import URL_RULES
from app.scamlens.analysis.social_engineering import SOCIAL_ENGINEERING_RULES
from app.scamlens.analysis.entity_extractor import ENTITY_RULES
from app.scamlens.intelligence.reputation import REPUTATION_RULES
from app.scamlens.risk.risk_engine import RISK_RULES
from app.scamlens.response.incident_response import RESPONSE_RULES
from app.scamlens.privacy.redactor import PRIVACY_RULES

def build_system_prompt() -> str:
    """
    Tự động lắp ghép tất cả các quy tắc từ các module con thành một Prompt hoàn chỉnh.
    Điều này giúp kiến trúc Backend sạch sẽ, chuẩn mực và dễ bảo trì.
    """
    sections = [
        ROLE,
        PRINCIPLES,
        OCR_RULES,
        URL_RULES,
        SOCIAL_ENGINEERING_RULES,
        ENTITY_RULES,
        REPUTATION_RULES,
        RISK_RULES,
        RESPONSE_RULES,
        PRIVACY_RULES,
        OUTPUT_CONTRACT
    ]
    
    # Gom tất cả lại và phân cách bằng dòng phân cách
    full_prompt = "\n============================================================\n".join(sections)
    return full_prompt
