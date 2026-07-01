import { NextRequest, NextResponse } from "next/server";
import type { JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateDueDate, generateInvoiceNumber } from "@/lib/utils";
import { handleApiError, jsonError } from "@/lib/api-handler";
import { roundMoney, sumMoney } from "@/lib/money";
import {
  canTransitionJobStatus,
  isJobDeletable,
  isJobFinanciallyLocked,
} from "@/lib/job-status";
import { normalizeLineItems, patchJobSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        invoice: true,
      },
    });

    if (!job) {
      return jsonError("Job not found", 404);
    }

    return NextResponse.json(job);
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
    const body = patchJobSchema.parse(await request.json());

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return jsonError("Job not found", 404);
    }

    if (isJobFinanciallyLocked(existing.status)) {
      return jsonError("Invoiced or paid jobs cannot be edited.", 403);
    }

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      if (
        !canTransitionJobStatus(
          existing.status,
          body.status as JobStatus
        )
      ) {
        return jsonError(
          `Cannot change status from ${existing.status} to ${body.status}.`,
          400
        );
      }
      updateData.status = body.status;
      if (body.status === "IN_PROGRESS" && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      if (body.status === "COMPLETE") {
        updateData.completedAt = new Date();
      }
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt
        ? new Date(body.scheduledAt)
        : null;
    }

    if (body.lineItems) {
      const lineItems = normalizeLineItems(body.lineItems);
      updateData.total = sumMoney(lineItems.map((item) => item.lineTotal));

      await prisma.jobLineItem.deleteMany({ where: { jobId: id } });
      await prisma.jobLineItem.createMany({
        data: lineItems.map((item) => ({
          jobId: id,
          ...item,
        })),
      });
    }

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        invoice: true,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return jsonError("Job not found", 404);
    }

    if (!isJobDeletable(job.status)) {
      return jsonError(
        "Invoiced or paid jobs cannot be deleted.",
        403
      );
    }

    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action !== "create_invoice") {
      return jsonError("Unknown action", 400);
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: { invoice: true, lineItems: true },
    });

    if (!job) {
      return jsonError("Job not found", 404);
    }

    if (job.invoice) {
      return NextResponse.json(job.invoice);
    }

    if (job.status !== "COMPLETE") {
      return jsonError("Only completed jobs can be invoiced.", 400);
    }

    if (roundMoney(job.total) <= 0) {
      return jsonError("Job total must be greater than zero.", 400);
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const invoiceNumber = generateInvoiceNumber(
      settings?.invoicePrefix ?? "MG",
      settings?.nextInvoiceNumber ?? 1
    );

    const issuedAt = new Date();
    const dueAt = calculateDueDate(
      issuedAt,
      settings?.paymentTermsDays ?? 14
    );

    const [invoice] = await prisma.$transaction([
      prisma.invoice.create({
        data: {
          jobId: id,
          invoiceNumber,
          status: "DRAFT",
          issuedAt,
          dueAt,
          subtotal: job.total,
          total: job.total,
        },
      }),
      prisma.job.update({
        where: { id },
        data: { status: "INVOICED" },
      }),
      prisma.settings.update({
        where: { id: "default" },
        data: { nextInvoiceNumber: (settings?.nextInvoiceNumber ?? 1) + 1 },
      }),
    ]);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
