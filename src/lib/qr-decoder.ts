import jsQR from "jsqr";

export interface QRDecodeResult {
  hasQR: boolean;
  data: string | null;
  type: "URL" | "VIETQR" | "APK_LINK" | "TEXT" | "UNKNOWN";
  details?: {
    url?: string;
    bankName?: string;
    accountNumber?: string;
    amount?: string;
    memo?: string;
    isSuspicious: boolean;
    suspiciousReason?: string;
  };
}

/**
 * Parses VietQR payload if standard EMVCo format
 */
function parseVietQRPayload(payload: string): { bankName?: string; accountNumber?: string; amount?: string; memo?: string } {
  const result: { bankName?: string; accountNumber?: string; amount?: string; memo?: string } = {};
  
  if (payload.startsWith("000201")) {
    // EMVCo QR Code format
    // Simple extraction heuristics for common VietQR tags
    if (payload.includes("QRIBFTTA") || payload.includes("9704")) {
      result.bankName = "VietQR Banking Network";
    }
  }
  return result;
}

/**
 * Decode QR Code from an HTML Image Element or Canvas on the client-side
 */
export async function decodeQRCodeFromImageFile(file: File): Promise<QRDecodeResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ hasQR: false, data: null, type: "UNKNOWN" });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Scale to max 1200px for optimal QR detection
        const maxDimension = 1200;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({ hasQR: false, data: null, type: "UNKNOWN" });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        URL.revokeObjectURL(objectUrl);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });

        if (code && code.data) {
          const rawData = code.data.trim();
          let type: QRDecodeResult["type"] = "TEXT";
          let isSuspicious = false;
          let suspiciousReason = "";

          const lower = rawData.toLowerCase();

          if (lower.startsWith("http://") || lower.startsWith("https://")) {
            type = "URL";
            if (lower.endsWith(".apk") || lower.includes(".apk?") || lower.includes("/apk/")) {
              type = "APK_LINK";
              isSuspicious = true;
              suspiciousReason = "Mã QR dẫn trực tiếp tới file cài đặt ứng dụng Android (.APK) ngoài chợ ứng dụng chính thống. Đây là chiêu trò phổ biến để lừa cài mã độc chiếm quyền điều khiển điện thoại / trộm tiền tài khoản ngân hàng!";
            } else if (lower.includes("vneid") || lower.includes("dichvucong") || lower.includes("thue") || lower.includes("hoantien")) {
              if (!lower.includes(".gov.vn") && !lower.includes("dichvucong.gov.vn")) {
                isSuspicious = true;
                suspiciousReason = "Mã QR giả mạo cổng dịch vụ công / cơ quan nhà nước nhưng không có tên miền chính thống .gov.vn.";
              }
            }
          } else if (rawData.startsWith("000201") || lower.includes("vietqr")) {
            type = "VIETQR";
          }

          const details: QRDecodeResult["details"] = {
            url: type === "URL" || type === "APK_LINK" ? rawData : undefined,
            isSuspicious,
            suspiciousReason,
            ...parseVietQRPayload(rawData),
          };

          resolve({
            hasQR: true,
            data: rawData,
            type,
            details,
          });
        } else {
          resolve({ hasQR: false, data: null, type: "UNKNOWN" });
        }
      } catch (err) {
        console.warn("QR decode error:", err);
        URL.revokeObjectURL(objectUrl);
        resolve({ hasQR: false, data: null, type: "UNKNOWN" });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ hasQR: false, data: null, type: "UNKNOWN" });
    };

    img.src = objectUrl;
  });
}
