"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { type TimeblockRestriction } from "./TimeblockRestrictionsSettings";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
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
import { Switch } from "~/components/ui/switch";
import { TimeRestrictionFields } from "./fields/TimeRestrictionFields";
import { FrequencyRestrictionFields } from "./fields/FrequencyRestrictionFields";
import { AvailabilityRestrictionFields } from "./fields/AvailabilityRestrictionFields";
import {
  createTimeblockRestriction,
  updateTimeblockRestriction,
} from "~/server/timeblock-restrictions/actions";
import toast from "react-hot-toast";
import { preserveDate } from "~/lib/utils";
import { MultiSelect, type OptionType } from "~/components/ui/multi-select";
import type { MemberClass } from "~/server/db/schema";

// Define the form schema based on the TimeblockRestriction type
const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullable().optional(),
    restrictionCategory: z.enum([
      "MEMBER_CLASS",
      "GUEST",
      "COURSE_AVAILABILITY",
    ]),
    restrictionType: z.enum(["TIME", "FREQUENCY", "AVAILABILITY"]),
    memberClasses: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    priority: z.coerce.number().default(0),
    canOverride: z.boolean().default(true),

    // Time restriction fields
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    daysOfWeek: z.array(z.number()).default([]),

    // Date range fields
    startDate: z
      .union([z.date(), z.null(), z.string(), z.undefined()])
      .optional()
      .nullable(),
    endDate: z
      .union([z.date(), z.null(), z.string(), z.undefined()])
      .optional()
      .nullable(),

    // Frequency restriction fields
    maxCount: z.coerce.number().optional().nullable(),
    periodDays: z.coerce.number().optional().nullable(),
    applyCharge: z.boolean().default(false),
    chargeAmount: z.string().optional().nullable(),

    // Course availability fields
    isFullDay: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // TIME restrictions require start time, end time, and days
      if (
        data.restrictionType === "TIME" &&
        data.restrictionCategory !== "COURSE_AVAILABILITY"
      ) {
        return (
          data.startTime &&
          data.startTime.trim() !== "" &&
          data.endTime &&
          data.endTime.trim() !== "" &&
          data.daysOfWeek &&
          data.daysOfWeek.length > 0
        );
      }
      return true;
    },
    {
      message:
        "TIME restrictions require start time, end time, and days of week",
      path: ["startTime"],
    },
  )
  .refine(
    (data) => {
      // FREQUENCY restrictions require max count and period days
      if (data.restrictionType === "FREQUENCY") {
        return (
          data.maxCount &&
          data.maxCount > 0 &&
          data.periodDays &&
          data.periodDays > 0
        );
      }
      return true;
    },
    {
      message: "FREQUENCY restrictions require max count and period days",
      path: ["maxCount"],
    },
  )
  .refine(
    (data) => {
      // COURSE_AVAILABILITY restrictions require date range
      if (data.restrictionCategory === "COURSE_AVAILABILITY") {
        return data.startDate && data.endDate;
      }
      return true;
    },
    {
      message: "Course availability restrictions require start and end dates",
      path: ["startDate"],
    },
  );

export type TimeblockRestrictionFormValues = z.infer<typeof formSchema>;

interface TimeblockRestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingRestriction?: TimeblockRestriction;
  memberClasses?: MemberClass[];
  restrictionCategory: "MEMBER_CLASS" | "GUEST" | "COURSE_AVAILABILITY";
  onSuccess: (restriction: TimeblockRestriction) => void;
}

export function TimeblockRestrictionDialog({
  isOpen,
  onClose,
  existingRestriction,
  memberClasses = [],
  restrictionCategory,
  onSuccess,
}: TimeblockRestrictionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track if the dialog was previously open to prevent reset loops
  const [wasOpen, setWasOpen] = useState(false);
  // Add state to track submission attempts for debugging
  const [submitAttempts, setSubmitAttempts] = useState(0);

  // Convert member classes to options for MultiSelect
  const memberClassOptions = memberClasses.map((mc) => ({
    label: mc.label,
    value: mc.label,
  }));

  // Determine default restriction type based on category
  const getDefaultRestrictionType = () => {
    if (restrictionCategory === "COURSE_AVAILABILITY") return "AVAILABILITY";
    if (restrictionCategory === "GUEST") return "TIME";
    return "TIME"; // Default for MEMBER_CLASS
  };

  // Get default values based on existing restriction or create new ones
  const getDefaultValues = () => {
    if (existingRestriction) {
      // Determine if it's a full day restriction based on start/end time
      const isFullDay =
        existingRestriction.isFullDay ??
        (!existingRestriction.startTime && !existingRestriction.endTime);

      // Ensure values are properly formatted
      const defaultValues = {
        name: existingRestriction.name || "",
        description: existingRestriction.description || "",
        restrictionCategory: existingRestriction.restrictionCategory,
        restrictionType: existingRestriction.restrictionType,
        memberClasses: Array.isArray(existingRestriction.memberClasses)
          ? existingRestriction.memberClasses.filter(
              (mc) => typeof mc === "string",
            )
          : [],
        isActive: existingRestriction.isActive ?? true,
        priority: existingRestriction.priority ?? 0,
        canOverride: existingRestriction.canOverride ?? true,
        startTime: existingRestriction.startTime || "06:00",
        endTime: existingRestriction.endTime || "18:00",
        daysOfWeek: existingRestriction.daysOfWeek || [],
        startDate: existingRestriction.startDate || null,
        endDate: existingRestriction.endDate || null,
        maxCount: existingRestriction.maxCount ?? null,
        periodDays: existingRestriction.periodDays ?? null,
        applyCharge: existingRestriction.applyCharge ?? false,
        chargeAmount: existingRestriction.chargeAmount
          ? String(existingRestriction.chargeAmount)
          : "",
        isFullDay: isFullDay,
      };

      return defaultValues;
    } else {
      const defaultValues = {
        name: "",
        description: "",
        restrictionCategory,
        restrictionType: getDefaultRestrictionType() as
          | "TIME"
          | "FREQUENCY"
          | "AVAILABILITY",
        memberClasses:
          restrictionCategory === "MEMBER_CLASS"
            ? [memberClasses[0]?.label || ""]
            : [],
        isActive: true,
        priority: 0,
        canOverride: true,
        daysOfWeek: [],
        applyCharge: false,
        isFullDay: false,
        startTime: "06:00",
        endTime: "18:00",
        startDate: null,
        endDate: null,
        maxCount: null,
        periodDays: null,
        chargeAmount: "",
      };

      return defaultValues;
    }
  };

  // Setup form with default values
  const form = useForm<TimeblockRestrictionFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: getDefaultValues(),
  });

  // Watch restriction type for conditional rendering
  const watchRestrictionType = form.watch("restrictionType");

  // Reset form when dialog opens/closes or restriction changes
  useEffect(() => {
    // Only reset the form when opening the dialog, not closing it
    if (isOpen && !wasOpen) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues as any);
      setWasOpen(true);
    } else if (!isOpen && wasOpen) {
      setWasOpen(false);
    }
  }, [
    isOpen,
    existingRestriction,
    restrictionCategory,
    memberClasses,
    form,
    wasOpen,
  ]);

  // Submit handler
  const onSubmit = async (values: TimeblockRestrictionFormValues) => {
    setIsSubmitting(true);

    try {
      // Prepare the form data
      const formData = { ...values };

      // Handle isFullDay logic: if true, clear time fields
      if (formData.isFullDay) {
        formData.startTime = "06:00";
        formData.endTime = "18:00";
      }

      // Handle dates properly using the preserveDate function
      if (formData.startDate) {
        formData.startDate = preserveDate(formData.startDate);
      } else {
        formData.startDate = null;
      }

      if (formData.endDate) {
        formData.endDate = preserveDate(formData.endDate);
      } else {
        formData.endDate = null;
      }

      // Call the appropriate server action
      let result;
      if (existingRestriction) {
        result = await updateTimeblockRestriction({
          id: existingRestriction.id,
          ...formData,
        });
      } else {
        result = await createTimeblockRestriction(formData);
      }

      if (result && "error" in result) {
        toast.error(result.error || "Unknown error occurred");
        return;
      }

      // Show success message
      toast.success(
        existingRestriction
          ? "Restriction updated successfully"
          : "Restriction created successfully",
      );

      // Call onSuccess with the created/updated restriction
      if (result) {
        onSuccess(result as unknown as TimeblockRestriction);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while saving the restriction");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    setSubmitAttempts((prev) => prev + 1);
    form.handleSubmit(onSubmit)();
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      // Reset submit attempts when closing
      setSubmitAttempts(0);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingRestriction
              ? "Edit Timeblock Restriction"
              : "Create Timeblock Restriction"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter restriction name" {...field} />
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
                        placeholder="Enter restriction description"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Restriction Type */}
            <FormField
              control={form.control}
              name="restrictionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restriction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select restriction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TIME">Time Restriction</SelectItem>
                      <SelectItem value="FREQUENCY">
                        Frequency Restriction
                      </SelectItem>
                      {restrictionCategory === "COURSE_AVAILABILITY" && (
                        <SelectItem value="AVAILABILITY">
                          Course Availability
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Classes (only for MEMBER_CLASS category) */}
            {restrictionCategory === "MEMBER_CLASS" && (
              <FormField
                control={form.control}
                name="memberClasses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Classes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={memberClassOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Select member classes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Restriction Type-specific Fields */}
            {watchRestrictionType === "TIME" && (
              <TimeRestrictionFields
                form={form}
                restrictionCategory={restrictionCategory}
              />
            )}

            {watchRestrictionType === "FREQUENCY" && (
              <FrequencyRestrictionFields form={form} />
            )}

            {watchRestrictionType === "AVAILABILITY" && (
              <AvailabilityRestrictionFields form={form} />
            )}

            {/* Settings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-muted-foreground text-sm">
                        Enable this restriction
                      </div>
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

              <FormField
                control={form.control}
                name="canOverride"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Can Override</FormLabel>
                      <div className="text-muted-foreground text-sm">
                        Allow admin override
                      </div>
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

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onClose()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : existingRestriction
                    ? "Update Restriction"
                    : "Create Restriction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
