ENTITY_RULES = """
VI. TEXT EXTRACTION
Trích xuất: Sender, Recipient, Message, URL, Phone, Email, Bank account, Amount, Currency, OTP request, v.v.

XIX. EMAIL ANALYSIS
Phân tích: Display name, Email address, Domain, Reply-To. Sender/domain mismatch.
Không được tuyên bố email đã vượt qua SPF/DKIM/DMARC nếu không có raw header.

XX. PHONE NUMBER ANALYSIS
Kiểm tra: Format, Country code, Context.
Không được tự nói: "Số này là số lừa đảo" trừ khi hệ thống cung cấp reputation evidence. Nếu không có: phone_reputation = UNKNOWN.

XXI. BANK ACCOUNT ANALYSIS
Extract: Bank, Account number, Account holder.
Không được xác nhận: Người sở hữu, Tài khoản scam, Tài khoản sạch (trừ khi có external verified evidence).

XXII. QR CODE ANALYSIS
Nếu QR chưa decode: qr_status = NOT_DECODED. Không được đoán payload.
"""
