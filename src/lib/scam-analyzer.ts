import { GoogleGenAI, Type, Schema } from "@google/genai";
import { checkBlacklist } from "./blacklist-checker";

// ==========================================
// SCAMLENS VN SYSTEM PROMPT & ARCHITECTURE
// ==========================================

export const SYSTEM_INSTRUCTION = `Bạn là ScamLens AI — Hệ thống phân tích an toàn thông tin và phát hiện nguy cơ lừa đảo trực tuyến (Scam/Phishing/Fraud/Social Engineering) tại Việt Nam.

MỤC TIÊU & NGUYÊN TẮC:
1. Phân tích nội dung (văn bản, hình ảnh biên lai/tin nhắn/văn bản/QR code/link) để phát hiện lừa đảo.
2. Dựa trên bằng chứng thực tế, không bịa đặt, không suy đoán vô căn cứ.
3. Nhận diện các chiêu trò lừa đảo đặc thù tại Việt Nam:
   - Giả danh Công an, Viện kiểm sát gửi Lệnh bắt/Giấy triệu tập qua Zalo/Facebook/SMS (Nguyên tắc: Cơ quan tố tụng VN không bao giờ gửi văn bản tố tụng qua mạng).
   - Biên lai chuyển tiền giả (Fake Bill ngân hàng: lệch font số dư, sai status bar, thiếu mã FT/Trace ID).
   - Lừa cài ứng dụng độc hại đuôi .APK mạo danh VNeID, Thuế, Dịch vụ công để chiếm quyền Trợ năng (Accessibility).
   - Lừa đảo việc nhẹ lương cao, làm nhiệm vụ Telegram/Shopee/Tiki nạp tiền hoàn vốn.
   - Lừa đảo thu hồi vốn treo, luật sư lấy lại tiền lừa đảo (Recovery Scam).
4. Phân tích chi tiết:
   - Rủi ro (0-100), Mức độ (SAFE, LOW_RISK, SUSPICIOUS, HIGH_RISK, CRITICAL).
   - Tâm lý thao túng (Gấp gáp, Sợ hãi, Quyền lực, Phần thưởng).
   - Dấu hiệu URL lạ, Typosquatting, Domain giả mạo.
   - Hướng dẫn xử lý sự cố (Nếu chưa bấm vs Nếu đã lỡ chuyển tiền/bấm link).
5. Luôn trả lời bằng tiếng Việt, ngắn gọn, chính xác, súc tích và tuân thủ tuyệt đối JSON Schema.`;

export const scamAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    risk_score: { type: Type.INTEGER, description: "Tổng điểm rủi ro từ 0 đến 100" },
    confidence_score: { type: Type.INTEGER, description: "Độ tự tin của AI vào phán đoán này (0-100)" },
    risk_level: { type: Type.STRING, description: "SAFE, LOW_RISK, SUSPICIOUS, HIGH_RISK, CRITICAL, hoặc UNKNOWN" },
    scam_category: { type: Type.STRING, description: "Phân loại lừa đảo quốc tế (vd: Phishing, Impersonation, Job Scam...)" },
    vietnam_scam_pattern: { type: Type.STRING, description: "Mô hình lừa đảo phổ biến tại VN (vd: Giả danh công an, Việc nhẹ lương cao, Giả mạo ngân hàng...)" },
    image_quality: { type: Type.STRING, description: "Chất lượng ảnh: EXCELLENT | GOOD | ACCEPTABLE | POOR | UNUSABLE | UNKNOWN" },
    credential_request: { type: Type.BOOLEAN, description: "Có yêu cầu cung cấp tài khoản, mật khẩu, OTP không?" },
    risk_score_breakdown: {
      type: Type.OBJECT,
      properties: {
        impersonation_penalty: { type: Type.INTEGER, description: "Điểm cộng thêm do giả mạo (+0 đến +30)" },
        url_penalty: { type: Type.INTEGER, description: "Điểm cộng thêm do link lạ/độc hại (+0 đến +30)" },
        urgency_penalty: { type: Type.INTEGER, description: "Điểm cộng thêm do thúc giục thời gian (+0 đến +20)" },
        payment_penalty: { type: Type.INTEGER, description: "Điểm cộng thêm do yêu cầu chuyển tiền/OTP (+0 đến +30)" },
        other_penalty: { type: Type.INTEGER, description: "Điểm cộng thêm do các yếu tố khác (+0 đến +20)" },
      },
      required: ["impersonation_penalty", "url_penalty", "urgency_penalty", "payment_penalty", "other_penalty"],
    },
    psychological_analysis: {
      type: Type.OBJECT,
      properties: {
        urgency_score: { type: Type.INTEGER, description: "Mức độ ép buộc thời gian (0-100)" },
        fear_score: { type: Type.INTEGER, description: "Mức độ dọa dẫm, gây sợ hãi (0-100)" },
        authority_score: { type: Type.INTEGER, description: "Mức độ giả danh cơ quan quyền lực (0-100)" },
        reward_score: { type: Type.INTEGER, description: "Mức độ hứa hẹn phần thưởng/tiền bạc (0-100)" },
      },
      required: ["urgency_score", "fear_score", "authority_score", "reward_score"],
    },
    manipulation_tactics: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách các thủ thuật thao túng tâm lý",
    },
    detected_flags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Danh sách các dấu hiệu đáng ngờ phát hiện được",
    },
    url_intelligence: {
      type: Type.OBJECT,
      properties: {
        has_typosquatting: { type: Type.BOOLEAN, description: "Có dấu hiệu giả mạo tên miền" },
        suspicious_domain_extension: { type: Type.BOOLEAN, description: "Đuôi tên miền đáng ngờ (.xyz, .top...)" },
        is_shortened: { type: Type.BOOLEAN, description: "Sử dụng link rút gọn" },
        explanation: { type: Type.STRING, description: "Giải thích chi tiết URL" },
      },
      required: ["has_typosquatting", "suspicious_domain_extension", "is_shortened", "explanation"],
    },
    entity_intelligence: {
      type: Type.OBJECT,
      properties: {
        suspicious_links: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Các đường link lạ" },
        bank_accounts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Số tài khoản ngân hàng" },
        phone_numbers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Số điện thoại xuất hiện" },
        organizations_mentioned: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tổ chức được nhắc tới" },
        impersonation_target: { type: Type.STRING, description: "Đối tượng bị mạo danh" },
        is_known_scam_entity: { type: Type.BOOLEAN, description: "Có dấu hiệu thực thể lừa đảo không" },
      },
      required: [
        "suspicious_links",
        "bank_accounts",
        "phone_numbers",
        "organizations_mentioned",
        "impersonation_target",
        "is_known_scam_entity",
      ],
    },
    explanation: { type: Type.STRING, description: "Giải thích chi tiết thông thường vì sao đáng ngờ" },
    simple_explanation: { type: Type.STRING, description: "Giải thích cực kỳ đơn giản, dễ hiểu cho người lớn tuổi" },
    technical_explanation: { type: Type.STRING, description: "Phân tích kỹ thuật chuyên sâu (domain, header, pattern)" },
    actionable_advice: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Khuyến nghị an toàn chung" },
    incident_response_not_clicked: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Phải làm gì nếu chưa làm theo yêu cầu / chưa bấm link",
    },
    incident_response_clicked: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Phải làm gì khẩn cấp nếu đã lỡ bấm link hoặc chuyển tiền",
    },
  },
  required: [
    "risk_score",
    "confidence_score",
    "risk_level",
    "scam_category",
    "vietnam_scam_pattern",
    "image_quality",
    "credential_request",
    "risk_score_breakdown",
    "psychological_analysis",
    "manipulation_tactics",
    "detected_flags",
    "url_intelligence",
    "entity_intelligence",
    "explanation",
    "simple_explanation",
    "technical_explanation",
    "actionable_advice",
    "incident_response_not_clicked",
    "incident_response_clicked",
  ],
};

function getApiKeyPool(): string[] {
  const keys: string[] = [];

  // 1. Check GEMINI_API_KEY (supports comma, semicolon, or newline separated keys)
  if (process.env.GEMINI_API_KEY) {
    const splitKeys = process.env.GEMINI_API_KEY.split(/[\n,;]+/).map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  // 2. Check GEMINI_API_KEYS
  if (process.env.GEMINI_API_KEYS) {
    const splitKeys = process.env.GEMINI_API_KEYS.split(/[\n,;]+/).map((k) => k.trim()).filter(Boolean);
    keys.push(...splitKeys);
  }

  // 3. Check individual indexed keys (GEMINI_API_KEY_1 to 10)
  for (let i = 1; i <= 10; i++) {
    const envKey = process.env[`GEMINI_API_KEY_${i}`];
    if (envKey && envKey.trim()) {
      keys.push(envKey.trim());
    }
  }

  // Remove duplicates and empty strings
  const uniqueKeys = Array.from(new Set(keys)).filter((k) => k.length > 5);
  return uniqueKeys.length > 0 ? uniqueKeys : [process.env.GEMINI_API_KEY || ""];
}

function getAiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ 
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
];

function isKeyQuotaOrAuthError(err: any): boolean {
  if (!err) return false;
  const str = String(err?.message || err).toLowerCase();
  return (
    str.includes("429") ||
    str.includes("quota") ||
    str.includes("resource_exhausted") ||
    str.includes("rate limit") ||
    str.includes("403") ||
    str.includes("401") ||
    str.includes("api key not valid") ||
    str.includes("invalid api key") ||
    str.includes("permission_denied")
  );
}

export async function analyzeContentAI(params: {
  text?: string | null;
  imageBase64?: string | null;
  mimeType?: string | null;
  decodedQR?: string | null;
}) {
  const { text, imageBase64, mimeType, decodedQR } = params;
  const parts: any[] = [];

  // Check threat intelligence blacklist pre-check
  const textToCheck = `${text || ""} ${decodedQR || ""}`.trim();
  const blacklistHit = textToCheck ? checkBlacklist(textToCheck) : null;

  if (blacklistHit) {
    parts.push({
      text: `[EXTERNAL THREAT INTELLIGENCE FEED - VERIFIED EVIDENCE]:
- Trùng khớp Danh sách đen Quốc gia: ${blacklistHit.matchedItem}
- Mức độ: ${blacklistHit.threatLevel}
- Danh mục: ${blacklistHit.scamCategory}
- Chi tiết: ${blacklistHit.reason}
- Nguồn dữ liệu: ${blacklistHit.source}
HÃY TÍCH HỢP BẰNG CHỨNG NÀY ĐỂ KẾT LUẬN CRITICAL RISK VÀ CUNG CẤP CẢNH BÁO CHÍNH XÁC NHẤT.`
    });
  }

  if (decodedQR) {
    parts.push({
      text: `[DECODED QR CODE PAYLOAD FROM IMAGE]: ${decodedQR}`
    });
  }

  if (imageBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    });
  }

  if (text && text.trim()) {
    parts.push({
      text: text.trim(),
    });
  }

  if (parts.length === 0) {
    throw new Error("Must provide either text or image to analyze.");
  }

  const keyPool = getApiKeyPool();
  let lastError: any = null;

  // Lặp qua từng API key trong danh sách pool (quét từng mã key cái nào xài được thì xài)
  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const currentApiKey = keyPool[keyIdx];
    const ai = getAiClient(currentApiKey);

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: parts,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: scamAnalysisSchema,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          if (blacklistHit) {
            parsed.blacklist_hit = blacklistHit;
          }
          return parsed;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ScamLens AI] Key #${keyIdx + 1} with model ${model} error:`, err?.message || err);

        // Nếu API key này bị hết quota / 429 / sai key, chuyển ngay sang API key tiếp theo
        if (isKeyQuotaOrAuthError(err)) {
          console.warn(`[ScamLens AI] API Key #${keyIdx + 1} exhausted/invalid, auto-switching to next API key...`);
          break; // Thoát vòng lặp model để chuyển sang key tiếp theo ngay lập tức
        }
      }
    }
  }

  throw new Error(`Tất cả các API key (${keyPool.length} keys) và mô hình AI đều không phản hồi: ${lastError?.message || lastError}`);
}

export async function chatWithAssistantAI(params: {
  contextResult: any;
  userMessage: string;
  chatHistory?: Array<{ role: string; content: string }>;
}) {
  const { contextResult, userMessage, chatHistory = [] } = params;

  let historyText = "";
  if (chatHistory && chatHistory.length > 0) {
    for (const msg of chatHistory) {
      const role = msg.role === "user" ? "User" : "ScamLens AI";
      historyText += `${role}: ${msg.content}\n`;
    }
  }

  const systemPrompt = `Bạn là ScamLens AI Assistant. 
Người dùng vừa quét một nội dung và hệ thống trả về kết quả JSON sau:
${JSON.stringify(contextResult, null, 2)}

Hãy dựa vào kết quả JSON này để trả lời câu hỏi của người dùng. 
Nếu họ hỏi tại sao lại là lừa đảo, hãy giải thích cặn kẽ dựa vào risk_score_breakdown và psychological_analysis.
Nếu họ hỏi cách xử lý, hãy tham khảo incident_response.
Trả lời ngắn gọn, súc tích, thân thiện và bằng tiếng Việt.`;

  const prompt = `Lịch sử chat:\n${historyText}\nCâu hỏi mới: ${userMessage}`;
  const keyPool = getApiKeyPool();
  let lastError: any = null;

  for (let keyIdx = 0; keyIdx < keyPool.length; keyIdx++) {
    const currentApiKey = keyPool[keyIdx];
    const ai = getAiClient(currentApiKey);

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: [prompt],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        });

        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[ScamLens AI Chat] Key #${keyIdx + 1} with model ${model} error:`, err?.message || err);

        if (isKeyQuotaOrAuthError(err)) {
          console.warn(`[ScamLens AI Chat] API Key #${keyIdx + 1} exhausted/invalid, auto-switching to next API key...`);
          break;
        }
      }
    }
  }

  throw new Error(`AI Chat failed across all available keys: ${lastError?.message || lastError}`);
}
