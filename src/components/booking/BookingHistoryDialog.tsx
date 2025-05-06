"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { format } from "date-fns";
import { Card, CardContent } from "~/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";

export interface BookingHistoryItem {
  id: number;
  date: Date | string;
  timeBlockId: number;
  createdAt: Date | string;
  invitedBy?: string;
  invitedByMemberId?: number;
}

interface BookingHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fetchHistory: () => Promise<BookingHistoryItem[]>;
  entityName: string;
}

export function BookingHistoryDialog({
  isOpen,
  onClose,
  title,
  fetchHistory,
  entityName,
}: BookingHistoryDialogProps) {
  const [history, setHistory] = useState<BookingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading booking history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Showing booking history for {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <p>No booking history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const bookingDate = new Date(item.date);
                const createdDate = new Date(item.createdAt);

                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {format(bookingDate, "PPP")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>{format(bookingDate, "h:mm a")}</span>
                        </div>
                        {item.invitedBy && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-purple-600" />
                            <span>Invited by: {item.invitedBy}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Booked on {format(createdDate, "PPP 'at' h:mm a")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
