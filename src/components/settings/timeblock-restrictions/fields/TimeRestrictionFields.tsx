"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { DatePicker } from "~/components/ui/date-picker";
import { TimeblockRestrictionFormValues } from "../TimeblockRestrictionDialog";
import { preserveDate } from "~/lib/utils";

interface TimeRestrictionFieldsProps {
  form: UseFormReturn<TimeblockRestrictionFormValues>;
}

const daysOfWeek = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export function TimeRestrictionFields({ form }: TimeRestrictionFieldsProps) {
  // Get current values for conditional rendering
  const daysOfWeekValue = form.watch("daysOfWeek") || [];

  return (
    <div className="space-y-4 rounded-md border p-4">
      <h3 className="text-lg font-medium">Time-based Settings</h3>

      {/* Time Range */}
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

      {/* Days of Week */}
      <div className="space-y-3">
        <FormLabel>Days of Week</FormLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {daysOfWeek.map((day) => (
            <FormField
              key={day.value}
              control={form.control}
              name="daysOfWeek"
              render={({ field }) => (
                <FormItem className="flex items-center space-y-0 space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...daysOfWeekValue, day.value]);
                        } else {
                          field.onChange(
                            daysOfWeekValue.filter(
                              (value: number) => value !== day.value,
                            ),
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer font-normal">
                    {day.label}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <FormMessage />
      </div>

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
