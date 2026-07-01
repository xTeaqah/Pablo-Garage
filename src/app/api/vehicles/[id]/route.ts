import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-handler";
import { patchVehicleSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = patchVehicleSchema.parse(await request.json());

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...body,
        registration: body.registration?.toUpperCase(),
      },
    });

    return NextResponse.json(vehicle);
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

    const jobCount = await prisma.job.count({
      where: {
        vehicleId: id,
        status: { in: ["INVOICED", "PAID"] },
      },
    });
    if (jobCount > 0) {
      return jsonError(
        "Cannot delete a vehicle with invoiced or paid jobs.",
        403
      );
    }

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
