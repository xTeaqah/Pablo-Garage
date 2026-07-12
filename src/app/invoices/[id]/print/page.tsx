import { Suspense } from "react";
import { InvoicePrintView } from "./InvoicePrintView";

export default function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="invoice-print-page min-h-dvh bg-white flex items-center justify-center">
          <p className="text-gray-500 text-sm">Loading invoice…</p>
        </div>
      }
    >
      <InvoicePrintView params={params} />
    </Suspense>
  );
}
