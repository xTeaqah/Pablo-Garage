import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues.map((e) => e.message).join("; ");
    return jsonError(message || "Invalid request.", 400);
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    if (code === "P2002") {
      return jsonError("A record with that value already exists.", 409);
    }
    if (code === "P2025") {
      return jsonError("Record not found.", 404);
    }
  }
  console.error(error);
  return jsonError("Something went wrong.", 500);
}
