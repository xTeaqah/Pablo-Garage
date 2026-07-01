import { NextRequest, NextResponse } from "next/server";
import { lookupVehicleByRegistration } from "@/lib/dvla";
import { normalizeRegistration } from "@/lib/registration";

export async function GET(request: NextRequest) {
  const registration = request.nextUrl.searchParams.get("registration");

  if (!registration) {
    return NextResponse.json(
      { error: "Registration number is required" },
      { status: 400 }
    );
  }

  const normalized = normalizeRegistration(registration);
  if (normalized.length < 4) {
    return NextResponse.json(
      { error: "Registration number is too short" },
      { status: 400 }
    );
  }

  try {
    const vehicle = await lookupVehicleByRegistration(registration);

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found for this registration" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("DVLA lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to look up vehicle details" },
      { status: 500 }
    );
  }
}
