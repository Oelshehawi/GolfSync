"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Member } from "~/app/types/MemberTypes";
import toast from "react-hot-toast";

const memberFormSchema = z.object({
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

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  member?: Member;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MemberForm({ member, onSubmit, onCancel }: MemberFormProps) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      memberNumber: member?.memberNumber || "",
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      username: member?.username || "",
      email: member?.email || "",
      class: member?.class || "",
      gender: member?.gender || "",
      dateOfBirth: member?.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split("T")[0]
        : "",
      handicap: member?.handicap || "",
      bagNumber: member?.bagNumber || "",
    },
  });

  const handleSubmit = async (values: MemberFormValues) => {
    await onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="memberNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter member number" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNLIMITED PLAY MALE">
                      Unlimited Play Male
                    </SelectItem>
                    <SelectItem value="UNLIMITED PLAY FEMALE">
                      Unlimited Play Female
                    </SelectItem>
                    <SelectItem value="FULL PLAY MALE">
                      Full Play Male
                    </SelectItem>
                    <SelectItem value="FULL PLAY FEMALE">
                      Full Play Female
                    </SelectItem>
                    <SelectItem value="SOCIAL MALE">Social Male</SelectItem>
                    <SelectItem value="SOCIAL FEMALE">Social Female</SelectItem>
                    <SelectItem value="INTERMEDIATE MALE">
                      Intermediate Male
                    </SelectItem>
                    <SelectItem value="INTERMEDIATE FEMALE">
                      Intermediate Female
                    </SelectItem>
                    <SelectItem value="JR INTERMEDIATE MALE">
                      Jr Intermediate Male
                    </SelectItem>
                    <SelectItem value="JR INTERMEDIATE FEMALE">
                      Jr Intermediate Female
                    </SelectItem>
                    <SelectItem value="JUNIOR BOY">Junior Boy</SelectItem>
                    <SelectItem value="JUNIOR GIRL">Junior Girl</SelectItem>
                    <SelectItem value="WEEKDAY PLAY MALE">
                      Weekday Play Male
                    </SelectItem>
                    <SelectItem value="WEEKDAY PLAY FEMALE">
                      Weekday Play Female
                    </SelectItem>
                    <SelectItem value="NON-RESIDENT MALE">
                      Non-Resident Male
                    </SelectItem>
                    <SelectItem value="NON-RESIDENT FEMALE">
                      Non-Resident Female
                    </SelectItem>
                    <SelectItem value="STAFF PLAY">Staff Play</SelectItem>
                    <SelectItem value="MGMT / PRO">Management/Pro</SelectItem>
                    <SelectItem value="DINING">Dining</SelectItem>
                    <SelectItem value="PRIVILEGED MALE">
                      Privileged Male
                    </SelectItem>
                    <SelectItem value="PRIVILEGED FEMALE">
                      Privileged Female
                    </SelectItem>
                    <SelectItem value="SENIOR RETIRED MALE">
                      Senior Retired Male
                    </SelectItem>
                    <SelectItem value="SENIOR RETIRED FEMALE">
                      Senior Retired Female
                    </SelectItem>
                    <SelectItem value="HONORARY MALE">Honorary Male</SelectItem>
                    <SelectItem value="HONORARY FEMALE">
                      Honorary Female
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="handicap"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Handicap</FormLabel>
                <FormControl>
                  <Input placeholder="Enter handicap" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bagNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bag Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter bag number" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {member ? "Update Member" : "Create Member"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
