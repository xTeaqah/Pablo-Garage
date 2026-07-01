import { titleCase, normalizeRegistration, type VehicleLookupResult } from "@/lib/registration";

const DVLA_API_URL =
  "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles";

interface DvlaVehicleResponse {
  registrationNumber?: string;
  make?: string;
  yearOfManufacture?: number;
  colour?: string;
  fuelType?: string;
  engineCapacity?: number;
  motStatus?: string;
  motExpiryDate?: string;
  taxStatus?: string;
  errors?: Array<{
    status: string;
    title: string;
    detail: string;
  }>;
}

export async function lookupVehicleByRegistration(
  registration: string
): Promise<VehicleLookupResult | null> {
  const apiKey = process.env.DVLA_API_KEY;
  if (!apiKey) {
    throw new Error("DVLA API key is not configured");
  }

  const registrationNumber = normalizeRegistration(registration);
  if (registrationNumber.length < 2) {
    return null;
  }

  const response = await fetch(DVLA_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ registrationNumber }),
    cache: "no-store",
  });

  const data = (await response.json()) as DvlaVehicleResponse;

  if (!response.ok || data.errors?.length) {
    return null;
  }

  if (!data.make) {
    return null;
  }

  return {
    registration: data.registrationNumber ?? registrationNumber,
    make: titleCase(data.make),
    model: "",
    year: data.yearOfManufacture ?? null,
    colour: data.colour ? titleCase(data.colour) : null,
    fuelType: data.fuelType ? titleCase(data.fuelType) : null,
    engineCapacity: data.engineCapacity ?? null,
    motStatus: data.motStatus ?? null,
    motExpiryDate: data.motExpiryDate ?? null,
  };
}
