"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserButtonComponent from "./UserButton";
import Image from "next/image";
import { useState } from "react";

interface NavigationProps {
  logoUrl?: string;
  organizationName: string;
}

const Navigation = ({ logoUrl, organizationName }: NavigationProps) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Teesheet", href: "/admin" },
    { name: "Members", href: "/admin/members" },
    { name: "Events", href: "/admin/events" },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <div className="relative bg-[var(--org-primary)]">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/admin" className="flex-shrink-0">
            {logoUrl ? (
              <div className="relative h-10 w-auto">
                <Image
                  src={logoUrl}
                  alt={`${organizationName} Logo`}
                  width={140}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded bg-[var(--org-tertiary)]" />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex space-x-1 rounded-full bg-white/5 p-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Button */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-white/10 md:hidden"
            >
              <div className="space-y-1.5">
                <div className="h-0.5 w-5 bg-white"></div>
                <div className="h-0.5 w-5 bg-white"></div>
                <div className="h-0.5 w-5 bg-white"></div>
              </div>
            </button>
            <UserButtonComponent />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`absolute inset-x-0 top-full transform bg-[var(--org-primary)] transition-all duration-300 md:hidden ${
          isMobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="space-y-1 px-4 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
