import { Member } from "./MemberTypes";

export type BaseGuest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  handicap: string | null;
};

export type TimeBlockGuest = BaseGuest & {
  invitedByMember?: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
};

export type GuestFormValues = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  handicap?: string;
};
