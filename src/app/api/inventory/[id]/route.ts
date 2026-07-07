import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonError } from "@/lib/api-handler";
import { withInventoryTotals } from "@/lib/inventory";
import { roundMoney } from "@/lib/money";
import { parseFormDate } from "@/lib/dates";
import { patchInventorySchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const car = await prisma.inventoryCar.findUnique({
      where: { id },
      include: {
        parts: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!car) {
      return jsonError("Not found", 404);
    }

    return NextResponse.json(withInventoryTotals(car));
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
    const body = patchInventorySchema.parse(await request.json());
    const { parts, purchaseDate, soldAt, salePrice, ...rest } = body;

    const updateData: Record<string, unknown> = { ...rest };

    if (rest.registration !== undefined) {
      updateData.registration = rest.registration.toUpperCase();
    }
    if (purchaseDate !== undefined) {
      updateData.purchaseDate = purchaseDate
        ? parseFormDate(purchaseDate)
        : null;
    }
    if (soldAt !== undefined) {
      updateData.soldAt = soldAt ? parseFormDate(soldAt) : null;
    }
    if (salePrice !== undefined) {
      updateData.salePrice =
        salePrice === null ? null : roundMoney(salePrice);
    }
    if (rest.purchaseCost !== undefined) {
      updateData.purchaseCost = roundMoney(rest.purchaseCost);
    }

    if (parts) {
      await prisma.inventoryPart.deleteMany({ where: { inventoryCarId: id } });
      await prisma.inventoryPart.createMany({
        data: parts.map((part, index) => ({
          inventoryCarId: id,
          description: part.description,
          cost: roundMoney(part.cost),
          sortOrder: index,
        })),
      });
    }

    const car = await prisma.inventoryCar.update({
      where: { id },
      data: updateData,
      include: {
        parts: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(withInventoryTotals(car));
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
    await prisma.inventoryCar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
