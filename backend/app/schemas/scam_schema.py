from pydantic import BaseModel, Field
from typing import List

class ExtractedEntities(BaseModel):
    suspicious_links: List[str] = Field(default_factory=list)
    bank_accounts: List[str] = Field(default_factory=list)
    phone_numbers: List[str] = Field(default_factory=list)
    organizations_mentioned: List[str] = Field(default_factory=list)

class PsychologicalAnalysis(BaseModel):
    urgency_score: int = Field(description="Mức độ ép buộc thời gian (0-100)")
    fear_score: int = Field(description="Mức độ dọa dẫm, gây sợ hãi (0-100)")
    authority_score: int = Field(description="Mức độ giả danh cơ quan quyền lực (0-100)")
    reward_score: int = Field(description="Mức độ hứa hẹn phần thưởng/tiền bạc (0-100)")

class RiskScoreBreakdown(BaseModel):
    impersonation_penalty: int = Field(description="Điểm cộng thêm do giả mạo (vd: +25)")
    url_penalty: int = Field(description="Điểm cộng thêm do link lạ/độc hại (vd: +20)")
    urgency_penalty: int = Field(description="Điểm cộng thêm do thúc giục thời gian (vd: +15)")
    payment_penalty: int = Field(description="Điểm cộng thêm do yêu cầu chuyển tiền/OTP (vd: +20)")
    other_penalty: int = Field(description="Điểm cộng thêm do các yếu tố khác (vd: +10)")

class ScamAnalysisResult(BaseModel):
    risk_score: int = Field(description="Tổng điểm rủi ro (0-100)")
    risk_level: str = Field(description="SAFE, SUSPICIOUS, hoặc HIGH_DANGER")
    scam_category: str = Field(description="Phân loại lừa đảo quốc tế")
    vietnam_scam_pattern: str = Field(description="Mô hình lừa đảo phổ biến tại VN (vd: Giả danh công an, Việc nhẹ lương cao...)")
    
    risk_score_breakdown: RiskScoreBreakdown
    psychological_analysis: PsychologicalAnalysis
    
    manipulation_tactics: List[str] = Field(description="Danh sách các thủ thuật thao túng")
    detected_flags: List[str] = Field(description="Dấu hiệu đáng ngờ")
    extracted_entities: ExtractedEntities
    
    # 3 mức độ giải thích
    explanation: str = Field(description="Giải thích thông thường")
    simple_explanation: str = Field(description="Giải thích cực kỳ đơn giản cho người lớn tuổi")
    technical_explanation: str = Field(description="Phân tích kỹ thuật chuyên sâu (domain, metadata, v.v.)")
    
    # Incident Response
    actionable_advice: List[str] = Field(description="Khuyến nghị chung")
    incident_response_not_clicked: List[str] = Field(description="Phải làm gì nếu CHƯA làm theo yêu cầu / chưa bấm link")
    incident_response_clicked: List[str] = Field(description="Phải làm gì khẩn cấp nếu ĐÃ lỡ bấm link hoặc chuyển tiền")
