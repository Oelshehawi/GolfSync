"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Trophy,
  Clock10,
  Eye,
  Edit,
  Bell,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { cn, formatTimeStringTo12Hour, preserveDate } from "~/lib/utils";
import Link from "next/link";
import { EventDialog } from "./admin/EventDialog";
import { useMediaQuery } from "~/hooks/use-media-query";
import RegisterForEventButton from "./members/RegisterForEventButton";
import RegistrationsDialog from "./admin/RegistrationsDialog";
import DeleteEventButton from "./admin/DeleteEventButton";
import { EventCardProps } from "~/app/types/events";

// Helper function to get event type badge details
function getEventTypeBadge(eventType: string) {
  switch (eventType) {
    case "TOURNAMENT":
      return { label: "Tournament", variant: "default", icon: Trophy };
    case "DINNER":
      return { label: "Dinner", variant: "secondary", icon: Clock10 };
    case "SOCIAL":
      return { label: "Social Event", variant: "outline", icon: Users };
    case "MEETING":
      return { label: "Meeting", variant: "destructive", icon: Calendar };
    default:
      return { label: "Event", variant: "outline", icon: Calendar };
  }
}

export function EventCard({
  event,
  linkPrefix = "/admin/events",
  className,
  isAdmin = false,
  isMember = false,
  memberId,
  isRegistered = false,
  registrations = [],
  registrationStatus,
  variant = "default",
}: EventCardProps & { variant?: "default" | "compact" }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registrationsDialogOpen, setRegistrationsDialogOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const {
    label,
    variant: badgeVariant,
    icon: Icon,
  } = getEventTypeBadge(event.eventType);

  // Ensure we have proper Date objects using the utility function
  const startDate = preserveDate(event.startDate) || new Date();
  const endDate = preserveDate(event.endDate) || new Date();
  const registrationDeadline = event.registrationDeadline
    ? preserveDate(event.registrationDeadline)
    : undefined;

  const isSingleDay = startDate.toDateString() === endDate.toDateString();

  // Create a truncated description
  const truncatedDescription =
    event.description.length >
    (variant === "compact" ? 60 : isMobile ? 80 : 120)
      ? `${event.description.substring(0, variant === "compact" ? 60 : isMobile ? 80 : 120)}...`
      : event.description;

  // Format event times
  const startTimeFormatted = event.startTime
    ? formatTimeStringTo12Hour(event.startTime)
    : "";

  const endTimeFormatted = event.endTime
    ? formatTimeStringTo12Hour(event.endTime)
    : "";

  const timeDisplay = startTimeFormatted
    ? endTimeFormatted
      ? `${startTimeFormatted} - ${endTimeFormatted}`
      : startTimeFormatted
    : "";

  // Format event dates
  const dateDisplay = isSingleDay
    ? format(startDate, "EEE, MMMM d, yyyy")
    : `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;

  // Check if registration deadline is past
  const isRegistrationClosed = registrationDeadline
    ? new Date() > registrationDeadline
    : false;

  // Has pending registrations that need approval
  const hasPendingRegistrations =
    isAdmin &&
    event.pendingRegistrationsCount &&
    event.pendingRegistrationsCount > 0;

  // Get registration status badge and custom class
  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { variant: "default", className: "" };
      case "PENDING":
        return {
          variant: "outline",
          className: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "REJECTED":
        return { variant: "destructive", className: "" };
      default:
        return { variant: "secondary", className: "" };
    }
  };

  // Determine badge text based on status
  const getRegistrationStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Registered";
      case "PENDING":
        return "Pending Approval";
      case "REJECTED":
        return "Registration Rejected";
      default:
        return "Unknown Status";
    }
  };

  // Render compact variant for member view
  if (variant === "compact") {
    return (
      <>
        <Card className={cn("w-full", className)}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-org-primary" />
                  <span>{dateDisplay}</span>
                  {timeDisplay && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span>{timeDisplay}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge
                variant={badgeVariant as any}
                className="flex items-center gap-1"
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </Badge>
            </div>
          </CardHeader>

          <CardFooter className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="flex-1"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Button>
            {isMember && !isRegistered && memberId && (
              <RegisterForEventButton
                eventId={event.id}
                memberId={memberId}
                disabled={!event.isActive || isRegistrationClosed}
                requiresApproval={event.requiresApproval}
                className="flex-1"
              />
            )}
            {isRegistered && registrationStatus && (
              <Badge
                variant={
                  getRegistrationStatusBadge(registrationStatus).variant as any
                }
                className={cn(
                  "px-2 py-1 text-xs font-medium",
                  getRegistrationStatusBadge(registrationStatus).className,
                )}
              >
                {getRegistrationStatusText(registrationStatus)}
              </Badge>
            )}
          </CardFooter>
        </Card>

        {/* Event Detail Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">{event.name}</DialogTitle>
                  <DialogDescription>Event Details</DialogDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={badgeVariant as any}>{event.eventType}</Badge>
                  {!event.isActive && <Badge variant="outline">Inactive</Badge>}
                  {isRegistered && registrationStatus && (
                    <Badge
                      variant={
                        getRegistrationStatusBadge(registrationStatus)
                          .variant as any
                      }
                      className={
                        getRegistrationStatusBadge(registrationStatus).className
                      }
                    >
                      {getRegistrationStatusText(registrationStatus)}
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Mobile-optimized event info card */}
              <div className="rounded-lg border bg-gray-50/50 p-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 shrink-0 text-org-primary" />
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Date
                      </span>
                      <p className="font-medium">{dateDisplay}</p>
                    </div>
                  </div>

                  {timeDisplay && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 shrink-0 text-org-primary" />
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Time
                        </span>
                        <p className="font-medium">{timeDisplay}</p>
                      </div>
                    </div>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 shrink-0 text-org-primary" />
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Location
                        </span>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.capacity && (
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 shrink-0 text-org-primary" />
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Capacity
                        </span>
                        <p className="font-medium">
                          {event.registrationsCount || 0} / {event.capacity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
                    {event.description}
                  </p>
                </div>

                {event.details &&
                  Object.values(event.details).some((val) => val !== null) && (
                    <>
                      <Separator />
                      <div className="mt-4">
                        <h3 className="mb-2 text-sm font-medium">
                          Additional Details
                        </h3>

                        {event.details.format && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-gray-600">
                              Format
                            </h4>
                            <p className="text-sm">{event.details.format}</p>
                          </div>
                        )}

                        {event.details.rules && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-gray-600">
                              Rules
                            </h4>
                            <p className="text-sm whitespace-pre-line">
                              {event.details.rules}
                            </p>
                          </div>
                        )}

                        {event.details.prizes && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-gray-600">
                              Prizes
                            </h4>
                            <p className="text-sm whitespace-pre-line">
                              {event.details.prizes}
                            </p>
                          </div>
                        )}

                        {event.details.entryFee !== null &&
                          event.details.entryFee !== undefined && (
                            <div className="mb-2">
                              <h4 className="text-xs font-medium text-gray-600">
                                Entry Fee
                              </h4>
                              <p className="text-sm">
                                ${event.details.entryFee.toFixed(2)}
                              </p>
                            </div>
                          )}

                        {event.details.additionalInfo && (
                          <div className="mb-2">
                            <h4 className="text-xs font-medium text-gray-600">
                              Additional Information
                            </h4>
                            <p className="text-sm whitespace-pre-line">
                              {event.details.additionalInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {isMember && !isRegistered && memberId && (
                <RegisterForEventButton
                  eventId={event.id}
                  memberId={memberId}
                  disabled={!event.isActive || isRegistrationClosed}
                  requiresApproval={event.requiresApproval}
                  className="w-full"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Return the original card for admin view
  return (
    <>
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-start justify-between sm:hidden">
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <Badge
                  variant={badgeVariant as any}
                  className="ml-2 flex items-center gap-1 self-start"
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </Badge>
              </div>
              <CardTitle className="hidden text-xl sm:block">
                {event.name}
              </CardTitle>
              <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 sm:bg-transparent sm:px-0 sm:py-0">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-org-primary" />
                  <span className="font-medium">{dateDisplay}</span>
                </div>
                {timeDisplay && (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-org-primary" />
                    <span>{timeDisplay}</span>
                  </div>
                )}
                {event.location && (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-org-primary" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={badgeVariant as any}
                className="mt-2 hidden items-center gap-1 sm:flex"
              >
                <Icon className="h-3 w-3" />
                <span>{label}</span>
              </Badge>

              {hasPendingRegistrations && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800"
                >
                  <Bell className="h-3 w-3" />
                  <span>{event.pendingRegistrationsCount} Pending</span>
                </Badge>
              )}

              {event.memberClasses && event.memberClasses.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {event.memberClasses.join(", ")}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <p className="text-muted-foreground text-sm">
            {truncatedDescription}
          </p>

          {(event.capacity !== undefined ||
            event.registrationsCount !== undefined) && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-org-primary" />
              <span>
                {event.registrationsCount || 0}
                {event.capacity !== null &&
                  event.capacity !== undefined &&
                  ` / ${event.capacity}`}{" "}
                participants
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className={cn("w-full")}
          >
            <span className="flex items-center justify-center gap-1">
              <Eye className="mr-1 h-4 w-4" />
              View Details
            </span>
          </Button>

          {isMember && !isRegistered && memberId && (
            <div className="w-full">
              <RegisterForEventButton
                eventId={event.id}
                memberId={memberId}
                disabled={!event.isActive || isRegistrationClosed}
                requiresApproval={event.requiresApproval}
              />
            </div>
          )}

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegistrationsDialogOpen(true)}
              className={
                hasPendingRegistrations
                  ? "w-full bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : "w-full"
              }
            >
              <Bell className="mr-2 h-4 w-4" />
              <span>
                {hasPendingRegistrations
                  ? `Review ${event.pendingRegistrationsCount} Pending`
                  : "Manage Registrations"}
              </span>
            </Button>
          )}

          {isRegistered && registrationStatus && (
            <Badge
              variant={
                getRegistrationStatusBadge(registrationStatus).variant as any
              }
              className={cn(
                "px-2 py-1 text-xs font-medium",
                getRegistrationStatusBadge(registrationStatus).className,
              )}
            >
              {getRegistrationStatusText(registrationStatus)}
            </Badge>
          )}

          {!event.isActive && (
            <Badge variant="outline" className="text-muted-foreground ml-2">
              Inactive
            </Badge>
          )}
        </CardFooter>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">{event.name}</DialogTitle>
                <DialogDescription>Event Details</DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={badgeVariant as any}>{event.eventType}</Badge>
                {!event.isActive && <Badge variant="outline">Inactive</Badge>}
                {isRegistered && registrationStatus && (
                  <Badge
                    variant={
                      getRegistrationStatusBadge(registrationStatus)
                        .variant as any
                    }
                    className={
                      getRegistrationStatusBadge(registrationStatus).className
                    }
                  >
                    {getRegistrationStatusText(registrationStatus)}
                  </Badge>
                )}
                {hasPendingRegistrations && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800"
                  >
                    <Bell className="h-3 w-3" />
                    <span>{event.pendingRegistrationsCount} Pending</span>
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Mobile-optimized event info card */}
            <div className="rounded-lg border bg-gray-50/50 p-4 sm:hidden">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 shrink-0 text-org-primary" />
                  <div>
                    <span className="text-xs font-medium text-gray-600">
                      Date
                    </span>
                    <p className="font-medium">{dateDisplay}</p>
                  </div>
                </div>

                {timeDisplay && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 shrink-0 text-org-primary" />
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Time
                      </span>
                      <p className="font-medium">{timeDisplay}</p>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 shrink-0 text-org-primary" />
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Location
                      </span>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                )}

                {event.capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 shrink-0 text-org-primary" />
                    <div>
                      <span className="text-xs font-medium text-gray-600">
                        Capacity
                      </span>
                      <p className="font-medium">
                        {event.registrationsCount || 0} / {event.capacity}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
                <CardDescription>Details about this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Description</h3>
                      <p className="text-muted-foreground mt-1 text-sm whitespace-pre-line">
                        {event.description}
                      </p>
                    </div>

                    {/* Desktop event info */}
                    <div className="hidden sm:block">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium">Start Date</h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {format(startDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">End Date</h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {format(endDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {(event.startTime || event.endTime) && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {event.startTime && (
                            <div>
                              <h3 className="text-sm font-medium">
                                Start Time
                              </h3>
                              <p className="text-muted-foreground mt-1 text-sm">
                                {startTimeFormatted}
                              </p>
                            </div>
                          )}
                          {event.endTime && (
                            <div>
                              <h3 className="text-sm font-medium">End Time</h3>
                              <p className="text-muted-foreground mt-1 text-sm">
                                {endTimeFormatted}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {event.location && (
                        <div className="mt-4">
                          <h3 className="text-sm font-medium">Location</h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {event.location}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium">Capacity</h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {event.capacity !== null &&
                          event.capacity !== undefined
                            ? event.capacity
                            : "Unlimited"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">
                          Requires Approval
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {event.requiresApproval ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    {registrationDeadline && (
                      <div>
                        <h3 className="text-sm font-medium">
                          Registration Deadline
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {format(registrationDeadline, "MMMM d, yyyy")}
                        </p>
                      </div>
                    )}

                    {event.details &&
                      Object.values(event.details).some(
                        (val) => val !== null,
                      ) && (
                        <>
                          <Separator />
                          <div className="mt-4">
                            <h3 className="mb-2 text-sm font-medium">
                              Additional Details
                            </h3>

                            {event.details.format && (
                              <div className="mb-2">
                                <h4 className="text-xs font-medium text-gray-600">
                                  Format
                                </h4>
                                <p className="text-sm">
                                  {event.details.format}
                                </p>
                              </div>
                            )}

                            {event.details.rules && (
                              <div className="mb-2">
                                <h4 className="text-xs font-medium text-gray-600">
                                  Rules
                                </h4>
                                <p className="text-sm whitespace-pre-line">
                                  {event.details.rules}
                                </p>
                              </div>
                            )}

                            {event.details.prizes && (
                              <div className="mb-2">
                                <h4 className="text-xs font-medium text-gray-600">
                                  Prizes
                                </h4>
                                <p className="text-sm whitespace-pre-line">
                                  {event.details.prizes}
                                </p>
                              </div>
                            )}

                            {event.details.entryFee !== null &&
                              event.details.entryFee !== undefined && (
                                <div className="mb-2">
                                  <h4 className="text-xs font-medium text-gray-600">
                                    Entry Fee
                                  </h4>
                                  <p className="text-sm">
                                    ${event.details.entryFee.toFixed(2)}
                                  </p>
                                </div>
                              )}

                            {event.details.additionalInfo && (
                              <div className="mb-2">
                                <h4 className="text-xs font-medium text-gray-600">
                                  Additional Information
                                </h4>
                                <p className="text-sm whitespace-pre-line">
                                  {event.details.additionalInfo}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {isMember && !isRegistered && memberId && (
              <div className="w-full">
                <RegisterForEventButton
                  eventId={event.id}
                  memberId={memberId}
                  disabled={!event.isActive || isRegistrationClosed}
                  requiresApproval={event.requiresApproval}
                />
              </div>
            )}

            <div className="flex w-full justify-end gap-2">
              {isAdmin && (
                <>
                  <EventDialog
                    existingEvent={event as any}
                    triggerButton={
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    }
                  />

                  <DeleteEventButton
                    eventId={event.id}
                    eventName={event.name}
                  />
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Registrations Management Dialog */}
      {isAdmin && (
        <RegistrationsDialog
          eventId={event.id}
          eventName={event.name}
          registrations={registrations}
          requiresApproval={!!event.requiresApproval}
          capacity={event.capacity}
          isOpen={registrationsDialogOpen}
          onOpenChange={setRegistrationsDialogOpen}
        />
      )}
    </>
  );
}
