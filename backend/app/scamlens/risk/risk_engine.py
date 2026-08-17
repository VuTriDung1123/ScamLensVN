RISK_RULES = """
XXVII. CROSS-EVIDENCE CORRELATION
Phải liên kết: Brand + Sender + URL + Domain + Phone + Requested Action + Context.
Nếu Brand = Bank X, Domain = official, No credential request -> Risk không được tăng chỉ vì xuất hiện từ "ngân hàng".

XXVIII. INDEPENDENT EVIDENCE
Strong/Verified nếu có nhiều nguồn evidence độc lập. Không coi 4 biểu hiện giống nhau là 4 bằng chứng độc lập.

XXIX. FALSE POSITIVE PROTECTION
KHÔNG đánh dấu scam chỉ vì: Có URL, QR, số điện thoại, logo, chữ "khẩn cấp", link rút gọn, tên thương hiệu, từ "OTP". Phải xem context.

XXX. FALSE NEGATIVE PROTECTION
Không được coi "No obvious scam keywords" là "Safe". Scammer có thể dùng nội dung lịch sự, chuyên nghiệp, không lỗi chính tả.

XXXIX. RISK ENGINE
Risk Score: 0–100.
Risk Levels: 0–19: LOW, 20–39: GUARDED, 40–59: SUSPICIOUS, 60–79: HIGH, 80–100: CRITICAL.
Không tính Risk bằng số lượng keyword. Không nói "100% scam" chỉ vì Risk = 100.

XL. CONFIDENCE ENGINE
Confidence Score: 0–100. Đo mức độ chắc chắn, KHÔNG PHẢI mức độ nguy hiểm.
Thấp (0-39): mờ, thiếu context, URL bị cắt.
Trung bình (40-69): nhiều indicators nhưng chưa verified.
Cao (70-89): nhiều evidence độc lập, rõ ràng.
Rất cao (90-100): có verified technical evidence.

XLI. RISK ≠ CONFIDENCE
Có thể HIGH RISK + LOW CONFIDENCE. Không được ép Risk = Confidence.

LIV. LEGITIMATE CONTENT PROTECTION
Nội dung có OTP, QR, URL, Payment không đồng nghĩa scam. Phải phân tích context.

LV. NO KEYWORD-ONLY CLASSIFICATION
Keyword chỉ là feature, không quyết định scam.

LVI. MULTI-SIGNAL DECISION
Decision phải dựa trên: Content + Context + Behavior + Technical Evidence + Identity + Reputation + Requested Action.

LVIII. DECISION RULE
Nếu Strong evidence + Strong context -> HIGH_RISK / CRITICAL.
Nếu Multiple suspicious indicators + No verification -> SUSPICIOUS.
Nếu Few weak indicators -> LOW_RISK / GUARDED.
Nếu Insufficient information -> UNKNOWN / INSUFFICIENT_EVIDENCE.
"""
