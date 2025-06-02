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
  charged: boolean;
  numHoles: number;
  isSplit: boolean;
};

export type GeneralChargeWithRelations = {
  id: number;
  date: string;
  chargeType: string;
  paymentMethod: "VISA" | "ACCOUNT" | "MASTERCARD" | "DEBIT" | "OTHER" | null;
  staffInitials: string;
  member: Member | null;
  guest: Guest | null;
  sponsorMember: Member | null;
  charged: boolean;
};

export interface PowerCartAssignmentData {
  memberId?: number;
  guestId?: number;
  numHoles: 9 | 18;
  isSplit: boolean;
  splitWithMemberId?: number;
  isMedical: boolean;
  staffInitials: string;
  date: Date;
}

export interface ChargeCompletionData {
  chargeId: number;
  paymentMethod: "VISA" | "ACCOUNT" | "MASTERCARD" | "DEBIT" | "OTHER";
  memberNumber?: string; // For billing to a different member's account
}

export type ChargeType = "power-cart" | "general";

export interface PendingChargeActions {
  onComplete: (data: ChargeCompletionData, type: ChargeType) => Promise<void>;
  onDelete: (chargeId: number, type: ChargeType) => Promise<void>;
}
