"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  semantic?: "income" | "expense" | "credit";
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  label,
  disabled,
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-xs font-medium tracking-wide text-ink-muted">{label}</span>
      )}
      <div
        role="radiogroup"
        className="flex gap-1 rounded-lg border border-glass-border bg-ground/60 p-1"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const selected = value === option.value;
          const semanticColor =
            option.semantic === "income"
              ? "text-income"
              : option.semantic === "expense"
                ? "text-expense"
                : option.semantic === "credit"
                  ? "text-credit"
                  : "text-accent";

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                "disabled:cursor-not-allowed disabled:opacity-60",
                selected
                  ? "border border-glass-border bg-glass text-ink shadow-glass"
                  : "border border-transparent text-ink-muted hover:bg-glass-hover hover:text-ink"
              )}
            >
              {Icon && <Icon className={cn("h-4 w-4", selected && semanticColor)} />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}