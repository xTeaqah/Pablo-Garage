import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-handler";
import { withInventoryTotals } from "@/lib/inventory";
import { roundMoney } from "@/lib/money";
import {
  createInventorySchema,
} from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const cars = await prisma.inventoryCar.findMany({
      where:
        status && status !== "all"
          ? { status: status as "IN_STOCK" | "SOLD" }
          : {},
      include: {
        parts: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(cars.map(withInventoryTotals));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createInventorySchema.parse(await request.json());

    const car = await prisma.inventoryCar.create({
      data: {
        registration: body.registration.toUpperCase(),
        make: body.make,
        model: body.model,
        year: body.year ?? null,
        color: body.color ?? null,
        mileage: body.mileage ?? null,
        notes: body.notes ?? null,
        purchaseCost: roundMoney(body.purchaseCost ?? 0),
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        ...(body.parts?.length
          ? {
              parts: {
                create: body.parts.map((part, index) => ({
                  description: part.description,
                  cost: roundMoney(part.cost),
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: {
        parts: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(withInventoryTotals(car), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
