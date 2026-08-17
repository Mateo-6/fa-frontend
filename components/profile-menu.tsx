"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";
import { logout } from "@/lib/api";
import { LogOut, UserRound, ChevronDown } from "lucide-react";

interface ProfileMenuProps {
  className?: string;
}

export function ProfileMenu({ className }: ProfileMenuProps) {
  const router = useRouter();
  const [user, setUser] = React.useState<{ name?: string; email: string } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, right: 0 });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("fa_user") || sessionStorage.getItem("fa_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore malformed storage */
      }
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handleReposition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    };
    const handleClose = () => setOpen(false);

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleClose, true);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((value) => !value);
  };

  const handleLogout = () => {
    logout().finally(() => router.push("/"));
  };

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const menuContent = open ? (
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label="Perfil de usuario"
        className="glass-panel fixed z-[100] w-56 rounded-2xl p-1.5"
        style={{ top: position.top, right: position.right }}
      >
        {user && (
          <div className="flex items-center gap-3 border-b border-glass-border px-3 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent ring-1 ring-accent/20">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name || "Usuario"}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
          </div>
        )}

        <Link
          href="/profile"
          role="menuitem"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
        >
          <UserRound className="h-4 w-4" />
          <span>Ver perfil</span>
        </Link>

        <button
          type="button"
          role="menuitem"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de perfil"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent ring-1 ring-accent/20">
          {initial}
        </span>
        {user && (
          <span className="hidden max-w-[120px] truncate lg:inline">{user.name || user.email}</span>
        )}
        <ChevronDown
          className={`hidden h-4 w-4 transition-transform duration-200 lg:block ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menuContent}
    </div>
  );
}