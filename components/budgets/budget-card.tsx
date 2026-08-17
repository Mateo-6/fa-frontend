"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Budget } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { Pencil, Trash2, PiggyBank, Repeat, Tag, CalendarRange, ChevronRight } from "lucide-react";

const PERIOD_LABELS: Record<Budget["period"], string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

const RESULTADO_STYLES: Record<
  string,
  { badge: string; bar: string; label: string }
> = {
  EXCEDIDO: { badge: "bg-danger/10 text-danger", bar: "bg-danger", label: "Excedido" },
  EN_LIMITE: { badge: "bg-accent/10 text-accent", bar: "bg-accent", label: "En el límite" },
  CUMPLIDO: { badge: "bg-income/10 text-income", bar: "bg-income", label: "Cumplido" },
};

function progressStyles(percentage: number): { badge: string; bar: string; label: string } {
  if (percentage > 100) return RESULTADO_STYLES.EXCEDIDO;
  if (percentage >= 80) return RESULTADO_STYLES.EN_LIMITE;
  return RESULTADO_STYLES.CUMPLIDO;
}

interface BudgetCardProps {
  budget: Budget;
  categoryName?: string | null;
  showActions?: boolean;
  onOpen?: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDeactivate: (budget: Budget) => void;
}

export function BudgetCard({
  budget,
  categoryName,
  showActions = true,
  onOpen,
  onEdit,
  onDeactivate,
}: BudgetCardProps) {
  const percentage = Math.min(100, Math.max(0, budget.percentage));
  const style = budget.resultado ? RESULTADO_STYLES[budget.resultado] : progressStyles(budget.percentage);
  const isOver = budget.spent > budget.amount;
  const isGeneral = !budget.categoryId;

  const handleOpen = () => onOpen?.(budget);

  const stopPropagation = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <article
      className={cn(
        "glass-panel flex flex-col gap-4 rounded-2xl p-5 transition-colors",
        onOpen && "cursor-pointer hover:bg-glass-hover"
      )}
      onClick={onOpen ? handleOpen : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <PiggyBank className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">{budget.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {isGeneral ? "General" : categoryName ?? "Categoría"}
            </span>
            <span className="text-ink-subtle">·</span>
            <span>{PERIOD_LABELS[budget.period]}</span>
            {budget.rollover && (
              <>
                <span className="text-ink-subtle">·</span>
                <span className="inline-flex items-center gap-1" title="Acumula el saldo no usado">
                  <Repeat className="h-3 w-3" />
                  Acumula saldo
                </span>
              </>
            )}
          </p>
        </div>
        {showActions && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(event) => {
                stopPropagation(event);
                onEdit(budget);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
              aria-label={`Editar ${budget.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                stopPropagation(event);
                onDeactivate(budget);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-danger"
              aria-label={`Desactivar ${budget.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-muted">
            <span className="font-semibold text-ink">
              {formatCurrency(budget.spent, budget.currency)}
            </span>{" "}
            de {formatCurrency(budget.amount, budget.currency)}
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              style.badge
            )}
          >
            {Math.round(budget.percentage)}%
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-glass"
          role="progressbar"
          aria-valuenow={Math.round(budget.percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progreso de ${budget.name}`}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", style.bar)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-glass-border pt-3">
        <div className="min-w-0">
          <p className="text-xs text-ink-subtle">Restante</p>
          <p className={cn("text-sm font-semibold", isOver ? "text-danger" : "text-ink")}>
            {isOver
              ? `Excedido por ${formatCurrency(budget.spent - budget.amount, budget.currency)}`
              : formatCurrency(budget.remaining, budget.currency)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-subtle">
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {formatShortDate(budget.startDate)} – {formatShortDate(budget.endDate)}
          </span>
          <span className="hidden text-ink-subtle sm:inline">·</span>
          <span className="hidden sm:inline">
            Alertas: {budget.alertThresholds.map((value) => `${value}%`).join(", ")}
          </span>
        </div>
      </div>

      {onOpen && (
        <div className="mt-1 flex items-center justify-end border-t border-glass-border pt-3">
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-accent/80"
            aria-label={`Ver detalle de ${budget.name}`}
          >
            Ver detalle
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </article>
  );
}
