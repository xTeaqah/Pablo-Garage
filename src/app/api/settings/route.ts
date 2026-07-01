import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-handler";
import { patchSettingsSchema } from "@/lib/validations";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "default" },
      });
    }

    const { passwordHash: _pw, ...safeSettings } = settings;
    void _pw;

    return NextResponse.json(safeSettings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = patchSettingsSchema.parse(await request.json());

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: body,
      create: { id: "default", ...body },
    });

    const { passwordHash: _pw, ...safeSettings } = settings;
    void _pw;

    return NextResponse.json(safeSettings);
  } catch (error) {
    return handleApiError(error);
  }
}
