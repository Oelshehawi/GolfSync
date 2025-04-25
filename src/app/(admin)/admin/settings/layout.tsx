"use client";

import { ChevronLeft, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="flex items-center justify-between space-x-4 pb-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      {children}
    </div>
  );
}
