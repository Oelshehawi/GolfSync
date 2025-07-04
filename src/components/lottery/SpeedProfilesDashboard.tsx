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
} from "lucide-react";
import { SpeedBonusConfiguration } from "./SpeedBonusConfiguration";
import { SpeedProfilesTable } from "./SpeedProfilesTable";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import { resetAllAdminPriorityAdjustmentsAction } from "~/server/lottery/speed-profiles-actions";
import { toast } from "react-hot-toast";
import type { MemberSpeedProfileView } from "~/app/types/LotteryTypes";

interface SpeedProfilesDashboardProps {
  profiles: MemberSpeedProfileView[];
  stats?: {
    fast: number;
    average: number;
    slow: number;
    total: number;
    withAdminAdjustments: number;
  };
}

export function SpeedProfilesDashboard({
  profiles,
  stats,
}: SpeedProfilesDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [speedTierFilter, setSpeedTierFilter] = useState<
    "ALL" | "FAST" | "AVERAGE" | "SLOW"
  >("ALL");
  const [showBonusConfig, setShowBonusConfig] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Filter profiles based on search and speed tier
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch =
      profile.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.memberNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      speedTierFilter === "ALL" || profile.speedTier === speedTierFilter;

    return matchesSearch && matchesFilter;
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fast Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.fast || 0}
            </div>
            <p className="text-muted-foreground text-xs">≤ 3:55 pace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Players
            </CardTitle>
            <Timer className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.average || 0}
            </div>
            <p className="text-muted-foreground text-xs">3:56 - 4:05 pace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Admin Adjustments
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.withAdminAdjustments || 0}
            </div>
            <p className="text-muted-foreground text-xs">
              Members with priority adjustments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Speed Bonus Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Time Window Speed Bonuses</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBonusConfig(!showBonusConfig)}
            >
              {showBonusConfig ? "Hide" : "Configure"}
            </Button>
          </div>
        </CardHeader>
        {showBonusConfig && (
          <CardContent>
            <SpeedBonusConfiguration />
          </CardContent>
        )}
      </Card>

      {/* Speed Profiles Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Member Speed Profiles
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats && stats.withAdminAdjustments > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={isResetting}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset All Adjustments
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
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
              <span className="text-sm text-gray-600">Filter:</span>
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
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredProfiles.length} of {profiles.length} members
          </div>

          {/* Speed Profiles Table */}
          <SpeedProfilesTable profiles={filteredProfiles} />
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={resetConfirmOpen}
        onOpenChange={() => setResetConfirmOpen(false)}
        onConfirm={handleResetAllAdjustments}
        title="Reset All Admin Priority Adjustments"
        description={`This will reset all ${stats?.withAdminAdjustments || 0} admin priority adjustments to 0. This action cannot be undone.`}
        confirmText="Reset All"
        variant="destructive"
        loading={isResetting}
      />
    </div>
  );
}
