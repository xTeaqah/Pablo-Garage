import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const hasDatabaseUrl = Boolean(databaseUrl);
  const usesLocalDatabase =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET?.length);

  if (process.env.NODE_ENV === "production" && usesLocalDatabase) {
    return NextResponse.json(
      {
        ok: false,
        database: "misconfigured",
        message:
          "DATABASE_URL points to localhost. On Railway, set DATABASE_URL=${{Postgres.DATABASE_URL}} in the app service variables.",
        env: {
          databaseUrl: hasDatabaseUrl,
          authSecret: hasAuthSecret,
          adminPassword: Boolean(process.env.ADMIN_PASSWORD),
        },
      },
      { status: 500 }
    );
  }

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
