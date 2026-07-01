"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  isValid,
  setHours,
  setMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn, formatWeekLabel, getWeekBounds } from "@/lib/utils";

interface ScheduleJobModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (scheduledAt: Date) => Promise<void>;
  initialDate?: string | null;
  vehicleRegistration?: string;
  jobTitle?: string;
  saving?: boolean;
}

interface ScheduledJob {
  scheduledAt: string;
}

export function ScheduleJobModal({
  open,
  onClose,
  onConfirm,
  initialDate,
  vehicleRegistration,
  jobTitle,
  saving = false,
}: ScheduleJobModalProps) {
  const parsedInitial = initialDate && isValid(parseISO(initialDate))
    ? parseISO(initialDate)
    : null;

  const [viewDate, setViewDate] = useState(() => parsedInitial ?? new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => parsedInitial);
  const [selectedTime, setSelectedTime] = useState(() => {
    if (parsedInitial) return format(parsedInitial, "HH:mm");
    return "09:00";
  });
  const [weekJobs, setWeekJobs] = useState<ScheduledJob[]>([]);

  const weekRange = useMemo(() => {
    const { start, end } = getWeekBounds(viewDate);
    return { start, end, days: eachDayOfInterval({ start, end }) };
  }, [viewDate]);

  const periodLabel = formatWeekLabel(weekRange.start, weekRange.end);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const job of weekJobs) {
      const date = parseISO(job.scheduledAt);
      if (!isValid(date)) continue;
      const key = format(date, "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [weekJobs]);

  useEffect(() => {
    if (!open) return;

    const initial = initialDate && isValid(parseISO(initialDate))
      ? parseISO(initialDate)
      : null;

    setViewDate(initial ?? new Date());
    setSelectedDay(initial);
    setSelectedTime(initial ? format(initial, "HH:mm") : "09:00");
  }, [open, initialDate]);

  useEffect(() => {
    if (!open) return;

    const from = format(weekRange.start, "yyyy-MM-dd");
    const to = format(weekRange.end, "yyyy-MM-dd");

    fetch(`/api/schedule?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setWeekJobs(Array.isArray(data) ? data : []))
      .catch(() => setWeekJobs([]));
  }, [open, weekRange.start, weekRange.end]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const navigate = (direction: -1 | 1) => {
    setViewDate((current) =>
      direction === -1 ? subWeeks(current, 1) : addWeeks(current, 1)
    );
  };

  const handleConfirm = async () => {
    if (!selectedDay) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const scheduledAt = setMinutes(setHours(selectedDay, hours), minutes);

    await onConfirm(scheduledAt);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close schedule picker"
      />

      <div className="relative w-full max-w-lg bg-garage-900 rounded-t-2xl border border-garage-700 shadow-2xl max-h-[88dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-garage-900 border-b border-garage-700 px-5 py-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">Schedule Job</h2>
              {jobTitle && (
                <p className="text-sm text-white font-medium mt-0.5 truncate">
                  {jobTitle}
                </p>
              )}
              {vehicleRegistration && (
                <p className="text-sm text-garage-400 mt-0.5">{vehicleRegistration}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-garage-800 border border-garage-700 flex items-center justify-center text-garage-400 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Card className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-10 h-10 shrink-0 rounded-xl bg-garage-900 border border-garage-700 flex items-center justify-center text-garage-300 hover:text-white hover:border-garage-600 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 text-center min-w-0">
                <p className="font-bold text-white truncate">{periodLabel}</p>
                <button
                  type="button"
                  onClick={() => {
                    setViewDate(new Date());
                    setSelectedDay(new Date());
                  }}
                  className="text-xs text-garage-500 hover:text-amber-brand font-medium mt-0.5"
                >
                  This week
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate(1)}
                className="w-10 h-10 shrink-0 rounded-xl bg-garage-900 border border-garage-700 flex items-center justify-center text-garage-300 hover:text-white hover:border-garage-600 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </div>

        <div className="px-5 py-4 space-y-4">
          <Card className="!p-3 min-w-0">
            <div className="grid grid-cols-7 gap-1.5">
              {weekRange.days.map((date) => {
                const key = format(date, "yyyy-MM-dd");
                const count = jobsByDay.get(key) ?? 0;
                const today = isToday(date);
                const selected = selectedDay ? isSameDay(date, selectedDay) : false;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(date)}
                    className={cn(
                      "rounded-xl py-2 px-0.5 flex flex-col items-center transition-colors min-w-0",
                      selected &&
                        "bg-amber-brand text-garage-950 shadow-md shadow-amber-brand/20",
                      !selected &&
                        today &&
                        "bg-amber-brand/15 text-amber-brand border border-amber-brand/40",
                      !selected &&
                        !today &&
                        count > 0 &&
                        "bg-garage-800 text-white border border-garage-700",
                      !selected &&
                        !today &&
                        count === 0 &&
                        "text-garage-400 hover:bg-garage-800/60"
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

          <div>
            <label className="block text-xs font-medium text-garage-400 uppercase tracking-wider mb-2">
              Time
            </label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full bg-garage-800 border border-garage-700 rounded-xl px-4 py-3 text-white focus:border-amber-brand/50"
            />
          </div>

          {selectedDay && (
            <p className="text-sm text-garage-400 text-center">
              Booking for{" "}
              <span className="text-white font-medium">
                {format(selectedDay, "EEEE d MMMM")} at {selectedTime}
              </span>
            </p>
          )}

          <div className="flex gap-3 pb-2">
            <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleConfirm}
              disabled={!selectedDay || saving}
            >
              {saving ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
