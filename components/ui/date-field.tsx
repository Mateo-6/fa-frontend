"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export interface DateFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const fallbackId = React.useId();
    const inputId = id || fallbackId;
    const errorId = `${inputId}-error`;

    return (
      <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
        <label
          htmlFor={inputId}
          className="text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type="date"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              "w-full min-w-0 rounded-lg border bg-ground/60 px-4 py-3 pr-10 text-sm text-ink",
              "placeholder:text-ink-muted",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
              "hover:border-glass-border hover:bg-ground-raised/60",
              "dark:[color-scheme:dark]",
              error
                ? "border-danger focus:border-danger focus:shadow-danger-glow"
                : "border-glass-border",
              "[&::-webkit-calendar-picker-indicator]:opacity-0"
            )}
            {...props}
          />
          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        </div>
        {error && (
          <span id={errorId} className="text-xs text-danger" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
DateField.displayName = "DateField";

export { DateField };