import { useState } from "react";
import { db } from "~/server/db";
import { teesheetConfigs, teesheetConfigRules } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type {
  TeesheetConfig,
  TeesheetConfigRule,
} from "~/app/types/TeeSheetTypes";

interface ConfigManagerProps {
  initialConfigs: TeesheetConfig[];
}

export function ConfigManager({ initialConfigs }: ConfigManagerProps) {
  const [configs, setConfigs] = useState<TeesheetConfig[]>(initialConfigs);
  const [newConfigName, setNewConfigName] = useState("");
  const [editingConfig, setEditingConfig] = useState<TeesheetConfig | null>(
    null,
  );

  const handleCreateConfig = async () => {
    if (!newConfigName.trim()) return;

    try {
      const [newConfig] = await db
        .insert(teesheetConfigs)
        .values({
          name: newConfigName,
          startTime: "07:00",
          endTime: "19:00",
          interval: 15,
          maxMembersPerBlock: 4,
          isActive: true,
        })
        .returning();

      if (!newConfig) {
        throw new Error("Failed to create config");
      }

      setConfigs([...configs, newConfig]);
      setNewConfigName("");
    } catch (error) {
      console.error("Error creating config:", error);
    }
  };

  const handleUpdateConfig = async (config: TeesheetConfig) => {
    try {
      await db
        .update(teesheetConfigs)
        .set({ name: config.name })
        .where(eq(teesheetConfigs.id, config.id));

      setConfigs(configs.map((c) => (c.id === config.id ? config : c)));
      setEditingConfig(null);
    } catch (error) {
      console.error("Error updating config:", error);
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    try {
      await db.delete(teesheetConfigs).where(eq(teesheetConfigs.id, configId));
      setConfigs(configs.filter((c) => c.id !== configId));
    } catch (error) {
      console.error("Error deleting config:", error);
    }
  };

  const handleAddRule = async (configId: number) => {
    try {
      const [newRule] = await db
        .insert(teesheetConfigRules)
        .values({
          configId,
          dayOfWeek: null,
          isWeekend: null,
          startDate: null,
          endDate: null,
          priority: 1,
          isActive: true,
        })
        .returning();

      if (!newRule) {
        throw new Error("Failed to create rule");
      }

      setConfigs(
        configs.map((c) =>
          c.id === configId
            ? {
                ...c,
                rules: [...(c.rules || []), newRule],
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error adding rule:", error);
    }
  };

  const handleUpdateRule = async (
    configId: number,
    ruleId: number,
    updates: Partial<TeesheetConfigRule>,
  ) => {
    try {
      await db
        .update(teesheetConfigRules)
        .set(updates)
        .where(eq(teesheetConfigRules.id, ruleId));

      setConfigs(
        configs.map((c) =>
          c.id === configId
            ? {
                ...c,
                rules: c.rules?.map((r) =>
                  r.id === ruleId ? { ...r, ...updates } : r,
                ),
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const handleDeleteRule = async (configId: number, ruleId: number) => {
    try {
      await db
        .delete(teesheetConfigRules)
        .where(eq(teesheetConfigRules.id, ruleId));

      setConfigs(
        configs.map((c) =>
          c.id === configId
            ? {
                ...c,
                rules: c.rules?.filter((r) => r.id !== ruleId),
              }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          value={newConfigName}
          onChange={(e) => setNewConfigName(e.target.value)}
          placeholder="New configuration name"
        />
        <Button onClick={handleCreateConfig}>Create Configuration</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                {editingConfig?.id === config.id ? (
                  <Input
                    value={editingConfig.name}
                    onChange={(e) =>
                      setEditingConfig({
                        ...editingConfig,
                        name: e.target.value,
                      })
                    }
                  />
                ) : (
                  <CardTitle>{config.name}</CardTitle>
                )}
                <div className="flex gap-2">
                  {editingConfig?.id === config.id ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateConfig(editingConfig)}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingConfig(config)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteConfig(config.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddRule(config.id)}
                >
                  Add Rule
                </Button>
                {config.rules?.map((rule) => (
                  <div key={rule.id} className="rounded-lg border p-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Day of Week</Label>
                          <Input
                            type="number"
                            min="0"
                            max="6"
                            value={rule.dayOfWeek ?? ""}
                            onChange={(e) =>
                              handleUpdateRule(config.id, rule.id, {
                                dayOfWeek: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Is Weekend</Label>
                          <select
                            value={
                              rule.isWeekend === null
                                ? ""
                                : rule.isWeekend.toString()
                            }
                            onChange={(e) =>
                              handleUpdateRule(config.id, rule.id, {
                                isWeekend:
                                  e.target.value === ""
                                    ? null
                                    : e.target.value === "true",
                              })
                            }
                            className="w-full rounded-md border p-2"
                          >
                            <option value="">Any</option>
                            <option value="true">Weekend</option>
                            <option value="false">Weekday</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={rule.priority}
                          onChange={(e) =>
                            handleUpdateRule(config.id, rule.id, {
                              priority: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRule(config.id, rule.id)}
                      >
                        Delete Rule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
