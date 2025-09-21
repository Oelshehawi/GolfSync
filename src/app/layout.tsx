import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { Toaster } from "react-hot-toast";
import { QueryProvider } from "~/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Quilchena Golf Club",
  description: "Quilchena Golf Club",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={GeistSans.variable}>
        <body>
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" />
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
