import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-handler";
import { syncOverdueInvoices } from "@/lib/invoices";
import { patchInvoiceSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await syncOverdueInvoices();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            customer: true,
            vehicle: true,
            lineItems: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (!invoice) {
      return jsonError("Invoice not found", 404);
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const { passwordHash: _pw, ...safeSettings } = settings ?? {};
    void _pw;

    return NextResponse.json({ invoice, settings: safeSettings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = patchInvoiceSchema.parse(await request.json());

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Invoice not found", 404);
    }

    if (existing.status === "PAID" && status !== "PAID") {
      return jsonError("Paid invoices cannot be changed.", 403);
    }

    const updateData: { status: typeof status; paidAt?: Date | null } = {
      status,
    };

    if (status === "PAID") {
      updateData.paidAt = new Date();
    } else if (status === "DRAFT" || status === "SENT") {
      updateData.paidAt = null;
    }

    if (status === "SENT" && existing.dueAt < new Date()) {
      updateData.status = "OVERDUE";
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        job: { include: { customer: true, vehicle: true } },
      },
    });

    if (invoice.status === "PAID") {
      await prisma.job.update({
        where: { id: invoice.jobId },
        data: { status: "PAID" },
      });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return handleApiError(error);
  }
}
