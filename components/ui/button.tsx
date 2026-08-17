"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "ghost" | "danger";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, isLoading, variant = "primary", disabled, asChild, ...props }, ref) => {
    const classes = cn(
      "relative inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold",
      "transition-all duration-200 ease-out",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ground-deep",
      "disabled:cursor-not-allowed disabled:opacity-60",
      variant === "primary" && [
        "bg-accent text-accent-foreground",
        "hover:brightness-110 hover:shadow-accent-glow",
        "active:scale-[0.98]",
        isLoading && "overflow-hidden",
      ],
      variant === "ghost" && [
        "bg-transparent text-ink-muted",
        "hover:text-ink hover:bg-glass-hover",
      ],
      variant === "danger" && [
        "bg-danger text-white",
        "hover:brightness-110 hover:shadow-danger-glow",
        "active:scale-[0.98]",
      ],
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(classes, (children as React.ReactElement<{ className?: string }>).props.className),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading && (
          <span
            className="absolute inset-0 animate-shimmer bg-shimmer-gradient bg-[length:200%_100%]"
            aria-hidden="true"
          />
        )}
        <span className={cn("relative flex items-center gap-2", isLoading && "opacity-90")}>
          {children}
        </span>
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
