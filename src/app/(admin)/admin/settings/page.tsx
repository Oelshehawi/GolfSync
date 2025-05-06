import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { TeesheetSettings } from "~/components/settings/teesheet/TeesheetSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  getMemberClasses,
  getTimeblockRestrictions,
} from "~/server/timeblock-restrictions/data";
import { TimeblockRestrictionsSettings } from "~/components/settings/timeblock-restrictions/TimeblockRestrictionsSettings";
import { CourseInfoSettings } from "~/components/settings/course-info/CourseInfoSettings";
import { getCourseInfo } from "~/server/settings/data";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "~/components/ui/button";

type CourseInfoType = {
  id?: number;
  weatherStatus?: string;
  forecast?: string;
  rainfall?: string;
  notes?: string;
};

export default async function SettingsPage() {
  const teesheetResult = await getTeesheetConfigs();
  const teesheetConfigs = "success" in teesheetResult ? [] : teesheetResult;

  const memberClassesResult = await getMemberClasses();
  const memberClasses =
    "success" in memberClassesResult ? [] : memberClassesResult;

  // Get course info
  const courseInfoResult = await getCourseInfo();

  // Transform the data to match expected format
  let courseInfo: CourseInfoType | undefined = undefined;

  if (courseInfoResult && !("success" in courseInfoResult)) {
    courseInfo = {
      id: courseInfoResult.id,
      weatherStatus: courseInfoResult.weatherStatus ?? undefined,
      forecast: courseInfoResult.forecast ?? undefined,
      rainfall: courseInfoResult.rainfall ?? undefined,
      notes: courseInfoResult.notes ?? undefined,
    };
  }

  // Get timeblock restrictions
  const timeblockRestrictionsResult = await getTimeblockRestrictions();
  const timeblockRestrictions =
    "success" in timeblockRestrictionsResult ? [] : timeblockRestrictionsResult;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Back Link */}
      <div className="pb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Settings
          </CardTitle>
          <CardDescription>
            Manage your teesheet settings and configurations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="teesheet" className="w-full">
        <div className="mb-6 flex justify-center">
          <TabsList className=" flex w-[600px]">
            <TabsTrigger value="teesheet" className="flex-1">
              Teesheet Settings
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="flex-1">
              Timeblock Restrictions
            </TabsTrigger>
            <TabsTrigger value="courseInfo" className="flex-1">
              Course Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="teesheet" className="mt-4">
          {/* Teesheet Settings */}
          <TeesheetSettings initialConfigs={teesheetConfigs} />
        </TabsContent>

        <TabsContent value="restrictions" className="mt-4">
          {/* Timeblock Restrictions */}
          <TimeblockRestrictionsSettings
            initialRestrictions={timeblockRestrictions}
            memberClasses={memberClasses}
          />
        </TabsContent>

        <TabsContent value="courseInfo" className="mt-4">
          {/* Course Info Settings */}
          <CourseInfoSettings initialData={courseInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
