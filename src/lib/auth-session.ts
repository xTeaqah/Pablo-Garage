import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  isLoggedIn: boolean;
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set in .env and be at least 32 characters long."
    );
  }
  return secret;
}

let cachedSessionOptions: SessionOptions | null = null;

export function getSessionOptions(): SessionOptions {
  if (!cachedSessionOptions) {
    cachedSessionOptions = {
      password: getAuthSecret(),
      cookieName: "pablo_session",
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      },
    };
  }
  return cachedSessionOptions;
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getSessionFromRequest(
  request: NextRequest,
  response: NextResponse
) {
  return getIronSession<SessionData>(request, response, getSessionOptions());
}
