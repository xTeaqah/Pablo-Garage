"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { StatusBadge, Button, Input, Card } from "@/components/ui";
import {
  InventoryPartsEditor,
  type InventoryPartLine,
} from "@/components/inventory/InventoryPartsEditor";
import { formatGBP, formatDate, formatVehicleTitle } from "@/lib/utils";

interface InventoryDetail {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  mileage: number | null;
  notes: string | null;
  purchaseCost: number;
  purchaseDate: string | null;
  salePrice: number | null;
  soldAt: string | null;
  status: "IN_STOCK" | "SOLD";
  partsCost: number;
  totalCost: number;
  profit: number | null;
  parts: InventoryPartLine[];
}

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [car, setCar] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parts, setParts] = useState<InventoryPartLine[]>([]);
  const [purchaseCost, setPurchaseCost] = useState("");
  const [partsDirty, setPartsDirty] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [soldDate, setSoldDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showSaleForm, setShowSaleForm] = useState(false);

  const isSold = car?.status === "SOLD";

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchCar = useCallback(() => {
    if (!id) return;
    fetch(`/api/inventory/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCar(data);
        setParts(
          data.parts.map((part: InventoryPartLine) => ({
            id: part.id,
            description: part.description,
            cost: part.cost,
          }))
        );
        setPurchaseCost(String(data.purchaseCost));
        setSalePrice(data.salePrice != null ? String(data.salePrice) : "");
        if (data.soldAt) {
          setSoldDate(data.soldAt.split("T")[0]);
        }
        setPartsDirty(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCar();
  }, [fetchCar]);

  const saveParts = async (updatedParts: InventoryPartLine[]) => {
    if (!id || isSold) return;
    setSaving(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parts: updatedParts.map(({ description, cost }) => ({
          description,
          cost,
        })),
      }),
    });
    fetchCar();
    setSaving(false);
    setPartsDirty(false);
  };

  const handlePartsChange = (updatedParts: InventoryPartLine[]) => {
    setParts(updatedParts);
    setPartsDirty(true);
  };

  useEffect(() => {
    if (!partsDirty || !id || isSold) return;
    const timer = setTimeout(() => saveParts(parts), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, partsDirty, id, isSold]);

  const savePurchaseCost = async () => {
    if (!id || isSold) return;
    setSaving(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseCost }),
    });
    fetchCar();
    setSaving(false);
  };

  const markSold = async () => {
    if (!salePrice) return;
    setSaving(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salePrice,
        soldAt: new Date(`${soldDate}T12:00:00`).toISOString(),
        status: "SOLD",
      }),
    });
    fetchCar();
    setSaving(false);
    setShowSaleForm(false);
  };

  const markUnsold = async () => {
    if (!confirm("Mark this vehicle as in stock again?")) return;
    setSaving(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salePrice: null,
        soldAt: null,
        status: "IN_STOCK",
      }),
    });
    fetchCar();
    setSaving(false);
  };

  const deleteCar = async () => {
    if (!confirm("Delete this vehicle from stock? This cannot be undone.")) {
      return;
    }
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    router.push("/inventory");
  };

  if (loading || !car) {
    return (
      <div className="animate-pulse px-5 pt-6 space-y-4">
        <div className="h-8 w-48 bg-garage-800 rounded" />
        <div className="h-36 bg-garage-800 rounded-2xl" />
        <div className="h-48 bg-garage-800 rounded-2xl" />
      </div>
    );
  }

  const vehicleTitle = formatVehicleTitle({
    year: car.year,
    make: car.make,
    model: car.model,
  });
  const livePartsCost = parts.reduce((sum, p) => sum + p.cost, 0);
  const liveTotal =
    (parseFloat(purchaseCost) || 0) + livePartsCost;
  const liveProfit =
    car.salePrice != null ? car.salePrice - car.totalCost : null;

  return (
    <div className="pb-8">
      <div className="gradient-brand px-4 py-3.5 flex items-center gap-3">
        <Link
          href="/inventory"
          className="w-9 h-9 rounded-lg bg-garage-950/20 flex items-center justify-center text-garage-950"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-bold text-garage-950 text-lg pr-9">
          Stock Vehicle
        </h1>
      </div>

      <div className="bg-garage-800 border-b border-garage-700 px-4 py-2.5 flex items-center justify-between">
        <StatusBadge status={car.status} size="md" />
      </div>

      <div className="px-4 space-y-4 pt-4">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex">
            <div className="flex-1 p-4 space-y-2">
              <p className="text-xs font-mono text-amber-brand font-semibold">
                {car.registration}
              </p>
              <p className="text-lg font-bold text-white leading-tight">
                {vehicleTitle || "Unknown vehicle"}
              </p>
              <div className="space-y-1 text-sm">
                {car.color && (
                  <p className="text-garage-400">
                    <span className="text-garage-500">Colour:</span> {car.color}
                  </p>
                )}
                {car.mileage && (
                  <p className="text-garage-400">
                    <span className="text-garage-500">Mileage:</span>{" "}
                    {car.mileage.toLocaleString()} miles
                  </p>
                )}
                {car.purchaseDate && (
                  <p className="text-garage-400">
                    <span className="text-garage-500">Bought:</span>{" "}
                    {formatDate(car.purchaseDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="w-28 bg-garage-900/60 flex items-center justify-center border-l border-garage-700">
              <Car className="w-14 h-14 text-garage-600" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        {car.notes && (
          <Card>
            <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider mb-2">
              Notes
            </p>
            <p className="text-sm text-garage-300 whitespace-pre-wrap">{car.notes}</p>
          </Card>
        )}

        <Card className="space-y-4">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
            Costs
          </p>

          {!isSold ? (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  label="Buy price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  onBlur={savePurchaseCost}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-garage-400">Buy price</span>
              <span className="text-white font-medium">
                {formatGBP(car.purchaseCost)}
              </span>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-garage-400 uppercase tracking-wider mb-3">
              Parts fitted
            </p>
            <InventoryPartsEditor
              parts={parts}
              onChange={handlePartsChange}
              readOnly={isSold}
            />
            {partsDirty && !isSold && (
              <button
                type="button"
                onClick={() => saveParts(parts)}
                disabled={saving}
                className="text-xs font-semibold text-amber-brand mt-2"
              >
                {saving ? "Saving..." : "Save parts"}
              </button>
            )}
          </div>

          <div className="border-t border-garage-700 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-garage-400">Buy price</span>
              <span className="text-white">
                {formatGBP(isSold ? car.purchaseCost : parseFloat(purchaseCost) || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-garage-400">Parts</span>
              <span className="text-white">
                {formatGBP(isSold ? car.partsCost : livePartsCost)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-garage-700">
              <span className="text-white">Total invested</span>
              <span className="text-amber-brand">
                {formatGBP(isSold ? car.totalCost : liveTotal)}
              </span>
            </div>
          </div>
        </Card>

        {isSold ? (
          <Card className="space-y-3 border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Sold
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-garage-400">Sale price</span>
              <span className="text-white font-semibold">
                {formatGBP(car.salePrice ?? 0)}
              </span>
            </div>
            {car.soldAt && (
              <div className="flex justify-between text-sm">
                <span className="text-garage-400">Sold on</span>
                <span className="text-white">{formatDate(car.soldAt)}</span>
              </div>
            )}
            {liveProfit != null && (
              <div
                className={`flex items-center justify-between pt-3 border-t border-garage-700/60 ${
                  liveProfit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {liveProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {liveProfit >= 0 ? "Profit" : "Loss"}
                </span>
                <span className="text-lg font-bold">
                  {liveProfit >= 0 ? "+" : ""}
                  {formatGBP(liveProfit)}
                </span>
              </div>
            )}
            <Button variant="secondary" fullWidth size="sm" onClick={markUnsold}>
              Mark as in stock
            </Button>
          </Card>
        ) : showSaleForm ? (
          <Card className="space-y-3 border-amber-brand/20">
            <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
              Record Sale
            </p>
            <Input
              label="Sale price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
            <Input
              label="Sold date"
              type="date"
              value={soldDate}
              onChange={(e) => setSoldDate(e.target.value)}
            />
            {salePrice && (
              <p className="text-sm text-garage-400 text-center">
                Estimated{" "}
                <span
                  className={
                    parseFloat(salePrice) - liveTotal >= 0
                      ? "text-emerald-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {parseFloat(salePrice) - liveTotal >= 0 ? "profit" : "loss"}{" "}
                  {formatGBP(Math.abs(parseFloat(salePrice) - liveTotal))}
                </span>
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowSaleForm(false)}
              >
                Cancel
              </Button>
              <Button fullWidth onClick={markSold} disabled={!salePrice || saving}>
                {saving ? "Saving..." : "Confirm Sale"}
              </Button>
            </div>
          </Card>
        ) : (
          <Button fullWidth size="lg" onClick={() => setShowSaleForm(true)}>
            Record Sale
          </Button>
        )}

        <Button variant="danger" fullWidth size="sm" onClick={deleteCar}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Vehicle
        </Button>
      </div>
    </div>
  );
}
