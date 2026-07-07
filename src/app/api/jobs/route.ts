import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-handler";
import { parseFormDate } from "@/lib/dates";
import { sumMoney } from "@/lib/money";
import {
  createJobSchema,
  normalizeLineItems,
  paginationSchema,
} from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() ?? "";
    const unscheduled = searchParams.get("unscheduled") === "true";
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
    });
    const skip = (page - 1) * limit;

    const where = {
      ...(unscheduled
        ? { scheduledAt: null, status: "SCHEDULED" as const }
        : status && status !== "all"
          ? { status: status as never }
          : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search } },
              { customer: { name: { contains: search } } },
              { vehicle: { registration: { contains: search } } },
            ],
          }
        : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          vehicle: true,
          invoice: true,
        },
        orderBy: unscheduled
          ? { createdAt: "desc" }
          : [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page,
      limit,
      hasMore: skip + jobs.length < total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createJobSchema.parse(await request.json());

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: body.vehicleId, customerId: body.customerId },
    });
    if (!vehicle) {
      return jsonError("Vehicle does not belong to this customer.", 400);
    }

    const lineItems = normalizeLineItems(body.lineItems ?? []);
    const total = sumMoney(lineItems.map((item) => item.lineTotal));

    const job = await prisma.job.create({
      data: {
        customerId: body.customerId,
        vehicleId: body.vehicleId,
        description: body.description,
        notes: body.notes || null,
        status: body.status || "SCHEDULED",
        scheduledAt: body.scheduledAt
          ? parseFormDate(body.scheduledAt)
          : null,
        total,
        ...(lineItems.length
          ? {
              lineItems: {
                create: lineItems,
              },
            }
          : {}),
      },
      include: {
        customer: true,
        vehicle: true,
        lineItems: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
