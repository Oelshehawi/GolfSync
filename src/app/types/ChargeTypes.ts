import { type members, type guests } from "~/server/db/schema";

export type Member = Pick<
  typeof members.$inferSelect,
  "id" | "firstName" | "lastName" | "memberNumber"
>;

export type Guest = Pick<
  typeof guests.$inferSelect,
  "id" | "firstName" | "lastName"
>;

export type PowerCartChargeWithRelations = {
  id: number;
  date: string;
  isMedical: boolean;
  staffInitials: string;
  member: Member | null;
  guest: Guest | null;
  splitWithMember: Member | null;
};

export type GeneralChargeWithRelations = {
  id: number;
  date: string;
  chargeType: string;
  paymentMethod: "VISA" | "ACCOUNT" | "MASTERCARD" | null;
  staffInitials: string;
  member: Member | null;
  guest: Guest | null;
  sponsorMember: Member | null;
};

export interface PowerCartAssignmentData {
  memberId: number;
  numHoles: 9 | 18;
  isSplit: boolean;
  splitWithMemberId?: number;
  isMedical: boolean;
  staffInitials: string;
  date: Date;
}
