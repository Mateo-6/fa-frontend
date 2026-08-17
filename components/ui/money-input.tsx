"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange" | "min" | "max" | "step"
  > {
  label: string;
  error?: string;
  value: string;
  onValueChange: (raw: string) => void;
}

function stripLeadingZeros(intPart: string): string {
  if (intPart === "") return "";
  const trimmed = intPart.length > 1 && intPart[0] === "0" ? intPart.replace(/^0+/, "") : intPart;
  return trimmed || "0";
}

function toDisplay(raw: string): string {
  if (raw === "") return "";
  const dot = raw.indexOf(".");
  const hasDecimal = dot !== -1;
  const intPart = hasDecimal ? raw.slice(0, dot) : raw;
  const decPart = hasDecimal ? raw.slice(dot + 1) : "";
  const intOut = stripLeadingZeros(intPart) || "0";
  const grouped = intOut.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return hasDecimal ? `${grouped},${decPart}` : grouped;
}

function fromDisplay(text: string): string {
  let s = text.replace(/[^\d.,]/g, "");
  if (s === "") return "";

  const lastComma = s.lastIndexOf(",");
  let decSep = lastComma;
  if (lastComma === -1) {
    const lastDot = s.lastIndexOf(".");
    const after = lastDot === -1 ? "" : s.slice(lastDot + 1);
    decSep = lastDot !== -1 && /^\d{0,2}$/.test(after) ? lastDot : -1;
  }

  if (decSep === -1) {
    return stripLeadingZeros(s.replace(/[.,]/g, ""));
  }

  const intPart = s.slice(0, decSep).replace(/[.,]/g, "");
  const decPart = s.slice(decSep + 1).replace(/[.,]/g, "");
  return `${stripLeadingZeros(intPart)}.${decPart}`;
}

function caretAfterDigits(formatted: string, digits: number): number {
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count += 1;
    if (count >= digits) return i + 1;
  }
  return formatted.length;
}

export function MoneyInput({
  label,
  error,
  value,
  onValueChange,
  className,
  id,
  placeholder,
  disabled,
  ...props
}: MoneyInputProps) {
  const fallbackId = React.useId();
  const inputId = id || fallbackId;
  const errorId = `${inputId}-error`;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const display = React.useMemo(() => toDisplay(value), [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const oldLen = el.value.length;
    const caret = el.selectionStart ?? oldLen;
    const before = el.value.slice(0, caret);
    const digitsBefore = (before.match(/\d/g) || []).length;
    const raw = fromDisplay(el.value);
    const nextDisplay = toDisplay(raw);
    const isAppend = caret === oldLen;
    const nextCaret = isAppend ? nextDisplay.length : caretAfterDigits(nextDisplay, digitsBefore);

    if (el.value !== nextDisplay) {
      el.value = nextDisplay;
      el.setSelectionRange(nextCaret, nextCaret);
    }
    onValueChange(raw);
  };

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
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={display}
        onChange={handleChange}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : undefined}
        placeholder={placeholder ?? "0,00"}
        disabled={disabled}
        className={cn(
          "w-full min-w-0 rounded-lg border bg-ground/60 px-4 py-3 text-sm text-ink",
          "placeholder:text-ink-muted",
          "transition-all duration-200 ease-out",
          "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
          "hover:border-glass-border hover:bg-ground-raised/60",
          error ? "border-danger focus:border-danger focus:shadow-danger-glow" : "border-glass-border"
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