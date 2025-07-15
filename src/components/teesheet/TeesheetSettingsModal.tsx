"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Settings, Eye, EyeOff, Dice1, AlertCircle } from "lucide-react";
import {
  updateTeesheetConfigForDate,
  updateLotterySettings,
  updateTeesheetVisibility,
} from "~/server/settings/actions";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import type { TeeSheet, TeesheetConfig } from "~/app/types/TeeSheetTypes";
import type { LotterySettingsType } from "~/server/db/schema";

const settingsSchema = z.object({
  configId: z.number(),
  lotteryEnabled: z.boolean(),
  lotteryDisabledMessage: z.string(),
  isPublic: z.boolean(),
  privateMessage: z.string(),
});

type FormData = z.infer<typeof settingsSchema>;

interface TeesheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teesheet: TeeSheet;
  availableConfigs: TeesheetConfig[];
  lotterySettings: LotterySettingsType | null;
  onSuccess?: () => void;
}

export function TeesheetSettingsModal({
  isOpen,
  onClose,
  teesheet,
  availableConfigs,
  lotterySettings,
  onSuccess,
}: TeesheetSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [configChanged, setConfigChanged] = useState(false);
  const [showConfigConfirmation, setShowConfigConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      configId: teesheet.configId,
      lotteryEnabled: lotterySettings?.enabled ?? true,
      lotteryDisabledMessage:
        lotterySettings?.disabledMessage ||
        "Lottery signup is disabled for this date",
      isPublic: teesheet.isPublic || false,
      privateMessage:
        teesheet.privateMessage ||
        "This teesheet is not yet available for booking.",
    },
  });

  // Reset form when teesheet changes (fix for date switching issue)
  useEffect(() => {
    form.reset({
      configId: teesheet.configId,
      lotteryEnabled: lotterySettings?.enabled ?? true,
      lotteryDisabledMessage:
        lotterySettings?.disabledMessage ||
        "Lottery signup is disabled for this date",
      isPublic: teesheet.isPublic || false,
      privateMessage:
        teesheet.privateMessage ||
        "This teesheet is not yet available for booking.",
    });
  }, [
    teesheet.id,
    teesheet.configId,
    teesheet.isPublic,
    teesheet.privateMessage,
    lotterySettings,
    form,
  ]);

  // Watch for config changes
  const watchedConfigId = form.watch("configId");
  useEffect(() => {
    setConfigChanged(watchedConfigId !== teesheet.configId);
  }, [watchedConfigId, teesheet.configId]);

  const onSubmit = async (data: FormData) => {
    // Check if configuration is changed and show confirmation
    if (data.configId !== teesheet.configId) {
      setPendingFormData(data);
      setShowConfigConfirmation(true);
      return;
    }

    // If no config change, proceed directly
    await handleFormSubmit(data);
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const promises = [];

      // Update configuration if changed
      if (data.configId !== teesheet.configId) {
        promises.push(updateTeesheetConfigForDate(teesheet.id, data.configId));
      }

      // Update lottery settings
      promises.push(
        updateLotterySettings(teesheet.id, {
          enabled: data.lotteryEnabled,
          disabledMessage: data.lotteryDisabledMessage,
        }),
      );

      // Update visibility settings
      promises.push(
        updateTeesheetVisibility(
          teesheet.id,
          data.isPublic,
          data.privateMessage,
        ),
      );

      const results = await Promise.all(promises);

      // Check if any operation failed
      const hasFailure = results.some((result) => !result.success);

      if (hasFailure) {
        const failedResults = results.filter((result) => !result.success);
        toast.error(
          failedResults[0]?.error || "Some settings failed to update",
        );
        return;
      }

      toast.success("Teesheet settings updated successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating teesheet settings:", error);
      toast.error("Failed to update teesheet settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmConfigChange = async () => {
    if (!pendingFormData) return;

    setShowConfigConfirmation(false);
    await handleFormSubmit(pendingFormData);
    setPendingFormData(null);
  };

  const handleCancelConfigChange = () => {
    setShowConfigConfirmation(false);
    setPendingFormData(null);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Teesheet Settings
          </DialogTitle>
          <DialogDescription>
            Configure teesheet settings for {teesheet.date}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="configuration" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="lottery">Lottery</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
              </TabsList>

              <TabsContent value="configuration" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <h3 className="font-semibold">Configuration</h3>
                </div>

                <FormField
                  control={form.control}
                  name="configId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teesheet Configuration</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select configuration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableConfigs.map((config) => (
                            <SelectItem
                              key={config.id}
                              value={config.id.toString()}
                            >
                              {config.name}
                              {config.id === teesheet.configId && " (Current)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the configuration template for this teesheet
                      </FormDescription>
                      {configChanged && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          Changing configuration will remove all existing
                          bookings
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="lottery" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Dice1 className="h-4 w-4" />
                  <h3 className="font-semibold">Lottery Settings</h3>
                </div>

                <FormField
                  control={form.control}
                  name="lotteryEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enable Lottery
                        </FormLabel>
                        <FormDescription>
                          Allow members to submit lottery entries for this date
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

                <FormField
                  control={form.control}
                  name="lotteryDisabledMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disabled Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Message shown to members when lottery is disabled"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be shown to members when lottery is
                        disabled
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="visibility" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <h3 className="font-semibold">Visibility Settings</h3>
                </div>

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Public Teesheet
                        </FormLabel>
                        <FormDescription>
                          Make this teesheet visible to members for booking
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

                <FormField
                  control={form.control}
                  name="privateMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Private Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Message shown to members when teesheet is private"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be shown to members when the teesheet
                        is private
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {/* Configuration Change Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfigConfirmation}
        onOpenChange={(open) => {
          if (!open) handleCancelConfigChange();
          setShowConfigConfirmation(open);
        }}
        onConfirm={handleConfirmConfigChange}
        title="Change Teesheet Configuration"
        description="Changing the configuration will remove all existing bookings and lottery entries from this teesheet. Are you sure you want to continue?"
        confirmText="Change Configuration"
        cancelText="Cancel"
        variant="destructive"
        loading={isLoading}
      />
    </Dialog>
  );
}
