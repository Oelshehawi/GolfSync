"use client";

import { useState } from "react";
import { db } from "~/server/db";
import { teesheetConfigRules } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { getOrganizationId } from "~/lib/auth";

interface TeesheetConfigRule {
  id: number;
  clerkOrgId: string;
  configId: number;
  daysOfWeek: number[] | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

interface RulesManagerProps {
  config: TeesheetConfig & { rules: TeesheetConfigRule[] };
}

export function RulesManager({ config }: RulesManagerProps) {
  const [rules, setRules] = useState<TeesheetConfigRule[]>(config.rules || []);
  const [editingRule, setEditingRule] = useState<TeesheetConfigRule | null>(
    null,
  );

  const handleCreateRule = async () => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error("No organization selected");

      const [newRule] = await db
        .insert(teesheetConfigRules)
        .values({
          clerkOrgId: orgId,
          configId: config.id,
          daysOfWeek: null,
          startDate: null,
          endDate: null,
          priority: 1,
          isActive: true,
        })
        .returning();

      if (!newRule) {
        throw new Error("Failed to create rule");
      }

      setRules([...rules, newRule]);
    } catch (error) {
      console.error("Error creating rule:", error);
    }
  };

  const handleUpdateRule = async (ruleId: number, updates: any) => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error("No organization selected");

      await db
        .update(teesheetConfigRules)
        .set(updates)
        .where(eq(teesheetConfigRules.id, ruleId));

      setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
      setEditingRule(null);
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      const orgId = await getOrganizationId();
      if (!orgId) throw new Error("No organization selected");

      await db
        .delete(teesheetConfigRules)
        .where(eq(teesheetConfigRules.id, ruleId));

      setRules(rules.filter((r) => r.id !== ruleId));
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Rules for {config.name}</h3>
        <Button onClick={handleCreateRule}>Add Rule</Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                {editingRule?.id === rule.id ? (
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Days of Week</Label>
                        <Input
                          type="text"
                          placeholder="e.g., 1,2,3,4,5"
                          value={editingRule.daysOfWeek?.join(",") || ""}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              daysOfWeek: e.target.value
                                .split(",")
                                .map((d) => parseInt(d.trim())),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={editingRule.priority}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              priority: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={editingRule.startDate || ""}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={editingRule.endDate || ""}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <CardTitle>Rule #{rule.id}</CardTitle>
                )}
                <div className="flex gap-2">
                  {editingRule?.id === rule.id ? (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateRule(rule.id, editingRule)}
                    >
                      Save
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRule(rule)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-500">
                <div>Days: {rule.daysOfWeek?.join(", ") || "Any"}</div>
                <div>
                  Date Range:{" "}
                  {rule.startDate && rule.endDate
                    ? `${rule.startDate} to ${rule.endDate}`
                    : "Recurring"}
                </div>
                <div>Priority: {rule.priority}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
