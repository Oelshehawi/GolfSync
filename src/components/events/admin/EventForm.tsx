"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Form } from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createEvent, updateEvent } from "~/server/events/actions";
import toast from "react-hot-toast";
import { Event, EventType, EventFormProps } from "~/app/types/events";
import { BasicInfoForm } from "./form-sections/BasicInfoForm";
import { EventDetailsForm } from "./form-sections/EventDetailsForm";
import { EventSettingsForm } from "./form-sections/EventSettingsForm";
import { preserveDate } from "~/lib/utils";

// Event types
const EVENT_TYPES = [
  { value: "TOURNAMENT", label: "Tournament" },
  { value: "DINNER", label: "Dinner" },
  { value: "SOCIAL", label: "Social Event" },
  { value: "MEETING", label: "Meeting" },
  { value: "OTHER", label: "Other" },
];

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  eventType: z.string().min(1, "Event type is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  requiresApproval: z.boolean(),
  registrationDeadline: z.date().optional(),
  isActive: z.boolean(),
  // Tournament/event details
  format: z.string().optional(),
  rules: z.string().optional(),
  prizes: z.string().optional(),
  entryFee: z.coerce.number().nonnegative().optional(),
  additionalInfo: z.string().optional(),
});

export type EventFormValues = z.infer<typeof formSchema>;

export function EventForm({ existingEvent, onSuccess }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Define form with explicit typing
  const form = useForm<EventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingEvent?.name || "",
      description: existingEvent?.description || "",
      eventType: existingEvent?.eventType || "TOURNAMENT",
      startDate: existingEvent?.startDate
        ? preserveDate(existingEvent.startDate) || new Date()
        : new Date(),
      endDate: existingEvent?.endDate
        ? preserveDate(existingEvent.endDate) || new Date()
        : new Date(),
      startTime: existingEvent?.startTime || "",
      endTime: existingEvent?.endTime || "",
      location: existingEvent?.location || "",
      capacity: existingEvent?.capacity || undefined,
      requiresApproval: existingEvent?.requiresApproval ?? false,
      registrationDeadline: existingEvent?.registrationDeadline
        ? preserveDate(existingEvent.registrationDeadline)
        : undefined,
      isActive: existingEvent?.isActive ?? true,
      format: existingEvent?.details?.format || "",
      rules: existingEvent?.details?.rules || "",
      prizes: existingEvent?.details?.prizes || "",
      entryFee: existingEvent?.details?.entryFee || undefined,
      additionalInfo: existingEvent?.details?.additionalInfo || "",
    },
  });

  // Watch event type to conditionally render fields
  const watchEventType = form.watch("eventType");

  // Form submission handler
  const onSubmit = form.handleSubmit(async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingEvent) {
        // Update existing event
        const result = await updateEvent(existingEvent.id, data);
        if (result.success) {
          toast.success("Event updated successfully");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(`/admin/events/${existingEvent.id}`);
          }
        } else {
          toast.error(result.error || "Failed to update event");
        }
      } else {
        // Create new event
        const result = await createEvent(data);
        if (result.success) {
          toast.success("Event created successfully");
          form.reset();
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/admin/events");
          }
        } else {
          toast.error(result.error || "Failed to create event");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred while saving the event");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <BasicInfoForm form={form} />
          </TabsContent>

          {/* Event Details Tab */}
          <TabsContent value="details" className="space-y-4 pt-4">
            <EventDetailsForm form={form} watchEventType={watchEventType} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 pt-4">
            <EventSettingsForm form={form} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : existingEvent
                ? "Update Event"
                : "Create Event"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
