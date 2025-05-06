"use client";

import { UseFormReturn } from "react-hook-form";
import { useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { DatePicker } from "~/components/ui/date-picker";
import { Switch } from "~/components/ui/switch";
import { TimeblockRestrictionFormValues } from "../TimeblockRestrictionDialog";

interface AvailabilityRestrictionFieldsProps {
  form: UseFormReturn<TimeblockRestrictionFormValues>;
}

export function AvailabilityRestrictionFields({
  form,
}: AvailabilityRestrictionFieldsProps) {
  // Watch isFullDay value for conditional rendering
  const isFullDay = form.watch("isFullDay");

  // Effect to ensure time fields are cleared when isFullDay is true
  useEffect(() => {
    if (isFullDay) {
      form.setValue("startTime", "");
      form.setValue("endTime", "");
    }
  }, [isFullDay, form]);

  // Update start/end time when isFullDay changes
  const handleFullDayChange = (checked: boolean) => {
    if (checked) {
      // Clear times when switching to full day
      form.setValue("startTime", "");
      form.setValue("endTime", "");
    }
    form.setValue("isFullDay", checked);
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      {/* Full Day Toggle */}
      <FormField
        control={form.control}
        name="isFullDay"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Full Day Restriction</FormLabel>
              <p className="text-muted-foreground text-sm">
                Apply restriction for the entire day (no specific time window)
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value || false}
                onCheckedChange={handleFullDayChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Time Range (only shown if not full day) */}
      {!isFullDay && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <DatePicker
                date={field.value ? preserveDate(field.value) : undefined}
                setDate={(date?: Date) => {
                  if (date) {
                    // Ensure selected date doesn't get timezone-shifted
                    field.onChange(preserveDate(date));
                  } else {
                    field.onChange(null);
                  }
                }}
                placeholder="Select start date"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>End Date</FormLabel>
              <DatePicker
                date={field.value ? preserveDate(field.value) : undefined}
                setDate={(date?: Date) => {
                  if (date) {
                    // Ensure selected date doesn't get timezone-shifted
                    field.onChange(preserveDate(date));
                  } else {
                    field.onChange(null);
                  }
                }}
                placeholder="Select end date"
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// Helper function to preserve date without timezone issues
function preserveDate(date: Date | string): Date {
  // If date is a string like "2025-05-05", parse it directly
  if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Split the date string into year, month, day
    const parts = date.split("-").map(Number);
    const year = parts[0] || 2000;
    const month = parts[1] || 1;
    const day = parts[2] || 1;

    // Create date with the correct local date (month is 0-indexed in JS)
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // Otherwise, use the existing date object or parse the string
  const d = new Date(date);

  // Create a new date using local time components to prevent timezone shifts
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    12, // Use noon to avoid any DST issues
    0,
    0,
    0,
  );
}
