import Image from "next/image";
import { formatGBP, formatDate, formatMakeModel } from "@/lib/utils";

export interface InvoiceTemplateSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  sortCode: string;
  accountNumber: string;
  paymentTermsDays: number;
  invoiceTitle: string;
  invoiceHeaderNote: string;
  invoicePaymentText: string;
  invoiceBankText: string;
  invoiceFooterText: string;
}

export interface InvoiceDocumentData {
  invoiceNumber: string;
  total: number;
  issuedAt: string;
  dueAt: string;
  job: {
    description: string;
    customer: { name: string; phone: string; address: string | null };
    vehicle: {
      registration: string;
      make: string;
      model: string;
      year: number | null;
    };
    lineItems: Array<{
      type: string;
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
  };
}

export function applyInvoiceTemplate(
  text: string,
  vars: {
    days: number;
    sortCode: string;
    accountNumber: string;
    businessName: string;
  }
) {
  return text
    .replace(/\{days\}/g, String(vars.days))
    .replace(/\{sortCode\}/g, vars.sortCode || "—")
    .replace(/\{accountNumber\}/g, vars.accountNumber || "—")
    .replace(/\{businessName\}/g, vars.businessName);
}

export function InvoiceDocument({
  invoice,
  settings,
  className = "",
}: {
  invoice: InvoiceDocumentData;
  settings: InvoiceTemplateSettings;
  className?: string;
}) {
  const templateVars = {
    days: settings.paymentTermsDays,
    sortCode: settings.sortCode,
    accountNumber: settings.accountNumber,
    businessName: settings.businessName,
  };

  const paymentLine = applyInvoiceTemplate(
    settings.invoicePaymentText || "Payment due within {days} days.",
    templateVars
  );
  const bankLine =
    settings.sortCode &&
    settings.accountNumber &&
    (settings.invoiceBankText ?? "").trim()
      ? applyInvoiceTemplate(
          settings.invoiceBankText ||
            "BACS: Sort {sortCode} · Account {accountNumber}",
          templateVars
        )
      : "";
  const footerLine = applyInvoiceTemplate(
    settings.invoiceFooterText || "",
    templateVars
  );

  return (
    <div
      className={`invoice-document bg-white text-gray-900 rounded-2xl p-6 sm:p-8 print:rounded-none print:shadow-none print:p-0 ${className}`}
    >
      <div className="border-b-2 border-amber-500 pb-4 mb-6">
        <div className="flex items-start gap-4">
          <Image
            src="/logo.png"
            alt=""
            width={64}
            height={64}
            priority
            className="rounded-full shrink-0 ring-1 ring-gray-200 print:ring-gray-300"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {settings.businessName}
            </h2>
            {settings.invoiceHeaderNote && (
              <p className="text-sm text-amber-700 font-medium mt-1">
                {applyInvoiceTemplate(settings.invoiceHeaderNote, templateVars)}
              </p>
            )}
            {settings.address && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                {settings.address}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
              {settings.phone && <span>Tel: {settings.phone}</span>}
              {settings.email && <span>{settings.email}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Bill To
          </p>
          <p className="font-semibold text-gray-900 mt-1">
            {invoice.job.customer.name}
          </p>
          {invoice.job.customer.address && (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {invoice.job.customer.address}
            </p>
          )}
          <p className="text-sm text-gray-600">{invoice.job.customer.phone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            {settings.invoiceTitle || "INVOICE"}
          </p>
          <p className="text-sm font-mono text-gray-700 mt-1">
            {invoice.invoiceNumber}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Date: {formatDate(invoice.issuedAt)}
          </p>
          <p className="text-sm text-gray-600">
            Due: {formatDate(invoice.dueAt)}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-6 text-sm">
        <span className="font-semibold text-gray-700">Vehicle: </span>
        <span className="text-gray-900 font-mono font-bold">
          {invoice.job.vehicle.registration}
        </span>
        <span className="text-gray-600">
          {" "}
          — {formatMakeModel(invoice.job.vehicle.make, invoice.job.vehicle.model)}
          {invoice.job.vehicle.year ? ` (${invoice.job.vehicle.year})` : ""}
        </span>
      </div>

      <table className="w-full text-sm mb-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200 print:break-inside-avoid">
            <th className="text-left py-2 font-semibold text-gray-700">
              Description
            </th>
            <th className="text-right py-2 font-semibold text-gray-700 w-16">
              Qty
            </th>
            <th className="text-right py-2 font-semibold text-gray-700 w-24">
              Price
            </th>
            <th className="text-right py-2 font-semibold text-gray-700 w-24">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.job.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-gray-100 print:break-inside-avoid">
              <td className="py-3 text-gray-900">
                <span className="text-xs text-gray-500 uppercase mr-2">
                  {item.type === "LABOR" ? "Labour" : "Part"}
                </span>
                {item.description}
              </td>
              <td className="py-3 text-right text-gray-700">
                {item.type === "LABOR" ? `${item.quantity}h` : item.quantity}
              </td>
              <td className="py-3 text-right text-gray-700">
                {formatGBP(item.unitPrice)}
              </td>
              <td className="py-3 text-right font-medium text-gray-900">
                {formatGBP(item.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-48">
          <div className="flex justify-between py-2 border-t-2 border-gray-900">
            <span className="font-bold text-gray-900">TOTAL</span>
            <span className="font-bold text-gray-900 text-lg">
              {formatGBP(invoice.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 text-sm text-gray-600 space-y-2 whitespace-pre-line">
        {paymentLine && <p>{paymentLine}</p>}
        {bankLine && <p>{bankLine}</p>}
        {footerLine && <p>{footerLine}</p>}
      </div>
    </div>
  );
}

export const SAMPLE_INVOICE: InvoiceDocumentData = {
  invoiceNumber: "MG-2026-0042",
  total: 285,
  issuedAt: new Date().toISOString(),
  dueAt: new Date(Date.now() + 14 * 86400000).toISOString(),
  job: {
    description: "Front brake pads and discs",
    customer: {
      name: "John Smith",
      phone: "07700 900123",
      address: "12 High Street\nManchester\nM1 1AA",
    },
    vehicle: {
      registration: "AB12 CDE",
      make: "Ford",
      model: "Focus",
      year: 2018,
    },
    lineItems: [
      {
        type: "LABOR",
        description: "Brake pad and disc replacement",
        quantity: 1.5,
        unitPrice: 45,
        lineTotal: 67.5,
      },
      {
        type: "PART",
        description: "Front brake pads",
        quantity: 1,
        unitPrice: 42.5,
        lineTotal: 42.5,
      },
      {
        type: "PART",
        description: "Front brake discs (pair)",
        quantity: 1,
        unitPrice: 175,
        lineTotal: 175,
      },
    ],
  },
};
