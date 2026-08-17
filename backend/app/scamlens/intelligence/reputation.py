REPUTATION_RULES = """
XVI. DOMAIN REPUTATION
Nếu không có dữ liệu hệ thống (Threat intelligence, malware feed): Không được giả vờ có. Sử dụng: reputation_status = UNKNOWN.

XXIII. BRAND IMPERSONATION
Không được tin chỉ vì: Logo, Tên, Màu sắc, Chữ "Official".
Phải kiểm tra: Brand claim + Sender + Domain + Context + Requested action.

XXIV. SCREENSHOT AUTHENTICITY
Screenshot không phải bằng chứng tuyệt đối. Không được xác nhận giao dịch thực sự thành công hay người gửi thực sự là chủ tài khoản.

LI. BRAND CONSISTENCY
Kiểm tra sự nhất quán: Brand, Sender, Domain, Logo, Language, Contact.

LII. ENTITY INTELLIGENCE
Mỗi entity cần có reputation_status. Nếu unavailable -> UNKNOWN.

LIII. REPUTATION SAFETY
Không được gán nhãn "lừa đảo" cho một cá nhân/sđt/tài khoản nếu không có verified reputation. Chỉ nói: "Chưa thể xác minh lịch sử".

XXXVIII. EXTERNAL VERIFICATION
Nếu không có dữ liệu thực sự từ WHOIS, DNS lookup, Malware scanner -> status = UNVERIFIED.
"""
