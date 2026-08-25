import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || "scamlens-vn-super-secure-admin-secret-2026";
const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "scamlens2026";

export function generateAdminToken(username: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64");
}

export function verifyAdminToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, expiresAtStr, signature] = decoded.split(":");
    if (!username || !expiresAtStr || !signature) {
      return { valid: false };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${username}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
    
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) {
      return { valid: true, username };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu." },
        { status: 400 }
      );
    }

    // Constant-time check for username and password
    const isUserMatch = username === ADMIN_USER;
    const isPassMatch = password === ADMIN_PASS;

    if (!isUserMatch || !isPassMatch) {
      // Delay response slightly to mitigate brute-force
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc mật khẩu quản trị không chính xác." },
        { status: 401 }
      );
    }

    const token = generateAdminToken(username);
    return NextResponse.json({
      success: true,
      token,
      message: "Đăng nhập quản trị viên thành công.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi xử lý xác thực quản trị." },
      { status: 500 }
    );
  }
}
