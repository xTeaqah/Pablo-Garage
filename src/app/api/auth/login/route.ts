import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCredentials,
  resolveCredentials,
} from "@/lib/auth";
import { getSessionFromRequest } from "@/lib/auth-session";
import {
  checkRateLimit,
  clearRateLimit,
  pruneExpiredLoginAttempts,
} from "@/lib/rate-limit";
import { handleApiError, jsonError } from "@/lib/api-handler";

export async function POST(request: NextRequest) {
  try {
    await pruneExpiredLoginAttempts();

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rateLimit = await checkRateLimit(`login:${ip}`);
    if (!rateLimit.allowed) {
      return jsonError(
        `Too many attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
        429
      );
    }

    let body: { username?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid request.", 400);
    }

    const username = body.username?.trim();
    const password = body.password?.trim();
    if (!username || !password) {
      return jsonError("Username and password are required.", 400);
    }

    try {
      await resolveCredentials();
    } catch {
      return jsonError(
        "Sign-in is not configured. Contact the site owner.",
        503
      );
    }

    const valid = await authenticateCredentials(username, password);
    if (!valid) {
      return jsonError("Invalid username or password.", 401);
    }

    await clearRateLimit(`login:${ip}`);

    const response = NextResponse.json({ ok: true });
    const session = await getSessionFromRequest(request, response);
    session.destroy();
    session.isLoggedIn = true;
    await session.save();

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
