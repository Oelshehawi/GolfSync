import * as z from "zod";
import { GuestFormValues } from "~/app/types/GuestTypes";

export const guestFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  handicap: z.string().optional().or(z.literal("")),
});

// Ensure the inferred type from schema matches the GuestFormValues type
export type GuestFormSchemaType = z.infer<typeof guestFormSchema>;
