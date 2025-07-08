"use client";

import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Send, Target } from "lucide-react";
import { BulkNotificationForm } from "./BulkNotificationForm";
import { TargetedNotificationForm } from "./TargetedNotificationForm";

interface ClassCount {
  class: string;
  totalCount: number;
  subscribedCount: number;
}

interface NotificationFormsProps {
  validSubscriptions: number;
  memberClasses?: string[];
  classCounts?: ClassCount[];
}

export function NotificationForms({
  validSubscriptions,
  memberClasses,
  classCounts,
}: NotificationFormsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Bulk Notification
            </TabsTrigger>
            <TabsTrigger value="targeted" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Targeted Notification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="mt-6">
            <BulkNotificationForm
              validSubscriptions={validSubscriptions}
              hideCard={true}
            />
          </TabsContent>

          <TabsContent value="targeted" className="mt-6">
            <TargetedNotificationForm
              memberClasses={memberClasses}
              classCounts={classCounts}
              hideCard={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
