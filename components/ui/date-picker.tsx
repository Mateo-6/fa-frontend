"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];
const FULL_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const SHORT_MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

interface ISO {
  y: number;
  m: number;
  d: number;
}

interface ViewState {
  y: number;
  m: number;
}

interface DayState {
  selected: boolean;
  inRange: boolean;
}

function parseISO(value: string): ISO | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function toISO({ y, m, d }: ISO): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function firstWeekdayOffset(y: number, m: number): number {
  const jsDay = new Date(y, m - 1, 1).getDay();
  return (jsDay + 6) % 7;
}

function todayISO(): string {
  const now = new Date();
  return toISO({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

function isSameDay(a: ISO, b: ISO): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

function compareISO(a: ISO, b: ISO): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

function formatISO(value: string): string {
  const iso = parseISO(value);
  if (!iso) return "";
  return `${iso.d} ${SHORT_MONTHS[iso.m - 1]} ${iso.y}`;
}

function formatRange(start: string, end: string): string {
  if (!start && !end) return "Selecciona un período";
  if (start && end) return start === end ? formatISO(start) : `${formatISO(start)} – ${formatISO(end)}`;
  if (start) return `Desde ${formatISO(start)}`;
  return `Hasta ${formatISO(end)}`;
}

function monthFor(value: string): ViewState {
  const iso = parseISO(value);
  const now = new Date();
  return iso ? { y: iso.y, m: iso.m } : { y: now.getFullYear(), m: now.getMonth() + 1 };
}

function positionPanel(anchor: HTMLElement, panel: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const panelW = panel.offsetWidth;
  const panelH = panel.offsetHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const margin = 8;

  let left = rect.left;
  if (left + panelW + margin > vw - margin) {
    const rightAligned = rect.right - panelW;
    left = rightAligned - margin >= margin ? rightAligned : vw - panelW - margin;
  }
  left = Math.max(margin, Math.min(left, vw - panelW - margin));

  let top = rect.bottom + margin;
  if (top + panelH + margin > vh) {
    top = rect.top - panelH - margin >= margin ? rect.top - panelH - margin : Math.max(margin, vh - panelH - margin);
  }
  top = Math.max(margin, top);

  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

interface CalendarPanelProps {
  view: ViewState;
  onViewChange: (view: ViewState) => void;
  highlight: string;
  onHighlightChange: (highlight: string) => void;
  dayState: (isoStr: string) => DayState;
  onSelect: (iso: ISO) => void;
  onHoverDay?: (isoStr: string | null) => void;
  labelPrefix: string;
  panelId: string;
  panelRef: React.Ref<HTMLDivElement>;
  footer?: React.ReactNode;
}

function CalendarPanel({
  view,
  onViewChange,
  highlight,
  onHighlightChange,
  dayState,
  onSelect,
  onHoverDay,
  labelPrefix,
  panelId,
  panelRef,
  footer,
}: CalendarPanelProps) {
  const today = parseISO(todayISO());

  const moveHighlight = (rows: number, cols: number) => {
    const current = parseISO(highlight) ?? today;
    if (!current) return;
    const next = new Date(current.y, current.m - 1, current.d + rows * 7 + cols);
    const nextISO = { y: next.getFullYear(), m: next.getMonth() + 1, d: next.getDate() };
    onHighlightChange(toISO(nextISO));
    onViewChange({ y: nextISO.y, m: nextISO.m });
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveHighlight(0, -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveHighlight(0, 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveHighlight(-1, 0);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveHighlight(1, 0);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        const iso = parseISO(highlight) ?? today;
        if (iso) onSelect(iso);
        break;
    }
  };

  const prevMonth: ViewState = view.m <= 1 ? { y: view.y - 1, m: 12 } : { y: view.y, m: view.m - 1 };
  const nextMonth: ViewState = view.m >= 12 ? { y: view.y + 1, m: 1 } : { y: view.y, m: view.m + 1 };
  const offset = firstWeekdayOffset(view.y, view.m);
  const total = daysInMonth(view.y, view.m);
  const cells = Math.ceil((offset + total) / 7) * 7;

  return (
    <div
      id={panelId}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
      aria-label={`${labelPrefix} en ${FULL_MONTHS[view.m - 1]} ${view.y}`}
      onKeyDown={onKeyDown}
      className="glass-panel animate-dialog-in fixed z-[120] max-h-[calc(100vh-1rem)] w-72 overflow-y-auto rounded-2xl p-4 focus:outline-none"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onViewChange(prevMonth)}
          aria-label="Mes anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold tracking-tight text-ink">
          {FULL_MONTHS[view.m - 1]} {view.y}
        </span>
        <button
          type="button"
          onClick={() => onViewChange(nextMonth)}
          aria-label="Mes siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle"
          >
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: cells }, (_, i) => {
          const day = i - offset + 1;
          if (day < 1 || day > total) {
            return <span key={i} className="aspect-square w-full" aria-hidden="true" />;
          }
          const iso = { y: view.y, m: view.m, d: day };
          const isoStr = toISO(iso);
          const state = dayState(isoStr);
          const isToday = today ? isSameDay(iso, today) : false;
          const isHighlight = highlight === isoStr;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(iso)}
              onMouseEnter={() => onHoverDay?.(isoStr)}
              onMouseLeave={() => onHoverDay?.(null)}
              aria-label={`${day} de ${FULL_MONTHS[view.m - 1]} de ${view.y}`}
              aria-pressed={state.selected}
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-lg text-sm transition-all duration-150",
                state.selected
                  ? "bg-accent font-semibold text-accent-foreground shadow-accent-glow"
                  : state.inRange
                    ? "bg-[var(--accent-glow)] font-medium text-ink"
                    : isHighlight
                      ? "bg-glass-hover font-medium text-ink"
                      : "text-ink-muted hover:bg-glass-hover hover:text-ink",
                isToday && !state.selected && !state.inRange && "font-semibold text-accent"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {footer}
    </div>
  );
}

export interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled,
  className,
  id,
}: DatePickerProps) {
  const fallbackId = React.useId();
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputId = id || fallbackId;
  const panelId = `${inputId}-calendar`;
  const errorId = `${inputId}-error`;

  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<string>(value || todayISO());
  const [view, setView] = React.useState<ViewState>(() => monthFor(value));

  React.useEffect(() => {
    if (open) {
      setHighlight(value || todayISO());
      setView(monthFor(value));
    }
  }, [open, value]);

  React.useLayoutEffect(() => {
    if (open && anchorRef.current && panelRef.current) {
      positionPanel(anchorRef.current, panelRef.current);
      panelRef.current.focus({ preventScroll: true });
    }
  }, [open, view, highlight]);

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

  const dayState = React.useCallback<React.ComponentProps<typeof CalendarPanel>["dayState"]>(
    (isoStr) => ({ selected: isoStr === value, inRange: false }),
    [value]
  );

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent"
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={anchorRef}
          type="button"
          id={inputId}
          onClick={() => {
            if (!disabled) setOpen((current) => !current);
          }}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-ground/60 px-4 py-3 text-left text-sm text-ink",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
            "hover:border-glass-border hover:bg-ground-raised/60",
            error
              ? "border-danger focus:border-danger focus:shadow-danger-glow"
              : "border-glass-border",
            !value && "text-ink-muted",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="min-w-0 truncate">{value ? formatISO(value) : "Selecciona una fecha"}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>

        {open &&
          createPortal(
            <CalendarPanel
              panelId={panelId}
              panelRef={panelRef}
              view={view}
              onViewChange={setView}
              highlight={highlight}
              onHighlightChange={setHighlight}
              dayState={dayState}
              onSelect={(iso) => {
                onChange(toISO(iso));
                setOpen(false);
              }}
              labelPrefix="Elegir fecha"
              footer={
                <div className="mt-3 border-t border-glass-border pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(todayISO());
                      setOpen(false);
                    }}
                    className="text-xs font-semibold text-accent transition-colors hover:underline"
                  >
                    Hoy
                  </button>
                </div>
              }
            />,
            document.body
          )}
      </div>
      {error && (
        <span id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangePickerProps {
  label: string;
  start: string;
  end: string;
  onChange: (range: DateRange) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DateRangePicker({
  label,
  start,
  end,
  onChange,
  error,
  disabled,
  className,
  id,
}: DateRangePickerProps) {
  const fallbackId = React.useId();
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const inputId = id || fallbackId;
  const panelId = `${inputId}-range-calendar`;
  const errorId = `${inputId}-error`;

  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<string>(start || end || todayISO());
  const [view, setView] = React.useState<ViewState>(() => monthFor(start || end));
  const [draft, setDraft] = React.useState<ISO | null>(null);
  const [hoverDay, setHoverDay] = React.useState<string | null>(null);

  const rangeStart = parseISO(start);
  const rangeEnd = parseISO(end);

  React.useEffect(() => {
    if (open) {
      setHighlight(start || end || todayISO());
      setView(monthFor(start || end));
      setDraft(null);
      setHoverDay(null);
    }
  }, [open, start, end]);

  React.useLayoutEffect(() => {
    if (open && anchorRef.current && panelRef.current) {
      positionPanel(anchorRef.current, panelRef.current);
      panelRef.current.focus({ preventScroll: true });
    }
  }, [open, view, draft, hoverDay, highlight]);

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

  const handleSelect = (iso: ISO) => {
    if (!draft) {
      setDraft(iso);
      setHighlight(toISO(iso));
      return;
    }
    const first = toISO(draft);
    const second = toISO(iso);
    onChange(compareISO(draft, iso) <= 0 ? { start: first, end: second } : { start: second, end: first });
    setDraft(null);
    setHoverDay(null);
    setOpen(false);
  };

  const clearRange = () => {
    onChange({ start: "", end: "" });
    setDraft(null);
    setHoverDay(null);
  };

  const dayState = React.useCallback<React.ComponentProps<typeof CalendarPanel>["dayState"]>(
    (isoStr) => {
      if (draft) {
        const first = toISO(draft);
        const end = hoverDay ?? highlight;
        const lo = first < end ? first : end;
        const hi = first < end ? end : first;
        return { selected: isoStr === first, inRange: isoStr > lo && isoStr < hi };
      }
      if (rangeStart && rangeEnd) {
        const lo = toISO(rangeStart);
        const hi = toISO(rangeEnd);
        return {
          selected: isoStr === lo || isoStr === hi,
          inRange: isoStr > lo && isoStr < hi,
        };
      }
      return { selected: false, inRange: false };
    },
    [draft, hoverDay, highlight, rangeStart, rangeEnd]
  );

  return (
    <div className={cn("group flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={inputId}
        className="text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent"
      >
        {label}
      </label>
      <div className="relative">
        <button
          ref={anchorRef}
          type="button"
          id={inputId}
          onClick={() => {
            if (!disabled) setOpen((current) => !current);
          }}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-ground/60 px-4 py-3 text-left text-sm text-ink",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
            "hover:border-glass-border hover:bg-ground-raised/60",
            error
              ? "border-danger focus:border-danger focus:shadow-danger-glow"
              : "border-glass-border",
            !start && !end && "text-ink-muted",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span className="min-w-0 truncate">{formatRange(start, end)}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>

        {open &&
          createPortal(
            <CalendarPanel
              panelId={panelId}
              panelRef={panelRef}
              view={view}
              onViewChange={setView}
              highlight={highlight}
              onHighlightChange={setHighlight}
              dayState={dayState}
              onSelect={handleSelect}
              onHoverDay={setHoverDay}
              labelPrefix="Seleccionar período"
              footer={
                <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3">
                  {start || end ? (
                    <button
                      type="button"
                      onClick={clearRange}
                      className="text-xs font-medium text-ink-muted transition-colors hover:text-danger"
                    >
                      Borrar período
                    </button>
                  ) : (
                    <span className="text-xs text-ink-subtle">Elegí una fecha de inicio</span>
                  )}
                  {draft ? (
                    <span className="text-xs text-ink-subtle">Elegí la fecha de fin</span>
                  ) : (
                    <span className="text-xs text-ink-subtle">Elegí un día para empezar</span>
                  )}
                </div>
              }
            />,
            document.body
          )}
      </div>
      {error && (
        <span id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}