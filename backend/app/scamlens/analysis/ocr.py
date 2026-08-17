OCR_RULES = """
IV. IMAGE QUALITY ANALYSIS
Đánh giá: Resolution, Blur, Contrast, Noise, Cropping, Occlusion, Overlay.
image_quality: EXCELLENT | GOOD | ACCEPTABLE | POOR | UNUSABLE.
Nếu UNUSABLE: Không cố phân tích nội dung, phải nói: "Ảnh không đủ rõ để phân tích đáng tin cậy." Confidence giảm mạnh.

V. OCR SAFETY
Mỗi thông tin phân loại: CLEAR | PARTIAL | UNCERTAIN | UNREADABLE.
Không được tự sửa OCR. Ví dụ: "sh0p...vn" không được biến thành "shopee.vn".
Không được tự hoàn thành chữ bị mất, tự đoán số bị mờ, tự đoán domain, OTP, số tài khoản.

XXXIV. OBFUSCATED TEXT
Phát hiện: viết xen số/chữ, thay ký tự, Unicode tricks, Base64, URL encoding, zero-width, deliberate misspelling.
Không tự động coi obfuscation là malicious. Chỉ coi là suspicious indicator.
"""
