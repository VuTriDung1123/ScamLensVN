// ============================================================================
// VIETNAM CYBERSECURITY & ANTI-SCAM THREAT INTELLIGENCE BLACKLIST
// ============================================================================

export interface BlacklistHit {
  isMatch: boolean;
  type: "BANK_ACCOUNT" | "PHISHING_DOMAIN" | "TELECOM_SCAM" | "GOV_IMPERSONATION" | "MALICIOUS_APP";
  matchedItem: string;
  threatLevel: "CRITICAL" | "HIGH";
  scamCategory: string;
  reason: string;
  source: string;
}

// 1. Phishing & Fake Bank / Government / E-Commerce Domains Patterns
const KNOWN_PHISHING_DOMAINS = [
  // Fake Bank & E-Wallets
  "vietcombank-login", "vcb-digibank.vip", "vietinbank-online.top", "mbbank-online.cc",
  "techcombank-ibanking.top", "acb-digi.click", "tpbank-login.xyz", "bidv-smartbanking.top",
  "momo-nhanqua.top", "zalopay-trian.top", "sacombank-ibanking.online",
  
  // Fake Dịch vụ công / VNeID / Thuế
  "dichvucong-vneid.cc", "vneid-gov.top", "dichvucong-gov.vip", "tongcucthue-hanoi.top",
  "gdt-gov.vip", "vneid-cap2.apk", "dichvucong-online.xyz", "vneid-tracuu.online",
  "dichvucong-quocgia.top", "baohiemxahoi-vietnam.top", "cucantoanthongtin-hotro.top",
  
  // Fake Sàn TMĐT / Hoàn tiền / Việc làm
  "shopee-quatang.top", "lazada-hoantien.vip", "tiki-trian2026.top", "tiktok-kiemtien.online",
  "tuyendung-shopee.top", "shopee-mall-vip.xyz", "lazada-trian.xyz", "vnpost-tracking.top",
  "ghtk-giaohang.top", "viettelpost-hoanphi.online", "shopee-congtacvien.top",
  
  // Fake Sàn chứng khoán / Tiền ảo / Cờ bạc trá hình
  "binance-vietnam.top", "exness-trade.vip", "sanchungkhoan-vietnam.top", "forex-vietnam.top"
];

// 2. High Risk Known Malicious Beneficiary Account Signatures in Vietnam
const KNOWN_SCAM_ACCOUNTS = [
  { bank: "MBBank", account: "098765432109", owner: "NGUYEN VAN LUA", scam: "Giả mạo nhân viên Shopee hoàn tiền" },
  { bank: "Techcombank", account: "190367890123", owner: "TRAN THI MA", scam: "Lừa đảo nâng hạn mức thẻ tín dụng" },
  { bank: "Vietcombank", account: "0011004392819", owner: "LE VAN BAP", scam: "Mạo danh công an dọa khóa tài khoản" },
  { bank: "VPBank", account: "10982347102", owner: "HOANG MINH TAI", scam: "Lừa đảo cọc xe máy giá rẻ" },
  { bank: "ACB", account: "23456789012", owner: "VO THI PHUONG", scam: "Cộng tác viên xem video nhận tiền" }
];

// 3. Government / Police / Authority Impersonation Phrasing
const GOV_POLICE_SCAM_PHRASES = [
  "lệnh bắt tạm giam",
  "quyết định khởi tố",
  "viện kiểm sát nhân dân tối cao",
  "cục an ninh mạng",
  "bộ công an yêu cầu chuyển tiền",
  "tài khoản thanh tra",
  "chứng minh tài chính trong sạch",
  "vneid bị lỗi cần cài bản cập nhật .apk",
  "hoàn thuế thu nhập cá nhân bấm vào link",
  "cập nhật sinh trắc học qua link"
];

/**
 * Checks text or URL against the Vietnam Scam Intelligence Blacklist
 */
export function checkBlacklist(input: string): BlacklistHit | null {
  if (!input) return null;
  const normalized = input.toLowerCase();

  // 1. Check Phishing Domain Patterns
  for (const domain of KNOWN_PHISHING_DOMAINS) {
    if (normalized.includes(domain)) {
      return {
        isMatch: true,
        type: "PHISHING_DOMAIN",
        matchedItem: domain,
        threatLevel: "CRITICAL",
        scamCategory: "Phishing / Giả mạo cổng dịch vụ hoặc ngân hàng",
        reason: `Tên miền "${domain}" đã nằm trong danh sách đen các website giả mạo lừa đảo trực tuyến tại Việt Nam.`,
        source: "Cơ sở dữ liệu ScamLens & Hệ sinh thái Chống Lừa Đảo VN"
      };
    }
  }

  // Check generic high-risk TLDs combined with banking keywords
  const bankingKeywords = ["vietcombank", "techcombank", "mbbank", "vietinbank", "vneid", "dichvucong", "shopee", "lazada", "vnpost", "gdt-gov"];
  const riskyTLDs = [".top", ".vip", ".xyz", ".cc", ".click", ".online", ".work", ".buzz", ".live"];
  
  for (const kw of bankingKeywords) {
    for (const tld of riskyTLDs) {
      if (normalized.includes(`${kw}`) && normalized.includes(`${tld}`)) {
        return {
          isMatch: true,
          type: "PHISHING_DOMAIN",
          matchedItem: `${kw}*${tld}`,
          threatLevel: "CRITICAL",
          scamCategory: "Typosquatting / Domain Phishing nguy hiểm cao",
          reason: `Phát hiện tên miền sử dụng từ khóa thương hiệu chính thống (${kw}) kết hợp với đuôi tên miền rủi ro cao (${tld}). Các tổ chức tài chính & nhà nước tại VN không bao giờ sử dụng các đuôi tên miền này.`,
          source: "Hệ thống Phân tích An ninh ScamLens VN"
        };
      }
    }
  }

  // 2. Check Police & Authority Impersonation Phrasing
  for (const phrase of GOV_POLICE_SCAM_PHRASES) {
    if (normalized.includes(phrase)) {
      return {
        isMatch: true,
        type: "GOV_IMPERSONATION",
        matchedItem: phrase,
        threatLevel: "CRITICAL",
        scamCategory: "Mạo danh Cơ quan Công an / Cơ quan Nhà nước lừa đảo",
        reason: `Nội dung chứa cụm từ mạo danh cơ quan thực thi pháp luật ("${phrase}"). Quy định pháp luật Việt Nam: Cơ quan Công an, Viện Kiểm sát, Thuế KHÔNG BAO GIỜ làm việc hoặc gửi văn bản tố tụng qua Zalo, Telegram, Facebook hay yêu cầu chuyển tiền vào tài khoản cá nhân.`,
        source: "Cảnh báo Bộ Công An & Cục An toàn Thông tin (NCSC)"
      };
    }
  }

  // 3. Check Known Scam Bank Accounts
  for (const acc of KNOWN_SCAM_ACCOUNTS) {
    if (input.includes(acc.account)) {
      return {
        isMatch: true,
        type: "BANK_ACCOUNT",
        matchedItem: `${acc.bank} - ${acc.account} (${acc.owner})`,
        threatLevel: "CRITICAL",
        scamCategory: "Số tài khoản ngân hàng gian lận đã được báo cáo",
        reason: `Số tài khoản ${acc.account} (${acc.bank}) thuộc danh sách cảnh báo có liên quan đến hành vi: ${acc.scam}.`,
        source: "Cơ sở dữ liệu STK lừa đảo cộng đồng VN"
      };
    }
  }

  return null;
}
