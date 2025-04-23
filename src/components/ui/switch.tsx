import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "~/lib/utils";
import { getOrganizationColors } from "~/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    theme?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
  }
>(({ className, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  const themeStyles = {
    ["--org-primary" as string]: colors.primary,
    ["--org-secondary" as string]: colors.secondary,
    ["--org-tertiary" as string]: colors.tertiary,
  } as React.CSSProperties;

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--org-secondary)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--org-primary)] data-[state=unchecked]:bg-[var(--org-tertiary)]",
        className,
      )}
      style={themeStyles}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
