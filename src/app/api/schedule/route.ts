import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  endOfMonth,
  endOfDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let rangeStart: Date;
  let rangeEnd: Date;

  if (from && to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json(
        { error: "from and to must be YYYY-MM-DD" },
        { status: 400 }
      );
    }
    rangeStart = startOfDay(parseISO(from));
    rangeEnd = endOfDay(parseISO(to));
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    rangeStart = startOfMonth(parseISO(`${month}-01`));
    rangeEnd = endOfMonth(rangeStart);
  } else {
    return NextResponse.json(
      { error: "Provide month (YYYY-MM) or from & to (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const jobs = await prisma.job.findMany({
    where: {
      scheduledAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      status: { not: "CANCELLED" },
    },
    include: {
      customer: true,
      vehicle: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(jobs);
}
