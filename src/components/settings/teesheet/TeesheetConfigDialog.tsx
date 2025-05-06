"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Checkbox } from "~/components/ui/checkbox";
import type {
  TeesheetConfig,
  TeesheetConfigInput,
  TeesheetConfigRuleInput,
} from "~/app/types/TeeSheetTypes";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

interface TeesheetConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: TeesheetConfigInput) => void;
  existingConfig?: TeesheetConfig;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export function TeesheetConfigDialog({
  isOpen,
  onClose,
  onSave,
  existingConfig,
}: TeesheetConfigDialogProps) {
  const { register, handleSubmit, reset, setValue, watch } =
    useForm<TeesheetConfigInput>({
      defaultValues: {
        name: "",
        startTime: "",
        endTime: "",
        interval: 15,
        maxMembersPerBlock: 4,
        isActive: true,
        rules: [
          {
            daysOfWeek: [],
            startDate: null,
            endDate: null,
            priority: 1,
            isActive: true,
          },
        ],
      },
    });

  const [scheduleType, setScheduleType] = useState<
    "weekdays" | "specific-dates"
  >("weekdays");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [priority, setPriority] = useState<number>(
    existingConfig?.rules?.[0]?.priority || 1,
  );

  const currentValues = watch();
  const isSystemConfig = existingConfig?.isSystemConfig;

  // Reset form when existingConfig changes
  useEffect(() => {
    if (existingConfig) {
      reset({
        name: existingConfig.name,
        startTime: existingConfig.startTime,
        endTime: existingConfig.endTime,
        interval: existingConfig.interval,
        maxMembersPerBlock: existingConfig.maxMembersPerBlock,
        isActive: existingConfig.isActive,
        rules: existingConfig.rules?.map((rule) => ({
          daysOfWeek: rule.daysOfWeek || [],
          startDate: rule.startDate
            ? format(rule.startDate, "yyyy-MM-dd")
            : null,
          endDate: rule.endDate ? format(rule.endDate, "yyyy-MM-dd") : null,
          priority: rule.priority,
          isActive: rule.isActive,
        })) || [
          {
            daysOfWeek: [],
            startDate: null,
            endDate: null,
            priority: 1,
            isActive: true,
          },
        ],
      });

      // Set schedule type and selected days based on rules
      const rule = existingConfig.rules?.[0];
      if (rule) {
        if (rule.startDate && rule.endDate) {
          setScheduleType("specific-dates");
          setDateRange({
            start: format(rule.startDate, "yyyy-MM-dd"),
            end: format(rule.endDate, "yyyy-MM-dd"),
          });
        } else if (rule.daysOfWeek) {
          setScheduleType("weekdays");
          setSelectedDays(rule.daysOfWeek);
        }
        setPriority(rule.priority);
      }
    } else {
      reset({
        name: "",
        startTime: "",
        endTime: "",
        interval: 15,
        maxMembersPerBlock: 4,
        isActive: true,
        rules: [
          {
            daysOfWeek: [],
            startDate: null,
            endDate: null,
            priority: 1,
            isActive: true,
          },
        ],
      });
      setScheduleType("weekdays");
      setSelectedDays([]);
      setDateRange({ start: "", end: "" });
      setPriority(1);
    }
  }, [existingConfig, reset]);

  const hasChanges = () => {
    if (!existingConfig) {
      return (
        currentValues.name !== "" ||
        currentValues.startTime !== "" ||
        currentValues.endTime !== "" ||
        currentValues.interval !== 15 ||
        currentValues.maxMembersPerBlock !== 4 ||
        currentValues.isActive !== true ||
        selectedDays.length > 0
      );
    }

    const initialDays = existingConfig.rules?.[0]?.daysOfWeek || [];
    const hasFormChanges =
      JSON.stringify(currentValues) !== JSON.stringify(existingConfig);
    const hasScheduleChanges =
      scheduleType === "weekdays"
        ? JSON.stringify(selectedDays.sort()) !==
          JSON.stringify(initialDays.sort())
        : dateRange.start !==
            format(
              existingConfig.rules?.[0]?.startDate || new Date(),
              "yyyy-MM-dd",
            ) ||
          dateRange.end !==
            format(
              existingConfig.rules?.[0]?.endDate || new Date(),
              "yyyy-MM-dd",
            );
    const hasPriorityChanges = priority !== existingConfig.rules?.[0]?.priority;

    return hasFormChanges || hasScheduleChanges || hasPriorityChanges;
  };

  const onSubmit = handleSubmit((data: TeesheetConfigInput) => {
    // Validate schedule
    if (scheduleType === "weekdays" && selectedDays.length === 0) {
      toast.error("Please select at least one day of the week");
      return;
    }

    if (
      scheduleType === "specific-dates" &&
      (!dateRange.start || !dateRange.end)
    ) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (!data.startTime || !data.endTime) {
      toast.error("Please set start and end times");
      return;
    }

    // Prepare rule data
    const ruleInput: TeesheetConfigRuleInput = {
      daysOfWeek: scheduleType === "weekdays" ? selectedDays : null,
      startDate: scheduleType === "specific-dates" ? dateRange.start : null,
      endDate: scheduleType === "specific-dates" ? dateRange.end : null,
      priority,
      isActive: true,
    };

    // Update form and save
    setValue("rules", [ruleInput]);
    onSave({
      ...data,
      rules: [ruleInput],
    });
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingConfig
              ? "Edit Teesheet Configuration"
              : "Create New Configuration"}
          </DialogTitle>
          <DialogDescription>
            {isSystemConfig
              ? "This is a system configuration. You can view its settings but cannot modify them."
              : "Configure when and how tee times are scheduled"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <Tabs defaultValue="schedule" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    {...register("name", { required: true })}
                    placeholder="e.g., Weekday Morning Schedule"
                    disabled={isSystemConfig}
                  />
                </div>

                <div className="space-y-4">
                  <Label>When does this configuration apply?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={
                        scheduleType === "weekdays" ? "default" : "outline"
                      }
                      onClick={() => setScheduleType("weekdays")}
                      disabled={isSystemConfig}
                    >
                      Specific Days
                    </Button>
                    <Button
                      type="button"
                      variant={
                        scheduleType === "specific-dates"
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setScheduleType("specific-dates")}
                      disabled={isSystemConfig}
                    >
                      Date Range
                    </Button>
                  </div>

                  {scheduleType === "weekdays" ? (
                    <div className="space-y-4">
                      <Label>Select Days</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={selectedDays.includes(day.value)}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setSelectedDays([...selectedDays, day.value]);
                                } else {
                                  setSelectedDays(
                                    selectedDays.filter((d) => d !== day.value),
                                  );
                                }
                              }}
                              disabled={isSystemConfig}
                            />
                            <Label htmlFor={`day-${day.value}`}>
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) =>
                              setDateRange({
                                ...dateRange,
                                start: e.target.value,
                              })
                            }
                            disabled={isSystemConfig}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) =>
                              setDateRange({
                                ...dateRange,
                                end: e.target.value,
                              })
                            }
                            disabled={isSystemConfig}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority (1-10)</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={1}
                      max={10}
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      disabled={isSystemConfig}
                    />
                    <p className="text-sm text-gray-500">
                      Higher priority configurations will override lower
                      priority ones for the same days
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register("startTime", { required: true })}
                      disabled={isSystemConfig}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...register("endTime", { required: true })}
                      disabled={isSystemConfig}
                    />
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
                      {...register("interval", {
                        required: true,
                        min: 5,
                        max: 60,
                      })}
                      disabled={isSystemConfig}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Max Players per Tee Time</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      min={1}
                      max={8}
                      {...register("maxMembersPerBlock", {
                        required: true,
                        min: 1,
                        max: 8,
                      })}
                      disabled={isSystemConfig}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={watch("isActive")}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                    disabled={isSystemConfig}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {!isSystemConfig && (
              <Button type="submit" className="ml-2" disabled={!hasChanges()}>
                Save Changes
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
