"use client";

import { LotteryInterface } from "~/components/lottery/MemberLotteryInterface";
import { DateNavigationHeader } from "../member-teesheet-client/DateNavigationHeader";
import { DatePicker } from "../member-teesheet-client/DatePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { getDateForDB } from "~/lib/dates";
import type { LotteryEntryData } from "~/app/types/LotteryTypes";
import type { Member } from "~/app/types/MemberTypes";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";

interface LotteryViewProps {
  selectedDate: string | Date;
  lotteryEntry?: LotteryEntryData;
  member: Member;
  date: Date;
  config: TeesheetConfig;
  showDatePicker: boolean;
  swipeLoading: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onDatePickerToggle: () => void;
  onDateChange: (date: Date) => void;
  onDataChange?: () => void;
}

export function LotteryView({
  selectedDate,
  lotteryEntry = null,
  member,
  date,
  config,
  showDatePicker,
  swipeLoading,
  onPreviousDay,
  onNextDay,
  onDatePickerToggle,
  onDateChange,
  onDataChange,
}: LotteryViewProps) {
  return (
    <div className="space-y-6 pb-6">
      {/* Date Navigation Header */}
      <DateNavigationHeader
        date={date}
        onPreviousDay={onPreviousDay}
        onNextDay={onNextDay}
        onDatePickerToggle={onDatePickerToggle}
        swipeLoading={swipeLoading}
      />

      {/* Lottery Interface */}
      <LotteryInterface
        lotteryDate={
          typeof selectedDate === "string"
            ? selectedDate
            : getDateForDB(selectedDate)
        }
        lotteryEntry={lotteryEntry}
        member={member}
        config={config}
        onDataChange={onDataChange}
      />

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <Dialog open={showDatePicker} onOpenChange={onDatePickerToggle}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Date</DialogTitle>
            </DialogHeader>
            <DatePicker selected={date} onChange={onDateChange} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
