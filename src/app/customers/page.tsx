"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, Phone, Car, ChevronRight, Loader2 } from "lucide-react";
import { PageHeader, Card, EmptyState, Button } from "@/components/ui";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicles: { registration: string; make: string; model: string }[];
  _count: { jobs: number; vehicles: number };
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const PAGE_SIZE = 30;

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const fetchCustomers = useCallback(
    async (pageNum: number, searchQuery: string, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(PAGE_SIZE),
        });
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/customers?${params}`);
        const data: CustomersResponse = await res.json();

        setCustomers((prev) =>
          append ? [...prev, ...data.customers] : data.customers
        );
        setTotal(data.total);
        setPage(data.page);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCustomers(1, debouncedSearch, false);
  }, [debouncedSearch, fetchCustomers]);

  const subtitle = debouncedSearch
    ? `${total} result${total !== 1 ? "s" : ""}`
    : `${total.toLocaleString("en-GB")} customer${total !== 1 ? "s" : ""}`;

  return (
    <div className="overflow-x-hidden">
      <PageHeader title="Customers" subtitle={subtitle} />

      <div className="px-5 space-y-4 pb-6">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-garage-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search name, phone, reg..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-garage-900 border border-garage-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-garage-500 focus:border-amber-brand/50"
            />
          </div>
          {!loading && customers.length > 0 && total > customers.length && (
            <p className="text-xs text-garage-500 px-1">
              Showing {customers.length.toLocaleString("en-GB")} of{" "}
              {total.toLocaleString("en-GB")}
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-garage-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={debouncedSearch ? "No matches" : "No customers yet"}
            description={
              debouncedSearch
                ? "Try a different name, phone number, or registration."
                : "Customers are added when you create a job."
            }
            action={
              !debouncedSearch ? (
                <Link href="/new-job">
                  <button className="gradient-brand text-garage-950 font-semibold px-4 py-2 rounded-xl text-sm">
                    Create a Job
                  </button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {customers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/customers/${customer.id}`}
                  className="block"
                >
                  <Card className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-garage-700 flex items-center justify-center text-lg font-bold text-amber-brand shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-garage-400 mt-0.5">
                          <span className="flex items-center gap-1 min-w-0">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span className="truncate">{customer.phone}</span>
                          </span>
                          {customer.vehicles.length > 0 && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Car className="w-3 h-3" />
                              {customer.vehicles[0].registration}
                              {customer._count.vehicles > 1 &&
                                ` +${customer._count.vehicles - 1}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-garage-500">
                          {customer._count.jobs} job
                          {customer._count.jobs !== 1 ? "s" : ""}
                        </p>
                        <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand ml-auto mt-1" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => fetchCustomers(page + 1, debouncedSearch, true)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load more (${(total - customers.length).toLocaleString("en-GB")} remaining)`
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
