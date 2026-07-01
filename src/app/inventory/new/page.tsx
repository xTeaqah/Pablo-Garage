"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  PageHeader,
  Input,
  Textarea,
  Button,
  Card,
} from "@/components/ui";
import { RegistrationLookupFields } from "@/components/vehicles/RegistrationLookupFields";
import {
  InventoryPartsEditor,
  type InventoryPartLine,
} from "@/components/inventory/InventoryPartsEditor";

export default function NewInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicle, setVehicle] = useState({
    registration: "",
    make: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
  });
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState<InventoryPartLine[]>([]);

  const handleSubmit = async () => {
    setError("");

    if (!vehicle.registration.trim() || !vehicle.make.trim()) {
      setError("Registration and make are required.");
      return;
    }

    if (!purchaseCost) {
      setError("Enter what you paid for the car.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || undefined,
        color: vehicle.color || undefined,
        mileage: vehicle.mileage || undefined,
        notes: notes || undefined,
        purchaseCost,
        purchaseDate,
        parts: parts.map(({ description, cost }) => ({ description, cost })),
      }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Could not save vehicle. Please try again.");
      return;
    }

    const car = await res.json();
    router.push(`/inventory/${car.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Add Vehicle"
        subtitle="Your stock — track buy price, parts & sale"
      />

      <div className="px-5 space-y-5 pb-8">
        <Card className="space-y-3">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
            Vehicle
          </p>
          <RegistrationLookupFields
            registration={vehicle.registration}
            make={vehicle.make}
            model={vehicle.model}
            year={vehicle.year}
            showYear
            onRegistrationChange={(value) =>
              setVehicle((prev) => ({ ...prev, registration: value }))
            }
            onMakeChange={(value) =>
              setVehicle((prev) => ({ ...prev, make: value }))
            }
            onModelChange={(value) =>
              setVehicle((prev) => ({ ...prev, model: value }))
            }
            onYearChange={(value) =>
              setVehicle((prev) => ({ ...prev, year: value }))
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Colour (optional)"
              value={vehicle.color}
              onChange={(e) =>
                setVehicle((prev) => ({ ...prev, color: e.target.value }))
              }
            />
            <Input
              label="Mileage (optional)"
              type="number"
              value={vehicle.mileage}
              onChange={(e) =>
                setVehicle((prev) => ({ ...prev, mileage: e.target.value }))
              }
            />
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
            Purchase
          </p>
          <Input
            label="Buy price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={purchaseCost}
            onChange={(e) => setPurchaseCost(e.target.value)}
          />
          <Input
            label="Purchase date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </Card>

        <Card className="space-y-3">
          <p className="text-xs font-semibold text-amber-brand uppercase tracking-wider">
            Parts Fitted
          </p>
          <InventoryPartsEditor parts={parts} onChange={setParts} />
        </Card>

        <Textarea
          label="Notes (optional)"
          placeholder="Where you bought it, condition, etc."
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Add to Stock"}
          {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
