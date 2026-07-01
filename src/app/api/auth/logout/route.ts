import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const session = await getSessionFromRequest(request, response);
  session.destroy();
  return response;
}
