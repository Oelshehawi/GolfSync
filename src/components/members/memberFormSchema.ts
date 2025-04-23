import * as z from "zod";

export const memberFormSchema = z.object({
  memberNumber: z.string().min(1, "Member number is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  class: z.string().min(1, "Class is required"),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  handicap: z.string().optional(),
  bagNumber: z.string().optional(),
});
