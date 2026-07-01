import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-handler";
import {
  createVehicleSchema,
  patchCustomerSchema,
} from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: { orderBy: { registration: "asc" } },
        jobs: {
          include: { vehicle: true, invoice: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return jsonError("Customer not found", 404);
    }

    return NextResponse.json(customer);
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
    const body = patchCustomerSchema.parse(await request.json());

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...body,
        email: body.email === "" ? null : body.email,
      },
      include: { vehicles: true },
    });

    return NextResponse.json(customer);
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

    const paidJobs = await prisma.job.count({
      where: { customerId: id, status: { in: ["INVOICED", "PAID"] } },
    });
    if (paidJobs > 0) {
      return jsonError(
        "Cannot delete a customer with invoiced or paid jobs.",
        403
      );
    }

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = createVehicleSchema.parse(await request.json());

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return jsonError("Customer not found", 404);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: id,
        registration: body.registration.toUpperCase(),
        make: body.make,
        model: body.model,
        year: body.year ?? null,
        mileage: body.mileage ?? null,
        color: body.color ?? null,
        fuelType: body.fuelType ?? null,
        motStatus: body.motStatus ?? null,
        motExpiryDate: body.motExpiryDate ?? null,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
