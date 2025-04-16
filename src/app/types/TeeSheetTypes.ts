import { members } from "~/server/db/schema";

export interface Member {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
  avatarUrl?: string;
}

export interface TeeSheet {
  id: number;
  date: string;
  configId: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlock {
  id: number;
  teesheetId: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date | null;
  members: Member[];
}

export interface TimeBlockWithMember extends TimeBlock {
  members: Member[];
}

export interface TimeBlockMember {
  id: number;
  timeBlockId: number;
  memberId: number;
  createdAt: Date;
}

export interface TeesheetConfig {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  interval: number;
  maxMembersPerBlock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  rules?: TeesheetConfigRule[];
}

export interface TeesheetConfigRule {
  id: number;
  configId: number;
  dayOfWeek: number | null;
  isWeekend: boolean | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}
