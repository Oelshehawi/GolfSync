export type EventType =
  | "TOURNAMENT"
  | "SOCIAL"
  | "DINNER"
  | "MEETING"
  | "OTHER";

export interface EventDetails {
  id?: number;
  eventId?: number;
  format?: string | null;
  rules?: string | null;
  prizes?: string | null;
  entryFee?: number | null;
  additionalInfo?: string | null;
}

// Base event interface with string dates for component use
export interface Event {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  capacity?: number | null;
  requiresApproval: boolean;
  registrationDeadline?: string | null;
  isActive: boolean;
  memberClasses: string[];
  createdAt: Date;
  updatedAt?: Date | null;
  details?: EventDetails | null;
  registrationsCount?: number;
  pendingRegistrationsCount?: number;
}

// Event with registrations data for admin use
export interface EventWithRegistrations extends Event {
  registrations?: EventRegistration[];
}

// Database event registration type
export interface EventRegistration {
  id: number;
  eventId: number;
  memberId: number;
  status: string;
  notes?: string;
  createdAt: Date;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
    [key: string]: any;
  };
}

export interface EventCardProps {
  event: Event;
  linkPrefix?: string;
  className?: string;
  isAdmin?: boolean;
  isMember?: boolean;
  memberId?: number;
  isRegistered?: boolean;
  registrations?: EventRegistration[];
  registrationStatus?: string;
  variant?: "default" | "compact";
}

export interface RegisterForEventButtonProps {
  eventId: number;
  memberId: number;
  disabled?: boolean;
  requiresApproval?: boolean;
  className?: string;
}

export interface EventFormProps {
  existingEvent?: Event;
  onSuccess?: () => void;
}
