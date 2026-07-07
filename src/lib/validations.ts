import { z } from "zod";
import { calcLineTotal, roundMoney } from "@/lib/money";
import { isValidFormDate } from "@/lib/dates";

/** YYYY-MM-DD from <input type="date"> or full ISO datetime. */
export const optionalFormDate = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return String(value).trim();
  },
  z
    .string()
    .refine(isValidFormDate, { message: "Invalid date." })
    .optional()
);

export const optionalFormDateTime = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return String(value).trim();
  },
  z
    .string()
    .refine(
      (s) => isValidFormDate(s) || !Number.isNaN(Date.parse(s)),
      { message: "Invalid date or time." }
    )
    .optional()
);

/** DVLA often omits model — default so saves don't fail. */
export const vehicleModelField = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((value) => value || "Unknown");

const lineItemInputSchema = z.object({
  type: z.enum(["LABOR", "PART"]),
  description: z.string().trim().min(1, "Line item description is required."),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  lineTotal: z.coerce.number().min(0).optional(),
});

export type LineItemInput = z.infer<typeof lineItemInputSchema>;

export function normalizeLineItems(items: LineItemInput[]) {
  return items.map((item, index) => {
    const lineTotal = calcLineTotal(item.quantity, item.unitPrice);
    return {
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      unitPrice: roundMoney(item.unitPrice),
      lineTotal,
      sortOrder: index,
    };
  });
}

export const jobStatusSchema = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "COMPLETE",
  "INVOICED",
  "PAID",
  "CANCELLED",
]);

export const createJobSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  description: z.string().trim().min(1, "Description is required."),
  notes: z.string().trim().optional().nullable(),
  status: jobStatusSchema.optional(),
  scheduledAt: optionalFormDateTime.optional().nullable(),
  lineItems: z.array(lineItemInputSchema).optional(),
});

export const patchJobSchema = z
  .object({
    status: jobStatusSchema.optional(),
    description: z.string().trim().min(1).optional(),
    notes: z.string().trim().optional().nullable(),
    scheduledAt: optionalFormDateTime.optional().nullable(),
    lineItems: z.array(lineItemInputSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  vehicle: z
    .object({
      registration: z.string().trim().min(1),
      make: z.string().trim().min(1),
      model: vehicleModelField,
      year: z.coerce.number().int().optional().nullable(),
      color: z.string().trim().optional().nullable(),
      fuelType: z.string().trim().optional().nullable(),
      motStatus: z.string().trim().optional().nullable(),
      motExpiryDate: z.string().trim().optional().nullable(),
    })
    .optional(),
});

export const patchCustomerSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
    address: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

export const createVehicleSchema = z.object({
  registration: z.string().trim().min(1),
  make: z.string().trim().min(1),
  model: vehicleModelField,
  year: z.coerce.number().int().optional().nullable(),
  mileage: z.coerce.number().int().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  fuelType: z.string().trim().optional().nullable(),
  motStatus: z.string().trim().optional().nullable(),
  motExpiryDate: z.string().trim().optional().nullable(),
});

export const patchVehicleSchema = z
  .object({
    registration: z.string().trim().min(1).optional(),
    make: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    year: z.coerce.number().int().optional().nullable(),
    mileage: z.coerce.number().int().optional().nullable(),
    color: z.string().trim().optional().nullable(),
    vin: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    fuelType: z.string().trim().optional().nullable(),
    motStatus: z.string().trim().optional().nullable(),
    motExpiryDate: z.string().trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

export const patchSettingsSchema = z
  .object({
    businessName: z.string().trim().min(1).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    defaultLaborRate: z.coerce.number().min(0).optional(),
    invoicePrefix: z.string().trim().min(1).optional(),
    nextInvoiceNumber: z.coerce.number().int().min(1).optional(),
    paymentTermsDays: z.coerce.number().int().min(1).optional(),
    sortCode: z.string().optional(),
    accountNumber: z.string().optional(),
    invoiceTitle: z.string().optional(),
    invoiceHeaderNote: z.string().optional(),
    invoicePaymentText: z.string().optional(),
    invoiceBankText: z.string().optional(),
    invoiceFooterText: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

export const patchInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]),
});

export const createInventorySchema = z.object({
  registration: z.string().trim().min(1),
  make: z.string().trim().min(1),
  model: vehicleModelField,
  year: z.coerce.number().int().optional().nullable(),
  color: z.string().trim().optional().nullable(),
  mileage: z.coerce.number().int().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  purchaseCost: z.coerce.number().min(0).optional(),
  purchaseDate: optionalFormDate,
  parts: z
    .array(
      z.object({
        description: z.string().trim().min(1),
        cost: z.coerce.number().min(0),
      })
    )
    .optional(),
});

export const patchInventorySchema = z
  .object({
    registration: z.string().trim().min(1).optional(),
    make: z.string().trim().min(1).optional(),
    model: z.string().trim().min(1).optional(),
    year: z.coerce.number().int().optional().nullable(),
    color: z.string().trim().optional().nullable(),
    mileage: z.coerce.number().int().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    purchaseCost: z.coerce.number().min(0).optional(),
    purchaseDate: optionalFormDate,
    salePrice: z.coerce.number().min(0).optional().nullable(),
    soldAt: optionalFormDate,
    status: z.enum(["IN_STOCK", "SOLD"]).optional(),
    parts: z
      .array(
        z.object({
          description: z.string().trim().min(1),
          cost: z.coerce.number().min(0),
        })
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update.",
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
