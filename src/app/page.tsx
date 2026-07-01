"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PoundSterling,
  AlertCircle,
  Briefcase,
  TrendingUp,
  Plus,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { PageHeader, StatTile, SectionTitle, EmptyState, Button } from "@/components/ui";
import { JobCard, WeekStrip } from "@/components/jobs/JobCard";
import { formatGBP, formatDateLong, getGreeting } from "@/lib/utils";

interface DashboardData {
  todaysJobs: Array<{
    id: string;
    description: string;
    status: string;
    total: number;
    scheduledAt: string | null;
    customer: { name: string };
    vehicle: { registration: string; make: string; model: string };
  }>;
  stats: {
    weekRevenue: number;
    outstanding: number;
    jobsThisWeek: number;
    openJobs: number;
  };
  needsAttention: Array<{
    type: string;
    title: string;
    subtitle: string;
    href: string;
    amount?: number;
  }>;
  weekJobsForStrip: Array<{ scheduledAt: string | null }>;
  businessName: string;
  adminUsername: string;
}

export default function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (!data) return null;

  const attentionIcons: Record<string, React.ReactNode> = {
    invoice: <PoundSterling className="w-4 h-4" />,
    send: <AlertCircle className="w-4 h-4" />,
    overdue: <AlertCircle className="w-4 h-4" />,
    stale: <Briefcase className="w-4 h-4" />,
  };

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={`${getGreeting()}, ${data.adminUsername ?? "Pablo"} · ${formatDateLong(new Date())}`}
      />

      <div className="px-5 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/money" className="block">
            <StatTile
              label="This Week"
              value={formatGBP(data.stats.weekRevenue)}
              icon={<TrendingUp className="w-4 h-4" />}
              accent
            />
          </Link>
          <Link href="/money" className="block">
            <StatTile
              label="Outstanding"
              value={formatGBP(data.stats.outstanding)}
              icon={<PoundSterling className="w-4 h-4" />}
            />
          </Link>
          <StatTile
            label="Jobs This Week"
            value={String(data.stats.jobsThisWeek)}
            icon={<Briefcase className="w-4 h-4" />}
          />
          <StatTile
            label="Open Jobs"
            value={String(data.stats.openJobs)}
            icon={<Briefcase className="w-4 h-4" />}
          />
        </div>

        {/* Week Strip */}
        <div>
          <SectionTitle
            title="This Week"
            action={
              <Link
                href="/schedule"
                className="text-xs text-amber-brand font-medium flex items-center gap-0.5"
              >
                Calendar <ChevronRight className="w-3 h-3" />
              </Link>
            }
          />
          <WeekStrip jobs={data.weekJobsForStrip} />
        </div>

        {/* Today's Jobs */}
        <div>
          <SectionTitle
            title="Today's Jobs"
            action={
              data.todaysJobs.length > 0 ? (
                <Link
                  href="/schedule"
                  className="text-xs text-amber-brand font-medium flex items-center gap-0.5"
                >
                  Schedule <ChevronRight className="w-3 h-3" />
                </Link>
              ) : null
            }
          />
          {data.todaysJobs.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="w-8 h-8" />}
              title="No jobs today"
              description="Enjoy the quiet — or book something in."
              action={
                <Link href="/new-job">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    New Job
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {data.todaysJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        {data.needsAttention.length > 0 && (
          <div>
            <SectionTitle title="Needs Attention" />
            <div className="space-y-2">
              {data.needsAttention.map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className="glass-card rounded-xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === "overdue"
                          ? "bg-red-500/15 text-red-400"
                          : item.type === "invoice"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-brand/15 text-amber-brand"
                      }`}
                    >
                      {attentionIcons[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className="text-xs text-garage-400 truncate">{item.subtitle}</p>
                    </div>
                    {item.amount !== undefined && (
                      <span className="text-sm font-semibold text-white shrink-0">
                        {formatGBP(item.amount)}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-garage-500 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {data.needsAttention.length === 0 && data.todaysJobs.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-4 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">All caught up</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-5 pt-6 pb-4">
        <div className="h-4 w-32 bg-garage-800 rounded mb-2" />
        <div className="h-8 w-48 bg-garage-800 rounded" />
      </div>
      <div className="px-5 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-garage-800 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
