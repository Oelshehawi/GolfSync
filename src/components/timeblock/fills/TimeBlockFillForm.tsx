"use client";

import { useState } from "react";
import { FillTypes, type FillType } from "~/app/types/TeeSheetTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface TimeBlockFillFormProps {
  onAddFill: (fillType: FillType, customName?: string) => Promise<void>;
  isTimeBlockFull: boolean;
  maxPeople: number;
  currentPeopleCount: number;
}

const DEFAULT_FILL_OPTIONS = [
  { id: FillTypes.GUEST, label: "Guest Fill" },
  { id: FillTypes.RECIPROCAL, label: "Reciprocal Fill" },
  { id: FillTypes.CUSTOM, label: "Other..." },
] as const;

export function TimeBlockFillForm({
  onAddFill,
  isTimeBlockFull,
  maxPeople,
  currentPeopleCount,
}: TimeBlockFillFormProps) {
  const [selectedFillType, setSelectedFillType] = useState<FillType>(
    FillTypes.GUEST,
  );
  const [customFillName, setCustomFillName] = useState("");
  const [fillCount, setFillCount] = useState(1);

  const availableSpots = maxPeople - currentPeopleCount;
  const isCustomFill = selectedFillType === FillTypes.CUSTOM;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTimeBlockFull || fillCount > availableSpots) {
      return;
    }

    try {
      // Create multiple individual fills
      const fillPromises = Array.from({ length: fillCount }, () =>
        onAddFill(selectedFillType, isCustomFill ? customFillName : undefined),
      );
      await Promise.all(fillPromises);

      // Reset form
      setFillCount(1);
      if (isCustomFill) {
        setCustomFillName("");
      }
    } catch (error) {
      console.error("Error adding fills:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div className="space-y-2">
        <Label htmlFor="fillType">Fill Type</Label>
        <Select
          value={selectedFillType}
          onValueChange={(value) => setSelectedFillType(value as FillType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fill type" />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_FILL_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCustomFill && (
        <div className="space-y-2">
          <Label htmlFor="customName">Fill Name</Label>
          <Input
            id="customName"
            value={customFillName}
            onChange={(e) => setCustomFillName(e.target.value)}
            placeholder="Enter fill name..."
            required={isCustomFill}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="count">Number of Fills</Label>
        <Input
          id="count"
          type="number"
          min={1}
          max={availableSpots}
          value={fillCount}
          onChange={(e) => setFillCount(parseInt(e.target.value) || 1)}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={
          isTimeBlockFull ||
          fillCount > availableSpots ||
          fillCount < 1 ||
          (isCustomFill && !customFillName.trim())
        }
      >
        Add Fill{fillCount > 1 ? "s" : ""}
      </Button>
    </form>
  );
}
