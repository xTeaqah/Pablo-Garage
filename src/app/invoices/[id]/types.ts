export interface InvoiceDetail {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    subtotal: number;
    issuedAt: string;
    dueAt: string;
    paidAt: string | null;
    job: {
      id: string;
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
  };
  settings: {
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
  };
}
