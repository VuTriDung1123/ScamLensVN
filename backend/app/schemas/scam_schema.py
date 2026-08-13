from pydantic import BaseModel, Field
from typing import List

class ExtractedEntities(BaseModel):
    suspicious_links: List[str] = Field(default_factory=list)
    bank_accounts: List[str] = Field(default_factory=list)
    phone_numbers: List[str] = Field(default_factory=list)
    organizations_mentioned: List[str] = Field(default_factory=list)

class ScamAnalysisResult(BaseModel):
    risk_score: int
    risk_level: str
    scam_category: str
    manipulation_tactics: List[str]
    detected_flags: List[str]
    extracted_entities: ExtractedEntities
    explanation: str
    actionable_advice: List[str]
