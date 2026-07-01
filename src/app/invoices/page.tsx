"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight } from "lucide-react";
import { PageHeader, Card, StatusBadge, EmptyState } from "@/components/ui";
import { formatGBP, formatDate } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  issuedAt: string;
  dueAt: string;
  job: {
    customer: { name: string };
    vehicle: { registration: string };
  };
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);

    setLoading(true);
    fetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => setInvoices(data.invoices ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  const totalOutstanding = invoices
    .filter((i) => ["SENT", "OVERDUE", "DRAFT"].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={
          totalOutstanding > 0
            ? `${formatGBP(totalOutstanding)} outstanding`
            : `${invoices.length} total`
        }
      />

      <div className="px-5 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-amber-brand text-garage-950"
                  : "bg-garage-800 text-garage-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-garage-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No invoices yet"
            description="Complete a job and create an invoice from the job page"
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                <Card className="group">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-garage-400">
                          {invoice.invoiceNumber}
                        </span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="font-semibold text-white">
                        {invoice.job.customer.name}
                      </p>
                      <p className="text-xs text-garage-400">
                        {invoice.job.vehicle.registration} · Issued{" "}
                        {formatDate(invoice.issuedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {formatGBP(invoice.total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
