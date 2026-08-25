import { NextRequest, NextResponse } from "next/server";
import { analyzeContentAI } from "@/lib/scam-analyzer";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  // 1. Rate Limiting Check (Max 20 analyses per minute per IP)
  const rateLimit = checkRateLimit(req, { limit: 20, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Bạn đã thực hiện quá nhiều lượt quét trong thời gian ngắn. Vui lòng chờ ${rateLimit.resetSeconds} giây nữa trước khi thử lại.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetSeconds.toString(),
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    let text: string | null = null;
    let imageBase64: string | null = null;
    let mimeType: string | null = null;
    let decodedQR: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = formData.get("text") as string | null;
      decodedQR = formData.get("decodedQR") as string | null;
      const file = formData.get("image") as File | null;

      if (file && typeof file === "object" && "arrayBuffer" in file) {
        mimeType = file.type || "image/jpeg";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageBase64 = buffer.toString("base64");
      }
    } else {
      const body = await req.json();
      text = body.text || null;
      imageBase64 = body.imageBase64 || null;
      mimeType = body.mimeType || null;
      decodedQR = body.decodedQR || null;
    }

    if (!text && !imageBase64 && !decodedQR) {
      return NextResponse.json(
        { error: "Vui lòng nhập văn bản, đường link hoặc tải ảnh lên để phân tích." },
        { status: 400 }
      );
    }

    const result = await analyzeContentAI({
      text,
      imageBase64,
      mimeType,
      decodedQR,
    });

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API Analyze Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Lỗi máy chủ trong quá trình phân tích an ninh." },
      { status: 500 }
    );
  }
}
