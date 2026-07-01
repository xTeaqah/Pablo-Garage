"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Briefcase } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";
import { JobCard } from "@/components/jobs/JobCard";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETE", label: "Complete" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Parameters<typeof JobCard>[0]["job"][]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    setLoading(true);
    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [filter, debouncedSearch]);

  return (
    <div>
      <PageHeader title="Jobs" subtitle={`${total} total`} />

      <div className="px-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-garage-500" />
          <input
            type="search"
            placeholder="Search jobs, customers, reg..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-garage-900 border border-garage-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-garage-500 focus:border-amber-brand/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-amber-brand text-garage-950"
                  : "bg-garage-800 text-garage-400 hover:text-garage-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-garage-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-8 h-8" />}
            title="No jobs found"
            description={search ? "Try a different search term" : "Create your first job to get started"}
            action={
              <Link href="/new-job">
                <button className="gradient-brand text-garage-950 font-semibold px-4 py-2 rounded-xl text-sm">
                  New Job
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
