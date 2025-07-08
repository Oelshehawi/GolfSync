"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Bell, BellOff, Check, AlertTriangle, Smartphone } from "lucide-react";
import toast from "react-hot-toast";
import {
  subscribeUserToPushNotifications,
  unsubscribeUserFromPushNotifications,
  getMemberPushNotificationStatus,
} from "~/server/pwa/actions";
import { urlBase64ToUint8Array } from "~/lib/utils";

export function NotificationPreferences() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      // Check if push notifications are supported
      if ("serviceWorker" in navigator && "PushManager" in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
        await registerServiceWorker();
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.log("Error initializing notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    } catch (error) {
      console.log("Service worker registration failed:", error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getMemberPushNotificationStatus();
      if (status.success) {
        setIsSubscribed(status.enabled ?? false);
      }
    } catch (error) {
      console.log("Error checking subscription status:", error);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      setIsUpdating(true);

      if (enabled) {
        await handleSubscribe();
      } else {
        await handleUnsubscribe();
      }
    } catch (error) {
      toast.error("Failed to update notification preferences");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      // Request permission if needed
      if (permission !== "granted") {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);

        if (newPermission !== "granted") {
          toast.error("Please allow notifications in your browser settings");
          return;
        }
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      // Save subscription to database
      const serializedSubscription = JSON.parse(JSON.stringify(subscription));
      const result = await subscribeUserToPushNotifications(
        serializedSubscription,
      );

      if (result.success) {
        setIsSubscribed(true);
        toast.success("Push notifications enabled successfully!");
      } else {
        toast.error("Failed to enable notifications");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    }
  };

  const handleUnsubscribe = async () => {
    try {
      // Unsubscribe from push notifications
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Update database
      const result = await unsubscribeUserFromPushNotifications();

      if (result.success) {
        setIsSubscribed(false);
        toast.success("Push notifications disabled");
      } else {
        toast.error("Failed to disable notifications");
      }
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toast.error("Failed to disable notifications");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="border-org-primary h-6 w-6 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are not supported in your browser. Please use a
              modern browser like Chrome, Firefox, or Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${isSubscribed ? "bg-green-100" : "bg-gray-100"}`}
            >
              {isSubscribed ? (
                <Bell className="h-4 w-4 text-green-600" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-gray-600">
                {isSubscribed
                  ? "You'll receive notifications for tee time confirmations and club updates"
                  : "Enable to receive booking confirmations and important updates"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSubscribed ? "default" : "outline"}>
              {isSubscribed ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>

        {/* Permission Alert */}
        {permission === "denied" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Notifications are blocked in your browser. To enable
              notifications, click the lock icon in your address bar and allow
              notifications for this site.
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="push-notifications"
              className="flex items-center gap-2"
            >
              <Smartphone className="h-4 w-4" />
              Enable Push Notifications
            </Label>
            <Switch
              id="push-notifications"
              checked={isSubscribed}
              onCheckedChange={handleToggleNotifications}
              disabled={isUpdating || permission === "denied"}
            />
          </div>

          {isSubscribed && (
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">What you'll receive:</p>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Tee time booking confirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Important club announcements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Event updates and reminders</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="border-t pt-4 text-xs text-gray-500">
          <p>
            Notifications are delivered directly to your device and can be
            managed in your browser settings. You can disable them at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
