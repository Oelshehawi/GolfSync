"use client";

import * as React from "react";
import { cn, getOrganizationColors } from "~/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, theme, ...props }, ref) => {
    const colors = getOrganizationColors(theme);
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        style={{
          borderColor: colors.primary,
          color: colors.text.primary,
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
