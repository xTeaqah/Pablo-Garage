"use client";

import { Calendar, ChevronRight } from "lucide-react";

export interface UnscheduledJob {
  id: string;
  description: string;
  customer: { name: string };
  vehicle: { registration: string; make: string; model: string };
}

interface UnscheduledJobsPanelProps {
  jobs: UnscheduledJob[];
  loading?: boolean;
  onSchedule: (job: UnscheduledJob) => void;
}

export function UnscheduledJobsPanel({
  jobs,
  loading,
  onSchedule,
}: UnscheduledJobsPanelProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-amber-brand/30 bg-amber-brand/5 p-4 space-y-3">
        <div className="h-5 w-36 bg-garage-800 rounded animate-pulse" />
        <div className="h-16 bg-garage-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (jobs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-brand/30 bg-amber-brand/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-brand/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-brand/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-amber-brand" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white">Schedule Jobs</h2>
            <p className="text-xs text-garage-400">
              {jobs.length} waiting for a day
            </p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-garage-950 bg-amber-brand px-2.5 py-1 rounded-full">
          {jobs.length}
        </span>
      </div>

      <div className="p-3 space-y-2">
        {jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => onSchedule(job)}
            className="w-full text-left glass-card rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-amber-brand font-semibold">
                  {job.vehicle.registration}
                </span>
                <span className="text-xs text-garage-500 truncate">
                  {job.customer.name}
                </span>
              </div>
              <p className="text-sm font-medium text-white truncate">
                {job.description}
              </p>
              <p className="text-xs text-amber-brand font-medium mt-1.5">
                Pick a day →
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
