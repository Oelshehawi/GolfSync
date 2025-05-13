"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { TimeblockRestriction } from "./TimeblockRestrictionsSettings";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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

// Define the form schema based on the TimeblockRestriction type
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  restrictionCategory: z.enum(["MEMBER_CLASS", "GUEST", "COURSE_AVAILABILITY"]),
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
  chargeAmount: z.coerce.number().optional().nullable(),

  // Course availability fields
  isFullDay: z.boolean().default(false),
});

export type TimeblockRestrictionFormValues = z.infer<typeof formSchema>;

interface TimeblockRestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingRestriction?: TimeblockRestriction;
  memberClasses?: string[];
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

  // Convert memberClasses to options for MultiSelect
  const memberClassOptions: OptionType[] = memberClasses.map((className) => ({
    value: className,
    label: className,
  }));

  // Determine default restriction type based on category
  const getDefaultRestrictionType = () => {
    if (restrictionCategory === "COURSE_AVAILABILITY") return "AVAILABILITY";
    return "TIME"; // Default for MEMBER_CLASS and GUEST
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
        restrictionCategory: existingRestriction.restrictionCategory as
          | "MEMBER_CLASS"
          | "GUEST"
          | "COURSE_AVAILABILITY",
        restrictionType: existingRestriction.restrictionType as
          | "TIME"
          | "FREQUENCY"
          | "AVAILABILITY",
        memberClasses: existingRestriction.memberClasses || [],
        isActive: existingRestriction.isActive ?? true,
        priority: existingRestriction.priority ?? 0,
        canOverride: existingRestriction.canOverride ?? true,
        startTime: existingRestriction.startTime || "",
        endTime: existingRestriction.endTime || "",
        daysOfWeek: existingRestriction.daysOfWeek || [],
        startDate: existingRestriction.startDate || null,
        endDate: existingRestriction.endDate || null,
        maxCount: existingRestriction.maxCount ?? null,
        periodDays: existingRestriction.periodDays ?? null,
        applyCharge: existingRestriction.applyCharge ?? false,
        chargeAmount: existingRestriction.chargeAmount ?? null,
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
            ? [memberClasses[0] || ""]
            : [],
        isActive: true,
        priority: 0,
        canOverride: true,
        daysOfWeek: [],
        applyCharge: false,
        isFullDay: false,
        startTime: "",
        endTime: "",
        startDate: null,
        endDate: null,
        maxCount: null,
        periodDays: null,
        chargeAmount: null,
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
      form.reset(defaultValues);
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
        formData.startTime = "";
        formData.endTime = "";
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
        onSuccess(result as TimeblockRestriction);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while saving the restriction");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced direct handler to ensure form validation and submission work
  const handleSubmitClick = () => {
    setSubmitAttempts((prev) => prev + 1);

    try {
      // Manually trigger form validation first
      const isValid = form.trigger();

      // Use Promise.resolve to handle both synchronous and asynchronous validation
      Promise.resolve(isValid).then((valid) => {
        if (valid) {
          // If form is valid, get values and call onSubmit directly
          const values = form.getValues();
          onSubmit(values);
        } else {
          // Show error toast if validation fails
          toast.error("Please fix form errors before submitting");
        }
      });
    } catch (e) {
      console.error("Error in handleSubmitClick:", e);
      toast.error("Error submitting form");
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="max-h-[90vh] max-w-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingRestriction ? "Edit Restriction" : "Add New Restriction"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restriction Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name" {...field} />
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
                        placeholder="Enter a description that will be shown to members"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member Class selection for MEMBER_CLASS type only */}
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
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Restriction Type - Not shown for COURSE_AVAILABILITY */}
              {restrictionCategory !== "COURSE_AVAILABILITY" && (
                <FormField
                  control={form.control}
                  name="restrictionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restriction Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a restriction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TIME">Time-based</SelectItem>
                          <SelectItem value="FREQUENCY">
                            Frequency-based
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Status and Priority */}
              <div className="flex flex-row gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canOverride"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-y-0 space-x-3 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Override</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type-specific fields */}
            {(restrictionCategory === "MEMBER_CLASS" ||
              restrictionCategory === "GUEST") && (
              <>
                {watchRestrictionType === "TIME" && (
                  <TimeRestrictionFields form={form as any} />
                )}

                {watchRestrictionType === "FREQUENCY" && (
                  <FrequencyRestrictionFields form={form as any} />
                )}
              </>
            )}

            {/* Course Availability Fields */}
            {restrictionCategory === "COURSE_AVAILABILITY" && (
              <AvailabilityRestrictionFields form={form as any} />
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitClick}
              >
                {isSubmitting
                  ? "Saving..."
                  : existingRestriction
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
