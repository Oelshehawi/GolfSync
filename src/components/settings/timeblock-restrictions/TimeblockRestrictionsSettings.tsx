"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { MemberClassRestrictions } from "./MemberClassRestrictions";
import { GuestRestrictions } from "./GuestRestrictions";
import { CourseAvailability } from "./CourseAvailability";

export type TimeblockRestriction = {
  id: number;
  name: string;
  description: string | null;
  restrictionCategory: "MEMBER_CLASS" | "GUEST" | "COURSE_AVAILABILITY";
  restrictionType: "TIME" | "FREQUENCY" | "AVAILABILITY";
  memberClass?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  startDate?: Date | null;
  endDate?: Date | null;
  maxCount?: number;
  periodDays?: number;
  applyCharge?: boolean;
  chargeAmount?: number;
  isFullDay?: boolean;
  weatherStatus?: string;
  rainfall?: string;
  availabilityNotes?: string;
  isActive: boolean;
  canOverride: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date | null;
  lastUpdatedBy?: string;
};

interface TimeblockRestrictionsSettingsProps {
  initialRestrictions: TimeblockRestriction[];
  memberClasses: string[];

}

export function TimeblockRestrictionsSettings({
  initialRestrictions,
  memberClasses,
}: TimeblockRestrictionsSettingsProps) {
  const [restrictions, setRestrictions] =
    useState<TimeblockRestriction[]>(initialRestrictions);

  // Filter restrictions by category
  const memberClassRestrictions = restrictions.filter(
    (r) => r.restrictionCategory === "MEMBER_CLASS",
  );

  const guestRestrictions = restrictions.filter(
    (r) => r.restrictionCategory === "GUEST",
  );

  const courseAvailabilityRestrictions = restrictions.filter(
    (r) => r.restrictionCategory === "COURSE_AVAILABILITY",
  );

  const handleRestrictionUpdate = (
    updatedRestriction: TimeblockRestriction,
  ) => {
    setRestrictions((prev) =>
      prev.map((r) =>
        r.id === updatedRestriction.id ? updatedRestriction : r,
      ),
    );
  };

  const handleRestrictionAdd = (newRestriction: TimeblockRestriction) => {
    setRestrictions((prev) => [...prev, newRestriction]);
  };

  const handleRestrictionDelete = (restrictionId: number) => {
    setRestrictions((prev) => prev.filter((r) => r.id !== restrictionId));
  };

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Timeblock Restrictions
        </CardTitle>
        <CardDescription>
          Manage time, frequency, and availability restrictions for members,
          guests, and course
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-6">
        <Tabs defaultValue="memberClass" className="w-full">
          <TabsList className="mx-auto mb-4 w-full max-w-[600px]">
            <TabsTrigger value="memberClass" className="flex-1">
              Member Classes
            </TabsTrigger>
            <TabsTrigger value="guest" className="flex-1">
              Guests
            </TabsTrigger>
            <TabsTrigger value="courseAvailability" className="flex-1">
              Course Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memberClass">
            <MemberClassRestrictions
              restrictions={memberClassRestrictions}
              memberClasses={memberClasses}
              onUpdate={handleRestrictionUpdate}
              onAdd={handleRestrictionAdd}
              onDelete={handleRestrictionDelete}
            />
          </TabsContent>

          <TabsContent value="guest">
            <GuestRestrictions
              restrictions={guestRestrictions}
              onUpdate={handleRestrictionUpdate}
              onAdd={handleRestrictionAdd}
              onDelete={handleRestrictionDelete}
            />
          </TabsContent>

          <TabsContent value="courseAvailability">
            <CourseAvailability
              restrictions={courseAvailabilityRestrictions}
              onUpdate={handleRestrictionUpdate}
              onAdd={handleRestrictionAdd}
              onDelete={handleRestrictionDelete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
