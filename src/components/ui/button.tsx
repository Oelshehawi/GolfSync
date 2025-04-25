"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--btn-bg,#06466C)] text-[var(--btn-text,white)] border border-[var(--btn-border,#06466C)] shadow-sm hover:bg-[var(--btn-bg-hover,#06466Cdd)] hover:shadow-md active:shadow-sm",
        outline:
          "bg-transparent text-[var(--btn-text,currentColor)] border border-[var(--btn-border,currentColor)] shadow-sm hover:bg-[var(--btn-bg-hover,#06466C)] hover:text-[var(--btn-text-hover,white)] hover:shadow-md active:shadow-sm",
        ghost:
          "bg-transparent text-[var(--btn-text,currentColor)] border-transparent hover:bg-[var(--btn-bg-hover,rgba(0,0,0,0.05))] hover:shadow-sm active:shadow-sm",
        destructive:
          "bg-red-500 text-white border border-red-500 shadow-sm hover:bg-red-600 hover:shadow-md active:shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, theme, style, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // Set CSS variables based on theme
    const cssVars = React.useMemo(() => {
      if (!theme) return {};

      const vars: Record<string, string> = {};

      if (theme.primary) {
        vars["--btn-bg"] = theme.primary;
        vars["--btn-border"] = theme.primary;
        vars["--btn-bg-hover"] = `${theme.primary}dd`; // Slightly transparent for hover
        vars["--btn-text"] =
          variant === "outline" || variant === "ghost"
            ? theme.primary
            : "white";
        vars["--btn-text-hover"] = "white";
      }

      return vars;
    }, [theme, variant]);

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{ ...cssVars, ...style }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
