"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { useState } from "react";
import Link from "next/link";

interface TeesheetHeaderProps {
  date: Date;
}

export function TeesheetHeader({ date }: TeesheetHeaderProps) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [showCalendar, setShowCalendar] = useState(false);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleDateChange(-1)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h1>
          <button
            onClick={() => handleDateChange(1)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            →
          </button>
        </div>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          {format(selectedDate, "MMMM yyyy")}
        </button>
      </div>

      {showCalendar && (
        <div className="mt-4 rounded-lg border bg-white p-4 shadow-lg">
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => (
              <Link
                key={day.toISOString()}
                href={`/admin?date=${format(day, "yyyy-MM-dd")}`}
                className={`flex h-10 items-center justify-center rounded-full text-sm transition-colors ${
                  isToday(day)
                    ? "bg-blue-600 text-white"
                    : isSameMonth(day, selectedDate)
                      ? "text-gray-900 hover:bg-gray-100"
                      : "text-gray-400"
                }`}
              >
                {format(day, "d")}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
