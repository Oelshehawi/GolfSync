"use client";

import * as React from "react";
import { cn } from "~/lib/utils";

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
    const themeStyles = {
      ["--org-primary" as string]: theme?.primary || "#1b4d3e", // Default primary color
      ["--org-secondary" as string]: theme?.secondary,
      ["--org-tertiary" as string]: theme?.tertiary,
    } as React.CSSProperties;

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md bg-white px-3 py-2 text-sm ring-1 ring-[var(--org-primary)] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={themeStyles}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
