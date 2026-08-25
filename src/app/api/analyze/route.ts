import { NextRequest, NextResponse } from "next/server";
import { analyzeContentAI } from "@/lib/scam-analyzer";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let text: string | null = null;
    let imageBase64: string | null = null;
    let mimeType: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = formData.get("text") as string | null;
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
    }

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: "Must provide either text or image to analyze." },
        { status: 400 }
      );
    }

    const result = await analyzeContentAI({
      text,
      imageBase64,
      mimeType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API Analyze Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during analysis." },
      { status: 500 }
    );
  }
}
