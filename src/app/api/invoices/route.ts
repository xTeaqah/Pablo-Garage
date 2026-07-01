import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-handler";
import { syncOverdueInvoices } from "@/lib/invoices";
import { paginationSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    await syncOverdueInvoices();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
    });
    const skip = (page - 1) * limit;

    const where =
      status && status !== "all" ? { status: status as never } : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          job: {
            include: {
              customer: true,
              vehicle: true,
              lineItems: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
        orderBy: { issuedAt: "desc" },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      page,
      limit,
      hasMore: skip + invoices.length < total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
