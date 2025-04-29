"use client";

import { AlertTriangle } from "lucide-react";

interface AlertBoxProps {
  title: string;
  description: string;
}

export function AlertBox({ title, description }: AlertBoxProps) {
  return (
    <div className="mb-3 rounded-lg bg-red-50 p-4">
      <div className="flex items-start">
        <AlertTriangle className="mt-0.5 mr-2 h-5 w-5 text-red-600" />
        <div>
          <h3 className="font-medium text-red-800">{title}</h3>
          <p className="text-sm text-red-700">{description}</p>
        </div>
      </div>
    </div>
  );
}
