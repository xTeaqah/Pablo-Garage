export interface VehicleLookupResult {
  registration: string;
  make: string;
  model: string;
  year: number | null;
  colour: string | null;
  fuelType: string | null;
  engineCapacity: number | null;
  motStatus: string | null;
  motExpiryDate: string | null;
}

export function normalizeRegistration(reg: string): string {
  return reg.replace(/\s+/g, "").toUpperCase();
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
