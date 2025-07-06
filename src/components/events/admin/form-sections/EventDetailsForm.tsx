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
import { Textarea } from "~/components/ui/textarea";
import { type EventFormValues } from "../EventForm";

interface EventDetailsFormProps {
  form: UseFormReturn<EventFormValues>;
  watchEventType: string;
}

export function EventDetailsForm({
  form,
  watchEventType,
}: EventDetailsFormProps) {
  return (
    <>
      {watchEventType === "TOURNAMENT" && (
        <>
          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Format</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Scramble, Stroke Play"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Rules</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter tournament rules"
                    className="min-h-24"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prizes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prizes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter prize information"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      <FormField
        control={form.control}
        name="entryFee"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Entry Fee</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="additionalInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Information</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any other information"
                className="min-h-24"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
