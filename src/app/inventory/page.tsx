"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Plus, ChevronRight } from "lucide-react";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { formatGBP, formatVehicleTitle } from "@/lib/utils";

interface InventoryCar {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  status: "IN_STOCK" | "SOLD";
  purchaseCost: number;
  salePrice: number | null;
  totalCost: number;
  profit: number | null;
}

const filters = [
  { value: "all", label: "All" },
  { value: "IN_STOCK", label: "In Stock" },
  { value: "SOLD", label: "Sold" },
];

export default function InventoryPage() {
  const [cars, setCars] = useState<InventoryCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);

    setLoading(true);
    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then(setCars)
      .finally(() => setLoading(false));
  }, [filter]);

  const inStock = cars.filter((c) => c.status === "IN_STOCK");
  const totalInvested = inStock.reduce((sum, c) => sum + c.totalCost, 0);

  const subtitle =
    filter === "SOLD"
      ? `${cars.length} sold`
      : inStock.length > 0
        ? `${inStock.length} in stock · ${formatGBP(totalInvested)} invested`
        : `${cars.length} vehicle${cars.length !== 1 ? "s" : ""}`;

  return (
    <div>
      <PageHeader title="Stock" subtitle={subtitle}>
        <Link
          href="/inventory/new"
          className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-garage-950 shrink-0 mt-1"
          aria-label="Add vehicle"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </Link>
      </PageHeader>

      <div className="px-5 space-y-4 pb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? "bg-amber-brand text-garage-950"
                  : "bg-garage-800 text-garage-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-garage-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <EmptyState
            icon={<Car className="w-8 h-8" />}
            title="No stock vehicles"
            description="Track cars you buy, parts you fit, and what you sell them for."
            action={
              <Link href="/inventory/new">
                <button className="gradient-brand text-garage-950 font-semibold px-4 py-2 rounded-xl text-sm">
                  Add Vehicle
                </button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {cars.map((car) => (
              <Link key={car.id} href={`/inventory/${car.id}`} className="block">
                <Card className="group">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-garage-700 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-amber-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-amber-brand font-semibold">
                          {car.registration}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            car.status === "SOLD"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-blue-500/15 text-blue-400"
                          }`}
                        >
                          {car.status === "SOLD" ? "Sold" : "In Stock"}
                        </span>
                      </div>
                      <p className="font-semibold text-white truncate">
                        {formatVehicleTitle({ year: car.year, make: car.make, model: car.model })}
                      </p>
                      <p className="text-xs text-garage-400 mt-0.5">
                        Invested {formatGBP(car.totalCost)}
                        {car.status === "SOLD" && car.salePrice != null && (
                          <>
                            {" "}
                            · Sold {formatGBP(car.salePrice)}
                            {car.profit != null && (
                              <span
                                className={
                                  car.profit >= 0 ? "text-emerald-400" : "text-red-400"
                                }
                              >
                                {" "}
                                ({car.profit >= 0 ? "+" : ""}
                                {formatGBP(car.profit)})
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-garage-500 group-hover:text-amber-brand shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
