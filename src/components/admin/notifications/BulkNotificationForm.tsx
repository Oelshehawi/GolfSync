"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Send } from "lucide-react";
import { sendNotificationToAllMembers } from "~/server/pwa/actions";
import toast from "react-hot-toast";

interface BulkNotificationFormProps {
  validSubscriptions: number;
  hideCard?: boolean;
}

export function BulkNotificationForm({
  validSubscriptions,
  hideCard = false,
}: BulkNotificationFormProps) {
  const [title, setTitle] = useState("Quilchena Golf Club");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setIsSending(true);
      const result = await sendNotificationToAllMembers(title, message);

      if (result.success) {
        toast.success(
          `Notification sent to ${result.sent} members! ${result.expired} expired subscriptions cleaned up.`,
        );
        setMessage("");
      } else {
        toast.error("Failed to send notifications");
      }
    } catch (error) {
      toast.error("Error sending notifications");
    } finally {
      setIsSending(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notification-title">Title</Label>
        <Input
          id="notification-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notification title"
        />
      </div>

      <div>
        <Label htmlFor="notification-message">Message</Label>
        <Textarea
          id="notification-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message for all members..."
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          This will send a notification to {validSubscriptions} members
        </p>
        <Button
          onClick={handleSendNotification}
          disabled={isSending || !message.trim()}
          className="min-w-[120px]"
        >
          <Send className="mr-2 h-4 w-4" />
          {isSending ? "Sending..." : "Send Notification"}
        </Button>
      </div>
    </div>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Notification to All Members
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
