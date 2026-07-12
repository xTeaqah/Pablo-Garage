"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileDown } from "lucide-react";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
import type { InvoiceDetail } from "@/app/invoices/[id]/types";

export function InvoicePrintView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [id, setId] = useState("");
  const autoExport = searchParams.get("auto") === "1";

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  useEffect(() => {
    if (!data) return;
    document.title = `${data.invoice.invoiceNumber} — Invoice`;
  }, [data]);

  useEffect(() => {
    if (!data || !autoExport) return;

    const timer = window.setTimeout(() => {
      window.print();
    }, 600);

    const handleAfterPrint = () => {
      window.close();
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [data, autoExport]);

  if (!data) {
    return (
      <div className="invoice-print-page min-h-dvh bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading invoice…</p>
      </div>
    );
  }

  const { invoice, settings } = data;

  return (
    <div className="invoice-print-page min-h-dvh bg-gray-100 print:bg-white">
      <div className="invoice-print-toolbar sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto px-4 py-8 print:px-0 print:py-0">
        <InvoiceDocument
          invoice={invoice}
          settings={settings}
          className="shadow-lg print:shadow-none"
        />
      </div>
    </div>
  );
}
