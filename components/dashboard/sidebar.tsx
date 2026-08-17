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
    <div data-impeccable-variants="4102c79b" data-impeccable-variant-count="3" style={{ display: "contents" }}>
      {/* impeccable-variants-start 4102c79b */}
      {/* Original */}
      <div data-impeccable-variant="original">
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
      </div>
      {/* Variants: insert below this line */}
      <style data-impeccable-css="4102c79b">{`
        @scope ([data-impeccable-variant="1"]) {
          :scope > nav { margin-top: var(--p-offset, 40px); }
          :scope > nav[data-p-divider] { border-top: 1px solid var(--glass-border); padding-top: 16px; }
        }
        @scope ([data-impeccable-variant="2"]) {
          :scope > nav .im-brand { margin-bottom: var(--p-gap, 16px); }
          :scope > nav .im-mark { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
          :scope > nav[data-p-brandstyle="mark"] .im-word { display: none; }
        }
        @scope ([data-impeccable-variant="3"]) {
          :scope > nav { margin-top: auto; margin-bottom: auto; }
          :scope > nav[data-p-anchor="near"] { margin-top: 40px; margin-bottom: 0; }
          :scope > nav[data-p-anchor="lower"] { margin-top: 18vh; margin-bottom: 0; }
          :scope > nav[data-p-rowpad="compact"] a { padding-top: 6px; padding-bottom: 6px; }
          :scope > nav[data-p-rowpad="tall"] a { padding-top: 14px; padding-bottom: 14px; }
        }
      `}</style>
      <div data-impeccable-variant="1" data-impeccable-params='[
        {"id":"offset","kind":"range","min":16,"max":80,"step":4,"default":40,"label":"Desplazamiento"},
        {"id":"divider","kind":"toggle","default":false,"label":"Línea separadora"}
      ]' style={{ display: "none" }}>
        <nav className="flex flex-col gap-1">
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
                    ? "bg-accent text-accent-foreground shadow-accent-glow"
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
      </div>
      <div data-impeccable-variant="2" data-impeccable-params='[
        {"id":"gap","kind":"range","min":8,"max":32,"step":2,"default":16,"label":"Espacio tras la marca"},
        {"id":"brandStyle","kind":"steps","default":"full","label":"Marca","options":[{"value":"mark","label":"Solo icono"},{"value":"full","label":"Icono + nombre"}]}
      ]' style={{ display: "none" }}>
        <nav className="flex flex-col gap-1">
          <div className={`im-brand flex items-center gap-2.5 ${minimized ? "justify-center px-0" : "px-3"}`}>
            <span className="im-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <Wallet className="h-4 w-4" />
            </span>
            {!minimized && <span className="im-word text-base font-semibold tracking-tight text-ink">Financial App</span>}
          </div>
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
                    ? "bg-accent text-accent-foreground shadow-accent-glow"
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
      </div>
      <div data-impeccable-variant="3" data-impeccable-params='[
        {"id":"anchor","kind":"steps","default":"middle","label":"Anclaje","options":[{"value":"near","label":"Cerca"},{"value":"middle","label":"Centro"},{"value":"lower","label":"Bajo"}]},
        {"id":"rowPad","kind":"steps","default":"default","label":"Altura de filas","options":[{"value":"compact","label":"Compacto"},{"value":"default","label":"Normal"},{"value":"tall","label":"Alto"}]}
      ]' style={{ display: "none" }}>
        <nav className="flex flex-col gap-1">
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
                    ? "bg-accent text-accent-foreground shadow-accent-glow"
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
      </div>
      {/* impeccable-variants-end 4102c79b */}
    </div>
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