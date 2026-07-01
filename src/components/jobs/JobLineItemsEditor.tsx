"use client";

import { useState } from "react";
import { X, Wrench, Package } from "lucide-react";
import { Input, Button, Card } from "@/components/ui";
import { formatGBP } from "@/lib/utils";

export interface LineItem {
  id: string;
  type: "LABOR" | "PART";
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface JobLineItemsEditorProps {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
  defaultLaborRate?: number;
  readOnly?: boolean;
}

export function JobLineItemsEditor({
  lineItems,
  onChange,
  defaultLaborRate = 45,
  readOnly = false,
}: JobLineItemsEditorProps) {
  const [showAddItem, setShowAddItem] = useState<"LABOR" | "PART" | null>(null);
  const [newItem, setNewItem] = useState({
    description: "",
    quantity: "1",
    unitPrice: "",
  });

  const total = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const addLineItem = () => {
    if (!newItem.description || !newItem.unitPrice) return;
    const qty = parseFloat(newItem.quantity) || 1;
    const price = parseFloat(newItem.unitPrice) || 0;
    onChange([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        type: showAddItem!,
        description: newItem.description,
        quantity: qty,
        unitPrice: price,
        lineTotal: Math.round(qty * price * 100) / 100,
      },
    ]);
    setNewItem({
      description: "",
      quantity: "1",
      unitPrice: showAddItem === "LABOR" ? String(defaultLaborRate) : "",
    });
    setShowAddItem(null);
  };

  const removeLineItem = (id: string) => {
    onChange(lineItems.filter((item) => item.id !== id));
  };

  const openAdd = (type: "LABOR" | "PART") => {
    setShowAddItem(type);
    setNewItem({
      description: "",
      quantity: "1",
      unitPrice: type === "LABOR" ? String(defaultLaborRate) : "",
    });
  };

  return (
    <div className="space-y-3">
      {lineItems.length === 0 && !showAddItem && (
        <p className="text-sm text-garage-400 text-center py-4">
          No parts or labour added yet.
        </p>
      )}

      {lineItems.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          {lineItems.map((item, i) => (
            <div
              key={item.id}
              className={`px-4 py-3.5 flex items-center gap-3 ${
                i > 0 ? "border-t border-garage-700" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.type === "LABOR"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-purple-500/15 text-purple-400"
                }`}
              >
                {item.type === "LABOR" ? (
                  <Wrench className="w-4 h-4" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    item.type === "LABOR"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-purple-500/15 text-purple-400"
                  }`}
                >
                  {item.type === "LABOR" ? "Labour" : "Part"}
                </span>
                <p className="text-sm text-white font-medium truncate mt-1">
                  {item.description}
                </p>
                <p className="text-xs text-garage-400">
                  {item.type === "LABOR"
                    ? `${item.quantity} hr × ${formatGBP(item.unitPrice)}/hr`
                    : `${item.quantity} × ${formatGBP(item.unitPrice)}`}
                </p>
              </div>
              <span className="font-semibold text-white shrink-0">
                {formatGBP(item.lineTotal)}
              </span>
              {!readOnly && (
                <button
                  onClick={() => removeLineItem(item.id)}
                  className="text-garage-500 hover:text-red-400 p-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}

      {!readOnly && showAddItem && (
        <Card className="space-y-3 border-amber-brand/20">
          <p className="text-sm font-semibold text-amber-brand">
            Add {showAddItem === "LABOR" ? "Labour" : "Part"}
          </p>
          <Input
            label="Description"
            placeholder={
              showAddItem === "LABOR"
                ? "e.g. Brake pad replacement"
                : "e.g. Front brake pads"
            }
            value={newItem.description}
            onChange={(e) =>
              setNewItem({ ...newItem, description: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={showAddItem === "LABOR" ? "Hours" : "Quantity"}
              type="number"
              min="0"
              step={showAddItem === "LABOR" ? "0.5" : "1"}
              value={newItem.quantity}
              onChange={(e) =>
                setNewItem({ ...newItem, quantity: e.target.value })
              }
            />
            <Input
              label={showAddItem === "LABOR" ? "Rate (£/hr)" : "Price (£)"}
              type="number"
              min="0"
              step="0.01"
              value={newItem.unitPrice}
              onChange={(e) =>
                setNewItem({ ...newItem, unitPrice: e.target.value })
              }
            />
          </div>
          {newItem.quantity && newItem.unitPrice && (
            <p className="text-sm text-garage-400">
              Line total:{" "}
              <span className="text-white font-semibold">
                {formatGBP(
                  parseFloat(newItem.quantity) * parseFloat(newItem.unitPrice)
                )}
              </span>
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={addLineItem} fullWidth>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddItem(null)}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {!readOnly && !showAddItem && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" onClick={() => openAdd("LABOR")}>
            <Wrench className="w-4 h-4 mr-1.5" />
            Add Labour
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openAdd("PART")}>
            <Package className="w-4 h-4 mr-1.5" />
            Add Part
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between px-1 pt-1">
        <span className="text-sm font-medium text-garage-400 uppercase tracking-wider">
          Job Total
        </span>
        <span className="text-2xl font-bold text-amber-brand">
          {formatGBP(total)}
        </span>
      </div>
    </div>
  );
}
