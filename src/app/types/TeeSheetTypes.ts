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

export interface TimeBlockWithMembers extends TimeBlock {
  members: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  }[];
}

export interface TeesheetConfig {
  id: number;
  clerkOrgId: string;
  name: string;
  startTime: string;
  endTime: string;
  interval: number;
  maxMembersPerBlock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TeesheetConfigRule {
  id: number;
  clerkOrgId: string;
  configId: number;
  daysOfWeek: number[];
  startDate: Date | null;
  endDate: Date | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}
