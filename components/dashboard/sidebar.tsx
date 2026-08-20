"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Tag,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { label: "Resumen", href: "/summary", icon: LayoutDashboard },
  { label: "Transacciones", href: "/transactions", icon: Receipt },
  { label: "Métodos de pago", href: "/payment-methods", icon: Wallet, match: ["/cards"] },
  { label: "Presupuestos", href: "/budgets", icon: PiggyBank },
  { label: "Categorías", href: "/categories", icon: Tag },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ mobileOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.match?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const renderNav = (minimized: boolean) => (

    <nav className="mt-12 flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            title={minimized ? item.label : undefined}
            aria-label={minimized ? item.label : undefined}
            className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              minimized
                ? "justify-center px-0"
                : "px-3"
            } ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-ink-muted hover:bg-glass-hover hover:text-ink"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className={minimized ? "h-5 w-5 shrink-0" : "h-5 w-5 shrink-0"} />
            {!minimized && item.label}
          </Link>
        );
      })}
    </nav>

  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 z-40 hidden h-screen flex-col border-r border-glass-border bg-ground-deep py-5 transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? "w-16 px-3" : "w-60 px-4"
        }`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute right-[-14px] top-5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-glass-border bg-ground-deep text-ink-muted shadow-md transition-colors hover:bg-glass-hover hover:text-ink"
          aria-label={collapsed ? "Expandir menú lateral" : "Minimizar menú lateral"}
          title={collapsed ? "Expandir menú" : "Minimizar menú"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {renderNav(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-glass-border bg-ground-deep px-4 py-5 lg:hidden">
            <div className="mb-6 flex items-center justify-between px-3">
              <span className="whitespace-nowrap text-lg font-semibold tracking-tight text-ink">
                Financial App
              </span>
              <button
                type="button"
onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-glass-hover hover:text-ink"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNav(false)}
          </aside>
        </>
      )}
    </>
  );
}