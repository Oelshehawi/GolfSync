import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberFormSchema } from "./memberFormSchema";
import type { MemberFormValues } from "./memberFormSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Member } from "~/app/types/MemberTypes";
import { cn } from "~/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { MEMBER_CLASSES } from "~/lib/constants/memberClasses";

interface EditMemberFormProps {
  member: Member;
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel: () => void;
}

export function EditMemberForm({
  member,
  onSubmit,
  onCancel,
}: EditMemberFormProps) {
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema) as any,
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
      <form
        onSubmit={form.handleSubmit(handleSubmit as any)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
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
            control={form.control as any}
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
                      >
                        {field.value
                          ? MEMBER_CLASSES.find(
                              (memberClass) =>
                                memberClass.value === field.value,
                            )?.label
                          : "Select class"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search for class..." />
                      <CommandEmpty>No class found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        {MEMBER_CLASSES.map((memberClass) => (
                          <CommandItem
                            key={memberClass.value}
                            value={memberClass.value}
                            onSelect={(value) => {
                              field.onChange(
                                MEMBER_CLASSES.find(
                                  (item) =>
                                    item.value.toLowerCase() ===
                                    value.toLowerCase(),
                                )?.value,
                              );
                            }}
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
            control={form.control as any}
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
            control={form.control as any}
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
            control={form.control as any}
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
            control={form.control as any}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email address"
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
            control={form.control as any}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Input placeholder="Enter gender" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
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
            control={form.control as any}
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
            control={form.control as any}
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
