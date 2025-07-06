"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { useState, useEffect } from "react";

interface FrequencyRestrictionFieldsProps {
  form: UseFormReturn<any>;
}

export function FrequencyRestrictionFields({
  form,
}: FrequencyRestrictionFieldsProps) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <h3 className="text-lg font-medium">Frequency Settings</h3>

      {/* Maximum Count */}
      <FormField
        control={form.control}
        name="maxCount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Count</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g. 3"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Period Days */}
      <FormField
        control={form.control}
        name="periodDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period (Days)</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="e.g. 7"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Apply Charge */}
      <FormField
        control={form.control}
        name="applyCharge"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Apply Charge for Exceeding Limit</FormLabel>
            </div>
          </FormItem>
        )}
      />

      {/* Charge Amount (only shown if Apply Charge is checked) */}
      {form.watch("applyCharge") && (
        <FormField
          control={form.control}
          name="chargeAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Charge Amount</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. 25.00 or 30% of green fee"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
