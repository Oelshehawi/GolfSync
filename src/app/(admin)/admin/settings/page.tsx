import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getTeesheetConfigs, getTemplates } from "~/server/settings/data";
import { TeesheetSettings } from "~/components/settings/teesheet/TeesheetSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  getMemberClasses,
  getTimeblockRestrictions,
  getTimeblockOverrides,
} from "~/server/timeblock-restrictions/data";
import { TimeblockRestrictionsSettings } from "~/components/settings/timeblock-restrictions/TimeblockRestrictionsSettings";
import { CourseInfoSettings } from "~/components/settings/course-info/CourseInfoSettings";
import { getCourseInfo } from "~/server/settings/data";
import { PageHeader } from "~/components/ui/page-header";
import { OverridesSettings } from "~/components/settings/overrides/OverridesSettings";

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

  const templates = await getTemplates();

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

  // Get timeblock overrides
  const timeblockOverridesResult = await getTimeblockOverrides();
  const timeblockOverrides =
    "success" in timeblockOverridesResult ? [] : timeblockOverridesResult;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage your teesheet settings and configurations"
      />

      {/* Tabbed Interface */}
      <Tabs defaultValue="teesheet" className="w-full">
        <div className="mb-6 flex justify-center">
          <TabsList className="flex w-[800px]">
            <TabsTrigger value="teesheet" className="flex-1">
              Teesheet Settings
            </TabsTrigger>
            <TabsTrigger value="restrictions" className="flex-1">
              Timeblock Restrictions
            </TabsTrigger>
            <TabsTrigger value="overrides" className="flex-1">
              Override Records
            </TabsTrigger>
            <TabsTrigger value="courseInfo" className="flex-1">
              Course Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="teesheet" className="mt-4">
          {/* Teesheet Settings */}
          <TeesheetSettings
            initialConfigs={teesheetConfigs}
            templates={templates}
          />
        </TabsContent>

        <TabsContent value="restrictions" className="mt-4">
          {/* Timeblock Restrictions */}
          <TimeblockRestrictionsSettings
            initialRestrictions={timeblockRestrictions}
            memberClasses={memberClasses}
          />
        </TabsContent>

        <TabsContent value="overrides" className="mt-4">
          {/* Override Records */}
          <OverridesSettings initialOverrides={timeblockOverrides} />
        </TabsContent>

        <TabsContent value="courseInfo" className="mt-4">
          {/* Course Info Settings */}
          <CourseInfoSettings initialData={courseInfo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
