"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { Slider } from "~/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Timer, TrendingUp, Clock, AlertTriangle, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateMemberSpeedProfileAction } from "~/server/lottery/member-profiles-actions";
import { formatDistanceToNow } from "date-fns";
import type { MemberSpeedProfileView } from "~/app/types/LotteryTypes";

const speedProfileSchema = z.object({
  speedTier: z.enum(["FAST", "AVERAGE", "SLOW"]),
  adminPriorityAdjustment: z.number().min(-10).max(10),
  manualOverride: z.boolean(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof speedProfileSchema>;

interface SpeedProfileEditDialogProps {
  profile: MemberSpeedProfileView;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SpeedProfileEditDialog({
  profile,
  isOpen,
  onClose,
  onSave,
}: SpeedProfileEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(speedProfileSchema),
    defaultValues: {
      speedTier: profile.speedTier,
      adminPriorityAdjustment: profile.adminPriorityAdjustment,
      manualOverride: profile.manualOverride,
      notes: profile.notes || "",
    },
  });

  const watchedAdminAdjustment = form.watch("adminPriorityAdjustment");
  const watchedManualOverride = form.watch("manualOverride");
  const watchedSpeedTier = form.watch("speedTier");

  const formatPaceTime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const getSpeedTierInfo = (tier: "FAST" | "AVERAGE" | "SLOW") => {
    switch (tier) {
      case "FAST":
        return {
          icon: <TrendingUp className="h-4 w-4" />,
          color: "text-green-700",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          description:
            "≤ 3:55 - Gets priority in morning slots for optimal pace",
        };
      case "AVERAGE":
        return {
          icon: <Timer className="h-4 w-4" />,
          color: "text-yellow-700",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          description: "3:56 - 4:05 - Moderate priority in morning slots",
        };
      case "SLOW":
        return {
          icon: <Clock className="h-4 w-4" />,
          color: "text-gray-700",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          description: "4:06+ - Typically assigned to later time slots",
        };
    }
  };

  const currentTierInfo = getSpeedTierInfo(watchedSpeedTier);

  const handleSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const result = await updateMemberSpeedProfileAction(profile.memberId, {
        speedTier: data.speedTier,
        adminPriorityAdjustment: data.adminPriorityAdjustment,
        manualOverride: data.manualOverride,
        notes: data.notes || null,
      });

      if (result.success) {
        toast.success("Speed profile updated successfully");
        onSave();
      } else {
        toast.error(result.error || "Failed to update speed profile");
      }
    } catch (error) {
      toast.error("An error occurred while updating the speed profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getAutomaticSpeedTier = () => {
    if (!profile.averageMinutes) return "Unknown";
    if (profile.averageMinutes <= 235) return "FAST";
    if (profile.averageMinutes <= 245) return "AVERAGE";
    return "SLOW";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Edit Speed Profile: {profile.memberName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Member Information */}
            <div className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-3 font-medium">Member Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <div className="font-medium">{profile.memberName}</div>
                </div>
                <div>
                  <span className="text-gray-600">Member #:</span>
                  <div className="font-medium">#{profile.memberNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Average Pace:</span>
                  <div className="font-medium">
                    {formatPaceTime(profile.averageMinutes)}
                    {profile.averageMinutes && (
                      <span className="ml-1 text-gray-500">
                        ({profile.averageMinutes} min)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Last Calculated:</span>
                  <div className="font-medium">
                    {profile.lastCalculated
                      ? formatDistanceToNow(profile.lastCalculated, {
                          addSuffix: true,
                        })
                      : "Never"}
                  </div>
                </div>
              </div>
              {profile.averageMinutes && (
                <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-2">
                  <div className="text-xs text-blue-700">
                    <strong>Automatic Classification:</strong>{" "}
                    {getAutomaticSpeedTier()}
                    {!watchedManualOverride && " (Currently Applied)"}
                  </div>
                </div>
              )}
            </div>

            {/* Speed Classification */}
            <FormField
              control={form.control}
              name="speedTier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speed Classification</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select speed tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FAST">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span>Fast (≤ 3:55)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="AVERAGE">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-yellow-600" />
                          <span>Average (3:56 - 4:05)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SLOW">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span>Slow (4:06+)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Speed Tier Information */}
                  <div
                    className={`rounded-lg border p-3 ${currentTierInfo.bgColor} ${currentTierInfo.borderColor}`}
                  >
                    <div
                      className={`flex items-center gap-2 ${currentTierInfo.color} font-medium`}
                    >
                      {currentTierInfo.icon}
                      {watchedSpeedTier} Player
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {currentTierInfo.description}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Manual Override Switch */}
            <FormField
              control={form.control}
              name="manualOverride"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Manual Override</FormLabel>
                    <FormDescription>
                      Lock this classification and prevent automatic updates
                      during monthly recalculation
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

            {/* Admin Priority Adjustment */}
            <FormField
              control={form.control}
              name="adminPriorityAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Admin Priority Adjustment
                  </FormLabel>
                  <FormDescription>
                    Manually adjust lottery priority (-10 to +10 points).
                    Positive values increase priority.
                  </FormDescription>
                  <FormControl>
                    <div className="space-y-3">
                      <Slider
                        min={-10}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-red-600">
                          -10 (Lower Priority)
                        </span>
                        <Badge
                          variant={
                            watchedAdminAdjustment === 0
                              ? "outline"
                              : watchedAdminAdjustment > 0
                                ? "default"
                                : "destructive"
                          }
                        >
                          {watchedAdminAdjustment > 0 ? "+" : ""}
                          {watchedAdminAdjustment} points
                        </Badge>
                        <span className="text-green-600">
                          +10 (Higher Priority)
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormDescription>
                    Record reason for manual adjustments or other relevant
                    information
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Birthday week bonus, hosting important guests, etc."
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
