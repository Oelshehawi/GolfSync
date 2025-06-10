"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { TimeBlockTemplate } from "~/app/types/TeeSheetTypes";
import { toast } from "react-hot-toast";

interface TimeBlockTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<TimeBlockTemplate, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  template?: TimeBlockTemplate;
  configId: number;
}

interface FormValues {
  name: string;
  startTime: string;
  endTime: string;
  displayName: string;
  maxMembers: number;
}

export function TimeBlockTemplateEditor({
  isOpen,
  onClose,
  onSave,
  template,
  configId,
}: TimeBlockTemplateEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: template
      ? {
          name: template.name,
          startTime: template.startTime,
          endTime: template.endTime,
          displayName: template.displayName || "",
          maxMembers: template.maxMembers,
        }
      : {
          name: "",
          startTime: "09:00",
          endTime: "09:10",
          displayName: "",
          maxMembers: 4,
        },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      await onSave({
        ...data,
        configId,
        sortOrder: template?.sortOrder ?? 0,
        displayName: data.displayName || data.name,
      });
      toast.success(template ? "Template updated" : "Template created");
      onClose();
    } catch (error) {
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                {...register("startTime", {
                  required: "Start time is required",
                })}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                {...register("endTime", { required: "End time is required" })}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name{" "}
                <span className="text-gray-500">
                  (optional - defaults to template name)
                </span>
              </Label>
              <Input
                id="displayName"
                {...register("displayName")}
                placeholder="e.g., Hole 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Players</Label>
              <Input
                id="maxMembers"
                type="number"
                min={1}
                max={8}
                {...register("maxMembers", {
                  required: "Max players is required",
                  valueAsNumber: true,
                  validate: (value) => {
                    if (isNaN(value)) return "Please enter a valid number";
                    if (value < 1) return "Minimum players is 1";
                    if (value > 8) return "Maximum players is 8";
                    return true;
                  },
                })}
              />
              {errors.maxMembers && (
                <p className="text-sm text-red-500">
                  {errors.maxMembers.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
