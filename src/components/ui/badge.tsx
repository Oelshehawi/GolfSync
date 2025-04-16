"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getOrganizationColors } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent",
        secondary: "border-transparent",
        destructive: "border-transparent",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

function Badge({ className, variant, theme, ...props }: BadgeProps) {
  const colors = getOrganizationColors(theme);
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={
        variant === "default"
          ? {
              backgroundColor: colors.primary,
              color: "#ffffff",
            }
          : variant === "secondary"
            ? {
                backgroundColor: colors.secondary,
                color: colors.primary,
              }
            : variant === "outline"
              ? {
                  borderColor: colors.primary,
                  color: colors.primary,
                }
              : {}
      }
      {...props}
    />
  );
}

export { Badge, badgeVariants };
