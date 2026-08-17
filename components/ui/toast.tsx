"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (options: { kind?: ToastKind; title: string; description?: string }) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    (options: { kind?: ToastKind; title: string; description?: string }) => {
      const id = ++counter;
      setToasts((prev) => [
        ...prev,
        { id, kind: options.kind ?? "success", title: options.title, description: options.description },
      ]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4"
            aria-live="polite"
          >
            {toasts.map((item) => (
              <div
                key={item.id}
                className="glass-panel pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl p-4 shadow-glass-lg"
                role="status"
              >
                {item.kind === "success" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-income" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-sm text-ink-muted">{item.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
                  aria-label="Descartar notificación"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}