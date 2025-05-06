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

// Define the form schema based on the TimeblockRestriction type
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  restrictionCategory: z.enum(["MEMBER_CLASS", "GUEST", "COURSE_AVAILABILITY"]),
  restrictionType: z.enum(["TIME", "FREQUENCY", "AVAILABILITY"]),
  memberClass: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  canOverride: z.boolean().default(true),

  // Time restriction fields
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  daysOfWeek: z.array(z.number()).default([]),

  // Date range fields
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),

  // Frequency restriction fields
  maxCount: z.number().optional(),
  periodDays: z.number().optional(),
  applyCharge: z.boolean().default(false),
  chargeAmount: z.number().optional(),

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

      return {
        name: existingRestriction.name,
        description: existingRestriction.description,
        restrictionCategory: existingRestriction.restrictionCategory as
          | "MEMBER_CLASS"
          | "GUEST"
          | "COURSE_AVAILABILITY",
        restrictionType: existingRestriction.restrictionType as
          | "TIME"
          | "FREQUENCY"
          | "AVAILABILITY",
        memberClass: existingRestriction.memberClass,
        isActive: existingRestriction.isActive ?? true,
        priority: existingRestriction.priority ?? 0,
        canOverride: existingRestriction.canOverride ?? true,
        startTime: existingRestriction.startTime,
        endTime: existingRestriction.endTime,
        daysOfWeek: existingRestriction.daysOfWeek || [],
        startDate: existingRestriction.startDate,
        endDate: existingRestriction.endDate,
        maxCount: existingRestriction.maxCount,
        periodDays: existingRestriction.periodDays,
        applyCharge: existingRestriction.applyCharge ?? false,
        chargeAmount: existingRestriction.chargeAmount,
        isFullDay: isFullDay,
      };
    } else {
      return {
        name: "",
        description: "",
        restrictionCategory,
        restrictionType: getDefaultRestrictionType() as
          | "TIME"
          | "FREQUENCY"
          | "AVAILABILITY",
        memberClass:
          restrictionCategory === "MEMBER_CLASS"
            ? memberClasses[0] || ""
            : undefined,
        isActive: true,
        priority: 0,
        canOverride: true,
        daysOfWeek: [],
        applyCharge: false,
        isFullDay: false,
      };
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
      form.reset(getDefaultValues());
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

      // Ensure dates are properly formatted
      if (formData.startDate) {
        // Make sure we're using the date without time zone issues
        const startDate = new Date(formData.startDate);
        formData.startDate = startDate;
      }

      if (formData.endDate) {
        // Make sure we're using the date without time zone issues
        const endDate = new Date(formData.endDate);
        formData.endDate = endDate;
      }

      // Call the appropriate server action
      const result = existingRestriction
        ? await updateTimeblockRestriction({
            id: existingRestriction.id,
            ...formData,
          })
        : await createTimeblockRestriction(formData);

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="memberClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a member class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {memberClasses.map((className) => (
                            <SelectItem key={className} value={className}>
                              {className}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                type="submit"
                disabled={isSubmitting}
           
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
