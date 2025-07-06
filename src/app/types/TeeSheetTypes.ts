import { type TimeBlockGuest } from "./GuestTypes";

export const FillTypes = {
  GUEST: "guest_fill",
  RECIPROCAL: "reciprocal_fill",
  CUSTOM: "custom_fill",
} as const;

export type FillType = (typeof FillTypes)[keyof typeof FillTypes];

// New Config Types
export enum ConfigTypes {
  REGULAR = "REGULAR",
  CUSTOM = "CUSTOM",
}

export type ConfigType = (typeof ConfigTypes)[keyof typeof ConfigTypes];

export interface TimeBlockFill {
  id: number;
  timeBlockId: number;
  fillType: FillType;
  customName?: string | null;
  createdAt: Date;
}

export interface TeeSheet {
  id: number;
  date: string;
  configId: number;
  generalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlock {
  id: number;
  teesheetId: number;
  startTime: string;
  endTime: string;
  displayName?: string | null; // For custom display ("Hole 1 - 9:00 AM")
  templateId?: number; // Reference to template if using one
  maxMembers: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date | null;
  type: ConfigTypes;
  notes?: string | null;
  date?: string;
}

export interface TimeBlockMemberView {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
  class?: string;
  bagNumber?: string | null;
  username: string;
  email: string;
  gender?: string | null;
  dateOfBirth?: Date | string | null;
  handicap?: string | null;
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

// Add new template types
export interface TemplateBlock {
  displayName: string | null;
  startTime: string;
  maxPlayers: number;
}

export interface TimeBlockTemplate {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  displayName: string;
  maxMembers: number;
  sortOrder: number;
  configId: number;
  createdAt?: Date;
  updatedAt?: Date | null;
}

export interface Template {
  id: number;
  name: string;
  type: ConfigTypes;
  // For REGULAR templates
  startTime?: string;
  endTime?: string;
  interval?: number;
  maxMembersPerBlock?: number;
  // For CUSTOM templates
  blocks?: TemplateBlock[];
  createdAt?: Date;
  updatedAt?: Date | null;
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
  configId: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

// Base config interface
interface BaseConfig {
  id: number;
  name: string;
  type: ConfigTypes;
  isActive: boolean;
  isSystemConfig: boolean;
  disallowMemberBooking: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  rules: TeesheetConfigRule[];
}

// Regular sequential tee times config
export interface RegularConfig extends BaseConfig {
  type: ConfigTypes.REGULAR;
  startTime: string;
  endTime: string;
  interval: number;
  maxMembersPerBlock: number;
}

// Custom block configuration
export interface CustomConfig extends BaseConfig {
  type: ConfigTypes.CUSTOM;
  templateId: number;
}

export type TeesheetConfig = RegularConfig | CustomConfig;

export interface TeesheetConfigInput {
  name: string;
  type: ConfigTypes;
  startTime?: string;
  endTime?: string;
  interval?: number;
  maxMembersPerBlock?: number;
  templateId?: number;
  blocks?: TemplateBlock[];
  isActive: boolean;
  isSystemConfig?: boolean;
  disallowMemberBooking?: boolean;
  rules: TeesheetConfigRuleInput[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  type: "stroke" | "distance" | "time" | "other";
  value: number;
  unit?: string;
}
