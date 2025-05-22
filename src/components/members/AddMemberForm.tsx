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
import { SearchableSelect } from "~/components/ui/searchable-select";
import { memberFormSchema } from "./memberFormSchema";
type MemberFormValues = z.infer<typeof memberFormSchema>;

interface AddMemberFormProps {
  onSubmit: (values: MemberFormValues) => Promise<void>;
  onCancel: () => void;
}

export function AddMemberForm({ onSubmit, onCancel }: AddMemberFormProps) {
  const form = useForm<MemberFormValues>({
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

  const handleSubmit = async (values: MemberFormValues) => {
    await onSubmit(values);
  };

  // Define member class options
  const memberClassOptions = [
    { value: "UNLIMITED PLAY MALE", label: "Unlimited Play Male" },
    { value: "UNLIMITED PLAY FEMALE", label: "Unlimited Play Female" },
    { value: "FULL PLAY MALE", label: "Full Play Male" },
    { value: "FULL PLAY FEMALE", label: "Full Play Female" },
    { value: "SOCIAL MALE", label: "Social Male" },
    { value: "SOCIAL FEMALE", label: "Social Female" },
    { value: "INTERMEDIATE MALE", label: "Intermediate Male" },
    { value: "INTERMEDIATE FEMALE", label: "Intermediate Female" },
    { value: "JR INTERMEDIATE MALE", label: "Jr Intermediate Male" },
    { value: "JR INTERMEDIATE FEMALE", label: "Jr Intermediate Female" },
    { value: "JUNIOR BOY", label: "Junior Boy" },
    { value: "JUNIOR GIRL", label: "Junior Girl" },
    { value: "WEEKDAY PLAY MALE", label: "Weekday Play Male" },
    { value: "WEEKDAY PLAY FEMALE", label: "Weekday Play Female" },
    { value: "NON-RESIDENT MALE", label: "Non-Resident Male" },
    { value: "NON-RESIDENT FEMALE", label: "Non-Resident Female" },
    { value: "STAFF PLAY", label: "Staff Play" },
    { value: "MGMT / PRO", label: "Management/Pro" },
    { value: "DINING", label: "Dining" },
    { value: "PRIVILEGED MALE", label: "Privileged Male" },
    { value: "PRIVILEGED FEMALE", label: "Privileged Female" },
    { value: "SENIOR RETIRED MALE", label: "Senior Retired Male" },
    { value: "SENIOR RETIRED FEMALE", label: "Senior Retired Female" },
    { value: "HONORARY MALE", label: "Honorary Male" },
    { value: "HONORARY FEMALE", label: "Honorary Female" },
  ];

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
                  <Input type="email" placeholder="Enter email" {...field} />
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

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Create Member</Button>
        </div>
      </form>
    </Form>
  );
}
