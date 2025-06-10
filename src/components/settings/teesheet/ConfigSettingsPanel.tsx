"use client";

import { useEffect } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ConfigTypes } from "~/app/types/TeeSheetTypes";
import type { UseFormReturn } from "react-hook-form";
import type { TeesheetConfigInput, Template } from "~/app/types/TeeSheetTypes";
import { ManageTemplatesDialog } from "./ManageTemplatesDialog";
import { useState } from "react";

interface ConfigSettingsPanelProps {
  form: UseFormReturn<TeesheetConfigInput>;
  onTypeChange: (type: ConfigTypes) => void;
  templates: Template[];
  onTemplatesChange: (templates: Template[]) => void;
}

export function ConfigSettingsPanel({
  form,
  onTypeChange,
  templates,
  onTemplatesChange,
}: ConfigSettingsPanelProps) {
  const { register, setValue, watch } = form;
  const configType = watch("type");
  const selectedTemplateId = watch("templateId");
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);

  useEffect(() => {
    // Reset form values when type changes
    if (configType === ConfigTypes.CUSTOM) {
      setValue("startTime", undefined);
      setValue("endTime", undefined);
      setValue("interval", undefined);
      setValue("maxMembersPerBlock", undefined);
    } else {
      setValue("templateId", undefined);
      setValue("blocks", undefined);
    }
  }, [configType, setValue]);

  // When a template is selected, update the blocks
  useEffect(() => {
    if (configType === ConfigTypes.CUSTOM && selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setValue("blocks", template.blocks);
      }
    }
  }, [selectedTemplateId, templates, configType, setValue]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            id="name"
            {...register("name", { required: true })}
            placeholder="e.g., Morning Shotgun"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Configuration Type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={
                configType === ConfigTypes.REGULAR ? "default" : "outline"
              }
              onClick={() => onTypeChange(ConfigTypes.REGULAR)}
              className={
                configType === ConfigTypes.REGULAR
                  ? "w-full bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90"
                  : "w-full"
              }
            >
              Regular Intervals
            </Button>
            <Button
              type="button"
              variant={
                configType === ConfigTypes.CUSTOM ? "default" : "outline"
              }
              onClick={() => onTypeChange(ConfigTypes.CUSTOM)}
              className={
                configType === ConfigTypes.CUSTOM
                  ? "w-full bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90"
                  : "w-full"
              }
            >
              Custom Blocks
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-2">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"
            >
              Basic Settings
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white"
            >
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 pt-4">
            {configType === ConfigTypes.REGULAR ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register("startTime")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input id="endTime" type="time" {...register("endTime")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval (minutes)</Label>
                    <Input
                      id="interval"
                      type="number"
                      min={5}
                      max={60}
                      step={5}
                      {...register("interval")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Max Players per Time</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      min={1}
                      max={8}
                      {...register("maxMembersPerBlock")}
                    />
                  </div>
                </div>

                {/* Rules Section */}
                <div className="space-y-2">
                  <Label>Schedule Rules</Label>
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label>Days of Week</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                          (day, index) => (
                            <Button
                              key={day}
                              type="button"
                              variant="outline"
                              size="sm"
                              className={`w-full ${watch("rules.0.daysOfWeek")?.includes(index) ? "bg-[#1e3a5f] text-white" : ""}`}
                              onClick={() => {
                                const currentDays =
                                  watch("rules.0.daysOfWeek") || [];
                                if (currentDays.includes(index)) {
                                  setValue(
                                    "rules.0.daysOfWeek",
                                    currentDays.filter((d) => d !== index),
                                  );
                                } else {
                                  setValue("rules.0.daysOfWeek", [
                                    ...currentDays,
                                    index,
                                  ]);
                                }
                              }}
                            >
                              {day}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority (1-10)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...register("rules.0.priority")}
                        className="w-24"
                      />
                      <p className="text-sm text-gray-500">
                        Higher priority configurations override lower priority
                        ones
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-gray-500">
                    Custom block settings will be configured in the template
                    section below
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isActive"
                checked={watch("isActive")}
                onCheckedChange={(checked) => setValue("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Templates</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManageTemplatesOpen(true)}
                >
                  Manage Templates
                </Button>
              </div>

              {configType === ConfigTypes.CUSTOM ? (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`cursor-pointer rounded-lg border-2 p-3 transition-colors hover:bg-gray-50 ${
                        selectedTemplateId === template.id
                          ? "border-org-primary bg-org-primary/5"
                          : "border-gray-200"
                      }`}
                      onClick={() => {
                        setValue("templateId", template.id);
                        setValue("blocks", template.blocks);
                      }}
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-500">
                        {template.blocks?.length || 0} blocks
                      </div>
                    </div>
                  ))}

                  {templates.length === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                      No templates available. Click 'Manage Templates' to create
                      one.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4">
                  <p className="text-sm text-gray-500">
                    Template selection is only available for custom block
                    configurations.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Management Dialog */}
      <ManageTemplatesDialog
        isOpen={isManageTemplatesOpen}
        onClose={() => setIsManageTemplatesOpen(false)}
        templates={templates}
        onSave={onTemplatesChange}
      />
    </div>
  );
}
