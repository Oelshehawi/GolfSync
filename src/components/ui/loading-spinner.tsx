"use client";

import * as React from "react";
import { cn, getOrganizationColors } from "~/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  theme,
  className,
}: LoadingSpinnerProps) {
  const colors = getOrganizationColors(theme);
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className,
      )}
      style={{
        borderColor: colors.primary,
        borderTopColor: "transparent",
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
