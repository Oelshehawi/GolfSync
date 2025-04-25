"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  SearchableSelect,
  OptionType,
} from "~/components/ui/searchable-select";
import { Switch } from "~/components/ui/switch";
import {
  RestrictionFormValues,
  restrictionFormSchema,
  RestrictedEntityType,
  RestrictionType,
  Restriction,
} from "~/app/types/RestrictionTypes";
import { MultiSelect } from "~/components/ui/multi-select";

interface RestrictionFormProps {
  onSubmit: (values: RestrictionFormValues) => Promise<void>;
  onCancel: () => void;
  initialValues?: Restriction;
  memberClasses?: string[];
  isSubmitting?: boolean;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function RestrictionForm({
  onSubmit,
  onCancel,
  initialValues,
  memberClasses = [],
  isSubmitting = false,
  theme,
}: RestrictionFormProps) {
  const [restrictionType, setRestrictionType] = useState<RestrictionType>(
    initialValues?.restrictionType || RestrictionType.TIME,
  );
  const [entityType, setEntityType] = useState<RestrictedEntityType>(
    initialValues?.entityType || RestrictedEntityType.CLASS,
  );

  // Convert member classes to options format
  const memberClassOptions: OptionType[] = memberClasses.map((cls) => ({
    value: cls,
    label: cls,
  }));

  const form = useForm<RestrictionFormValues>({
    resolver: zodResolver(restrictionFormSchema),
    defaultValues: initialValues
      ? {
          ...initialValues,
          daysOfWeek:
            initialValues.restrictionType === RestrictionType.TIME
              ? (initialValues as any).daysOfWeek
              : [],
          maxCount:
            initialValues.restrictionType === RestrictionType.FREQUENCY
              ? (initialValues as any).maxCount
              : undefined,
          periodDays:
            initialValues.restrictionType === RestrictionType.FREQUENCY
              ? (initialValues as any).periodDays
              : undefined,
          applyCharge:
            initialValues.restrictionType === RestrictionType.FREQUENCY
              ? (initialValues as any).applyCharge
              : false,
          chargeAmount:
            initialValues.restrictionType === RestrictionType.FREQUENCY
              ? (initialValues as any).chargeAmount
              : undefined,
        }
      : {
          name: "",
          description: "",
          entityType: RestrictedEntityType.CLASS,
          entityId: null,
          restrictionType: RestrictionType.TIME,
          isActive: true,
          startTime: "00:00",
          endTime: "23:59",
          daysOfWeek: [],
        },
  });

  const handleSubmit = async (values: RestrictionFormValues) => {
    await onSubmit(values);
  };

  // Update form when restriction type changes
  useEffect(() => {
    const currentValues = form.getValues();
    form.setValue("restrictionType", restrictionType);
    setRestrictionType(restrictionType);
  }, [restrictionType, form]);

  // Update form when entity type changes
  useEffect(() => {
    form.setValue("entityType", entityType);
    form.setValue("entityId", null);
    setEntityType(entityType);
  }, [entityType, form]);

  const daysOfWeekOptions = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restriction Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Junior Time Restriction"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the purpose of this restriction"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="entityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apply To</FormLabel>
                  <Select
                    onValueChange={(value: RestrictedEntityType) => {
                      field.onChange(value);
                      setEntityType(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger theme={theme}>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent theme={theme}>
                      <SelectItem value={RestrictedEntityType.CLASS}>
                        Member Class
                      </SelectItem>
                      <SelectItem value={RestrictedEntityType.GUEST}>
                        Guests
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {entityType === RestrictedEntityType.CLASS && (
              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Class</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={memberClassOptions}
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        placeholder="Select or search member class"
                        theme={theme}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to apply to all classes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="restrictionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Restriction Type</FormLabel>
                <Select
                  onValueChange={(value: RestrictionType) => {
                    field.onChange(value);
                    setRestrictionType(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger theme={theme}>
                      <SelectValue placeholder="Select restriction type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent theme={theme}>
                    <SelectItem value={RestrictionType.TIME}>
                      Time Restriction
                    </SelectItem>
                    <SelectItem value={RestrictionType.FREQUENCY}>
                      Frequency Restriction
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Enable or disable this restriction
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Time Restriction Settings */}
        {restrictionType === RestrictionType.TIME && (
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Time Restriction Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
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
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="daysOfWeek"
              render={({ field }) => {
                // Convert number array to string array for the component
                const stringValues = field.value ? field.value.map(String) : [];

                return (
                  <FormItem className="mt-2">
                    <FormLabel>Days of Week</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={daysOfWeekOptions}
                        selected={stringValues}
                        onChange={(selected) => {
                          // Convert back to number array for the form
                          const numericValues = selected.map(Number);
                          field.onChange(numericValues);
                        }}
                        placeholder="Select days when this restriction applies"
                        theme={theme}
                        className="rounded-md border"
                      />
                    </FormControl>
                    <FormDescription className="mt-1">
                      The days when this time restriction is active
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        )}

        {/* Frequency Restriction Settings */}
        {restrictionType === RestrictionType.FREQUENCY && (
          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">
              Frequency Restriction Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Bookings</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : "",
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of bookings allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : "",
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days in the restriction period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applyCharge"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Apply Surcharge</FormLabel>
                    <FormDescription>
                      Charge a fee for exceeding the booking limit
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("applyCharge") && (
              <FormField
                control={form.control}
                name="chargeAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : "",
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Restriction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
