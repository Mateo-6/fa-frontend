"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectFieldProps {
  label: string;
  options: MultiSelectOption[];
  /** When true, allows selecting multiple options. When false, behaves like a single-select. Defaults to true. */
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function positionPanel(anchor: HTMLElement, panel: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const margin = 8;
  const panelW = rect.width;
  const panelH = panel.offsetHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;

  panel.style.width = `${Math.round(panelW)}px`;

  let left = rect.left;
  if (left + panelW + margin > vw - margin) {
    left = Math.max(margin, vw - panelW - margin);
  }

  let top = rect.bottom + margin;
  if (top + panelH + margin > vh) {
    top = rect.top - panelH - margin >= margin ? rect.top - panelH - margin : Math.max(margin, vh - panelH - margin);
  }
  top = Math.max(margin, top);

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

export function MultiSelectField({
  label,
  options,
  multiple = true,
  value,
  onChange,
  placeholder = "Todas",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  error,
  disabled,
  className,
  id,
}: MultiSelectFieldProps) {
  const fallbackId = React.useId();
  const fieldId = id || fallbackId;
  const listboxId = `${fieldId}-listbox`;
  const errorId = `${fieldId}-error`;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selectedValues = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    const raw = Array.isArray(value) ? value : value ? [value] : [];
    return raw.length > 0 ? [raw[0]] : [];
  }, [multiple, value]);

  const selected = React.useMemo(() => {
    const map = new Map(options.map((option) => [option.value, option]));
    return selectedValues
      .map((optionValue) => map.get(optionValue))
      .filter((option): option is MultiSelectOption => Boolean(option));
  }, [options, selectedValues]);

  const filteredOptions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;

    const close = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current && panelRef.current.contains(target)) return;
      if (anchorRef.current && anchorRef.current.contains(target)) return;
      setOpen(false);
    };
    const reposition = () => {
      if (anchorRef.current && panelRef.current) {
        positionPanel(anchorRef.current, panelRef.current);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", close, true);
    document.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close, true);
      document.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useLayoutEffect(() => {
    if (open && anchorRef.current && panelRef.current) {
      positionPanel(anchorRef.current, panelRef.current);
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, query, filteredOptions]);

  const toggleOption = (optionValue: string) => {
    if (multiple) {
      onChange(
        selectedValues.includes(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue]
      );
      return;
    }
    if (selectedValues.includes(optionValue)) {
      onChange("");
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  const toggleAllVisible = () => {
    if (!multiple) return;
    const visible = filteredOptions.map((option) => option.value);
    const allVisibleSelected = visible.every((v) => selectedValues.includes(v));
    onChange(
      allVisibleSelected
        ? selectedValues.filter((v) => !visible.includes(v))
        : Array.from(new Set([...selectedValues, ...visible]))
    );
  };

  const clearSelection = () => {
    onChange(multiple ? [] : "");
    setOpen(false);
  };

  const triggerText =
    selected.length > 0 ? selected.map((option) => option.label).join(", ") : placeholder;

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          "text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent",
          open && "text-accent"
        )}
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={anchorRef}
          type="button"
          id={fieldId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex w-full min-w-0 items-center gap-2 rounded-lg border bg-ground/60 py-3 pl-4 pr-10 text-left text-sm",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
            "hover:border-glass-border hover:bg-ground-raised/60",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error
              ? "border-danger focus:border-danger focus:shadow-danger-glow"
              : "border-glass-border",
            open && "border-accent/60 shadow-accent-glow",
            selectedValues.length === 0 && "text-ink-muted"
          )}
        >
          <span className="min-w-0 flex-1 truncate">{triggerText}</span>
          {multiple && selectedValues.length > 0 && (
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
              {selectedValues.length}
            </span>
          )}
        </button>

        {selectedValues.length > 0 && !disabled && (
          <button
            type="button"
            aria-label={`Quitar selección de ${label}`}
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              clearSelection();
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="fixed z-[120] min-w-[14rem] overflow-hidden rounded-xl border border-glass-border bg-ground-raised shadow-glass-lg"
          >
            <div className="relative border-b border-glass-border">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent py-2.5 pl-9 pr-8 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {multiple && (
              <div className="flex items-center justify-between border-b border-glass-border px-3 py-1.5">
                <button
                  type="button"
                  onClick={toggleAllVisible}
                  className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  Ninguna
                </button>
              </div>
            )}

            <ul className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-accent/10 text-ink"
                          : "text-ink-muted hover:bg-glass-hover hover:text-ink"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-glass-border"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-ink-muted">{emptyMessage}</p>
            )}
          </div>,
          document.body
        )}

      {error && (
        <span id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}