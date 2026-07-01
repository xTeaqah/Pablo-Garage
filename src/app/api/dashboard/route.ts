import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWeekBounds, DEFAULT_BUSINESS_NAME } from "@/lib/utils";
import { syncOverdueInvoices } from "@/lib/invoices";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    await syncOverdueInvoices();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const { start: weekStart, end: weekEnd } = getWeekBounds(now);

    const [
      todaysJobs,
      weekJobs,
      openJobs,
      paidThisWeek,
      outstandingInvoices,
      needsAttention,
      weekJobsForStrip,
      settings,
      motExpiringSoon,
    ] = await Promise.all([
      prisma.job.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: ["CANCELLED", "PAID"] },
        },
        include: {
          customer: true,
          vehicle: true,
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.job.count({
        where: {
          OR: [
            { scheduledAt: { gte: weekStart, lte: weekEnd } },
            { completedAt: { gte: weekStart, lte: weekEnd } },
          ],
          status: { not: "CANCELLED" },
        },
      }),
      prisma.job.count({
        where: {
          status: {
            in: ["SCHEDULED", "IN_PROGRESS", "WAITING_PARTS", "COMPLETE"],
          },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: ["SENT", "OVERDUE"] },
        },
        _sum: { total: true },
      }),
      getNeedsAttention(),
      prisma.job.findMany({
        where: {
          scheduledAt: { gte: weekStart, lte: weekEnd },
          status: { not: "CANCELLED" },
        },
        select: { scheduledAt: true },
      }),
      prisma.settings.findUnique({ where: { id: "default" } }),
      prisma.vehicle.findMany({
        where: {
          motExpiryDate: { not: null },
        },
        take: 5,
        include: { customer: true },
      }),
    ]);

    return NextResponse.json({
      todaysJobs,
      stats: {
        weekRevenue: paidThisWeek._sum.total ?? 0,
        outstanding: outstandingInvoices._sum.total ?? 0,
        jobsThisWeek: weekJobs,
        openJobs,
      },
      needsAttention,
      weekJobsForStrip,
      motExpiringSoon,
      businessName: settings?.businessName ?? DEFAULT_BUSINESS_NAME,
      adminUsername: settings?.adminUsername ?? "Pablo",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load dashboard." },
      { status: 500 }
    );
  }
}

async function getNeedsAttention() {
  const items: {
    type: string;
    title: string;
    subtitle: string;
    href: string;
    amount?: number;
  }[] = [];

  const completeJobs = await prisma.job.findMany({
    where: { status: "COMPLETE" },
    include: { customer: true, vehicle: true },
    take: 5,
  });

  for (const job of completeJobs) {
    items.push({
      type: "invoice",
      title: "Ready to invoice",
      subtitle: `${job.customer.name} — ${job.vehicle.registration}`,
      href: `/jobs/${job.id}`,
      amount: job.total,
    });
  }

  const unsentInvoices = await prisma.invoice.findMany({
    where: { status: "DRAFT" },
    include: { job: { include: { customer: true } } },
    take: 5,
  });

  for (const inv of unsentInvoices) {
    items.push({
      type: "send",
      title: "Send invoice",
      subtitle: `${inv.job.customer.name} — ${inv.invoiceNumber}`,
      href: `/invoices/${inv.id}`,
      amount: inv.total,
    });
  }

  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: "OVERDUE" },
    include: { job: { include: { customer: true } } },
    take: 5,
  });

  for (const inv of overdueInvoices) {
    items.push({
      type: "overdue",
      title: "Payment overdue",
      subtitle: `${inv.job.customer.name} — ${inv.invoiceNumber}`,
      href: `/invoices/${inv.id}`,
      amount: inv.total,
    });
  }

  const staleJobs = await prisma.job.findMany({
    where: {
      status: "IN_PROGRESS",
      updatedAt: { lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    },
    include: { customer: true, vehicle: true },
    take: 3,
  });

  for (const job of staleJobs) {
    items.push({
      type: "stale",
      title: "Job still open",
      subtitle: `${job.vehicle.registration} — ${job.description}`,
      href: `/jobs/${job.id}`,
    });
  }

  return items.slice(0, 5);
}
