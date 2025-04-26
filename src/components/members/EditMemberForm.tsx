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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { memberFormSchema } from "./memberFormSchema";
import type { Member } from "~/app/types/MemberTypes";
import { ThemeConfig } from "~/app/types/UITypes";

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface EditMemberFormProps {
  member: Member;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel: () => void;
  theme: ThemeConfig;
}

// Member class options
const memberClasses = [
  { label: "Unlimited Play Male", value: "UNLIMITED PLAY MALE" },
  { label: "Unlimited Play Female", value: "UNLIMITED PLAY FEMALE" },
  { label: "Full Play Male", value: "FULL PLAY MALE" },
  { label: "Full Play Female", value: "FULL PLAY FEMALE" },
  { label: "Social Male", value: "SOCIAL MALE" },
  { label: "Social Female", value: "SOCIAL FEMALE" },
  { label: "Intermediate Male", value: "INTERMEDIATE MALE" },
  { label: "Intermediate Female", value: "INTERMEDIATE FEMALE" },
  { label: "Jr Intermediate Male", value: "JR INTERMEDIATE MALE" },
  { label: "Jr Intermediate Female", value: "JR INTERMEDIATE FEMALE" },
  { label: "Junior Boy", value: "JUNIOR BOY" },
  { label: "Junior Girl", value: "JUNIOR GIRL" },
  { label: "Weekday Play Male", value: "WEEKDAY PLAY MALE" },
  { label: "Weekday Play Female", value: "WEEKDAY PLAY FEMALE" },
  { label: "Non-Resident Male", value: "NON-RESIDENT MALE" },
  { label: "Non-Resident Female", value: "NON-RESIDENT FEMALE" },
  { label: "Staff Play", value: "STAFF PLAY" },
  { label: "Management/Pro", value: "MGMT / PRO" },
  { label: "Dining", value: "DINING" },
  { label: "Privileged Male", value: "PRIVILEGED MALE" },
  { label: "Privileged Female", value: "PRIVILEGED FEMALE" },
  { label: "Senior Retired Male", value: "SENIOR RETIRED MALE" },
  { label: "Senior Retired Female", value: "SENIOR RETIRED FEMALE" },
  { label: "Honorary Male", value: "HONORARY MALE" },
  { label: "Honorary Female", value: "HONORARY FEMALE" },
];

export function EditMemberForm({
  member,
  onSubmit,
  onCancel,
  theme,
}: EditMemberFormProps) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      memberNumber: member.memberNumber,
      firstName: member.firstName,
      lastName: member.lastName,
      username: member.username,
      email: member.email,
      class: member.class,
      gender: member.gender || "",
      dateOfBirth: member.dateOfBirth
        ? new Date(member.dateOfBirth).toISOString().split("T")[0]
        : "",
      handicap: member.handicap || "",
      bagNumber: member.bagNumber || "",
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
                  <Input
                    theme={theme}
                    placeholder="Enter member number"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Class</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                        )}
                        theme={theme}
                      >
                        {field.value
                          ? memberClasses.find(
                              (memberClass) =>
                                memberClass.value === field.value,
                            )?.label
                          : "Select class"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" theme={theme}>
                    <Command theme={theme}>
                      <CommandInput placeholder="Search for class..." />
                      <CommandEmpty>No class found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {memberClasses.map((memberClass) => (
                          <CommandItem
                            key={memberClass.value}
                            value={memberClass.value}
                            onSelect={(value) => {
                              field.onChange(
                                memberClasses.find(
                                  (item) =>
                                    item.value.toLowerCase() ===
                                    value.toLowerCase(),
                                )?.value,
                              );
                            }}
                            theme={theme}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === memberClass.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {memberClass.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <Input
                    theme={theme}
                    placeholder="Enter first name"
                    {...field}
                  />
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
                  <Input
                    theme={theme}
                    placeholder="Enter last name"
                    {...field}
                  />
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
                  <Input
                    theme={theme}
                    placeholder="Enter username"
                    {...field}
                  />
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
                  <Input
                    theme={theme}
                    type="email"
                    placeholder="Enter email"
                    {...field}
                  />
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
                    <SelectTrigger theme={theme}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent theme={theme}>
                    <SelectItem value="M" theme={theme}>
                      Male
                    </SelectItem>
                    <SelectItem value="F" theme={theme}>
                      Female
                    </SelectItem>
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
                  <Input
                    type="date"
                    {...field}
                    className="cursor-pointer focus:border-[var(--org-primary)] focus:ring-2 focus:ring-[var(--org-primary)]"
                    theme={theme}
                  />
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
                  <Input
                    theme={theme}
                    placeholder="Enter handicap"
                    {...field}
                  />
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
                  <Input
                    theme={theme}
                    placeholder="Enter bag number"
                    {...field}
                  />
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
          <Button type="submit">Update Member</Button>
        </div>
      </form>
    </Form>
  );
}
