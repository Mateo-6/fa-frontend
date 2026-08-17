"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, placeholder, className, id, children, value, ...props }, ref) => {
    const fallbackId = React.useId();
    const selectId = id || fallbackId;
    const errorId = `${selectId}-error`;
    const hasOptions = options && options.length > 0;

    return (
      <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
        <label
          htmlFor={selectId}
          className="text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent"
        >
          {label}
        </label>
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
            value={value}
            className={cn(
              "w-full min-w-0 appearance-none rounded-lg border bg-ground/60 px-4 py-3 pr-10 text-sm text-ink",
              "placeholder:text-ink-muted",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
              "hover:border-glass-border hover:bg-ground-raised/60",
              error
                ? "border-danger focus:border-danger focus:shadow-danger-glow"
                : "border-glass-border",
              (value === undefined || value === "" || value === "default") && "text-ink-muted"
            )}
            {...props}
          >
            {placeholder && (
              <option value="default" disabled>
                {placeholder}
              </option>
            )}
            {hasOptions
              ? options!.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
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
SelectField.displayName = "SelectField";

export { SelectField };