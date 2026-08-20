"use client";

import { cn } from "@/lib/utils";
import { Budget } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  PiggyBank,
  Pencil,
  RefreshCw,
  CircleStop,
  Tag,
  Repeat,
  CalendarRange,
  CalendarDays,
  Coins,
  AlertTriangle,
} from "lucide-react";

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

function progressStyle(percentage: number): { badge: string; bar: string; label: string } {
  if (percentage > 100) return RESULTADO_STYLES.EXCEDIDO;
  if (percentage >= 80) return RESULTADO_STYLES.EN_LIMITE;
  return RESULTADO_STYLES.CUMPLIDO;
}

function isExpired(budget: Budget): boolean {
  return Boolean(budget.isActive) && new Date(budget.endDate) < new Date();
}

function statusInfo(budget: Budget): { badge: string; label: string } {
  if (!budget.isActive) return { badge: "bg-glass text-ink-muted", label: "Finalizado" };
  if (isExpired(budget)) return { badge: "bg-danger/10 text-danger", label: "Expirado" };
  return { badge: "bg-income/10 text-income", label: "Activo" };
}

interface MetadataItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function MetadataItem({ label, value, icon }: MetadataItemProps) {
  return (
    <div className="flex items-center gap-3">
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass text-ink-muted">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-ink-subtle">{label}</p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

interface BudgetDetailCardProps {
  budget: Budget;
  categoryName?: string | null;
  onEdit?: () => void;
  onRecalculate?: () => void;
  onFinalize?: () => void;
  recalculating?: boolean;
}

export function BudgetDetailCard({
  budget,
  categoryName,
  onEdit,
  onRecalculate,
  onFinalize,
  recalculating = false,
}: BudgetDetailCardProps) {
  const percentage = Math.min(100, Math.max(0, budget.percentage));
  const style = budget.resultado ? RESULTADO_STYLES[budget.resultado] : progressStyle(budget.percentage);
  const isOver = budget.spent > budget.amount;
  const isGeneral = !budget.categoryId;
  const status = statusInfo(budget);

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-ink">{budget.name}</h2>
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
        </div>

        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", status.badge)}>
          {status.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-muted">
            <span className="text-xl font-semibold text-ink">
              {formatCurrency(budget.spent, budget.currency)}
            </span>{" "}
            de {formatCurrency(budget.amount, budget.currency)}
          </p>
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", style.badge)}>
            {Math.round(budget.percentage)}%
          </span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-glass"
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
        <p className={cn("mt-3 text-sm font-semibold", isOver ? "text-danger" : "text-ink")}>
          {isOver
            ? `Excedido por ${formatCurrency(budget.spent - budget.amount, budget.currency)}`
            : `Disponible: ${formatCurrency(budget.remaining, budget.currency)}`}
        </p>
      </div>

      {/* Actions */}
      {budget.isActive && (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-glass-border pt-5">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          )}
          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", recalculating && "animate-spin")} />
              Recalcular
            </button>
          )}
          {onFinalize && (
            <button
              type="button"
              onClick={onFinalize}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-glass-hover hover:text-danger"
            >
              <CircleStop className="h-4 w-4" />
              Finalizar
            </button>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-glass-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetadataItem
          label="Categoría"
          value={isGeneral ? "General (todas las categorías)" : categoryName ?? "—"}
          icon={<Tag className="h-4 w-4" />}
        />
        <MetadataItem
          label="Período"
          value={PERIOD_LABELS[budget.period]}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <MetadataItem
          label="Rango de fechas"
          value={`${formatShortDate(budget.startDate)} – ${formatShortDate(budget.endDate)}`}
          icon={<CalendarRange className="h-4 w-4" />}
        />
        <MetadataItem
          label="Moneda"
          value={budget.currency}
          icon={<Coins className="h-4 w-4" />}
        />
        <MetadataItem
          label="Acumula saldo"
          value={budget.rollover ? "Sí" : "No"}
          icon={<Repeat className="h-4 w-4" />}
        />
        <MetadataItem
          label="Umbrales de alerta"
          value={budget.alertThresholds.map((value) => `${value}%`).join(", ") || "—"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>
    </section>
  );
}