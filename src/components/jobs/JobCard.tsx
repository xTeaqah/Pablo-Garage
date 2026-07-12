import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { Clock, ChevronRight, Car } from "lucide-react";
import { Card, StatusBadge } from "@/components/ui";
import { formatGBP, formatTime, formatMakeModel } from "@/lib/utils";

interface JobCardProps {
  job: {
    id: string;
    description: string;
    status: string;
    total: number;
    scheduledAt: string | null;
    customer: { name: string };
    vehicle: { registration: string; make: string; model: string };
  };
  compact?: boolean;
}

export function JobCard({ job, compact }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {job.scheduledAt && (
                <span className="flex items-center gap-1 text-xs text-amber-brand font-medium">
                  <Clock className="w-3 h-3" />
                  {formatTime(job.scheduledAt)}
                </span>
              )}
              <StatusBadge status={job.status} />
            </div>
            <h3 className="font-semibold text-white truncate">{job.customer.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-garage-400 mt-0.5">
              <Car className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {job.vehicle.registration} · {formatMakeModel(job.vehicle.make, job.vehicle.model)}
              </span>
            </div>
            {!compact && (
              <p className="text-sm text-garage-300 mt-2 line-clamp-1">
                {job.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-bold text-white">{formatGBP(job.total)}</span>
            <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand transition-colors" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function WeekStrip({
  jobs,
}: {
  jobs: { scheduledAt: string | null }[];
}) {
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const count = jobs.filter(
      (j) => j.scheduledAt && isSameDay(new Date(j.scheduledAt), date)
    ).length;
    return { date, count, isToday: isSameDay(date, today) };
  });

  return (
    <div className="flex gap-1.5">
      {days.map(({ date, count, isToday: todayFlag }) => (
        <div
          key={date.toISOString()}
          className={`flex-1 rounded-xl py-2 px-1 text-center ${
            todayFlag
              ? "bg-amber-brand/15 border border-amber-brand/30"
              : "bg-garage-800/50"
          }`}
        >
          <div className="text-[10px] text-garage-400 font-medium">
            {format(date, "EEE")}
          </div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              todayFlag ? "text-amber-brand" : "text-garage-200"
            }`}
          >
            {format(date, "d")}
          </div>
          <div className="text-[10px] text-garage-500 mt-0.5">
            {count > 0 ? `${count} job${count > 1 ? "s" : ""}` : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
