import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeekBounds } from "@/lib/utils";
import { syncOverdueInvoices } from "@/lib/invoices";
import { withInventoryTotals } from "@/lib/inventory";
import { roundMoney } from "@/lib/money";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  format,
} from "date-fns";

export async function GET() {
  try {
    await syncOverdueInvoices();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const { start: weekStart, end: weekEnd } = getWeekBounds(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const [
      earnedWeek,
      earnedMonth,
      earnedYear,
      earnedToday,
      outstandingSent,
      outstandingOverdue,
      outstandingDraft,
      invoicedWeek,
      invoicedMonth,
      recentPaid,
      recentOutstanding,
      weeklyBreakdown,
      soldCars,
    ] = await Promise.all([
      sumPaidInRange(weekStart, weekEnd),
      sumPaidInRange(monthStart, monthEnd),
      sumPaidInRange(yearStart, yearEnd),
      sumPaidInRange(todayStart, todayEnd),
      sumByStatus(["SENT"]),
      sumByStatus(["OVERDUE"]),
      sumByStatus(["DRAFT"]),
      sumIssuedInRange(weekStart, weekEnd),
      sumIssuedInRange(monthStart, monthEnd),
      prisma.invoice.findMany({
        where: { status: "PAID" },
        include: {
          job: {
            include: {
              customer: true,
              vehicle: true,
            },
          },
        },
        orderBy: { paidAt: "desc" },
        take: 8,
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["SENT", "OVERDUE", "DRAFT"] } },
        include: {
          job: {
            include: {
              customer: true,
              vehicle: true,
            },
          },
        },
        orderBy: { dueAt: "asc" },
        take: 8,
      }),
      getWeeklyBreakdown(now, 6),
      prisma.inventoryCar.findMany({
        where: { status: "SOLD", soldAt: { not: null } },
        include: { parts: true },
        orderBy: { soldAt: "desc" },
      }),
    ]);

    const stockProfitWeek = sumStockProfitInRange(
      soldCars.map(withInventoryTotals),
      weekStart,
      weekEnd
    );
    const stockProfitMonth = sumStockProfitInRange(
      soldCars.map(withInventoryTotals),
      monthStart,
      monthEnd
    );
    const stockProfitYear = sumStockProfitInRange(
      soldCars.map(withInventoryTotals),
      yearStart,
      yearEnd
    );

    const outstandingTotal =
      (outstandingSent._sum.total ?? 0) +
      (outstandingOverdue._sum.total ?? 0) +
      (outstandingDraft._sum.total ?? 0);

    return NextResponse.json({
      earned: {
        week: roundMoney((earnedWeek._sum.total ?? 0) + stockProfitWeek),
        month: roundMoney((earnedMonth._sum.total ?? 0) + stockProfitMonth),
        year: roundMoney((earnedYear._sum.total ?? 0) + stockProfitYear),
        today: earnedToday._sum.total ?? 0,
        workshopWeek: earnedWeek._sum.total ?? 0,
        stockWeek: stockProfitWeek,
        workshopMonth: earnedMonth._sum.total ?? 0,
        stockMonth: stockProfitMonth,
      },
      invoiced: {
        week: invoicedWeek._sum.total ?? 0,
        month: invoicedMonth._sum.total ?? 0,
      },
      outstanding: {
        total: outstandingTotal,
        sent: outstandingSent._sum.total ?? 0,
        overdue: outstandingOverdue._sum.total ?? 0,
        draft: outstandingDraft._sum.total ?? 0,
        count:
          outstandingSent._count.id +
          outstandingOverdue._count.id +
          outstandingDraft._count.id,
      },
      weeklyBreakdown,
      recentPaid,
      recentOutstanding,
      recentStockSales: soldCars
        .map(withInventoryTotals)
        .filter((car) => car.soldAt)
        .slice(0, 5),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load finances." },
      { status: 500 }
    );
  }
}

function sumStockProfitInRange(
  cars: Array<
    ReturnType<typeof withInventoryTotals> & { soldAt: Date | null }
  >,
  start: Date,
  end: Date
) {
  return roundMoney(
    cars
      .filter(
        (car) =>
          car.soldAt &&
          car.profit != null &&
          new Date(car.soldAt) >= start &&
          new Date(car.soldAt) <= end
      )
      .reduce((sum, car) => sum + (car.profit ?? 0), 0)
  );
}

async function sumPaidInRange(start: Date, end: Date) {
  return prisma.invoice.aggregate({
    where: {
      status: "PAID",
      paidAt: { gte: start, lte: end },
    },
    _sum: { total: true },
  });
}

async function sumIssuedInRange(start: Date, end: Date) {
  return prisma.invoice.aggregate({
    where: {
      issuedAt: { gte: start, lte: end },
      status: { not: "DRAFT" },
    },
    _sum: { total: true },
  });
}

async function sumByStatus(statuses: ("SENT" | "OVERDUE" | "DRAFT")[]) {
  return prisma.invoice.aggregate({
    where: { status: { in: statuses } },
    _sum: { total: true },
    _count: { id: true },
  });
}

async function getWeeklyBreakdown(now: Date, weeks: number) {
  const results: { label: string; amount: number; isCurrent: boolean }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekDate = subWeeks(now, i);
    const { start, end } = getWeekBounds(weekDate);
    const aggregate = await sumPaidInRange(start, end);
    const isCurrent = i === 0;

    results.push({
      label: isCurrent ? "This wk" : format(start, "d MMM"),
      amount: aggregate._sum.total ?? 0,
      isCurrent,
    });
  }

  return results;
}
