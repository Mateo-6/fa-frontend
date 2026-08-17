import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
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
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full min-w-0 rounded-lg border bg-ground/60 px-4 py-3 text-sm text-ink",
            "placeholder:text-ink-muted",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
            "hover:border-glass-border hover:bg-ground-raised/60",
            error
              ? "border-danger focus:border-danger focus:shadow-danger-glow"
              : "border-glass-border"
          )}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-xs text-danger" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
