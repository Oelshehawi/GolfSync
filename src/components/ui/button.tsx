"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getOrganizationColors } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "shadow-sm border hover:shadow-md active:shadow-sm",
        outline: "border shadow-sm hover:shadow-md active:shadow-sm",
        ghost: "hover:shadow-sm border active:shadow-sm",
        destructive: "shadow-sm border hover:shadow-md active:shadow-sm",
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
  ({ className, variant, size, asChild = false, theme, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const colors = theme ? getOrganizationColors(theme) : null;

    // Define base styles that don't depend on theme
    const baseStyles = {
      default: {
        backgroundColor: colors?.primary || "#06466C",
        color: "#ffffff",
        borderColor: colors?.primary || "#06466C",
      },
      outline: {
        borderColor: colors?.primary || "currentColor",
        color: colors?.primary || "currentColor",
        backgroundColor: "transparent",
      },
      ghost: {
        color: colors?.primary || "currentColor",
        backgroundColor: "transparent",
        borderColor: "transparent",
      },
      destructive: {
        backgroundColor: "#ef4444",
        color: "#ffffff",
        borderColor: "#ef4444",
      },
    };

    // Define hover styles using theme colors
    const hoverStyles = {
      default: {
        backgroundColor: colors?.background.secondary || "#06466C1C",
        color: colors?.primary || "#06466C",
        borderColor: colors?.primary || "#06466C",
      },
      outline: {
        backgroundColor: colors?.primary || "#06466C",
        color: "#ffffff",
        borderColor: colors?.primary || "#06466C",
      },
      ghost: {
        backgroundColor: colors?.background.secondary || "rgba(0, 0, 0, 0.05)",
        color: colors?.primary || "currentColor",
        borderColor: "transparent",
      },
      destructive: {
        backgroundColor: "#dc2626",
        color: "#ffffff",
        borderColor: "#dc2626",
      },
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={baseStyles[variant || "default"]}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          target.style.backgroundColor =
            hoverStyles[variant || "default"].backgroundColor;
          target.style.color = hoverStyles[variant || "default"].color;
          target.style.borderColor =
            hoverStyles[variant || "default"].borderColor;
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget;
          target.style.backgroundColor =
            baseStyles[variant || "default"].backgroundColor;
          target.style.color = baseStyles[variant || "default"].color;
          target.style.borderColor =
            baseStyles[variant || "default"].borderColor;
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
