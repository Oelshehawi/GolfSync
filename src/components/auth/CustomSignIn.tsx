"use client";
import { SignIn } from "@clerk/nextjs";

export function CustomSignIn() {
  return (
    <div className="from-primary flex min-h-screen flex-col items-center justify-center bg-gradient-to-b to-green-700">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-neutral text-4xl font-bold">GolfSync</h1>
          <p className="text-neutral/70">Your golf club management solution</p>
        </div>
        <SignIn
          appearance={{
            variables: {},
            elements: {
              rootBox: "w-full",
            },
          }}
        />
      </div>
    </div>
  );
}
