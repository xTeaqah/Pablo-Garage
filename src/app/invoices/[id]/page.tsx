"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  Share2,
  FileDown,
} from "lucide-react";
import { PageHeader, Card, StatusBadge, Button } from "@/components/ui";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import { formatGBP, formatDate } from "@/lib/utils";
import { openInvoicePdfExport } from "@/lib/invoice-export";
import type { InvoiceDetail } from "./types";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  const updateStatus = async (status: string) => {
    setLoading(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await fetch(`/api/invoices/${id}`).then((r) => r.json());
    setData(updated);
    setLoading(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Invoice ${data?.invoice.invoiceNumber}`,
        text: `Invoice from ${data?.settings.businessName} — ${formatGBP(data?.invoice.total ?? 0)}`,
        url: window.location.href,
      });
    }
  };

  const handleExportPdf = () => {
    if (!id) return;
    openInvoicePdfExport(id);
  };

  if (!data) {
    return (
      <div className="animate-pulse px-5 pt-6">
        <div className="h-8 w-48 bg-garage-800 rounded" />
      </div>
    );
  }

  const { invoice, settings } = data;

  return (
    <div>
      <div className="px-5 pt-4 flex items-center gap-3 print:hidden">
        <Link
          href="/invoices"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-garage-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <StatusBadge status={invoice.status} size="md" />
      </div>

      <div className="print:hidden">
        <PageHeader
          title={invoice.invoiceNumber}
          subtitle={invoice.job.customer.name}
        />
      </div>

      <div className="px-5 space-y-5 pb-8 print:px-0 print:pb-0">
        <div className="flex gap-2 flex-wrap print:hidden">
          {invoice.status === "DRAFT" && (
            <Button size="sm" onClick={() => updateStatus("SENT")} disabled={loading}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Mark as Sent
            </Button>
          )}
          {["SENT", "OVERDUE", "DRAFT"].includes(invoice.status) && (
            <Button size="sm" onClick={() => updateStatus("PAID")} disabled={loading}>
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Mark as Paid
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleExportPdf}>
            <FileDown className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Share
          </Button>
        </div>

        <div id="invoice-print" className="print:mx-auto print:max-w-[210mm]">
          <InvoiceDocument invoice={invoice} settings={settings} />
        </div>

        {invoice.paidAt && (
          <Card className="print:hidden">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Paid on {formatDate(invoice.paidAt)}
              </span>
            </div>
          </Card>
        )}

        <Link href={`/jobs/${invoice.job.id}`} className="print:hidden">
          <Button variant="secondary" fullWidth size="sm">
            View Job
          </Button>
        </Link>
      </div>
    </div>
  );
}
