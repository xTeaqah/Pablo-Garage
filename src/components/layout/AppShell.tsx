"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BurgerMenu, BurgerMenuButton } from "@/components/layout/BurgerMenu";

const FALLBACK_NAME = "Pablo Auto's";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/new-job", label: "New Job", icon: PlusCircle, highlight: true },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/money", label: "Money", icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState(FALLBACK_NAME);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/login") return;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.businessName) setBusinessName(data.businessName);
      })
      .catch(() => {});
  }, [pathname]);

  const isInvoicePrint = /^\/invoices\/[^/]+\/print$/.test(pathname);

  if (pathname === "/login" || isInvoicePrint) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto relative overflow-x-hidden print:max-w-none">
      <header className="app-chrome sticky top-0 z-40 safe-top shrink-0 bg-garage-950/95 backdrop-blur-md border-b border-garage-800/80 print:hidden">
        <div className="px-5 pt-3 pb-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              className="rounded-full shrink-0 ring-1 ring-garage-700"
              priority
            />
            <span className="font-bold text-white text-sm truncate leading-tight">
              {businessName}
            </span>
          </Link>
          <BurgerMenuButton
            onClick={() => setMenuOpen((open) => !open)}
            isOpen={menuOpen}
          />
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-x-hidden print:pb-0">{children}</main>

      <nav className="app-chrome fixed bottom-0 left-0 right-0 z-50 safe-bottom print:hidden">
        <div className="max-w-lg mx-auto px-2 pb-2">
          <div className="glass-card rounded-2xl px-1 py-1.5 flex items-center justify-around shadow-2xl shadow-black/40">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center -mt-5"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-amber-brand/30 transition-transform active:scale-95",
                        isActive &&
                          "ring-2 ring-amber-brand-light ring-offset-2 ring-offset-garage-900"
                      )}
                    >
                      <Icon className="w-7 h-7 text-garage-950" strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-medium text-amber-brand mt-1">
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px]",
                    isActive
                      ? "text-amber-brand"
                      : "text-garage-400 hover:text-garage-200"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <BurgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
