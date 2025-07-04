"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Edit,
  Clock,
  TrendingUp,
  Timer,
  AlertTriangle,
  Target,
  Trophy,
  Calendar,
} from "lucide-react";
import { SpeedProfileEditDialog } from "./SpeedProfileEditDialog";
import type { MemberProfileWithFairness } from "~/app/types/LotteryTypes";

interface MemberProfilesTableProps {
  profiles: MemberProfileWithFairness[];
}

export function MemberProfilesTable({ profiles }: MemberProfilesTableProps) {
  const [editingProfile, setEditingProfile] =
    useState<MemberProfileWithFairness | null>(null);

  const formatPaceTime = (minutes: number | null) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const getSpeedTierBadge = (tier: "FAST" | "AVERAGE" | "SLOW") => {
    switch (tier) {
      case "FAST":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <TrendingUp className="mr-1 h-3 w-3" />
            Fast
          </Badge>
        );
      case "AVERAGE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Timer className="mr-1 h-3 w-3" />
            Average
          </Badge>
        );
      case "SLOW":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <Clock className="mr-1 h-3 w-3" />
            Slow
          </Badge>
        );
    }
  };

  const getAdminAdjustmentBadge = (adjustment: number) => {
    if (adjustment === 0) {
      return <span className="text-gray-500">0</span>;
    }

    const isPositive = adjustment > 0;
    return (
      <Badge
        variant={isPositive ? "default" : "destructive"}
        className={isPositive ? "bg-blue-100 text-blue-800" : ""}
      >
        <AlertTriangle className="mr-1 h-3 w-3" />
        {isPositive ? "+" : ""}
        {adjustment}
      </Badge>
    );
  };

  const getPriorityBadge = (score: number) => {
    if (score > 20) {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <Target className="mr-1 h-3 w-3" />
          High ({score.toFixed(1)})
        </Badge>
      );
    } else if (score >= 10) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Calendar className="mr-1 h-3 w-3" />
          Medium ({score.toFixed(1)})
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <Trophy className="mr-1 h-3 w-3" />
          Low ({score.toFixed(1)})
        </Badge>
      );
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-500">
          <Timer className="mx-auto mb-4 h-12 w-12 opacity-50" />
          <p className="text-lg font-medium">No member profiles found</p>
          <p className="text-sm">
            Profiles will be created automatically when pace data is processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Avg Pace
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Speed Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Fairness Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Fulfillment Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Admin Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Override
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  {/* Member Info */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {profile.memberName}
                      </div>
                      <div className="text-sm text-gray-500">
                        #{profile.memberNumber} • {profile.memberClass}
                      </div>
                    </div>
                  </td>

                  {/* Average Pace */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPaceTime(profile.averageMinutes)}
                    </div>
                    {profile.averageMinutes && (
                      <div className="text-xs text-gray-500">
                        {profile.averageMinutes.toFixed(0)} minutes
                      </div>
                    )}
                  </td>

                  {/* Speed Tier */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getSpeedTierBadge(profile.speedTier)}
                  </td>

                  {/* Fairness Score */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {profile.fairnessScore ? (
                      getPriorityBadge(profile.fairnessScore.fairnessScore)
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        No Data
                      </Badge>
                    )}
                  </td>

                  {/* Fulfillment Rate */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {profile.fairnessScore ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(
                            profile.fairnessScore.preferenceFulfillmentRate *
                            100
                          ).toFixed(0)}
                          %
                        </div>
                        <div className="text-xs text-gray-500">
                          {profile.fairnessScore.preferencesGrantedMonth}/
                          {profile.fairnessScore.totalEntriesMonth} granted
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>

                  {/* Admin Priority Adjustment */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getAdminAdjustmentBadge(profile.adminPriorityAdjustment)}
                  </td>

                  {/* Manual Override */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {profile.manualOverride ? (
                      <Badge
                        variant="outline"
                        className="border-orange-200 text-orange-700"
                      >
                        Manual
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-700"
                      >
                        Auto
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProfile(profile)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Total: {profiles.length} members</span>
              <span>
                Fast: {profiles.filter((p) => p.speedTier === "FAST").length}
              </span>
              <span>
                Average:{" "}
                {profiles.filter((p) => p.speedTier === "AVERAGE").length}
              </span>
              <span>
                Slow: {profiles.filter((p) => p.speedTier === "SLOW").length}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                High Priority:{" "}
                {
                  profiles.filter(
                    (p) =>
                      p.fairnessScore && p.fairnessScore.fairnessScore > 20,
                  ).length
                }
              </span>
              <span>
                Manual Overrides:{" "}
                {profiles.filter((p) => p.manualOverride).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingProfile && (
        <SpeedProfileEditDialog
          profile={editingProfile}
          isOpen={!!editingProfile}
          onClose={() => setEditingProfile(null)}
          onSave={() => {
            setEditingProfile(null);
            // The dialog handles the save and triggers revalidation
          }}
        />
      )}
    </>
  );
}
