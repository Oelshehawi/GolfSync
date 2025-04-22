"use client";

import * as React from "react";
import { cn, getOrganizationColors } from "~/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, theme, ...props }, ref) => {
    const colors = getOrganizationColors(theme);
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border shadow-sm transition-shadow hover:shadow-md bg-[var(--org-background-primary)] border-[var(--org-border-primary)]",
          className,
        )}
        style={{
          borderColor: colors.primary,
          backgroundColor: colors.background.primary,
        }}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    theme?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
  }
>(({ className, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  return (
    <h3
      ref={ref}
      className={cn("leading-none font-semibold tracking-tight", className)}
      style={{ color: colors.primary }}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-gray-500", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
