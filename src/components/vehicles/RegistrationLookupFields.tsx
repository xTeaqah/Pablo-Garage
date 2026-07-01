"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui";
import { normalizeRegistration, type VehicleLookupResult } from "@/lib/registration";

export type { VehicleLookupResult };

interface RegistrationLookupFieldsProps {
  registration: string;
  make: string;
  model: string;
  year?: string;
  onRegistrationChange: (value: string) => void;
  onMakeChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onYearChange?: (value: string) => void;
  onLookup?: (data: VehicleLookupResult) => void;
  showYear?: boolean;
}

export function RegistrationLookupFields({
  registration,
  make,
  model,
  year = "",
  onRegistrationChange,
  onMakeChange,
  onModelChange,
  onYearChange,
  onLookup,
  showYear = false,
}: RegistrationLookupFieldsProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "not-found"
  >("idle");
  const [message, setMessage] = useState("");
  const lastLookupRef = useRef("");
  const callbacksRef = useRef({
    onMakeChange,
    onModelChange,
    onYearChange,
    onLookup,
  });

  callbacksRef.current = {
    onMakeChange,
    onModelChange,
    onYearChange,
    onLookup,
  };

  useEffect(() => {
    const normalized = normalizeRegistration(registration);

    if (normalized.length < 4) {
      setStatus("idle");
      setMessage("");
      return;
    }

    const timeout = setTimeout(async () => {
      if (normalized === lastLookupRef.current) return;
      lastLookupRef.current = normalized;

      setStatus("loading");
      setMessage("Looking up vehicle...");

      try {
        const res = await fetch(
          `/api/vehicle-lookup?registration=${encodeURIComponent(normalized)}`
        );

        if (res.status === 404) {
          setStatus("not-found");
          setMessage("No vehicle found for this registration.");
          return;
        }

        if (!res.ok) {
          setStatus("error");
          setMessage("Could not look up this registration.");
          return;
        }

        const data: VehicleLookupResult = await res.json();
        const { onMakeChange, onModelChange, onYearChange, onLookup } =
          callbacksRef.current;

        onMakeChange(data.make);
        if (data.model) {
          onModelChange(data.model);
        }
        if (data.year && onYearChange) {
          onYearChange(String(data.year));
        }
        onLookup?.(data);

        setStatus("success");
        const details = [
          data.make,
          data.model || null,
          data.year ? String(data.year) : null,
          data.colour,
          data.fuelType,
        ]
          .filter(Boolean)
          .join(" · ");

        setMessage(
          data.model
            ? `Vehicle found: ${details}`
            : `Vehicle found: ${details}. Enter model below.`
        );
      } catch {
        setStatus("error");
        setMessage("Lookup failed. Check your connection.");
      }
    }, 700);

    return () => clearTimeout(timeout);
  }, [registration]);

  const statusIcon = {
    idle: null,
    loading: <Loader2 className="w-4 h-4 animate-spin text-amber-brand" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-red-400" />,
    "not-found": <AlertCircle className="w-4 h-4 text-garage-400" />,
  }[status];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          label="Registration"
          placeholder="AB12 CDE"
          value={registration}
          onChange={(e) => {
            onRegistrationChange(e.target.value.toUpperCase());
            if (normalizeRegistration(e.target.value) !== lastLookupRef.current) {
              setStatus("idle");
            }
          }}
        />
        <div className="absolute right-3 top-[38px] text-garage-500">
          {status === "loading" ? (
            statusIcon
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            status === "success"
              ? "bg-emerald-500/10 text-emerald-400"
              : status === "error"
              ? "bg-red-500/10 text-red-400"
              : status === "not-found"
              ? "bg-garage-800 text-garage-400"
              : "bg-amber-brand/10 text-amber-brand"
          }`}
        >
          {statusIcon}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Make"
          placeholder="Ford"
          value={make}
          onChange={(e) => onMakeChange(e.target.value)}
        />
        <Input
          label="Model"
          placeholder="Focus"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
        />
      </div>

      {showYear && onYearChange && (
        <Input
          label="Year"
          placeholder="2018"
          type="number"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
        />
      )}
    </div>
  );
}
