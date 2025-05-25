import { TimeBlockGuest } from "./GuestTypes";

export const FillTypes = {
  GUEST: "guest_fill",
  RECIPROCAL: "reciprocal_fill",
  CUSTOM: "custom_fill",
} as const;

export type FillType = (typeof FillTypes)[keyof typeof FillTypes];

export interface TimeBlockFill {
  id: number;
  timeBlockId: number;
  fillType: FillType;
  customName?: string | null;
  clerkOrgId: string;
  createdAt: Date;
}

export interface TeeSheet {
  id: number;
  clerkOrgId: string;
  date: string;
  configId: number;
  generalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlock {
  id: number;
  clerkOrgId: string;
  teesheetId: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlockMemberView {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
  class?: string;
  bagNumber?: string | null;
  checkedIn?: boolean;
  checkedInAt?: Date | null;
}

export interface TimeBlockWithMembers extends TimeBlock {
  members: TimeBlockMemberView[];
  guests: TimeBlockGuest[];
  fills: TimeBlockFill[];
  notes?: string | null;
  date?: string;
}

export interface TeesheetConfigRuleInput {
  daysOfWeek: number[] | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  isActive: boolean;
}

export interface TeesheetConfigRule
  extends Omit<TeesheetConfigRuleInput, "startDate" | "endDate"> {
  id: number;
  clerkOrgId: string;
  configId: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TeesheetConfigInput {
  name: string;
  startTime: string;
  endTime: string;
  interval: number;
  maxMembersPerBlock: number;
  isActive: boolean;
  isSystemConfig?: boolean;
  rules: TeesheetConfigRuleInput[];
}

export interface TeesheetConfig extends Omit<TeesheetConfigInput, "rules"> {
  id: number;
  clerkOrgId: string;
  isSystemConfig: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  rules: TeesheetConfigRule[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: "stroke" | "distance" | "time" | "other";
  value: number;
  unit?: string;
}
