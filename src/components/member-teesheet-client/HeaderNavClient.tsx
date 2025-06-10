"use client";
import { useState } from "react";
import Link from "next/link";
import { AccountDialog } from "./AccountDialog";
import { Menu, X, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface HeaderNavClientProps {
  member?: any;
}

export const HeaderNavClient = ({ member }: HeaderNavClientProps) => {
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut(() => {
      window.location.href = "/";
    });
  };

  const navButtonClass = `
    relative z-0 flex items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border-[1.5px]
    border-org-primary px-5 py-1.5 font-semibold text-org-primary bg-white transition-all duration-300
    hover:scale-105 hover:border-org-primary hover:text-white
    focus:outline-none focus:ring-2 focus:ring-org-primary
    before:absolute before:inset-0 before:-z-10 before:translate-y-[200%]
    before:scale-[2.5] before:rounded-[100%] before:bg-org-primary
    before:transition-transform before:duration-300 before:content-['']
    hover:before:translate-y-[0%] active:scale-100
  `;

  const isActive = (path: string) => {
    if (path === "/members" && pathname === "/members") {
      return true;
    }
    if (path !== "/members" && pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <>
      <div className="mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link
            href="/members"
            className="text-xl font-bold text-org-primary"
          >
            GolfSync
          </Link>
          <div className="flex items-center gap-2">
            {member?.firstName && (
              <span className="ml-2 border-l-2 border-org-primary pl-2 text-sm font-medium text-neutral-600">
                Welcome, {member.firstName}!
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/members"
            className={`text-base transition-colors hover:text-org-primary ${
              isActive("/members")
                ? "font-medium text-org-primary"
                : "text-neutral-700"
            }`}
          >
            Portal
          </Link>
          <button
            onClick={() => setIsAccountDialogOpen(true)}
            className="cursor-pointer text-base text-neutral-700 transition-colors hover:text-org-primary"
          >
            My Account
          </button>
          <Link
            href="/members/teesheet"
            className={`${navButtonClass} ${
              isActive("/members/teesheet")
                ? "bg-org-primary text-org-primary before:translate-y-[0%]"
                : ""
            }`}
          >
            Tee Sheet
          </Link>
          <button
            onClick={handleSignOut}
            className="ml-3 flex cursor-pointer items-center gap-1 text-base text-neutral-700 transition-colors hover:text-org-primary"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="rounded-lg p-2 text-org-primary transition-colors hover:bg-org-primary hover:text-white md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open navigation menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="rounded-b-xl border-t border-org-primary/20 bg-white md:hidden">
          <div className="space-y-2 py-3">
            <Link
              href="/members"
              className={`block px-4 py-2 text-base hover:text-org-primary ${
                isActive("/members")
                  ? "font-medium text-org-primary"
                  : "text-neutral-700"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Portal
            </Link>
            <button
              className="block w-full cursor-pointer px-4 py-2 text-left text-base text-neutral-700 hover:text-org-primary"
              onClick={() => {
                setIsAccountDialogOpen(true);
                setIsMobileMenuOpen(false);
              }}
            >
              My Account
            </button>
            <Link
              href="/members/teesheet"
              className={`block px-4 py-2 text-base font-semibold ${
                isActive("/members/teesheet")
                  ? "bg-org-primary/10 text-org-primary"
                  : "text-org-primary"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tee Sheet
            </Link>
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-base text-neutral-700 hover:text-org-primary"
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Account Dialog */}
      <AccountDialog
        member={member}
        isOpen={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />
    </>
  );
};
