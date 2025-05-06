"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-[var(--org-primary)] text-white border-transparent",
        secondary:
          "bg-[var(--org-secondary)] text-[var(--org-primary)] border-transparent",
        destructive: "bg-red-500 text-white border-transparent",
        outline: "text-[var(--org-primary)] border-[var(--org-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
