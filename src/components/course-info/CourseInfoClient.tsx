"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CourseInfoDisplay } from "./CourseInfoDisplay";

interface CourseInfoClientProps {
  data: any;
}

export function CourseInfoClient({ data }: CourseInfoClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-neutral-50"
      >
        <h3 className="text-lg font-medium text-neutral-800">
          Today's Course Information
        </h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-neutral-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6">
          <CourseInfoDisplay data={data} />
        </div>
      )}
    </div>
  );
}
