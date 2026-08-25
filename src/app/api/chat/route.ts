import { NextRequest, NextResponse } from "next/server";
import { chatWithAssistantAI } from "@/lib/scam-analyzer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { context_result, user_message, chat_history } = body;

    if (!user_message || !context_result) {
      return NextResponse.json(
        { error: "Must provide context_result and user_message." },
        { status: 400 }
      );
    }

    const reply = await chatWithAssistantAI({
      contextResult: context_result,
      userMessage: user_message,
      chatHistory: chat_history || [],
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
