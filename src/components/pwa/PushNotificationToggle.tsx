"use client";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import {
  subscribeUserToPushNotifications,
  unsubscribeUserFromPushNotifications,
  getMemberPushNotificationStatus,
} from "~/server/pwa/actions";
import { urlBase64ToUint8Array } from "~/lib/utils";

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if push notifications are supported
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscriptionStatus();
      registerServiceWorker();
    } else {
      setIsLoading(false);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    } catch (error) {
      // Silent fail - service worker registration isn't critical for the UI
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getMemberPushNotificationStatus();
      if (status.success) {
        setIsSubscribed(status.enabled ?? false);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      // Request permission if needed
      if (permission !== "granted") {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);

        if (newPermission !== "granted") {
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

      // Save subscription to database (serialize the subscription object)
      const serializedSubscription = JSON.parse(JSON.stringify(subscription));
      const result = await subscribeUserToPushNotifications(
        serializedSubscription,
      );

      if (result.success) {
        setIsSubscribed(true);
      }
    } catch (error) {
      // Silent fail - user will see no change in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);

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
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <BellOff className="h-4 w-4" />
        <span>Notifications blocked</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading}
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        className="h-8 w-full sm:w-full"
      >
        {isLoading ? (
          "..."
        ) : isSubscribed ? (
          <>
            <Bell className="mr-1 h-4 w-4" />
            Notifications On
          </>
        ) : (
          <>
            <BellOff className="mr-1 h-4 w-4" />
            Enable Notifications
          </>
        )}
      </Button>
    </div>
  );
}
