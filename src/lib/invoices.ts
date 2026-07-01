import { prisma } from "@/lib/prisma";

/** Mark SENT invoices past due date as OVERDUE. */
export async function syncOverdueInvoices(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      status: "SENT",
      dueAt: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
  return result.count;
}
