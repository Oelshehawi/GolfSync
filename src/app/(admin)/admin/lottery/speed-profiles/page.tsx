import { PageHeader } from "~/components/ui/page-header";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SpeedProfilesDashboard } from "~/components/lottery/SpeedProfilesDashboard";
import {
  getAllMemberSpeedProfiles,
  getSpeedTierStats,
} from "~/server/lottery/speed-profiles-data";

export default async function SpeedProfilesPage() {
  // Fetch all speed profiles and statistics
  const [profilesResult, statsResult] = await Promise.all([
    getAllMemberSpeedProfiles(),
    getSpeedTierStats(),
  ]);

  if (!profilesResult.success) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-4">
            <Link href="/admin/lottery" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lottery
              </Button>
            </Link>
            <PageHeader
              title="Speed Profiles Management"
              description="Manage member speed classifications and lottery priority adjustments"
            />
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">
            Error loading speed profiles: {profilesResult.error}
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
          title="Speed Profiles Management"
          description="Manage member speed classifications and lottery priority adjustments"
        />
      </div>

      {/* Main Dashboard */}
      <SpeedProfilesDashboard
        profiles={profilesResult.profiles || []}
        stats={statsResult.stats}
      />
    </div>
  );
}
