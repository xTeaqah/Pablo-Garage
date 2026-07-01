import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-handler";
import {
  createCustomerSchema,
  paginationSchema,
} from "@/lib/validations";

function buildSearchWhere(search: string) {
  return {
    OR: [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
      { vehicles: { some: { registration: { contains: search } } } },
    ],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 30,
    });
    const skip = (page - 1) * limit;
    const where = search ? buildSearchWhere(search) : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          vehicles: {
            take: 1,
            orderBy: { registration: "asc" },
            select: { registration: true, make: true, model: true },
          },
          _count: { select: { jobs: true, vehicles: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      hasMore: skip + customers.length < total,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createCustomerSchema.parse(await request.json());

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        ...(body.vehicle
          ? {
              vehicles: {
                create: {
                  registration: body.vehicle.registration.toUpperCase(),
                  make: body.vehicle.make,
                  model: body.vehicle.model,
                  year: body.vehicle.year ?? null,
                  color: body.vehicle.color ?? null,
                  fuelType: body.vehicle.fuelType ?? null,
                  motStatus: body.vehicle.motStatus ?? null,
                  motExpiryDate: body.vehicle.motExpiryDate ?? null,
                },
              },
            }
          : {}),
      },
      include: { vehicles: true },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
