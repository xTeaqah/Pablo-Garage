"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Building2, FileText, ChevronDown, Eye, Pencil, Shield } from "lucide-react";
import { PageHeader, Input, Textarea, Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  InvoiceDocument,
  SAMPLE_INVOICE,
  type InvoiceTemplateSettings,
} from "@/components/invoices/InvoiceDocument";

interface Settings extends InvoiceTemplateSettings {
  defaultLaborRate: number;
  invoicePrefix: string;
  nextInvoiceNumber: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [invoiceTemplateOpen, setInvoiceTemplateOpen] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) =>
        setSettings({
          ...data,
          invoiceTitle: data.invoiceTitle ?? "INVOICE",
          invoiceHeaderNote: data.invoiceHeaderNote ?? "",
          invoicePaymentText:
            data.invoicePaymentText ?? "Payment due within {days} days.",
          invoiceBankText:
            data.invoiceBankText ??
            "BACS: Sort {sortCode} · Account {accountNumber}",
          invoiceFooterText:
            data.invoiceFooterText ?? "Thank you for your business.",
        })
      );
  }, []);

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveError("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setSaveError(data.error ?? "Could not save settings.");
      return;
    }
    const updated = await res.json();
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (field: keyof Settings, value: string | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPasswordSaving(false);
    if (!res.ok) {
      setPasswordError(data.error ?? "Could not update password.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div className="animate-pulse px-5 pt-6">
        <div className="h-8 w-32 bg-garage-800 rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="px-5 pt-4">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-garage-400 inline-flex"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      <PageHeader title="Settings" subtitle="Garage details & preferences" />

      <div className="px-5 space-y-5 pb-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
              <Building2 className="w-6 h-6 text-garage-950" />
            </div>
            <div>
              <p className="font-bold text-white">{settings.businessName}</p>
              <p className="text-xs text-garage-400">Business profile</p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Input
            label="Business Name"
            value={settings.businessName}
            onChange={(e) => update("businessName", e.target.value)}
          />
          <Textarea
            label="Address"
            rows={3}
            value={settings.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder={"123 High Street\nTown\nAB1 2CD"}
          />
          <Input
            label="Phone"
            type="tel"
            value={settings.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={settings.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="border-t border-garage-800 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-garage-300 uppercase tracking-wider">
            Rates & Invoicing
          </h3>
          <Input
            label="Default Labour Rate (£/hr)"
            type="number"
            min="0"
            step="0.01"
            value={settings.defaultLaborRate}
            onChange={(e) =>
              update("defaultLaborRate", parseFloat(e.target.value) || 0)
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Invoice Prefix"
              value={settings.invoicePrefix}
              onChange={(e) => update("invoicePrefix", e.target.value)}
            />
            <Input
              label="Next Invoice #"
              type="number"
              min="1"
              value={settings.nextInvoiceNumber}
              onChange={(e) =>
                update("nextInvoiceNumber", parseInt(e.target.value) || 1)
              }
            />
          </div>
          <Input
            label="Payment Terms (days)"
            type="number"
            min="1"
            value={settings.paymentTermsDays}
            onChange={(e) =>
              update("paymentTermsDays", parseInt(e.target.value) || 14)
            }
          />
        </div>

        <div className="border-t border-garage-800 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-garage-300 uppercase tracking-wider">
            Bank Details (for invoices)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Sort Code"
              placeholder="12-34-56"
              value={settings.sortCode}
              onChange={(e) => update("sortCode", e.target.value)}
            />
            <Input
              label="Account Number"
              placeholder="12345678"
              value={settings.accountNumber}
              onChange={(e) => update("accountNumber", e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-garage-800 pt-5">
          <button
            type="button"
            onClick={() => {
              setInvoiceTemplateOpen((open) => {
                if (open) setShowInvoicePreview(false);
                return !open;
              });
            }}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-brand/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">Invoice Template</p>
              <p className="text-xs text-garage-400 mt-0.5">
                Customise layout, wording & footer
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-garage-500 shrink-0 transition-transform",
                invoiceTemplateOpen && "rotate-180"
              )}
            />
          </button>

          {invoiceTemplateOpen && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInvoicePreview(false);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    !showInvoicePreview
                      ? "bg-amber-brand text-garage-950"
                      : "bg-garage-800 text-garage-400"
                  )}
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoicePreview(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    showInvoicePreview
                      ? "bg-amber-brand text-garage-950"
                      : "bg-garage-800 text-garage-400"
                  )}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {showInvoicePreview ? (
                <div className="overflow-x-auto -mx-1 px-1 pb-1">
                  <p className="text-xs text-garage-500 mb-3 px-1">
                    Sample invoice — your changes appear here
                  </p>
                  <div className="min-w-[320px] scale-[0.92] origin-top-left">
                    <InvoiceDocument
                      invoice={SAMPLE_INVOICE}
                      settings={settings}
                      className="shadow-lg border border-garage-700"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-garage-500">
                    Use {"{days}"}, {"{sortCode}"}, {"{accountNumber}"}, and{" "}
                    {"{businessName}"} in your text.
                  </p>
                  <Input
                    label="Document title"
                    value={settings.invoiceTitle}
                    onChange={(e) => update("invoiceTitle", e.target.value)}
                    placeholder="INVOICE"
                  />
                  <Input
                    label="Header tagline (optional)"
                    value={settings.invoiceHeaderNote}
                    onChange={(e) => update("invoiceHeaderNote", e.target.value)}
                    placeholder="Driven by quality. Powered by trust."
                  />
                  <Textarea
                    label="Payment instructions"
                    rows={2}
                    value={settings.invoicePaymentText}
                    onChange={(e) => update("invoicePaymentText", e.target.value)}
                    placeholder="Payment due within {days} days."
                  />
                  <Textarea
                    label="Bank payment line"
                    rows={2}
                    value={settings.invoiceBankText}
                    onChange={(e) => update("invoiceBankText", e.target.value)}
                    placeholder="BACS: Sort {sortCode} · Account {accountNumber}"
                  />
                  <Textarea
                    label="Footer notes"
                    rows={3}
                    value={settings.invoiceFooterText}
                    onChange={(e) => update("invoiceFooterText", e.target.value)}
                    placeholder="Thank you for your business."
                  />
                </>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-garage-800 pt-5">
          <button
            type="button"
            onClick={() => setSecurityOpen((open) => !open)}
            className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-garage-800 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white">Security</p>
              <p className="text-xs text-garage-400 mt-0.5">
                Change your sign-in password
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-garage-500 shrink-0 transition-transform",
                securityOpen && "rotate-180"
              )}
            />
          </button>

          {securityOpen && (
            <div className="mt-4 space-y-4">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-sm text-red-400">{passwordError}</p>
              )}
              <Button
                fullWidth
                onClick={handlePasswordChange}
                disabled={
                  passwordSaving ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {passwordSaving
                  ? "Updating…"
                  : passwordSaved
                    ? "Password updated!"
                    : "Update password"}
              </Button>
            </div>
          )}
        </div>

        <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
        {saveError && (
          <p className="text-sm text-red-400 text-center">{saveError}</p>
        )}
      </div>
    </div>
  );
}
