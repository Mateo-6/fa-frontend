"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileMenu } from "@/components/profile-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Wallet, Menu } from "lucide-react";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-glass-border bg-ground-deep dark:bg-ground-deep/80 dark:backdrop-blur-xl">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-glass-hover hover:text-ink lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/summary" className="flex items-center gap-3" aria-label="Ir al resumen">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-ink">
              Financial App
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-glass-hover hover:text-ink" />

          <NotificationBell />

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}