"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, ChevronRight, Search, X } from "lucide-react";
import {
  PageHeader,
  Input,
  Textarea,
  Select,
  Button,
  Card,
  SectionTitle,
} from "@/components/ui";
import { RegistrationLookupFields } from "@/components/vehicles/RegistrationLookupFields";
import { getApiError } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  phone: string;
  vehicles: Vehicle[];
}

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    registration: "",
    make: "",
    model: "",
    year: "",
  });
  const [newVehicle, setNewVehicle] = useState({
    registration: "",
    make: "",
    model: "",
    year: "",
  });
  const [customerError, setCustomerError] = useState("");

  useEffect(() => {
    fetch("/api/customers?limit=1")
      .then((r) => r.json())
      .then((data) => {
        if (data.total === 0) setCustomerMode("new");
      });
  }, []);

  useEffect(() => {
    if (customerMode !== "existing" || selectedCustomer) return;

    const query = customerSearch.trim();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ limit: query ? "20" : "15", page: "1" });
        if (query) params.set("search", query);

        const res = await fetch(`/api/customers?${params}`);
        const data = await res.json();
        setSearchResults(data.customers ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, query ? 300 : 0);

    return () => clearTimeout(timer);
  }, [customerSearch, customerMode, selectedCustomer]);

  const vehicles = selectedCustomer?.vehicles ?? [];

  const selectCustomer = async (id: string) => {
    const full = await fetch(`/api/customers/${id}`).then((r) => r.json());
    setSelectedCustomer(full);
    setCustomerId(id);
    setVehicleId("");
    setCustomerSearch("");
    setShowAddVehicle(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerId("");
    setVehicleId("");
    setShowAddVehicle(false);
  };

  const addVehicleToCustomer = async () => {
    if (!customerId || !newVehicle.registration.trim() || !newVehicle.make.trim()) {
      return;
    }

    const res = await fetch(`/api/customers/${customerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration: newVehicle.registration.toUpperCase().trim(),
        make: newVehicle.make.trim(),
        model: newVehicle.model.trim(),
        year: newVehicle.year ? parseInt(newVehicle.year, 10) : undefined,
      }),
    });

    if (!res.ok) {
      setCustomerError(
        await getApiError(res, "Could not add vehicle. Please try again.")
      );
      return;
    }

    const vehicle = await res.json();
    const updated = await fetch(`/api/customers/${customerId}`).then((r) => r.json());
    setSelectedCustomer(updated);
    setVehicleId(vehicle.id);
    setShowAddVehicle(false);
    setNewVehicle({ registration: "", make: "", model: "", year: "" });
  };

  const handleSubmit = async () => {
    setCustomerError("");
    let activeCustomerId = customerId;
    let activeVehicleId = vehicleId;

    if (customerMode === "new") {
      if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
        setCustomerError("Please fill in customer name and phone.");
        return;
      }
      if (!newCustomer.registration.trim() || !newCustomer.make.trim()) {
        setCustomerError("Please fill in vehicle registration and make.");
        return;
      }

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim() || undefined,
          vehicle: {
            registration: newCustomer.registration.toUpperCase().trim(),
            make: newCustomer.make.trim(),
            model: newCustomer.model.trim(),
            year: newCustomer.year ? parseInt(newCustomer.year, 10) : undefined,
          },
        }),
      });

      if (!res.ok) {
        setCustomerError(
          await getApiError(res, "Could not create customer. Please try again.")
        );
        return;
      }

      const customer = await res.json();
      activeCustomerId = customer.id;
      activeVehicleId = customer.vehicles?.[0]?.id ?? "";
    }

    if (!activeCustomerId || !activeVehicleId) {
      setCustomerError("Please select a customer and vehicle.");
      return;
    }

    if (!description.trim()) {
      setCustomerError("Please describe what's needed.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: activeCustomerId,
        vehicleId: activeVehicleId,
        description: description.trim(),
        notes: notes.trim() || null,
        lineItems: [],
      }),
    });

    if (!res.ok) {
      setLoading(false);
      setCustomerError(
        await getApiError(res, "Could not create job. Please try again.")
      );
      return;
    }

    const job = await res.json();
    router.push(`/jobs/${job.id}`);
  };

  return (
    <div>
      <PageHeader
        title="New Job"
        subtitle="Customer & job details — schedule on the next screen"
      />

      <div className="px-5 space-y-5 pb-8">
        <div>
          <SectionTitle title="Customer" />

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setCustomerMode("existing");
                setCustomerError("");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                customerMode === "existing"
                  ? "bg-amber-brand text-garage-950 shadow-lg shadow-amber-brand/20"
                  : "bg-garage-800 text-garage-400 border border-garage-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Existing
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerMode("new");
                clearCustomer();
                setCustomerError("");
              }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                customerMode === "new"
                  ? "bg-amber-brand text-garage-950 shadow-lg shadow-amber-brand/20"
                  : "bg-garage-800 text-garage-400 border border-garage-700"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              New Customer
            </button>
          </div>

          {customerMode === "new" ? (
            <Card className="space-y-3 border-amber-brand/20">
              <Input
                label="Name"
                placeholder="John Smith"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Input
                label="Phone"
                placeholder="07xxx xxxxxx"
                type="tel"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <Input
                label="Email (optional)"
                placeholder="john@email.com"
                type="email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer((prev) => ({ ...prev, email: e.target.value }))
                }
              />
              <div className="border-t border-garage-700 pt-3">
                <p className="text-xs font-medium text-garage-400 uppercase tracking-wider mb-3">
                  Vehicle
                </p>
                <RegistrationLookupFields
                  registration={newCustomer.registration}
                  make={newCustomer.make}
                  model={newCustomer.model}
                  year={newCustomer.year}
                  showYear
                  onRegistrationChange={(value) =>
                    setNewCustomer((prev) => ({ ...prev, registration: value }))
                  }
                  onMakeChange={(value) =>
                    setNewCustomer((prev) => ({ ...prev, make: value }))
                  }
                  onModelChange={(value) =>
                    setNewCustomer((prev) => ({ ...prev, model: value }))
                  }
                  onYearChange={(value) =>
                    setNewCustomer((prev) => ({ ...prev, year: value }))
                  }
                />
              </div>
            </Card>
          ) : selectedCustomer ? (
            <Card className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{selectedCustomer.name}</p>
                  <p className="text-sm text-garage-400">{selectedCustomer.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={clearCustomer}
                  className="text-garage-400 hover:text-white p-1"
                  aria-label="Change customer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {vehicles.length > 0 ? (
                <Select
                  label="Vehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  options={[
                    { value: "", label: "Choose a vehicle..." },
                    ...vehicles.map((v) => ({
                      value: v.id,
                      label: `${v.registration} — ${v.make} ${v.model}`,
                    })),
                  ]}
                />
              ) : (
                <p className="text-sm text-garage-400">
                  This customer has no vehicles yet.
                </p>
              )}

              {showAddVehicle ? (
                <Card className="space-y-3">
                  <RegistrationLookupFields
                    registration={newVehicle.registration}
                    make={newVehicle.make}
                    model={newVehicle.model}
                    year={newVehicle.year}
                    showYear
                    onRegistrationChange={(value) =>
                      setNewVehicle((prev) => ({ ...prev, registration: value }))
                    }
                    onMakeChange={(value) =>
                      setNewVehicle((prev) => ({ ...prev, make: value }))
                    }
                    onModelChange={(value) =>
                      setNewVehicle((prev) => ({ ...prev, model: value }))
                    }
                    onYearChange={(value) =>
                      setNewVehicle((prev) => ({ ...prev, year: value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addVehicleToCustomer} fullWidth>
                      Add Vehicle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddVehicle(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(true)}
                  className="text-sm text-amber-brand font-medium"
                >
                  + Add vehicle
                </button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-garage-500" />
                <input
                  type="search"
                  placeholder="Search name, phone, reg..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-garage-900 border border-garage-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-garage-500 focus:border-amber-brand/50"
                />
              </div>

              {searchLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-garage-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-garage-400 text-center py-4">
                  {customerSearch.trim()
                    ? "No customers found"
                    : "No customers yet — add a new one above"}
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {!customerSearch.trim() && (
                    <p className="text-xs text-garage-500 px-1">Recent customers</p>
                  )}
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer.id)}
                      className="w-full glass-card rounded-xl p-3.5 text-left active:scale-[0.98] transition-transform"
                    >
                      <p className="font-medium text-white">{customer.name}</p>
                      <p className="text-xs text-garage-400">{customer.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {customerError && (
            <p className="text-sm text-red-400 mt-3">{customerError}</p>
          )}
        </div>

        <div className="border-t border-garage-800 pt-5 space-y-4">
          <SectionTitle title="Job Details" />
          <Textarea
            label="What's needed?"
            placeholder="e.g. Front brake pads and discs replacement"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Internal notes for this job..."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Job"}
          {!loading && <ChevronRight className="w-5 h-5 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
