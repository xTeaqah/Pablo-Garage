import { format, startOfWeek, endOfWeek, isToday, isWithinInterval, addDays } from "date-fns";

export const DEFAULT_BUSINESS_NAME = "Pablo Auto's";

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "EEEE, d MMMM yyyy");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm");
}

export function getWeekBounds(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function formatWeekLabel(start: Date, end: Date): string {
  if (format(start, "MMM yyyy") === format(end, "MMM yyyy")) {
    return `${format(start, "d")}–${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

export function isDateToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isToday(new Date(date));
}

export function isInCurrentWeek(date: Date | string): boolean {
  const { start, end } = getWeekBounds();
  return isWithinInterval(new Date(date), { start, end });
}

export function calculateDueDate(issuedAt: Date, paymentTermsDays: number): Date {
  return addDays(issuedAt, paymentTermsDays);
}

export function generateInvoiceNumber(prefix: string, number: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(number).padStart(4, "0")}`;
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  WAITING_PARTS: "Waiting Parts",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
