"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Car,
  Briefcase,
  FileText,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/inventory", label: "Stock", icon: Car, description: "Your cars & parts" },
  { href: "/jobs", label: "All Jobs", icon: Briefcase, description: "Search every job" },
  { href: "/invoices", label: "Invoices", icon: FileText, description: "Billing & payments" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Business details" },
];

interface BurgerMenuProps {
  open: boolean;
  onClose: () => void;
}

export function BurgerMenu({ open, onClose }: BurgerMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    onClose();
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] print:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="Close menu"
      />

      <div className="absolute top-0 right-0 left-0 max-w-lg mx-auto safe-top">
        <div className="mx-3 mt-3 rounded-2xl bg-garage-900 border border-garage-700 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-garage-700">
            <p className="text-sm font-semibold text-white">Menu</p>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-garage-800 border border-garage-700 flex items-center justify-center text-garage-400 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3.5 transition-colors",
                    isActive
                      ? "bg-amber-brand/10 text-amber-brand"
                      : "text-garage-200 hover:bg-garage-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      isActive ? "bg-amber-brand/20" : "bg-garage-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-xs text-garage-500 truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-garage-500 shrink-0" />
                </Link>
              );
            })}
          </nav>

          <div className="p-2 pt-0 border-t border-garage-800">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 rounded-xl px-3 py-3.5 w-full text-garage-400 hover:bg-garage-800 hover:text-red-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-garage-800 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-sm">Sign out</p>
                <p className="text-xs text-garage-500">End your session</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BurgerMenuButton({
  onClick,
  isOpen,
}: {
  onClick: () => void;
  isOpen: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-garage-400 hover:text-garage-200 transition-colors shrink-0"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
    </button>
  );
}
