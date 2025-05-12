import React from "react";
import { cn } from "~/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="relative border-l-4 border-[var(--org-primary)] pl-4">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-3xl pt-1 text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
