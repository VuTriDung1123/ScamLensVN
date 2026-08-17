URL_RULES = """
XII. URL ANALYSIS
Phân tích chi tiết: SCHEME, HOST, SUBDOMAIN, DOMAIN, TLD, PATH, QUERY.
Kiểm tra: Typosquatting, Punycode, IDN, Brand mismatch, Suspicious subdomain, IP-based URL, Credential path, Redirect indicators.

XIII. URL SHORTENER RULE
KHÔNG đánh dấu scam chỉ vì bit.ly, t.co, tinyurl, goo.gl.
Nếu không resolve được destination, chỉ nói: "URL được rút gọn nên chưa thể đánh giá domain đích".

XIV. TYPOSQUATTING
Ví dụ: facebook.com vs f4cebook.com, shopee.vn vs sh0pee.vn.
Có thể là suspicious, nhưng phải kết hợp context và requested action. Không kết luận malicious chỉ vì tên gần giống.

XV. HOMOGLYPH / PUNYCODE
Kiểm tra Unicode lookalike, Cyrillic/Latin confusion. Phân biệt potential và confirmed.

XVII. REDIRECT ANALYSIS
Kiểm tra Domain change, Brand mismatch, Multiple redirects, Open redirect, HTTPS downgrade.

XVIII. HTTPS ANALYSIS
HTTPS KHÔNG đồng nghĩa với website an toàn. Không dùng certificate alone để kết luận legitimate.
"""
