export interface Member {
  id: number;
  clerkOrgId: string;
  class: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: string | null;
  dateOfBirth: Date | string | null;
  handicap: string | null;
  bagNumber: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface TimeBlockMember {
  id: number;
  clerkOrgId: string;
  timeBlockId: number;
  memberId: number;
  createdAt: Date;
}
