"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Calendar, Plus, Shield } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TeesheetConfigDialog } from "./TeesheetConfigDialog";
import type {
  TeesheetConfig,
  TeesheetConfigInput,
  RegularConfig,
  Template,
  CustomConfig,
} from "~/app/types/TeeSheetTypes";
import { ConfigTypes } from "~/app/types/TeeSheetTypes";
import {
  createTeesheetConfig,
  updateTeesheetConfig,
  deleteTeesheetConfig,
} from "~/server/settings/actions";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Badge } from "~/components/ui/badge";
import { formatTimeStringTo12Hour } from "~/lib/utils";
import { DeleteConfirmationDialog } from "~/components/ui/delete-confirmation-dialog";

interface TeesheetSettingsProps {
  initialConfigs: TeesheetConfig[];
  templates: Template[];
}

export function TeesheetSettings({
  initialConfigs,
  templates,
}: TeesheetSettingsProps) {
  const [configs, setConfigs] = useState<TeesheetConfig[]>(initialConfigs);
  const [selectedConfig, setSelectedConfig] = useState<
    TeesheetConfig | undefined
  >(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<
    TeesheetConfig | undefined
  >(undefined);

  const handleCloseDialog = () => {
    setSelectedConfig(undefined);
    setIsDialogOpen(false);
  };

  const handleOpenDialog = (config?: TeesheetConfig) => {
    setSelectedConfig(config);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await deleteTeesheetConfig(configToDelete.id);
      setConfigs(configs.filter((c) => c.id !== configToDelete.id));
      toast.success("Configuration deleted successfully");
      setIsDeleteDialogOpen(false);
      setConfigToDelete(undefined);
    } catch (error) {
      toast.error("Failed to delete configuration");
      console.error(error);
    }
  };

  const handleSaveConfig = async (configInput: TeesheetConfigInput) => {
    try {
      if (selectedConfig) {
        // Update existing config
        const result = await updateTeesheetConfig(
          selectedConfig.id,
          configInput,
        );
        if (result.success && result.data) {
          // Keep the existing rules if no new rules are provided
          const rules = configInput.rules
            ? configInput.rules.map((rule) => ({
                ...rule,
                id: 0, // New rules will get IDs from the database
                clerkOrgId: selectedConfig.clerkOrgId,
                configId: selectedConfig.id,
                createdAt: new Date(),
                updatedAt: null,
                startDate: rule.startDate ? new Date(rule.startDate) : null,
                endDate: rule.endDate ? new Date(rule.endDate) : null,
              }))
            : selectedConfig.rules;

          const baseConfig = {
            ...result.data,
            rules,
            type: configInput.type,
          };

          const updatedConfig =
            configInput.type === ConfigTypes.REGULAR
              ? ({
                  ...baseConfig,
                  type: ConfigTypes.REGULAR,
                  startTime: configInput.startTime!,
                  endTime: configInput.endTime!,
                  interval: configInput.interval!,
                  maxMembersPerBlock: configInput.maxMembersPerBlock!,
                } as RegularConfig)
              : ({
                  ...baseConfig,
                  type: ConfigTypes.CUSTOM,
                  templateId: configInput.templateId!,
                } as CustomConfig);

          const updatedConfigs = configs.map((c) =>
            c.id === selectedConfig.id ? updatedConfig : c,
          );
          setConfigs(updatedConfigs);
          toast.success("Configuration updated successfully");
        } else {
          toast.error(result.error || "Failed to update configuration");
        }
      } else {
        // Create new config logic
        if (configInput.type === ConfigTypes.REGULAR) {
          if (
            !configInput.startTime ||
            !configInput.endTime ||
            !configInput.interval ||
            !configInput.maxMembersPerBlock
          ) {
            toast.error("Missing required fields for regular configuration");
            return;
          }
        }

        const result = await createTeesheetConfig(configInput);
        if (result.success && result.data) {
          // Convert input rules to full TeesheetConfigRule format
          const rules = configInput.rules
            ? configInput.rules.map((rule) => ({
                ...rule,
                id: 0,
                clerkOrgId: result.data.clerkOrgId,
                configId: result.data.id,
                createdAt: new Date(),
                updatedAt: null,
                startDate: rule.startDate ? new Date(rule.startDate) : null,
                endDate: rule.endDate ? new Date(rule.endDate) : null,
              }))
            : [];

          const baseConfig = {
            ...result.data,
            rules,
            type: configInput.type,
          };

          const newConfig =
            configInput.type === ConfigTypes.REGULAR
              ? ({
                  ...baseConfig,
                  type: ConfigTypes.REGULAR,
                  startTime: configInput.startTime!,
                  endTime: configInput.endTime!,
                  interval: configInput.interval!,
                  maxMembersPerBlock: configInput.maxMembersPerBlock!,
                } as RegularConfig)
              : ({
                  ...baseConfig,
                  type: ConfigTypes.CUSTOM,
                  templateId: configInput.templateId!,
                } as CustomConfig);

          setConfigs([...configs, newConfig]);
          toast.success("Configuration created successfully");
        } else {
          toast.error(result.error || "Failed to create configuration");
        }
      }
      handleCloseDialog();
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Teesheet Settings</CardTitle>
              <CardDescription>
                Configure time blocks, intervals, and member limits
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            variant="default"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Configuration
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {configs.map((config) => {
              const isRegularConfig = config.type === ConfigTypes.REGULAR;
              const regularConfig = isRegularConfig
                ? (config as RegularConfig)
                : null;

              return (
                <div
                  key={config.id}
                  className="flex flex-col space-y-2 rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{config.name}</h3>
                      {config.isSystemConfig && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                <Shield className="h-3 w-3" />
                                System
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                This is a system configuration that cannot be
                                deleted or deactivated
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setConfigToDelete(config);
                          setIsDeleteDialogOpen(true);
                        }}
                        disabled={config.isSystemConfig}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {isRegularConfig && regularConfig ? (
                      <>
                        <p>
                          Hours:{" "}
                          {formatTimeStringTo12Hour(regularConfig.startTime)} -{" "}
                          {formatTimeStringTo12Hour(regularConfig.endTime)}
                        </p>
                        <p>Interval: {regularConfig.interval} minutes</p>
                        <p>Max Players: {regularConfig.maxMembersPerBlock}</p>
                      </>
                    ) : (
                      <p>Custom block configuration</p>
                    )}
                    <p>Status: {config.isActive ? "Active" : "Inactive"}</p>
                    <p>
                      Applied to:{" "}
                      {config.rules?.map((rule) =>
                        rule.daysOfWeek
                          ?.map(
                            (day) =>
                              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                                day
                              ],
                          )
                          .join(", "),
                      ) || "No days selected"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <TeesheetConfigDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveConfig}
        existingConfig={selectedConfig}
        templates={templates}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Configuration"
        description="This action cannot be undone and will permanently delete this configuration."
        itemName={configToDelete?.name}
      />
    </>
  );
}
