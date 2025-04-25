"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "~/lib/utils";
import { getOrganizationColors } from "~/lib/utils";

interface ThemeProps {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
    ["--org-primary"]?: string;
    ["--org-secondary"]?: string;
    ["--org-tertiary"]?: string;
  };
}

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & ThemeProps
>(({ className, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  const themeStyles = {
    ["--org-primary"]: colors.primary,
    ["--org-secondary"]: colors.secondary,
    ["--org-tertiary"]: colors.tertiary,
  } as React.CSSProperties;

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-[var(--org-primary)]/10 p-1 text-[var(--org-primary)] hover:cursor-pointer",
        className,
      )}
      style={themeStyles}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & ThemeProps
>(({ className, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  const themeStyles = {
    ["--org-primary"]: colors.primary,
    ["--org-secondary"]: colors.secondary,
    ["--org-tertiary"]: colors.tertiary,
  } as React.CSSProperties;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--org-primary)] data-[state=active]:text-white data-[state=active]:shadow-sm",
        className,
      )}
      style={themeStyles}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & ThemeProps
>(({ className, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  const themeStyles = {
    ["--org-primary"]: colors.primary,
    ["--org-secondary"]: colors.secondary,
    ["--org-tertiary"]: colors.tertiary,
  } as React.CSSProperties;

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
      style={themeStyles}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
