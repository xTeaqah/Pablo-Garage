export function openInvoicePdfExport(invoiceId: string) {
  const url = `/invoices/${invoiceId}/print?auto=1`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openInvoicePrintView(invoiceId: string) {
  window.open(
    `/invoices/${invoiceId}/print`,
    "_blank",
    "noopener,noreferrer"
  );
}
