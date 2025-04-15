import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "GolfSync - Authentication",
  description: "Sign in to your GolfSync account",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={GeistSans.variable}>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </div>
  );
}
