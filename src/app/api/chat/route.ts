import { NextRequest, NextResponse } from "next/server";
import { chatWithAssistantAI } from "@/lib/scam-analyzer";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  // Rate Limiting (Max 35 chat interactions per minute per IP)
  const rateLimit = checkRateLimit(req, { limit: 35, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ ${rateLimit.resetSeconds} giây trước khi gửi tiếp.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": rateLimit.resetSeconds.toString(),
        },
      }
    );
  }

  try {
    const { context_result, user_message, chat_history } = await req.json();

    if (!user_message) {
      return NextResponse.json({ error: "Missing user message" }, { status: 400 });
    }

    const reply = await chatWithAssistantAI({
      contextResult: context_result,
      userMessage: user_message,
      chatHistory: chat_history,
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("[API Chat Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during chat." },
      { status: 500 }
    );
  }
}
