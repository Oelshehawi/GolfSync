export interface TeeSheet {
  id: number;
  clerkOrgId: string;
  date: Date;
  configId: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlock {
  id: number;
  clerkOrgId: string;
  teesheetId: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlockMemberView {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

export interface TimeBlockWithMembers extends TimeBlock {
  members: TimeBlockMemberView[];
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
  rules: TeesheetConfigRuleInput[];
}

export interface TeesheetConfig extends Omit<TeesheetConfigInput, "rules"> {
  id: number;
  clerkOrgId: string;
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
