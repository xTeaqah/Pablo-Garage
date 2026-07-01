"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  isValid,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader, EmptyState, Card } from "@/components/ui";
import { ScheduleJobCard } from "@/components/schedule/ScheduleJobCard";
import {
  UnscheduledJobsPanel,
  type UnscheduledJob,
} from "@/components/schedule/UnscheduledJobsPanel";
import { ScheduleJobModal } from "@/components/jobs/ScheduleJobModal";
import { cn, formatWeekLabel } from "@/lib/utils";

type ScheduleView = "week" | "month";

interface ScheduledJob {
  id: string;
  description: string;
  status: string;
  total: number;
  scheduledAt: string;
  customer: { name: string };
  vehicle: { registration: string; make: string; model: string };
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const VIEW_OPTIONS: { value: ScheduleView; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function jobDayKey(scheduledAt: string) {
  const date = parseISO(scheduledAt);
  return isValid(date) ? format(date, "yyyy-MM-dd") : "";
}

function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end, days: eachDayOfInterval({ start, end }) };
}

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ScheduleView>("week");
  const [viewDate, setViewDate] = useState(() => new Date());
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [unscheduledJobs, setUnscheduledJobs] = useState<UnscheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [unscheduledLoading, setUnscheduledLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [schedulingJob, setSchedulingJob] = useState<UnscheduledJob | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const weekRange = useMemo(() => getWeekRange(viewDate), [viewDate]);
  const month = monthKey(viewDate);

  const fetchKey =
    viewMode === "week"
      ? `week:${format(weekRange.start, "yyyy-MM-dd")}:${format(weekRange.end, "yyyy-MM-dd")}`
      : `month:${month}`;

  useEffect(() => {
    setLoading(true);
    const url =
      viewMode === "week"
        ? `/api/schedule?from=${format(weekRange.start, "yyyy-MM-dd")}&to=${format(weekRange.end, "yyyy-MM-dd")}`
        : `/api/schedule?month=${month}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [fetchKey, refreshKey]);

  useEffect(() => {
    setUnscheduledLoading(true);
    fetch("/api/jobs?unscheduled=true")
      .then((r) => r.json())
      .then((data) => {
        setUnscheduledJobs(data.jobs ?? []);
      })
      .catch(() => setUnscheduledJobs([]))
      .finally(() => setUnscheduledLoading(false));
  }, [refreshKey]);

  const refreshAll = () => setRefreshKey((k) => k + 1);

  const confirmSchedule = async (scheduledAt: Date) => {
    if (!schedulingJob) return;
    setScheduling(true);
    await fetch(`/api/jobs/${schedulingJob.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAt.toISOString(),
        status: "SCHEDULED",
      }),
    });
    setSchedulingJob(null);
    setScheduling(false);
    setViewDate(scheduledAt);
    if (viewMode === "week") {
      setSelectedDay(scheduledAt);
    }
    refreshAll();
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, ScheduledJob[]>();
    for (const job of jobs) {
      const key = jobDayKey(job.scheduledAt);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(job);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    }
    return map;
  }, [jobs]);

  const periodLabel =
    viewMode === "week"
      ? formatWeekLabel(weekRange.start, weekRange.end)
      : format(viewDate, "MMMM yyyy");

  const visibleDays = useMemo(() => {
    if (viewMode === "week") {
      if (selectedDay) return [selectedDay];
      return weekRange.days;
    }

    if (selectedDay) return [selectedDay];
    return daysInMonth.filter((day) => {
      const key = format(day, "yyyy-MM-dd");
      return (jobsByDay.get(key)?.length ?? 0) > 0;
    });
  }, [viewMode, selectedDay, weekRange.days, daysInMonth, jobsByDay]);

  const navigate = (direction: -1 | 1) => {
    setViewDate((current) =>
      viewMode === "week"
        ? direction === -1
          ? subWeeks(current, 1)
          : addWeeks(current, 1)
        : direction === -1
        ? subMonths(current, 1)
        : addMonths(current, 1)
    );
    setSelectedDay(null);
  };

  const switchView = (mode: ScheduleView) => {
    setViewMode(mode);
    setSelectedDay(null);
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
      <PageHeader
        title="Schedule"
        subtitle={
          loading
            ? "Loading..."
            : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} · ${periodLabel}`
        }
      />

      <div className="px-5 space-y-4 pb-8 min-w-0">
        <UnscheduledJobsPanel
          jobs={unscheduledJobs}
          loading={unscheduledLoading}
          onSchedule={setSchedulingJob}
        />

        {/* View toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-garage-900 border border-garage-700">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => switchView(option.value)}
              className={cn(
                "py-2.5 rounded-lg text-sm font-semibold transition-all",
                viewMode === option.value
                  ? "bg-amber-brand text-garage-950 shadow-md shadow-amber-brand/20"
                  : "text-garage-400 hover:text-garage-200"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Period navigation */}
        <Card className="!p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-10 h-10 shrink-0 rounded-xl bg-garage-900 border border-garage-700 flex items-center justify-center text-garage-300 hover:text-white hover:border-garage-600 transition-colors"
              aria-label={viewMode === "week" ? "Previous week" : "Previous month"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 text-center min-w-0">
              <p className="font-bold text-white truncate">{periodLabel}</p>
              {selectedDay ? (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-amber-brand font-medium mt-0.5"
                >
                  {viewMode === "week" ? "Show full week" : "Show all booked days"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewDate(new Date())}
                  className="text-xs text-garage-500 hover:text-amber-brand font-medium mt-0.5"
                >
                  {viewMode === "week" ? "This week" : "This month"}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate(1)}
              className="w-10 h-10 shrink-0 rounded-xl bg-garage-900 border border-garage-700 flex items-center justify-center text-garage-300 hover:text-white hover:border-garage-600 transition-colors"
              aria-label={viewMode === "week" ? "Next week" : "Next month"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </Card>

        {/* Week strip (week view) or month grid (month view) */}
        {viewMode === "week" ? (
          <Card className="!p-3 min-w-0">
            <div className="grid grid-cols-7 gap-1.5">
              {weekRange.days.map((date) => {
                const key = format(date, "yyyy-MM-dd");
                const count = jobsByDay.get(key)?.length ?? 0;
                const today = isToday(date);
                const selected = selectedDay ? isSameDay(date, selectedDay) : false;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      "rounded-xl py-2 px-0.5 flex flex-col items-center transition-colors",
                      selected &&
                        "bg-amber-brand text-garage-950 shadow-md shadow-amber-brand/20",
                      !selected && today &&
                        "bg-amber-brand/15 text-amber-brand border border-amber-brand/40",
                      !selected && !today && count > 0 &&
                        "bg-garage-900 text-white border border-garage-700",
                      !selected && !today && count === 0 &&
                        "text-garage-400 hover:bg-garage-900/60"
                    )}
                  >
                    <span className="text-[10px] font-medium opacity-80">
                      {format(date, "EEE")}
                    </span>
                    <span className="text-sm font-bold mt-0.5">{format(date, "d")}</span>
                    {count > 0 && !selected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-brand mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="!p-3 min-w-0">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((label) => (
                <div
                  key={label}
                  className="h-6 flex items-center justify-center text-[10px] font-semibold text-garage-500 uppercase"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 w-full">
              {buildCalendarGrid(daysInMonth).map((cell, index) => {
                if (!cell.date) {
                  return <div key={`empty-${index}`} className="h-10" aria-hidden />;
                }

                const { date } = cell;
                const key = format(date, "yyyy-MM-dd");
                const count = jobsByDay.get(key)?.length ?? 0;
                const today = isToday(date);
                const selected = selectedDay ? isSameDay(date, selectedDay) : false;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      "h-10 w-full rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors",
                      selected &&
                        "bg-amber-brand text-garage-950 shadow-md shadow-amber-brand/20",
                      !selected && today &&
                        "bg-amber-brand/15 text-amber-brand border border-amber-brand/40",
                      !selected && !today && count > 0 &&
                        "bg-garage-900 text-white border border-garage-700 hover:border-amber-brand/40",
                      !selected && !today && count === 0 &&
                        "text-garage-400 hover:bg-garage-900/60"
                    )}
                  >
                    <span>{format(date, "d")}</span>
                    {count > 0 && !selected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-brand mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Day cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-garage-800 border border-garage-700 animate-pulse"
              />
            ))}
          </div>
        ) : visibleDays.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title={emptyTitle(viewMode, selectedDay)}
            description={emptyDescription(viewMode, selectedDay, viewDate, periodLabel)}
            action={
              <Link href="/new-job">
                <button
                  type="button"
                  className="gradient-brand text-garage-950 font-semibold px-4 py-2.5 rounded-xl text-sm"
                >
                  Book a Job
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {visibleDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayJobs = jobsByDay.get(key) ?? [];
              return <DayCard key={key} date={day} jobs={dayJobs} />;
            })}
          </div>
        )}

        <Link
          href="/jobs"
          className="block text-center text-sm text-garage-400 hover:text-amber-brand py-2"
        >
          View all jobs →
        </Link>
      </div>

      <ScheduleJobModal
        open={schedulingJob != null}
        onClose={() => setSchedulingJob(null)}
        onConfirm={confirmSchedule}
        jobTitle={schedulingJob?.customer.name}
        vehicleRegistration={schedulingJob?.vehicle.registration}
        saving={scheduling}
      />
    </div>
  );
}

function emptyTitle(viewMode: ScheduleView, selectedDay: Date | null) {
  if (selectedDay) return "Nothing booked";
  return viewMode === "week" ? "Free week" : "No jobs this month";
}

function emptyDescription(
  viewMode: ScheduleView,
  selectedDay: Date | null,
  viewDate: Date,
  periodLabel: string
) {
  if (selectedDay) {
    return `${format(selectedDay, "EEEE d MMMM")} is free`;
  }
  return viewMode === "week"
    ? `No scheduled jobs for ${periodLabel}`
    : `No scheduled jobs in ${format(viewDate, "MMMM yyyy")}`;
}

function DayCard({ date, jobs }: { date: Date; jobs: ScheduledJob[] }) {
  const today = isToday(date);

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-garage-700/60 bg-garage-800/80",
        today && "border-amber-brand/40 ring-1 ring-amber-brand/20"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between border-b border-garage-700",
          today ? "bg-amber-brand/10" : "bg-garage-900/50"
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-bold truncate",
              today ? "text-amber-brand" : "text-white"
            )}
          >
            {format(date, "EEEE")}
          </p>
          <p className="text-xs text-garage-400">
            {format(date, "d MMMM yyyy")}
          </p>
        </div>
        <span className="shrink-0 ml-3 text-xs font-medium text-garage-300 bg-garage-800 border border-garage-700 px-2.5 py-1 rounded-full">
          {jobs.length === 0
            ? "Free"
            : `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="p-3">
        {jobs.length === 0 ? (
          <p className="text-sm text-garage-500 text-center py-4">
            No jobs scheduled
          </p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <ScheduleJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildCalendarGrid(daysInMonth: Date[]): { date: Date | null }[] {
  if (daysInMonth.length === 0) return [];

  const first = daysInMonth[0];
  const startPad = (first.getDay() + 6) % 7;
  const cells: { date: Date | null }[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ date: null });
  }

  for (const date of daysInMonth) {
    cells.push({ date });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null });
  }

  return cells;
}
