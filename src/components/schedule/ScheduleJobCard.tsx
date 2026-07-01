import Link from "next/link";
import { Car, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { formatGBP, formatTime } from "@/lib/utils";

interface ScheduleJobCardProps {
  job: {
    id: string;
    description: string;
    status: string;
    total: number;
    scheduledAt: string;
    customer: { name: string };
    vehicle: { registration: string; make: string; model: string };
  };
}

export function ScheduleJobCard({ job }: ScheduleJobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="block w-full">
      <div className="bg-garage-900 border border-garage-700 rounded-xl p-3.5 flex items-start gap-3 w-full min-w-0 active:scale-[0.99] transition-transform hover:border-garage-600 group">
        <div className="w-12 shrink-0 text-center">
          <p className="text-sm font-bold text-amber-brand">
            {formatTime(job.scheduledAt)}
          </p>
        </div>
        <div className="flex-1 min-w-0 border-l border-garage-700 pl-3 overflow-hidden">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={job.status} />
          </div>
          <p className="font-semibold text-white truncate">{job.customer.name}</p>
          <div className="flex items-center gap-1 text-xs text-garage-400 mt-0.5">
            <Car className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {job.vehicle.registration} · {job.vehicle.make} {job.vehicle.model}
            </span>
          </div>
          <p className="text-xs text-garage-300 mt-1.5 line-clamp-1">
            {job.description}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span className="text-sm font-semibold text-white">
            {formatGBP(job.total)}
          </span>
          <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand" />
        </div>
      </div>
    </Link>
  );
}
