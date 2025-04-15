"use client";

import { UserButton } from "@clerk/nextjs";

export default function UserButtonComponent() {
  return (
    <div className="flex items-center">
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8",
            userButtonPopoverCard: "bg-white shadow-lg rounded-lg",
            userButtonPopoverActionButton: "hover:bg-gray-100",
          },
        }}
      />
    </div>
  );
}
