"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addMonths,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isSameDay,
} from "date-fns";

export interface DatePickerProps {
  selected: Date;
  onChange: (date: Date) => void;
}

export function DatePicker({ selected, onChange }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(selected));

  const goToPreviousMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Calculate calendar days
  const daysInMonth = getDaysInMonth(currentMonth);
  const monthStart = startOfMonth(currentMonth);
  const startDay = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

  // Create array of day numbers with empty spots for proper alignment
  const days = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Get today's date for highlighting
  const today = new Date();

  return (
    <div className="w-full px-2 py-4 sm:px-4">
      {/* Calendar */}
      <div className="rounded-md bg-white shadow-sm">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between p-3 sm:p-4">
          <button
            onClick={goToPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2 className="text-base font-semibold sm:text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </h2>

          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day names header */}
        <div className="grid grid-cols-7 border-t border-b text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-1 text-center text-xs font-medium text-gray-500 sm:p-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-0 p-2">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-1 sm:p-2" />;
            }

            const dayDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day,
            );

            const isToday = isSameDay(dayDate, today);
            const isSelected = isSameDay(dayDate, selected);

            return (
              <button
                key={`day-${day}`}
                onClick={() => onChange(dayDate)}
                className={`mx-auto my-1 flex h-8 w-8 items-center justify-center rounded-full text-xs hover:cursor-pointer hover:bg-gray-100 sm:h-10 sm:w-10 sm:text-sm ${
                  isSelected
                    ? "bg-black text-white"
                    : isToday
                      ? "bg-gray-200 font-medium text-black"
                      : ""
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
