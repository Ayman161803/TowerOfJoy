"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/board", label: "Board" },
  { href: "/calendar", label: "Calendar" },
  { href: "/memories", label: "Memories" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");
  const missingSupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen pb-8">
      {!isAuthRoute && (
        <header className="sticky top-0 z-20 border-b border-[#d8cab8] bg-[#fbf8f4]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-strong)]">TowerOfJoy</p>
            <p className="app-title text-2xl leading-none">Long Distance Planner</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : "border border-[var(--panel-stroke)] bg-white/70 text-[var(--foreground)] hover:bg-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        </header>
      )}
      {missingSupabase && (
        <div className="mx-auto mt-4 w-full max-w-6xl px-4 md:px-8">
          <div className="rounded-lg border border-[var(--panel-stroke)] bg-white px-3 py-2 text-xs text-[#7e6f5e]">
            Supabase env vars are not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
