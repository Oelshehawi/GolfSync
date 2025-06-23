/**
 * Lottery System Types
 *
 * Simplified lottery system for mobile-first usage
 */

// Time windows for lottery preferences
export type TimeWindow =
  | "EARLY_MORNING" // 6:00-8:00
  | "MORNING" // 8:00-11:00
  | "MIDDAY" // 11:00-14:00
  | "AFTERNOON"; // 14:00-18:00

// Entry status
export type LotteryStatus =
  | "PENDING" // Just submitted
  | "PROCESSING" // Being processed by algorithm
  | "ASSIGNED" // Tee time assigned
  | "CANCELLED"; // Cancelled by member

// Individual lottery entry
export interface LotteryEntry {
  id: string;
  memberId: string;
  lotteryDate: string;
  primaryTimeWindow: TimeWindow;
  backupTimeWindow?: TimeWindow;
  specificTimePreference?: string;
  memberClass: string;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  groupId?: string;
  assignedTimeBlockId?: string;
  submittedAt: Date;
  updatedAt: Date;
}

// Group lottery entry
export interface LotteryGroup {
  id: number;
  leaderId: number;
  lotteryDate: string; // YYYY-MM-DD
  memberIds: number[]; // All members including leader
  preferredWindow: TimeWindow;
  specificTimePreference?: string | null;
  alternateWindow?: TimeWindow | null;
  status: LotteryStatus;
  submissionTimestamp: Date;
  processedAt?: Date | null;
  leaderMemberClass: string;
  createdAt: Date;
  updatedAt: Date | null;
}

// Entry types for database inserts
export interface LotteryEntryInsert {
  memberId: number;
  lotteryDate: string;
  preferredWindow: TimeWindow;
  specificTimePreference?: string | null;
  alternateWindow?: TimeWindow | null;
  memberClass: string;
  status?: LotteryStatus;
  submittedBy?: number | null;
}

export interface LotteryGroupInsert {
  leaderId: number;
  lotteryDate: string;
  memberIds: number[];
  preferredWindow: TimeWindow;
  specificTimePreference?: string | null;
  alternateWindow?: TimeWindow | null;
  leaderMemberClass: string;
  status?: LotteryStatus;
}

// Union type for lottery entry data returned from server
export type LotteryEntryData =
  | {
      type: "individual";
      entry: LotteryEntry;
    }
  | {
      type: "group";
      entry: LotteryGroup;
    }
  | {
      type: "group_member";
      entry: LotteryGroup;
    }
  | null;

// Form data types for submissions
export interface LotteryEntryFormData {
  lotteryDate: string;
  preferredWindow: TimeWindow;
  specificTimePreference?: string;
  alternateWindow?: TimeWindow;
  memberIds?: number[]; // For group entries
}

// Time window display information
export interface TimeWindowInfo {
  value: TimeWindow;
  label: string;
  description: string;
  timeRange: string;
  icon: string;
}

// Constants for time windows
export const TIME_WINDOWS: TimeWindowInfo[] = [
  {
    value: "EARLY_MORNING",
    label: "Early Morning",
    description: "Beat the crowds",
    timeRange: "6:00 AM - 8:00 AM",
    icon: "🌅",
  },
  {
    value: "MORNING",
    label: "Morning",
    description: "Popular times",
    timeRange: "8:00 AM - 11:00 AM",
    icon: "☀️",
  },
  {
    value: "MIDDAY",
    label: "Midday",
    description: "Lunch time golf",
    timeRange: "11:00 AM - 2:00 PM",
    icon: "🌞",
  },
  {
    value: "AFTERNOON",
    label: "Afternoon",
    description: "Later times",
    timeRange: "2:00 PM - 6:00 PM",
    icon: "🌤️",
  },
];

export interface LotteryEntryInput {
  lotteryDate: string;
  primaryTimeWindow: TimeWindow;
  backupTimeWindow?: TimeWindow;
  specificTimePreference?: string;
  memberClass: string;
}
