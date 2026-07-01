"use client";

import { useState } from "react";
import { X, Package, Plus } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { formatGBP } from "@/lib/utils";

export interface InventoryPartLine {
  id: string;
  description: string;
  cost: number;
}

interface InventoryPartsEditorProps {
  parts: InventoryPartLine[];
  onChange: (parts: InventoryPartLine[]) => void;
  readOnly?: boolean;
}

export function InventoryPartsEditor({
  parts,
  onChange,
  readOnly = false,
}: InventoryPartsEditorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");

  const partsTotal = parts.reduce((sum, part) => sum + part.cost, 0);

  const addPart = () => {
    if (!description.trim() || !cost) return;
    onChange([
      ...parts,
      {
        id: crypto.randomUUID(),
        description: description.trim(),
        cost: parseFloat(cost) || 0,
      },
    ]);
    setDescription("");
    setCost("");
    setShowAdd(false);
  };

  const removePart = (id: string) => {
    onChange(parts.filter((part) => part.id !== id));
  };

  return (
    <div className="space-y-3">
      {parts.length === 0 && !showAdd && (
        <p className="text-sm text-garage-400 text-center py-3">
          No parts logged yet.
        </p>
      )}

      {parts.map((part) => (
        <div
          key={part.id}
          className="flex items-center gap-3 bg-garage-900/60 rounded-xl px-3 py-2.5 border border-garage-700/60"
        >
          <Package className="w-4 h-4 text-garage-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{part.description}</p>
          </div>
          <span className="text-sm font-semibold text-white shrink-0">
            {formatGBP(part.cost)}
          </span>
          {!readOnly && (
            <button
              type="button"
              onClick={() => removePart(part.id)}
              className="text-garage-500 hover:text-red-400 p-1"
              aria-label="Remove part"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <>
          {showAdd ? (
            <div className="space-y-3 bg-garage-900/40 rounded-xl p-3 border border-garage-700">
              <Input
                label="Part description"
                placeholder="e.g. Brake discs, Battery, Tyres"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                label="Cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addPart} fullWidth>
                  Add Part
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAdd(false);
                    setDescription("");
                    setCost("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-garage-600 text-sm text-garage-400 hover:text-amber-brand hover:border-amber-brand/40 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Part
            </button>
          )}
        </>
      )}

      {parts.length > 0 && (
        <div className="flex justify-between text-sm pt-2 border-t border-garage-700">
          <span className="text-garage-400">Parts total</span>
          <span className="font-semibold text-white">{formatGBP(partsTotal)}</span>
        </div>
      )}
    </div>
  );
}
