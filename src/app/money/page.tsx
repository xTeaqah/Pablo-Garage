"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PoundSterling,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
  FileText,
} from "lucide-react";
import { PageHeader, StatTile, SectionTitle, Card, StatusBadge, EmptyState } from "@/components/ui";
import { formatGBP, formatDate, formatMakeModel } from "@/lib/utils";

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  issuedAt: string;
  dueAt: string;
  paidAt: string | null;
  job: {
    customer: { name: string };
    vehicle: { registration: string };
  };
}

interface FinancesData {
  earned: {
    week: number;
    month: number;
    year: number;
    today: number;
    workshopWeek?: number;
    stockWeek?: number;
    workshopMonth?: number;
    stockMonth?: number;
  };
  invoiced: {
    week: number;
    month: number;
  };
  outstanding: {
    total: number;
    sent: number;
    overdue: number;
    draft: number;
    count: number;
  };
  weeklyBreakdown: Array<{
    label: string;
    amount: number;
    isCurrent: boolean;
  }>;
  recentPaid: InvoiceSummary[];
  recentOutstanding: InvoiceSummary[];
  recentStockSales?: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    soldAt: string | null;
    profit: number | null;
  }>;
}

export default function MoneyPage() {
  const [data, setData] = useState<FinancesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finances")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <MoneySkeleton />;
  }

  if (!data?.weeklyBreakdown) {
    return (
      <div>
        <PageHeader title="Money" subtitle="Earnings from paid invoices" />
        <div className="px-5">
          <EmptyState
            icon={<PoundSterling className="w-8 h-8" />}
            title="Couldn't load finances"
            description="Refresh the page to try again."
          />
        </div>
      </div>
    );
  }

  const maxWeekly = Math.max(...data.weeklyBreakdown.map((w) => w.amount), 1);

  return (
    <div className="overflow-x-hidden">
      <PageHeader
        title="Money"
        subtitle="Workshop invoices & stock sales"
      >
        <Link
          href="/invoices"
          className="text-xs text-amber-brand font-medium flex items-center gap-0.5 shrink-0 mt-1"
        >
          Invoices <ChevronRight className="w-3 h-3" />
        </Link>
      </PageHeader>

      <div className="px-5 space-y-6 pb-6">
        <div className="glass-card rounded-2xl p-5 border-amber-brand/30 bg-amber-brand/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-garage-400 uppercase tracking-wider">
              Earned This Week
            </span>
            <TrendingUp className="w-4 h-4 text-amber-brand" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {formatGBP(data.earned.week)}
          </p>
          {data.earned.today > 0 && (
            <p className="text-sm text-emerald-400">
              +{formatGBP(data.earned.today)} today
            </p>
          )}
          {(data.earned.stockWeek ?? 0) > 0 && (
            <p className="text-xs text-garage-400 mt-2">
              Includes {formatGBP(data.earned.stockWeek ?? 0)} from stock sales
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="This Month"
            value={formatGBP(data.earned.month)}
            icon={<Calendar className="w-4 h-4" />}
          />
          <StatTile
            label="This Year"
            value={formatGBP(data.earned.year)}
            icon={<PoundSterling className="w-4 h-4" />}
          />
          <StatTile
            label="Outstanding"
            value={formatGBP(data.outstanding.total)}
            icon={<Clock className="w-4 h-4" />}
            accent={data.outstanding.overdue > 0}
          />
          <StatTile
            label="Invoiced"
            value={formatGBP(data.invoiced.month)}
            icon={<FileText className="w-4 h-4" />}
          />
        </div>

        {data.outstanding.count > 0 && (
          <div>
            <SectionTitle title="Awaiting Payment" />
            <div className="grid grid-cols-3 gap-2 min-w-0">
              <OutstandingPill label="Sent" amount={data.outstanding.sent} />
              <OutstandingPill
                label="Overdue"
                amount={data.outstanding.overdue}
                warn={data.outstanding.overdue > 0}
              />
              <OutstandingPill label="Draft" amount={data.outstanding.draft} />
            </div>
          </div>
        )}

        <div>
          <SectionTitle title="Last 6 Weeks" />
          <Card className="!p-4 overflow-hidden">
            <div className="grid grid-cols-6 gap-1.5">
              {data.weeklyBreakdown.map((week, index) => {
                const barHeight = Math.max(
                  Math.round((week.amount / maxWeekly) * 72),
                  week.amount > 0 ? 10 : 4
                );

                return (
                  <div
                    key={`${week.label}-${index}`}
                    className="min-w-0 flex flex-col items-center gap-1.5"
                  >
                    <div className="w-full h-[72px] flex items-end justify-center">
                      <div
                        className={`w-full max-w-7 rounded-t-md ${
                          week.isCurrent ? "bg-amber-brand" : "bg-garage-600"
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium text-center leading-tight ${
                        week.isCurrent ? "text-amber-brand" : "text-garage-500"
                      }`}
                    >
                      {week.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {data.earned.week > 0 && (
              <p className="text-center text-xs text-garage-400 mt-3 pt-3 border-t border-garage-700/60">
                This week:{" "}
                <span className="text-white font-medium">
                  {formatGBP(data.earned.week)}
                </span>
              </p>
            )}
          </Card>
        </div>

        {data.recentPaid.length > 0 && (
          <div>
            <SectionTitle title="Recently Paid" />
            <div className="space-y-2">
              {data.recentPaid.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} showPaidDate />
              ))}
            </div>
          </div>
        )}

        {data.recentOutstanding.length > 0 ? (
          <div>
            <SectionTitle
              title="Needs Collecting"
              action={
                data.outstanding.overdue > 0 ? (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formatGBP(data.outstanding.overdue)} overdue
                  </span>
                ) : null
              }
            />
            <div className="space-y-2">
              {data.recentOutstanding.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} showDueDate />
              ))}
            </div>
          </div>
        ) : (
          data.recentPaid.length === 0 && (
            <EmptyState
              icon={<PoundSterling className="w-8 h-8" />}
              title="No invoice activity yet"
              description="Mark invoices as paid when money comes in to track earnings here."
              action={
                <Link href="/invoices">
                  <span className="text-sm text-amber-brand font-medium">View invoices</span>
                </Link>
              }
            />
          )
        )}

        {(data.recentStockSales?.length ?? 0) > 0 && (
          <div>
            <SectionTitle title="Recent Stock Sales" />
            <div className="space-y-2">
              {data.recentStockSales!.map((car) => (
                <Link key={car.id} href={`/inventory/${car.id}`} className="block">
                  <Card className="group !p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white tracking-wide">
                          {car.registration}
                        </p>
                        <p className="text-xs text-garage-400">
                          {formatMakeModel(car.make, car.model)}
                          {car.soldAt && <> · Sold {formatDate(car.soldAt)}</>}
                        </p>
                      </div>
                      <span
                        className={`font-bold shrink-0 ${
                          (car.profit ?? 0) >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {car.profit != null ? formatGBP(car.profit) : "—"}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OutstandingPill({
  label,
  amount,
  warn,
}: {
  label: string;
  amount: number;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center min-w-0 ${
        warn ? "bg-red-500/10 border border-red-500/20" : "glass-card"
      }`}
    >
      <p className="text-[10px] text-garage-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-sm font-bold ${warn ? "text-red-400" : "text-white"}`}>
        {formatGBP(amount)}
      </p>
    </div>
  );
}

function InvoiceRow({
  invoice,
  showPaidDate,
  showDueDate,
}: {
  invoice: InvoiceSummary;
  showPaidDate?: boolean;
  showDueDate?: boolean;
}) {
  return (
    <Link href={`/invoices/${invoice.id}`} className="block">
      <Card className="group !p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-garage-400">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm font-medium text-white truncate">
              {invoice.job.customer.name}
            </p>
            <p className="text-xs text-garage-400">
              {invoice.job.vehicle.registration}
              {showPaidDate && invoice.paidAt && (
                <> · Paid {formatDate(invoice.paidAt)}</>
              )}
              {showDueDate && (
                <> · Due {formatDate(invoice.dueAt)}</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-white">{formatGBP(invoice.total)}</span>
            <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function MoneySkeleton() {
  return (
    <div className="animate-pulse px-5 pt-6 space-y-6">
      <div className="h-4 w-24 bg-garage-800 rounded mb-2" />
      <div className="h-8 w-32 bg-garage-800 rounded" />
      <div className="h-32 bg-garage-800 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-garage-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
