import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET?.length);

  try {
    await prisma.$queryRaw`SELECT 1`;
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      database: "connected",
      tables: "ready",
      settingsRow: Boolean(settings),
      env: {
        databaseUrl: hasDatabaseUrl,
        authSecret: hasAuthSecret,
        adminPassword: Boolean(process.env.ADMIN_PASSWORD),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message,
        env: {
          databaseUrl: hasDatabaseUrl,
          authSecret: hasAuthSecret,
          adminPassword: Boolean(process.env.ADMIN_PASSWORD),
        },
      },
      { status: 500 }
    );
  }
}
