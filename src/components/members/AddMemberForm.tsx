import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberFormSchema } from "./memberFormSchema";
import { type Member } from "~/app/types/MemberTypes";
import type { MemberClass } from "~/server/db/schema";
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
import { SearchableSelect } from "~/components/ui/searchable-select";

interface AddMemberFormProps {
  onSubmit: (member: Member) => Promise<void>;
  onCancel: () => void;
  memberClasses?: MemberClass[];
}

export function AddMemberForm({
  onSubmit,
  onCancel,
  memberClasses,
}: AddMemberFormProps) {
  const form = useForm<Member>({
    resolver: zodResolver(memberFormSchema) as any,
    defaultValues: {
      memberNumber: "",
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      class: "",
      gender: "",
      dateOfBirth: "",
      handicap: "",
      bagNumber: "",
    },
  });

  // Convert member classes to options with null check
  const memberClassOptions = (memberClasses || []).map((mc) => ({
    label: mc.label,
    value: mc.label,
  }));

  const handleSubmit = async (values: Member) => {
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
              <FormItem>
                <FormLabel>Class</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={memberClassOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select or search member class"
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
                  <Input placeholder="Enter email" {...field} />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control as any}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Input placeholder="M/F/O" {...field} />
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
        </div>

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

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Add Member</Button>
        </div>
      </form>
    </Form>
  );
}
