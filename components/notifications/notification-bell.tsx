"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  type Notification,
} from "@/lib/api";
import { formatCompactDate } from "@/lib/format";

interface NotificationBellProps {
  className?: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "text-danger",
  HIGH: "text-accent",
  MEDIUM: "text-ink",
  LOW: "text-ink-muted",
};

export function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [markingAll, setMarkingAll] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, right: 0 });
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const refreshCount = React.useCallback(async () => {
    try {
      const { count } = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      /* ignore network errors */
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    refreshCount();
    const interval = window.setInterval(refreshCount, 60_000);
    const handleFocus = () => refreshCount();
    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshCount]);

  const loadNotifications = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 20, offset: 0 });
      setNotifications(data.notifications);
    } catch {
      /* ignore network errors */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
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
      loadNotifications();
      refreshCount();
    }
    setOpen((value) => !value);
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return;
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationAsRead(notification.id);
    } catch {
      refreshCount();
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((item) => !item.isRead);
    if (unread.length === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await Promise.all(unread.map((item) => markNotificationAsRead(item.id)));
    } catch {
      /* fall through */
    } finally {
      setMarkingAll(false);
      refreshCount();
    }
  };

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-glass-hover hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Panel de notificaciones"
              className="glass-panel fixed z-[100] w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl sm:w-96"
              style={{ top: position.top, right: position.right }}
            >
              <div className="flex items-center justify-between border-b border-glass-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">Notificaciones</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-glass-hover disabled:opacity-50"
                  >
                    {markingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                    Marcar todas como leídas
                  </button>
                )}
              </div>

              <div className="max-h-[min(70vh,460px)] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-ink-muted">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-ink-muted">
                    No tienes notificaciones
                  </p>
                ) : (
                  <ul className="divide-y divide-glass-border">
                    {notifications.map((notification) => {
                      const unread = !notification.isRead;
                      return (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => handleMarkRead(notification)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-glass-hover ${
                              unread ? "bg-glass/40" : ""
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                unread ? "bg-accent" : "bg-transparent"
                              }`}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1">
                              <span
                                className={`block text-sm font-medium ${
                                  unread ? "text-ink" : "text-ink-muted"
                                }`}
                              >
                                {notification.title}
                              </span>
                              {notification.body && (
                                <span className="mt-0.5 line-clamp-2 block text-xs text-ink-muted">
                                  {notification.body}
                                </span>
                              )}
                              <span className="mt-1 block text-[11px] text-ink-muted/70">
                                {notification.createdAt
                                  ? formatCompactDate(notification.createdAt)
                                  : ""}
                              </span>
                            </span>
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                PRIORITY_COLOR[notification.priority] ?? "bg-ink-muted"
                              }`}
                              title={`Prioridad ${notification.priority}`}
                              aria-label={`Prioridad ${notification.priority}`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}