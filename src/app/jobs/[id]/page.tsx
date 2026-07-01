"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  User,
  Calendar,
  Trash2,
} from "lucide-react";
import { StatusBadge, Button } from "@/components/ui";
import {
  JobLineItemsEditor,
  type LineItem,
} from "@/components/jobs/JobLineItemsEditor";
import { ScheduleJobModal } from "@/components/jobs/ScheduleJobModal";
import { formatGBP, formatDate, formatTime } from "@/lib/utils";

interface JobDetail {
  id: string;
  description: string;
  notes: string | null;
  status: string;
  total: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
  };
  vehicle: {
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number | null;
    mileage: number | null;
    color: string | null;
  };
  lineItems: LineItem[];
  invoice: { id: string; invoiceNumber: string; status: string } | null;
}

function jobRef(id: string) {
  return `JOB #${id.slice(0, 8).toUpperCase()}`;
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [defaultLaborRate, setDefaultLaborRate] = useState(45);
  const [itemsDirty, setItemsDirty] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const isLocked = job
    ? ["INVOICED", "PAID", "CANCELLED"].includes(job.status)
    : false;

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchJob = useCallback(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data);
        setLineItems(
          data.lineItems.map(
            (item: LineItem & { type: string }) => ({
              ...item,
              type: item.type as "LABOR" | "PART",
            })
          )
        );
        setItemsDirty(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchJob();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s?.defaultLaborRate) setDefaultLaborRate(s.defaultLaborRate);
      });
  }, [fetchJob]);

  const saveLineItems = async (items: LineItem[]) => {
    if (!id || isLocked) return;
    setSavingItems(true);
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lineItems: items.map(({ type, description, quantity, unitPrice, lineTotal }) => ({
          type,
          description,
          quantity,
          unitPrice,
          lineTotal,
        })),
      }),
    });
    fetchJob();
    setSavingItems(false);
    setItemsDirty(false);
  };

  const handleLineItemsChange = (items: LineItem[]) => {
    setLineItems(items);
    setItemsDirty(true);
  };

  useEffect(() => {
    if (!itemsDirty || !id || isLocked) return;
    const timer = setTimeout(() => {
      saveLineItems(lineItems);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineItems, itemsDirty, id, isLocked]);

  const updateStatus = async (status: string) => {
    setActionLoading(true);
    if (itemsDirty) {
      await saveLineItems(lineItems);
    }
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJob();
    setActionLoading(false);
  };

  const scheduleJob = async (scheduledAt: Date) => {
    setActionLoading(true);
    if (itemsDirty) {
      await saveLineItems(lineItems);
    }
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAt.toISOString(),
        status: "SCHEDULED",
      }),
    });
    fetchJob();
    setActionLoading(false);
    setShowScheduleModal(false);
  };

  const createInvoice = async () => {
    setActionLoading(true);
    if (itemsDirty) await saveLineItems(lineItems);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_invoice" }),
    });
    const invoice = await res.json();
    if (!res.ok) {
      alert(invoice.error ?? "Could not create invoice.");
      setActionLoading(false);
      return;
    }
    router.push(`/invoices/${invoice.id}`);
  };

  const deleteJob = async () => {
    if (isLocked) return;
    if (!confirm("Delete this job? This cannot be undone.")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete job.");
      return;
    }
    router.push("/jobs");
  };

  if (loading || !job) {
    return (
      <div className="animate-pulse">
        <div className="h-14 bg-garage-800" />
        <div className="px-5 pt-4 space-y-4">
          <div className="h-36 bg-garage-800 rounded-2xl" />
          <div className="h-24 bg-garage-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const vehicleTitle = [
    job.vehicle.year,
    job.vehicle.make,
    job.vehicle.model,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="pb-8">
      {/* Header bar */}
      <div className="gradient-brand px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/jobs"
          className="w-9 h-9 rounded-lg bg-garage-950/20 flex items-center justify-center text-garage-950"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-bold text-garage-950 text-lg pr-9">
          Job Information
        </h1>
      </div>

      {/* Status strip */}
      <div className="bg-garage-800 border-b border-garage-700 px-4 py-2.5 flex items-center justify-between">
        <StatusBadge status={job.status} size="md" />
        <span className="text-xs font-mono text-garage-400">{jobRef(job.id)}</span>
      </div>

      <div className="px-4 space-y-4 pt-4">
        {/* Vehicle card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex">
            <div className="flex-1 p-4 space-y-2">
              <p className="text-xs font-mono text-amber-brand font-semibold">
                {jobRef(job.id)}
              </p>
              <p className="text-lg font-bold text-white leading-tight">
                {vehicleTitle || "Unknown vehicle"}
              </p>
              <div className="space-y-1 text-sm">
                <InfoRow label="VRN" value={job.vehicle.registration} highlight />
                {job.vehicle.color && (
                  <InfoRow label="Colour" value={job.vehicle.color} />
                )}
                {job.vehicle.mileage && (
                  <InfoRow
                    label="Mileage"
                    value={`${job.vehicle.mileage.toLocaleString()} miles`}
                  />
                )}
              </div>
            </div>
            <div className="w-28 bg-garage-900/60 flex items-center justify-center border-l border-garage-700">
              <Car className="w-14 h-14 text-garage-600" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        {/* Customer & contact */}
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider mb-3">
            Customer Information
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-garage-500 uppercase tracking-wider mb-1">
                Customer
              </p>
              <Link
                href={`/customers/${job.customer.id}`}
                className="text-sm font-semibold text-white hover:text-amber-brand"
              >
                {job.customer.name}
              </Link>
            </div>
            <div>
              <p className="text-[10px] text-garage-500 uppercase tracking-wider mb-1">
                Contact
              </p>
              <a
                href={`tel:${job.customer.phone}`}
                className="flex items-center gap-1.5 text-sm text-amber-brand font-medium"
              >
                <Phone className="w-3.5 h-3.5" />
                {job.customer.phone}
              </a>
              {job.customer.email && (
                <a
                  href={`mailto:${job.customer.email}`}
                  className="flex items-center gap-1.5 text-xs text-garage-400 mt-1"
                >
                  <Mail className="w-3 h-3" />
                  {job.customer.email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Work needed */}
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider mb-2">
            Work Required
          </p>
          <p className="text-sm text-white leading-relaxed">{job.description}</p>
          {job.scheduledAt && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-garage-700 text-sm text-garage-400">
              <Calendar className="w-4 h-4 text-garage-500" />
              {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
            </div>
          )}
        </div>

        {/* Notes */}
        {job.notes && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider px-4 pt-4 pb-2">
              Job Notes
            </p>
            <div className="px-4 pb-4">
              <p className="text-sm text-garage-300 whitespace-pre-wrap">
                {job.notes}
              </p>
            </div>
          </div>
        )}

        {/* Parts & Labour */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
              Parts & Labour
            </p>
            {itemsDirty && !isLocked && (
              <button
                onClick={() => saveLineItems(lineItems)}
                disabled={savingItems}
                className="text-xs font-semibold text-amber-brand"
              >
                {savingItems ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
          <JobLineItemsEditor
            lineItems={lineItems}
            onChange={handleLineItemsChange}
            defaultLaborRate={defaultLaborRate}
            readOnly={isLocked}
          />
        </div>

        {/* Action buttons — 2×2 grid like reference */}
        {!isLocked && (
          <div className="grid grid-cols-2 gap-3">
            {job.status === "SCHEDULED" && (
              <>
                <Button
                  size="lg"
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowScheduleModal(true)}
                  disabled={actionLoading}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Job
                </Button>
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => updateStatus("IN_PROGRESS")}
                  disabled={actionLoading}
                >
                  Start Job
                </Button>
              </>
            )}
            {job.status === "IN_PROGRESS" && (
              <Button
                size="lg"
                fullWidth
                onClick={() => updateStatus("WAITING_PARTS")}
                disabled={actionLoading}
                variant="secondary"
              >
                Waiting Parts
              </Button>
            )}
            {["IN_PROGRESS", "WAITING_PARTS"].includes(job.status) && (
              <Button
                size="lg"
                fullWidth
                onClick={() => updateStatus("COMPLETE")}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete
              </Button>
            )}
            {job.status === "COMPLETE" && !job.invoice && (
              <Button
                size="lg"
                fullWidth
                onClick={createInvoice}
                disabled={actionLoading || job.total === 0}
                className="col-span-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Invoice — {formatGBP(job.total)}
              </Button>
            )}
          </div>
        )}

        {job.invoice && (
          <Link href={`/invoices/${job.invoice.id}`}>
            <Button variant="secondary" fullWidth size="lg">
              <FileText className="w-4 h-4 mr-2" />
              View Invoice {job.invoice.invoiceNumber}
            </Button>
          </Link>
        )}

        <div className="flex gap-3">
          <Link href={`/customers/${job.customer.id}`} className="flex-1">
            <Button variant="secondary" fullWidth size="sm">
              <User className="w-4 h-4 mr-2" />
              Customer
            </Button>
          </Link>
          {!isLocked && (
            <Button
              variant="danger"
              size="sm"
              onClick={deleteJob}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <ScheduleJobModal
        open={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={scheduleJob}
        initialDate={job.scheduledAt}
        vehicleRegistration={job.vehicle.registration}
        saving={actionLoading}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <span className="text-garage-500 w-14 shrink-0">{label}:</span>
      <span
        className={
          highlight
            ? "font-bold text-white tracking-wide"
            : "text-garage-300"
        }
      >
        {value}
      </span>
    </div>
  );
}
