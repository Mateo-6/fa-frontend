"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { SelectField } from "@/components/ui/select-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import {
  createBudget,
  updateBudget,
  Budget,
  BudgetPeriod,
  Category,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "@/lib/api";
import { Save, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
];

const CURRENCY_OPTIONS = [
  { value: "COP", label: "Peso colombiano (COP)" },
  { value: "USD", label: "Dólar estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
];

const ALERT_THRESHOLDS = [50, 80, 100] as const;

interface FormState {
  name: string;
  amount: string;
  currency: string;
  period: BudgetPeriod;
  categoryId: string;
  startDate: string;
  rollover: boolean;
  alertThresholds: number[];
}

function todayISO(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalISODate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return todayISO();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function thresholdsToArray(thresholds: number[]): number[] {
  return ALERT_THRESHOLDS.filter((value) => thresholds.includes(value));
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function initState(budget?: Budget | null): FormState {
  if (!budget) {
    return {
      name: "",
      amount: "",
      currency: "COP",
      period: "MONTHLY",
      categoryId: "",
      startDate: todayISO(),
      rollover: false,
      alertThresholds: [...ALERT_THRESHOLDS],
    };
  }

  return {
    name: budget.name,
    amount: String(budget.amount),
    currency: budget.currency,
    period: budget.period,
    categoryId: budget.categoryId ?? "",
    startDate: toLocalISODate(budget.startDate),
    rollover: budget.rollover,
    alertThresholds: thresholdsToArray(budget.alertThresholds),
  };
}

interface BudgetFormProps {
  budget?: Budget | null;
  categories?: Category[];
  onSuccess?: (budget: Budget) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function BudgetForm({ budget, categories = [], onSuccess, onCancel, submitLabel }: BudgetFormProps) {
  const isEdit = Boolean(budget);

  const [form, setForm] = React.useState<FormState>(() => initState(budget));
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (serverError) setServerError(null);
  };

  const expenseCategories = categories.filter((category) => category.type === "expense");

  const categoryOptions = [
    { value: "", label: "General (todas las categorías)" },
    ...expenseCategories.map((category) => ({ value: category.id, label: category.name })),
  ];

  const toggleThreshold = (value: number) => {
    setField(
      "alertThresholds",
      form.alertThresholds.includes(value)
        ? form.alertThresholds.filter((threshold) => threshold !== value)
        : [...form.alertThresholds, value].sort((a, b) => a - b)
    );
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const amount = parseAmount(form.amount);

    if (!form.name.trim()) {
      next.name = "El nombre es obligatorio";
    } else if (form.name.length > 100) {
      next.name = "Máximo 100 caracteres";
    }
    if (amount === null || amount <= 0) {
      next.amount = "Ingresa un monto mayor a 0";
    }
    if (!form.currency) {
      next.currency = "Selecciona una moneda";
    }
    if (!form.startDate) {
      next.startDate = "Selecciona una fecha";
    }
    if (form.alertThresholds.length === 0) {
      next.alertThresholds = "Selecciona al menos un umbral";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const amount = parseAmount(form.amount)!;
      const alertThresholds = form.alertThresholds;

      let saved: Budget;

      if (isEdit && budget) {
        const payload: UpdateBudgetPayload = {
          name: form.name.trim(),
          amount,
          currency: form.currency,
          period: form.period,
          categoryId: form.categoryId || null,
          startDate: form.startDate,
          rollover: form.rollover,
          alertThresholds,
        };
        saved = await updateBudget(budget.id, payload);
      } else {
        const payload: CreateBudgetPayload = {
          name: form.name.trim(),
          amount,
          currency: form.currency,
          period: form.period,
          categoryId: form.categoryId || null,
          startDate: form.startDate,
          rollover: form.rollover,
          alertThresholds,
        };
        saved = await createBudget(payload);
      }

      onSuccess?.(saved);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar el presupuesto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Nombre"
        type="text"
        placeholder="Ej. Comida del mes"
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        error={errors.name}
        disabled={saving}
        maxLength={100}
      />

      <div className="grid grid-cols-2 gap-4">
        <MoneyInput
          label="Monto"
          placeholder="0,00"
          value={form.amount}
          onValueChange={(raw) => setField("amount", raw)}
          error={errors.amount}
          disabled={saving}
        />
        <SelectField
          label="Moneda"
          value={form.currency}
          onChange={(e) => setField("currency", e.target.value)}
          options={CURRENCY_OPTIONS}
          error={errors.currency}
          disabled={saving}
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="Período"
          value={form.period}
          onChange={(e) => setField("period", e.target.value as BudgetPeriod)}
          options={PERIOD_OPTIONS}
          disabled={saving}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Categoría"
          value={form.categoryId || "default"}
          onChange={(e) => setField("categoryId", e.target.value)}
          options={categoryOptions}
          placeholder="Selecciona una categoría"
          disabled={saving}
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <DatePicker
        label="Inicio del período"
        value={form.startDate}
        onChange={(value) => setField("startDate", value)}
        error={errors.startDate}
        disabled={saving}
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium tracking-wide text-ink-muted">Umbrales de alerta (%)</span>
        <div className="flex flex-wrap gap-2">
          {ALERT_THRESHOLDS.map((value) => {
            const active = form.alertThresholds.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleThreshold(value)}
                disabled={saving}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200",
                  active
                    ? "border-accent bg-accent/10 text-accent shadow-accent-glow"
                    : "border-glass-border bg-ground/60 text-ink-muted hover:bg-ground-raised",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {value}%
              </button>
            );
          })}
        </div>
        {errors.alertThresholds && (
          <span className="text-xs text-danger" role="alert">
            {errors.alertThresholds}
          </span>
        )}
      </div>
      <p className="-mt-2 text-xs text-ink-subtle">
        Recibirás una notificación al alcanzar cada porcentaje del monto.
      </p>

      <Switch
        label="Acumular saldo no usado"
        description="El monto restante del período anterior se suma al siguiente."
        checked={form.rollover}
        onChange={(checked) => setField("rollover", checked)}
        disabled={saving}
      />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={saving} disabled={saving}>
          {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear presupuesto")}
        </Button>
      </div>
    </form>
  );
}
