import type { JobStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ["IN_PROGRESS", "WAITING_PARTS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "COMPLETE", "CANCELLED", "SCHEDULED"],
  WAITING_PARTS: ["IN_PROGRESS", "SCHEDULED", "CANCELLED"],
  COMPLETE: ["INVOICED", "IN_PROGRESS", "CANCELLED"],
  INVOICED: ["PAID", "COMPLETE"],
  PAID: [],
  CANCELLED: ["SCHEDULED"],
};

export function canTransitionJobStatus(
  from: JobStatus,
  to: JobStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isJobFinanciallyLocked(status: JobStatus): boolean {
  return status === "INVOICED" || status === "PAID";
}

export function isJobDeletable(status: JobStatus): boolean {
  return !isJobFinanciallyLocked(status);
}
