import { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store (keyed by IP / identifier)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;       // Max requests allowed in the window
  windowMs: number;    // Time window in milliseconds
}

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = { limit: 15, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetSeconds: number; clientIp: string } {
  // Extract client IP from standard proxy headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "127.0.0.1";
  
  const now = Date.now();
  const path = req.nextUrl.pathname;
  const key = `${clientIp}:${path}`;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetSeconds: Math.ceil(options.windowMs / 1000),
      clientIp,
    };
  }

  if (current.count >= options.limit) {
    const resetSeconds = Math.ceil((current.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
      clientIp,
    };
  }

  current.count += 1;
  const resetSeconds = Math.ceil((current.resetTime - now) / 1000);
  return {
    allowed: true,
    remaining: options.limit - current.count,
    resetSeconds: Math.max(1, resetSeconds),
    clientIp,
  };
}
