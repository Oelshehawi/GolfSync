"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import {
  Settings,
  Timer,
  TrendingUp,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import { SpeedBonusConfiguration } from "./SpeedBonusConfiguration";
import { MemberProfilesTable } from "./MemberProfilesTable";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import { resetAllAdminPriorityAdjustmentsAction } from "~/server/lottery/member-profiles-actions";
import { triggerManualMaintenance } from "~/server/lottery/maintenance-actions";
import { toast } from "react-hot-toast";
import type { MemberProfileWithFairness } from "~/app/types/LotteryTypes";

interface MemberProfilesDashboardProps {
  profiles: MemberProfileWithFairness[];
  stats?: {
    totalMembers: number;
    speedTiers: {
      fast: number;
      average: number;
      slow: number;
    };
    fairnessScores?: {
      highPriority: number;
      mediumPriority: number;
      lowPriority: number;
      averageFulfillmentRate: number;
    };
    adminAdjustments?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export function MemberProfilesDashboard({
  profiles,
  stats,
}: MemberProfilesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [speedTierFilter, setSpeedTierFilter] = useState<
    "ALL" | "FAST" | "AVERAGE" | "SLOW"
  >("ALL");
  const [priorityFilter, setPriorityFilter] = useState<
    "ALL" | "HIGH" | "MEDIUM" | "LOW"
  >("ALL");
  const [showBonusConfig, setShowBonusConfig] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);

  // Filter profiles based on search, speed tier, and priority
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.memberNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpeedFilter =
      speedTierFilter === "ALL" || profile.speedTier === speedTierFilter;

    const matchesPriorityFilter = () => {
      if (priorityFilter === "ALL") return true;
      const fairnessScore = profile.fairnessScore?.fairnessScore ?? 0;
      if (priorityFilter === "HIGH") return fairnessScore > 20;
      if (priorityFilter === "MEDIUM")
        return fairnessScore >= 10 && fairnessScore <= 20;
      if (priorityFilter === "LOW") return fairnessScore < 10;
      return true;
    };

    return matchesSearch && matchesSpeedFilter && matchesPriorityFilter();
  });

  const handleResetAllAdjustments = async () => {
    setIsResetting(true);
    try {
      const result = await resetAllAdminPriorityAdjustmentsAction();
      if (result.success) {
        toast.success(
          `Reset ${result.updatedCount} admin priority adjustments`,
        );
      } else {
        toast.error(result.error || "Failed to reset adjustments");
      }
    } catch (error) {
      toast.error("An error occurred while resetting adjustments");
    } finally {
      setIsResetting(false);
      setResetConfirmOpen(false);
    }
  };

  const handleRunMaintenance = async () => {
    setIsRunningMaintenance(true);
    try {
      const result = await triggerManualMaintenance();
      if (result.success) {
        toast.success("Manual maintenance completed successfully");
      } else {
        toast.error(result.error || "Failed to run maintenance");
      }
    } catch (error) {
      toast.error("An error occurred while running maintenance");
    } finally {
      setIsRunningMaintenance(false);
      setMaintenanceConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fast Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.speedTiers?.fast || 0}
            </div>
            <p className="text-muted-foreground text-xs">≤ 3:55 pace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.fairnessScores?.highPriority || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Fairness score &gt; 20
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Fulfillment
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(
                (stats?.fairnessScores?.averageFulfillmentRate || 0) * 100
              ).toFixed(0)}
              %
            </div>
            <p className="text-muted-foreground text-xs">Preference rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Member Profiles Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBonusConfig(!showBonusConfig)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Speed Bonuses
              </Button>
              <Button
                variant="outline"
                onClick={() => setMaintenanceConfirmOpen(true)}
                disabled={isRunningMaintenance}
              >
                {isRunningMaintenance ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Run Maintenance
              </Button>
              <Button
                variant="outline"
                onClick={() => setResetConfirmOpen(true)}
                disabled={isResetting}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Reset Adjustments
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Speed Bonus Configuration */}
        {showBonusConfig && (
          <CardContent className="border-t bg-gray-50">
            <SpeedBonusConfiguration />
          </CardContent>
        )}

        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Speed:</span>
              {(["ALL", "FAST", "AVERAGE", "SLOW"] as const).map((tier) => (
                <Badge
                  key={tier}
                  variant={speedTierFilter === tier ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSpeedTierFilter(tier)}
                >
                  {tier}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Priority:</span>
              {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map((priority) => (
                <Badge
                  key={priority}
                  variant={priorityFilter === priority ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPriorityFilter(priority)}
                >
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredProfiles.length} of {profiles.length} members
          </div>

          {/* Member Profiles Table */}
          <MemberProfilesTable profiles={filteredProfiles} />
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={resetConfirmOpen}
        onOpenChange={() => setResetConfirmOpen(false)}
        onConfirm={handleResetAllAdjustments}
        title="Reset All Admin Priority Adjustments"
        description={`This will reset all admin priority adjustments to 0. This action cannot be undone.`}
        confirmText="Reset All"
        variant="destructive"
        loading={isResetting}
      />

      {/* Maintenance Confirmation Dialog */}
      <ConfirmationDialog
        open={maintenanceConfirmOpen}
        onOpenChange={() => setMaintenanceConfirmOpen(false)}
        onConfirm={handleRunMaintenance}
        title="Run Manual Maintenance"
        description="This will reset fairness scores for the current month and recalculate speed profiles from pace data. This may take a few moments."
        confirmText="Run Maintenance"
        variant="default"
        loading={isRunningMaintenance}
      />
    </div>
  );
}
