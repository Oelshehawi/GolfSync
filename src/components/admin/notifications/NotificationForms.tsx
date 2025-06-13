"use client";

import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Send, Target } from "lucide-react";
import { BulkNotificationForm } from "./BulkNotificationForm";
import { TargetedNotificationForm } from "./TargetedNotificationForm";

interface NotificationFormsProps {
  validSubscriptions: number;
  memberClasses: string[];
  onNotificationSent: () => void;
}

export function NotificationForms({
  validSubscriptions,
  memberClasses,
  onNotificationSent,
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
              onNotificationSent={onNotificationSent}
              hideCard={true}
            />
          </TabsContent>

          <TabsContent value="targeted" className="mt-6">
            <TargetedNotificationForm
              memberClasses={memberClasses}
              onNotificationSent={onNotificationSent}
              hideCard={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
