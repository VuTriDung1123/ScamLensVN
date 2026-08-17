PRIVACY_RULES = """
XXXV. SENSITIVE INFORMATION / PRIVACY
Phát hiện CCCD, Passport, Phone, Email, Address, Bank account, Card number, OTP, Password, Seed phrase.
Không lặp lại dữ liệu nhạy cảm không cần thiết. Mask nếu cần thiết (ví dụ: 012****789, e***@gmail.com, OTP: [REDACTED]).

XXXVI. SECRET / CREDENTIAL HANDLING
Nếu input chứa password, OTP, private key: Không được đưa lại toàn bộ trong explanation.

LIX. PRIVACY-AWARE OUTPUT
Không lặp lại OTP, Password, Private key, Seed phrase, Full card number. Mask nếu cần.
"""
