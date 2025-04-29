import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { TeesheetSettings } from "~/components/settings/teesheet/TeesheetSettings";
import { RestrictionSettings } from "~/components/settings/restrictions/RestrictionSettings";
import { getRestrictions, getMemberClasses } from "~/server/restrictions/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getOrganizationColors } from "~/lib/utils";
import { getOrganizationTheme } from "~/server/config/data";
import { CourseInfoSettings } from "~/components/settings/course-info/CourseInfoSettings";
import { getCourseInfo } from "~/server/settings/data";

export default async function SettingsPage() {
  const teesheetResult = await getTeesheetConfigs();
  const teesheetConfigs = "success" in teesheetResult ? [] : teesheetResult;

  const restrictionsResult = await getRestrictions();
  const restrictions =
    "success" in restrictionsResult ? [] : restrictionsResult;

  const memberClassesResult = await getMemberClasses();
  const memberClasses =
    "success" in memberClassesResult ? [] : memberClassesResult;

  const theme = await getOrganizationTheme();

  // Get course info
  const courseInfo = await getCourseInfo();

  // Extract the actual theme properties instead of CSS variables
  const themeProps = {
    primary: theme?.primary,
    secondary: theme?.secondary,
    tertiary: theme?.tertiary,
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
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
          <TabsList className="flex w-[600px]" theme={themeProps}>
            <TabsTrigger value="teesheet" className="flex-1" theme={themeProps}>
              Teesheet Settings
            </TabsTrigger>
            <TabsTrigger
              value="restrictions"
              className="flex-1"
              theme={themeProps}
            >
              Booking Restrictions
            </TabsTrigger>
            <TabsTrigger
              value="course-info"
              className="flex-1"
              theme={themeProps}
            >
              Course Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="teesheet" className="mt-4" theme={themeProps}>
          {/* Teesheet Settings */}
          <TeesheetSettings
            initialConfigs={teesheetConfigs}
            theme={themeProps}
          />
        </TabsContent>

        <TabsContent value="restrictions" className="mt-4" theme={themeProps}>
          {/* Booking Restrictions */}
          <RestrictionSettings
            initialRestrictions={restrictions}
            memberClasses={memberClasses}
            theme={themeProps}
          />
        </TabsContent>

        <TabsContent value="course-info" className="mt-4" theme={themeProps}>
          {/* Course Info Settings */}
          <CourseInfoSettings initialData={courseInfo} theme={themeProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
