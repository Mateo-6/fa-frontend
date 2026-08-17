"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  ariaLabel?: string;
}

export function Switch({ checked, onChange, disabled, label, description, id, ariaLabel }: SwitchProps) {
  const fallbackId = React.useId();
  const switchId = id || fallbackId;

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={switchId}
              className="block text-sm font-medium text-ink"
            >
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label ?? undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ground-deep",
          "disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-accent" : "bg-ground-raised hover:bg-glass-hover"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-ink shadow-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}