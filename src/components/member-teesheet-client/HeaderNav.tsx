"use client";
import { useState } from "react";
import Link from "next/link";
import { AccountDialog } from "./AccountDialog";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface HeaderNavProps {
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  member?: any;
}

const defaultTheme = {
  primary: "#10b981",
  secondary: "#d1fae5",
  tertiary: "#f0fdfa",
};

export const HeaderNav = ({ theme, member }: HeaderNavProps) => {
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const orgPrimary = theme?.primary || defaultTheme.primary;
  const orgSecondary = theme?.secondary || defaultTheme.secondary;
  const orgTertiary = theme?.tertiary || defaultTheme.tertiary;

  const themeStyles = {
    ["--org-primary" as string]: orgPrimary,
    ["--org-secondary" as string]: orgSecondary,
    ["--org-tertiary" as string]: orgTertiary,
  } as React.CSSProperties;

  const navButtonClass = `
    relative z-0 flex items-center justify-center overflow-hidden whitespace-nowrap rounded-lg border-[1.5px]
    border-[var(--org-primary)] px-5 py-1.5 font-semibold text-[var(--org-primary)] bg-white transition-all duration-300
    hover:scale-105 hover:border-[var(--org-primary)] hover:text-white
    focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]
    before:absolute before:inset-0 before:-z-10 before:translate-y-[200%]
    before:scale-[2.5] before:rounded-[100%] before:bg-[var(--org-primary)]
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
    <header
      className="fixed top-2 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-4"
      style={themeStyles}
    >
      <nav className="rounded-xl border border-[var(--org-primary)]/20 bg-white shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex h-14 items-center justify-between px-6">
          <Link
            href="/members"
            className="text-xl font-bold text-[var(--org-primary)]"
          >
            GolfSync
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/members"
              className={`text-base transition-colors hover:text-[var(--org-primary)] ${
                isActive("/members")
                  ? "font-medium text-[var(--org-primary)]"
                  : "text-neutral-700"
              }`}
            >
              Portal
            </Link>
            <button
              onClick={() => setIsAccountDialogOpen(true)}
              className="cursor-pointer text-base text-neutral-700 transition-colors hover:text-[var(--org-primary)]"
            >
              My Account
            </button>
            <Link
              href="/members/teesheet"
              className={`${navButtonClass} ${
                isActive("/members/teesheet")
                  ? "bg-[var(--org-primary)] text-[var(--org-primary)] before:translate-y-[0%]"
                  : ""
              }`}
            >
              Tee Sheet
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg p-2 text-[var(--org-primary)] transition-colors hover:bg-[var(--org-primary)] hover:text-white md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="rounded-b-xl border-t border-[var(--org-primary)]/20 bg-white md:hidden">
            <div className="space-y-2 py-3">
              <Link
                href="/members"
                className={`block px-4 py-2 text-base hover:text-[var(--org-primary)] ${
                  isActive("/members")
                    ? "font-medium text-[var(--org-primary)]"
                    : "text-neutral-700"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portal
              </Link>
              <button
                className="block w-full cursor-pointer px-4 py-2 text-left text-base text-neutral-700 hover:text-[var(--org-primary)]"
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
                    ? "bg-[var(--org-primary)]/10 text-[var(--org-primary)]"
                    : "text-[var(--org-primary)]"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tee Sheet
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Account Dialog */}
      <AccountDialog
        member={member}
        isOpen={isAccountDialogOpen}
        onClose={() => setIsAccountDialogOpen(false)}
      />
    </header>
  );
};
