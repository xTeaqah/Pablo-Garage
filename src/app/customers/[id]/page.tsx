"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Car,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";
import {
  PageHeader,
  Card,
  StatusBadge,
  Button,
  SectionTitle,
  Input,
  Textarea,
} from "@/components/ui";
import { RegistrationLookupFields } from "@/components/vehicles/RegistrationLookupFields";
import type { VehicleLookupResult } from "@/lib/registration";
import { formatGBP, formatDate, formatMakeModel } from "@/lib/utils";

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  vehicles: Array<{
    id: string;
    registration: string;
    make: string;
    model: string;
    year: number | null;
    motStatus: string | null;
    motExpiryDate: string | null;
  }>;
  jobs: Array<{
    id: string;
    description: string;
    status: string;
    total: number;
    createdAt: string;
    vehicle: { registration: string };
  }>;
}

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [id, setId] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    registration: "",
    make: "",
    model: "",
    year: "",
    motStatus: "",
    motExpiryDate: "",
  });
  const [editVehicle, setEditVehicle] = useState({
    registration: "",
    make: "",
    model: "",
    year: "",
    motStatus: "",
    motExpiryDate: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const loadCustomer = useCallback(() => {
    if (!id) return;
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCustomer(data);
        setEditForm({
          name: data.name,
          phone: data.phone,
          email: data.email ?? "",
          address: data.address ?? "",
          notes: data.notes ?? "",
        });
      });
  }, [id]);

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const saveCustomer = async () => {
    setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save customer.");
      return;
    }
    setEditing(false);
    loadCustomer();
  };

  const addVehicle = async () => {
    if (!newVehicle.registration || !newVehicle.make) return;
    setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration: newVehicle.registration.toUpperCase(),
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year ? parseInt(newVehicle.year, 10) : undefined,
        motStatus: newVehicle.motStatus || undefined,
        motExpiryDate: newVehicle.motExpiryDate || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not add vehicle.");
      return;
    }
    setShowAddVehicle(false);
    setNewVehicle({
      registration: "",
      make: "",
      model: "",
      year: "",
      motStatus: "",
      motExpiryDate: "",
    });
    loadCustomer();
  };

  const startEditVehicle = (vehicle: CustomerDetail["vehicles"][0]) => {
    setEditingVehicleId(vehicle.id);
    setEditVehicle({
      registration: vehicle.registration,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year ? String(vehicle.year) : "",
      motStatus: vehicle.motStatus ?? "",
      motExpiryDate: vehicle.motExpiryDate ?? "",
    });
  };

  const saveVehicle = async () => {
    if (!editingVehicleId) return;
    setError("");
    const res = await fetch(`/api/vehicles/${editingVehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editVehicle,
        year: editVehicle.year ? parseInt(editVehicle.year, 10) : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not update vehicle.");
      return;
    }
    setEditingVehicleId(null);
    loadCustomer();
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm("Delete this vehicle?")) return;
    const res = await fetch(`/api/vehicles/${vehicleId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete vehicle.");
      return;
    }
    loadCustomer();
  };

  const onLookup = (data: VehicleLookupResult) => {
    if (showAddVehicle) {
      setNewVehicle((v) => ({
        ...v,
        motStatus: data.motStatus ?? "",
        motExpiryDate: data.motExpiryDate ?? "",
      }));
    }
  };

  if (!customer) {
    return (
      <div className="animate-pulse px-5 pt-6">
        <div className="h-8 w-48 bg-garage-800 rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 pt-4 flex items-center justify-between">
        <Link
          href="/customers"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-garage-400 inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="text-xs text-amber-brand font-medium flex items-center gap-1"
        >
          {editing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <PageHeader title={customer.name} />

      <div className="px-5 space-y-5 pb-8">
        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        {editing ? (
          <Card className="space-y-3">
            <Input
              label="Name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
            />
            <Input
              label="Email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
            />
            <Textarea
              label="Address"
              rows={2}
              value={editForm.address}
              onChange={(e) =>
                setEditForm({ ...editForm, address: e.target.value })
              }
            />
            <Textarea
              label="Notes"
              rows={2}
              value={editForm.notes}
              onChange={(e) =>
                setEditForm({ ...editForm, notes: e.target.value })
              }
            />
            <Button size="sm" onClick={saveCustomer} fullWidth>
              <Save className="w-4 h-4 mr-2" />
              Save Customer
            </Button>
          </Card>
        ) : (
          <Card>
            <div className="space-y-3">
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-3 text-garage-200 hover:text-amber-brand"
              >
                <Phone className="w-4 h-4 text-garage-500" />
                {customer.phone}
              </a>
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-3 text-garage-200 hover:text-amber-brand"
                >
                  <Mail className="w-4 h-4 text-garage-500" />
                  {customer.email}
                </a>
              )}
              {customer.address && (
                <p className="text-sm text-garage-400">{customer.address}</p>
              )}
              {customer.notes && (
                <p className="text-sm text-garage-500">{customer.notes}</p>
              )}
            </div>
          </Card>
        )}

        <div>
          <SectionTitle
            title="Vehicles"
            action={
              <button
                onClick={() => setShowAddVehicle(true)}
                className="text-xs text-amber-brand font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            }
          />
          {showAddVehicle && (
            <Card className="space-y-3 mb-3">
              <p className="text-sm font-medium text-white">Add Vehicle</p>
              <RegistrationLookupFields
                registration={newVehicle.registration}
                make={newVehicle.make}
                model={newVehicle.model}
                year={newVehicle.year}
                showYear
                onRegistrationChange={(value) =>
                  setNewVehicle({ ...newVehicle, registration: value })
                }
                onMakeChange={(value) =>
                  setNewVehicle({ ...newVehicle, make: value })
                }
                onModelChange={(value) =>
                  setNewVehicle({ ...newVehicle, model: value })
                }
                onYearChange={(value) =>
                  setNewVehicle({ ...newVehicle, year: value })
                }
                onLookup={onLookup}
              />
              <Button size="sm" onClick={addVehicle} fullWidth>
                Add Vehicle
              </Button>
            </Card>
          )}
          <div className="space-y-2">
            {customer.vehicles.map((v) => (
              <Card key={v.id}>
                {editingVehicleId === v.id ? (
                  <div className="space-y-3">
                    <Input
                      label="Registration"
                      value={editVehicle.registration}
                      onChange={(e) =>
                        setEditVehicle({
                          ...editVehicle,
                          registration: e.target.value,
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Make"
                        value={editVehicle.make}
                        onChange={(e) =>
                          setEditVehicle({
                            ...editVehicle,
                            make: e.target.value,
                          })
                        }
                      />
                      <Input
                        label="Model"
                        value={editVehicle.model}
                        onChange={(e) =>
                          setEditVehicle({
                            ...editVehicle,
                            model: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button size="sm" onClick={saveVehicle} fullWidth>
                      Save Vehicle
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <Car className="w-5 h-5 text-amber-brand shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white tracking-wide">
                          {v.registration}
                        </p>
                        <p className="text-sm text-garage-400">
                          {formatMakeModel(v.make, v.model)}
                          {v.year ? ` (${v.year})` : ""}
                        </p>
                        {v.motExpiryDate && (
                          <p className="text-xs text-garage-500 mt-1">
                            MOT: {v.motStatus ?? "—"} · Expires{" "}
                            {v.motExpiryDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditVehicle(v)}
                        className="w-8 h-8 rounded-lg bg-garage-800 flex items-center justify-center text-garage-400"
                        aria-label="Edit vehicle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVehicle(v.id)}
                        className="w-8 h-8 rounded-lg bg-garage-800 flex items-center justify-center text-red-400"
                        aria-label="Delete vehicle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="Job History" />
          {customer.jobs.length === 0 ? (
            <p className="text-sm text-garage-500 text-center py-6">No jobs yet</p>
          ) : (
            <div className="space-y-2">
              {customer.jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={job.status} />
                          <span className="text-xs text-garage-500">
                            {formatDate(job.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium">
                          {job.description}
                        </p>
                        <p className="text-xs text-garage-400">
                          {job.vehicle.registration}
                        </p>
                      </div>
                      <span className="font-semibold text-white">
                        {formatGBP(job.total)}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
