import { Inter } from "next/font/google";
import "~/styles/globals.css";
import { HeaderNav } from "../../components/member-teesheet-client/HeaderNav";
import { Footer } from "~/components/member-teesheet-client/Footer";
import { auth } from "@clerk/nextjs/server";
import { ClerkProvider } from "@clerk/nextjs";
import { getMemberData } from "~/server/members-teesheet-client/data";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GolfSync - Member Portal",
  description: "Book tee times and manage your golf membership",
};

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);


  return (
    <ClerkProvider>
      <div className={`flex min-h-screen flex-col ${inter.className}`}>
        <HeaderNav member={member} />
        <main className="container mx-auto flex-1 p-4">
          {children}
        </main>
        <Footer />
      </div>
    </ClerkProvider>
  );
}
