import { PageHeader } from "~/components/ui/page-header";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MemberProfilesDashboard } from "~/components/lottery/MemberProfilesDashboard";
import {
  getMemberProfilesWithFairness,
  getMemberProfileStats,
} from "~/server/lottery/member-profiles-data";

export default async function MemberProfilesPage() {
  // Fetch all member profiles with speed and fairness data
  const [profilesResult, statsResult] = await Promise.all([
    getMemberProfilesWithFairness(),
    getMemberProfileStats(),
  ]);

  if (!profilesResult.success) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <PageHeader
            title="Member Profiles Management"
            description="Manage member speed classifications, fairness scores, and lottery priority"
          />
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">
            Error loading member profiles: {profilesResult.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Page Header */}
      <div className="mb-6">
        <PageHeader
          title="Member Profiles Management"
          description="Manage member speed classifications, fairness scores, and lottery priority"
        />
      </div>

      {/* Main Dashboard */}
      <MemberProfilesDashboard
        profiles={profilesResult.profiles || []}
        stats={statsResult.stats}
      />
    </div>
  );
}
