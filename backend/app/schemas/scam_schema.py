from pydantic import BaseModel, Field
from typing import List

class UrlIntelligence(BaseModel):
    has_typosquatting: bool = Field(description="URL có dấu hiệu giả mạo ký tự (typosquatting) không?")
    suspicious_domain_extension: bool = Field(description="Đuôi tên miền có đáng ngờ không (.xyz, .top...)?")
    is_shortened: bool = Field(description="Có sử dụng rút gọn link không (bit.ly, t.co...)?")
    explanation: str = Field(description="Giải thích chi tiết về phân tích URL")

class EntityIntelligence(BaseModel):
    suspicious_links: List[str] = Field(default_factory=list)
    bank_accounts: List[str] = Field(default_factory=list)
    phone_numbers: List[str] = Field(default_factory=list)
    organizations_mentioned: List[str] = Field(default_factory=list)
    impersonation_target: str = Field(description="Tổ chức/cá nhân bị mạo danh (nếu có)")
    is_known_scam_entity: bool = Field(description="Tổ chức hoặc số điện thoại này có tiền sử/dấu hiệu lừa đảo không?")

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
    confidence_score: int = Field(description="Độ tự tin của AI vào phán đoán này (0-100)")
    risk_level: str = Field(description="SAFE, LOW_RISK, SUSPICIOUS, HIGH_RISK, CRITICAL, hoặc UNKNOWN")
    scam_category: str = Field(description="Phân loại lừa đảo quốc tế")
    vietnam_scam_pattern: str = Field(description="Mô hình lừa đảo phổ biến tại VN (vd: Giả danh công an, Việc nhẹ lương cao...)")
    
    # [NEW] Fields required by modular architecture
    image_quality: str = Field(description="Chất lượng ảnh: EXCELLENT | GOOD | ACCEPTABLE | POOR | UNUSABLE", default="UNKNOWN")
    credential_request: bool = Field(description="Có yêu cầu cung cấp tài khoản, mật khẩu, OTP không?", default=False)
    
    risk_score_breakdown: RiskScoreBreakdown
    psychological_analysis: PsychologicalAnalysis
    
    manipulation_tactics: List[str] = Field(description="Danh sách các thủ thuật thao túng")
    detected_flags: List[str] = Field(description="Dấu hiệu đáng ngờ")
    url_intelligence: UrlIntelligence
    entity_intelligence: EntityIntelligence
    
    # 3 mức độ giải thích
    explanation: str = Field(description="Giải thích thông thường (Vì sao đáng ngờ, evidence nào)")
    simple_explanation: str = Field(description="Giải thích cực kỳ đơn giản cho người lớn tuổi")
    technical_explanation: str = Field(description="Phân tích kỹ thuật chuyên sâu (domain, metadata, typosquatting...)")
    
    # Incident Response
    actionable_advice: List[str] = Field(description="Khuyến nghị chung")
    incident_response_not_clicked: List[str] = Field(description="Phải làm gì nếu CHƯA làm theo yêu cầu / chưa bấm link")
    incident_response_clicked: List[str] = Field(description="Phải làm gì khẩn cấp nếu ĐÃ lỡ bấm link hoặc chuyển tiền")
