"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Calendar, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TeesheetConfigDialog } from "./TeesheetConfigDialog";
import type {
  TeesheetConfig,
  TeesheetConfigInput,
} from "~/app/types/TeeSheetTypes";
import {
  createTeesheetConfig,
  updateTeesheetConfig,
  deleteTeesheetConfig,
} from "~/server/settings/actions";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface TeesheetSettingsProps {
  initialConfigs: TeesheetConfig[];
}

export function TeesheetSettings({ initialConfigs }: TeesheetSettingsProps) {
  const [configs, setConfigs] = useState<TeesheetConfig[]>(initialConfigs);
  const [selectedConfig, setSelectedConfig] = useState<
    TeesheetConfig | undefined
  >(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<TeesheetConfig | undefined>(
    undefined,
  );

  const handleOpenDialog = (config?: TeesheetConfig) => {
    setSelectedConfig(config);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedConfig(undefined);
    setIsDialogOpen(false);
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
          const updatedConfig = result.data as TeesheetConfig;
          // Ensure we preserve the rules array
          const updatedConfigs = configs.map((c) =>
            c.id === selectedConfig.id
              ? {
                  ...updatedConfig,
                  rules: updatedConfig.rules || selectedConfig.rules,
                }
              : c,
          );
          setConfigs(updatedConfigs);
          toast.success("Configuration updated successfully");
        } else {
          toast.error(result.error || "Failed to update configuration");
        }
      } else {
        // Create new config
        const result = await createTeesheetConfig(configInput);
        if (result.success && result.data) {
          const newConfig = result.data as TeesheetConfig;
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

  const handleDeleteClick = (config: TeesheetConfig) => {
    setDeleteConfig(config);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfig) return;

    try {
      const result = await deleteTeesheetConfig(deleteConfig.id);
      if (result.success) {
        setConfigs(configs.filter((c) => c.id !== deleteConfig.id));
        toast.success("Configuration deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setDeleteConfig(undefined);
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
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex flex-col space-y-2 rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{config.name}</h3>
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
                      onClick={() => handleDeleteClick(config)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>
                    Hours: {config.startTime} - {config.endTime}
                  </p>
                  <p>Interval: {config.interval} minutes</p>
                  <p>Max Players: {config.maxMembersPerBlock}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>

      <TeesheetConfigDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveConfig}
        existingConfig={selectedConfig}
      />

      <AlertDialog
        open={!!deleteConfig}
        onOpenChange={() => setDeleteConfig(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deleteConfig?.name}"
              configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete Configuration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
