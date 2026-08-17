"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPasswordRuleChecks,
  getPasswordStrength,
  PASSWORD_RULES,
  PASSWORD_STRENGTH_LEVELS,
} from "@/lib/password";

interface PasswordStrengthProps {
  password: string;
  focused?: boolean;
  className?: string;
}

export function PasswordStrength({ password, focused = false, className }: PasswordStrengthProps) {
  const checks = getPasswordRuleChecks(password);
  const score = getPasswordStrength(password);
  const level = PASSWORD_STRENGTH_LEVELS[score];

  if (!focused && password.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ul className="flex flex-col gap-1.5" aria-label="Reglas de la contraseña">
        {checks.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                rule.satisfied ? "bg-glass text-income" : "bg-glass text-ink-subtle"
              )}
            >
              {rule.satisfied ? (
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              ) : (
                <X className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
              )}
            </span>
            <span
              className={cn(
                "transition-colors duration-300",
                rule.satisfied ? "text-ink" : "text-ink-subtle"
              )}
            >
              {rule.label}
            </span>
          </li>
        ))}
      </ul>

      {password.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {PASSWORD_RULES.map((_, index) => (
              <span
                key={index}
                role="presentation"
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  index < score ? level.barColor : "bg-glass-border"
                )}
              />
            ))}
          </div>
          <span className={cn("text-[11px] font-medium tracking-wide", level.textColor)}>
            Fortaleza: {level.label}
          </span>
        </div>
      )}
    </div>
  );
}