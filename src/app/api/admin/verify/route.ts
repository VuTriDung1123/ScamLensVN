import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "../auth/route";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : (await req.json().catch(() => ({}))).token;

    if (!token) {
      return NextResponse.json({ valid: false, error: "Thiếu token xác thực." }, { status: 401 });
    }

    const result = verifyAdminToken(token);
    if (!result.valid) {
      return NextResponse.json({ valid: false, error: "Phiên đăng nhập quản trị đã hết hạn hoặc không hợp lệ." }, { status: 401 });
    }

    return NextResponse.json({ valid: true, username: result.username });
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error?.message || "Lỗi kiểm tra quyền quản trị." }, { status: 500 });
  }
}
