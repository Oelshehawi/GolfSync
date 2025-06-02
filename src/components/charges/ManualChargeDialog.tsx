"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  createGeneralCharge,
  createPowerCartCharge,
} from "~/server/charges/actions";
import { preserveDate } from "~/lib/utils";
import { MemberSearchInput } from "~/components/members/MemberSearchInput";
import { GuestSearchInput } from "~/components/guests/GuestSearchInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface ManualChargeDialogProps {
  onSuccess?: () => void;
}

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
}

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

const powerCartSchema = z.object({
  chargeType: z.literal("POWER_CART"),
  date: z.date(),
  staffInitials: z.string().min(1, "Staff initials are required"),
  numHoles: z.enum(["9", "18"]),
  isMedical: z.boolean(),
  isSplit: z.boolean(),
});

const generalChargeSchema = z.object({
  chargeType: z.literal("GENERAL"),
  date: z.date(),
  staffInitials: z.string().min(1, "Staff initials are required"),
  paymentMethod: z.enum(["ACCOUNT", "CASH", "CREDIT", "DEBIT", "OTHER"]),
});

const chargeFormSchema = z.discriminatedUnion("chargeType", [
  powerCartSchema,
  generalChargeSchema,
]);

type ChargeFormValues = z.infer<typeof chargeFormSchema>;

export function ManualChargeDialog({ onSuccess }: ManualChargeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedSponsorMember, setSelectedSponsorMember] =
    useState<Member | null>(null);
  const [selectedSplitMember, setSelectedSplitMember] = useState<Member | null>(
    null,
  );

  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      chargeType: "GENERAL",
      date: preserveDate(new Date()),
      staffInitials: "",
      paymentMethod: "ACCOUNT",
    },
  });

  const chargeType = form.watch("chargeType");
  const isSplit = chargeType === "POWER_CART" && form.watch("isSplit");

  const resetForm = () => {
    form.reset({
      chargeType: "GENERAL",
      date: preserveDate(new Date()),
      staffInitials: "",
      paymentMethod: "ACCOUNT",
    });
    setSelectedMember(null);
    setSelectedGuest(null);
    setSelectedSponsorMember(null);
    setSelectedSplitMember(null);
  };

  const handleManualChargeSubmit = async (values: ChargeFormValues) => {
    try {
      if (values.chargeType === "POWER_CART") {
        if (!selectedMember) {
          toast.error("Please select a member");
          return;
        }

        await createPowerCartCharge({
          memberId: selectedMember.id,
          date: values.date,
          staffInitials: values.staffInitials,
          numHoles: Number(values.numHoles) as 9 | 18,
          isMedical: values.isMedical,
          isSplit: values.isSplit,
          splitWithMemberId: selectedSplitMember?.id,
        });
      } else {
        if (!selectedMember && !selectedGuest) {
          toast.error("Please select a member or guest");
          return;
        }

        await createGeneralCharge({
          memberId: selectedMember?.id,
          guestId: selectedGuest?.id,
          sponsorMemberId: selectedSponsorMember?.id,
          chargeType: values.chargeType,
          date: values.date,
          staffInitials: values.staffInitials,
          paymentMethod: values.paymentMethod,
        });
      }

      toast.success("Charge created successfully");
      setIsOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating charge:", error);
      toast.error("Failed to create charge");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Manual Charge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Charge</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleManualChargeSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="chargeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Charge Type</FormLabel>
                  <Select
                    onValueChange={(value: "POWER_CART" | "GENERAL") => {
                      field.onChange(value);
                      if (value === "POWER_CART") {
                        form.setValue("isMedical", false);
                        form.setValue("isSplit", false);
                        form.setValue("numHoles", "18");
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select charge type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="POWER_CART">Power Cart</SelectItem>
                      <SelectItem value="GENERAL">General Charge</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {chargeType === "POWER_CART" ? (
              <>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <MemberSearchInput
                      onSelect={setSelectedMember}
                      selectedMember={selectedMember}
                      placeholder="Search members..."
                    />
                  </FormItem>

                  <div className="flex space-x-4">
                    <FormField
                      control={form.control}
                      name="isMedical"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Medical</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSplit"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Split Cart</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {isSplit && (
                    <FormItem>
                      <FormLabel>Split With Member</FormLabel>
                      <MemberSearchInput
                        onSelect={setSelectedSplitMember}
                        selectedMember={selectedSplitMember}
                        placeholder="Search members..."
                      />
                    </FormItem>
                  )}

                  <FormField
                    control={form.control}
                    name="numHoles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Holes</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="9">9 Holes</SelectItem>
                            <SelectItem value="18">18 Holes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <MemberSearchInput
                      onSelect={setSelectedMember}
                      selectedMember={selectedMember}
                      placeholder="Search members..."
                    />
                  </FormItem>

                  <FormItem>
                    <FormLabel>Guest</FormLabel>
                    <GuestSearchInput
                      onSelect={setSelectedGuest}
                      selectedGuest={selectedGuest}
                      placeholder="Search guests..."
                    />
                  </FormItem>

                  {selectedGuest && (
                    <FormItem>
                      <FormLabel>Sponsor Member</FormLabel>
                      <MemberSearchInput
                        onSelect={setSelectedSponsorMember}
                        selectedMember={selectedSponsorMember}
                        placeholder="Search sponsor member..."
                      />
                    </FormItem>
                  )}

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACCOUNT">Account</SelectItem>
                            <SelectItem value="VISA">Visa</SelectItem>
                            <SelectItem value="MASTERCARD">
                              Mastercard
                            </SelectItem>
                            <SelectItem value="DEBIT">Debit</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="staffInitials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Initials</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter staff initials" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Charge</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
