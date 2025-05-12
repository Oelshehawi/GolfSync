export type EventType =
  | "TOURNAMENT"
  | "DINNER"
  | "SOCIAL"
  | "MEETING"
  | "OTHER";

export interface EventDetails {
  format?: string | null;
  rules?: string | null;
  prizes?: string | null;
  entryFee?: number | null;
  additionalInfo?: string | null;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  startDate: Date | string;
  endDate: Date | string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  capacity?: number | null;
  requiresApproval: boolean;
  registrationDeadline?: Date | string | null;
  isActive: boolean;
  details?: EventDetails;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  registrationsCount?: number;
  pendingRegistrationsCount?: number;
}

export interface EventCardProps {
  event: Event;
  linkPrefix?: string;
  className?: string;
  isAdmin?: boolean;
  isMember?: boolean;
  memberId?: number;
  isRegistered?: boolean;
  registrations?: any[];
  registrationStatus?: string;
}

export type EventWithRegistrations = Event & { registrations?: any[] };

export interface RegisterForEventButtonProps {
  eventId: number;
  memberId: number;
  disabled?: boolean;
  requiresApproval?: boolean;
}

export interface EventFormProps {
  existingEvent?: Event;
  onSuccess?: () => void;
}
