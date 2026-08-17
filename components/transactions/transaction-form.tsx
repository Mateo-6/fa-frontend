"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { SegmentedControl, SegmentOption } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import {
  createTransaction,
  updateTransaction,
  getCategories,
  getPaymentMethods,
  getBudgets,
  parseTransactionIntent,
  Budget,
  Category,
  PaymentMethod,
  Transaction,
  TransactionType,
  RecurringFrequency,
  CreateTransactionPayload,
  UpdateTransactionPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Loader2,
  Save,
  Plus,
  Sparkles,
  PiggyBank,
} from "lucide-react";

const TYPE_OPTIONS: SegmentOption[] = [
  { value: "INCOME", label: "Ingreso", icon: ArrowDownLeft, semantic: "income" },
  { value: "EXPENSE", label: "Gasto", icon: ArrowUpRight, semantic: "expense" },
  { value: "TRANSFER", label: "Transferencia", icon: ArrowLeftRight, semantic: "credit" },
];

const TYPE_TO_CATEGORY: Record<TransactionType, Category["type"]> = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
};

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "YEARLY", label: "Anual" },
];

const PERIOD_LABELS: Record<Budget["period"], string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  YEARLY: "Anual",
};

const BUDGET_AMOUNT_OPTIONS: SegmentOption[] = [
  { value: "total", label: "Total de la compra" },
  { value: "custom", label: "Personalizado" },
];

const BUDGET_PROGRESS_STYLES: Record<string, { badge: string; bar: string }> = {
  EXCEDIDO: { badge: "bg-danger/10 text-danger", bar: "bg-danger" },
  EN_LIMITE: { badge: "bg-accent/10 text-accent", bar: "bg-accent" },
  CUMPLIDO: { badge: "bg-income/10 text-income", bar: "bg-income" },
};

function budgetProgressStyles(percentage: number): { badge: string; bar: string } {
  if (percentage > 100) return BUDGET_PROGRESS_STYLES.EXCEDIDO;
  if (percentage >= 80) return BUDGET_PROGRESS_STYLES.EN_LIMITE;
  return BUDGET_PROGRESS_STYLES.CUMPLIDO;
}

function BudgetProgressBar({ budget }: { budget: Budget }) {
  const percentage = Math.min(100, Math.max(0, budget.percentage));
  const style = budgetProgressStyles(budget.percentage);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="text-xs text-ink-subtle">
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
        className="h-1.5 w-full overflow-hidden rounded-full bg-glass"
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
  );
}

interface FormState {
  type: TransactionType;
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  paymentMethodId: string;
  sourcePaymentMethodId: string;
  destinationPaymentMethodId: string;
  budgetId: string;
  budgetAmount: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  recurringPayDay: string;
}

function todayISO(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayFromISO(localISO: string): string {
  const day = Number.parseInt(localISO.slice(8, 10), 10);
  return Number.isNaN(day) ? "1" : String(day);
}

function toLocalISODate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return todayISO();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toApiDate(localISO: string): string {
  return `${localISO}T00:00:00`;
}

function parseAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function addDaysISO(value: string, days: number): string {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (isNaN(date.getTime())) return value.slice(0, 10);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function budgetDateInRange(budget: Budget, localISO: string): boolean {
  const date = localISO.slice(0, 10);
  const start = budget.startDate?.slice(0, 10);
  const end = budget.endDate?.slice(0, 10);
  if (!start || !end) return true;
  if (date < start) return false;
  return date <= addDaysISO(end, 1);
}

function initState(transaction?: Transaction | null): FormState {
  if (!transaction) {
    return {
      type: "EXPENSE",
      amount: "",
      description: "",
      date: todayISO(),
      categoryId: "",
      paymentMethodId: "",
      sourcePaymentMethodId: "",
      destinationPaymentMethodId: "",
      budgetId: "",
      budgetAmount: "",
      isRecurring: false,
      recurringFrequency: "MONTHLY",
      recurringPayDay: dayFromISO(todayISO()),
    };
  }

  return {
    type: transaction.type,
    amount: String(transaction.amount),
    description: transaction.description,
    date: toLocalISODate(transaction.date),
    categoryId: transaction.category.id,
    paymentMethodId: transaction.paymentMethodId ?? "",
    sourcePaymentMethodId: transaction.sourcePaymentMethodId ?? "",
    destinationPaymentMethodId: transaction.destinationPaymentMethodId ?? "",
    budgetId: "",
    budgetAmount:
      transaction.budgetAmount === null || transaction.budgetAmount === undefined
        ? ""
        : String(transaction.budgetAmount),
    isRecurring: transaction.isRecurring ?? false,
    recurringFrequency: "MONTHLY",
    recurringPayDay: dayFromISO(toLocalISODate(transaction.date)),
  };
}

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function TransactionForm({ transaction, onSuccess, onCancel, submitLabel }: TransactionFormProps) {
  const isEdit = Boolean(transaction);

  const [form, setForm] = React.useState<FormState>(() => initState(transaction));
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [amiText, setAmiText] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [amiError, setAmiError] = React.useState<string | null>(null);
  const [amiRecognized, setAmiRecognized] = React.useState<string[] | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (serverError) setServerError(null);
  };

  React.useEffect(() => {
    let active = true;

    Promise.all([getCategories(), getPaymentMethods(), getBudgets({ isActive: true })])
      .then(([cats, methods, gotBudgets]) => {
        if (!active) return;
        setCategories(cats);
        setPaymentMethods(methods);
        setBudgets(gotBudgets);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setServerError(
          err instanceof Error ? err.message : "No se pudieron cargar las opciones del formulario"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleTypeChange = (type: string) => {
    if (type === form.type) return;
    setForm((prev) => ({
      ...prev,
      type: type as TransactionType,
      categoryId: "",
      paymentMethodId: "",
      sourcePaymentMethodId: "",
      destinationPaymentMethodId: "",
      budgetId: "",
      budgetAmount: "",
      isRecurring: false,
    }));
    setErrors((prev) => ({
      ...prev,
      categoryId: undefined,
      paymentMethodId: undefined,
      sourcePaymentMethodId: undefined,
      destinationPaymentMethodId: undefined,
      budgetAmount: undefined,
    }));
    setServerError(null);
  };

  const handlePayDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    if (cleaned === "") {
      setField("recurringPayDay", "");
      return;
    }
    const day = Number(cleaned);
    if (day < 1) setField("recurringPayDay", "1");
    else if (day > 31) setField("recurringPayDay", "31");
    else setField("recurringPayDay", cleaned);
  };

  const handleAmiParse = async () => {
    const text = amiText.trim();
    if (!text) {
      setAmiError("Describe la transacción, por ejemplo: 'Pago Netflix 12.500 el 15 de cada mes'.");
      return;
    }

    setParsing(true);
    setAmiError(null);
    setAmiRecognized(null);

    try {
      const result = await parseTransactionIntent(text);
      const fields = result.detectedFields;
      const recognized: string[] = [];
      const next = { ...form };

      if (fields.type.detected && fields.type.value) {
        const type = fields.type.value as TransactionType;
        if (type !== next.type) {
          next.type = type;
          next.categoryId = "";
          next.paymentMethodId = "";
          next.sourcePaymentMethodId = "";
          next.destinationPaymentMethodId = "";
          next.isRecurring = false;
        }
        recognized.push("tipo");
      }
      if (fields.description.detected && fields.description.value) {
        next.description = fields.description.value;
        recognized.push("descripción");
      }
      if (fields.amount.detected && fields.amount.value !== null) {
        next.amount = String(fields.amount.value);
        recognized.push("valor");
      }
      if (fields.date.detected && fields.date.value) {
        next.date = /^\d{4}-\d{2}-\d{2}$/.test(fields.date.value)
          ? fields.date.value
          : toLocalISODate(fields.date.value);
        recognized.push("fecha");
      }
      if (fields.categoryId.detected && fields.categoryId.value) {
        next.categoryId = fields.categoryId.value;
        recognized.push("categoría");
      }
      if (fields.paymentMethodId.detected && fields.paymentMethodId.value) {
        next.paymentMethodId = fields.paymentMethodId.value;
        recognized.push("método de pago");
      }
      if (fields.transferSourceId.detected && fields.transferSourceId.value) {
        next.sourcePaymentMethodId = fields.transferSourceId.value;
        recognized.push("origen");
      }
      if (fields.transferDestinationId.detected && fields.transferDestinationId.value) {
        next.destinationPaymentMethodId = fields.transferDestinationId.value;
        recognized.push("destino");
      }
      if (fields.isRecurring.detected && fields.isRecurring.value !== null) {
        next.isRecurring = fields.isRecurring.value;
        if (fields.isRecurring.value) recognized.push("recurrencia");
      }
      if (fields.recurringFrequency.detected && fields.recurringFrequency.value) {
        next.recurringFrequency = fields.recurringFrequency.value as RecurringFrequency;
      }
      if (fields.recurringPayDay.detected && fields.recurringPayDay.value !== null) {
        next.recurringPayDay = String(fields.recurringPayDay.value);
      }
      if (fields.budgetAmountInput.detected && fields.budgetAmountInput.value !== null) {
        next.budgetAmount = String(fields.budgetAmountInput.value);
        recognized.push("presupuesto");
      }

      setForm(next);
      setErrors((prev) => {
        const cleared = { ...prev };
        for (const key of [
          "amount",
          "description",
          "date",
          "categoryId",
          "paymentMethodId",
          "sourcePaymentMethodId",
          "destinationPaymentMethodId",
          "recurringPayDay",
          "budgetAmount",
        ] as const) {
          if (cleared[key]) cleared[key] = undefined;
        }
        return cleared;
      });
      setServerError(null);
      setAmiRecognized(recognized);
    } catch (err) {
      setAmiRecognized(null);
      setAmiError(
        err instanceof Error
          ? err.message
          : "No se pudo reconocer la transacción. Intenta de nuevo."
      );
    } finally {
      setParsing(false);
    }
  };

  const categoryOptions = categories
    .filter((category) => category.type === TYPE_TO_CATEGORY[form.type])
    .map((category) => ({ value: category.id, label: category.name }));

  const paymentOptions = paymentMethods
    .filter((method) => !(form.type === "INCOME" && method.type === "CREDIT_CARD"))
    .map((method) => ({ value: method.id, label: method.name }));

  const sourceOptions = paymentOptions.filter(
    (option) => option.value !== form.destinationPaymentMethodId
  );
  const destinationOptions = paymentOptions.filter(
    (option) => option.value !== form.sourcePaymentMethodId
  );

  const applicableBudgets = React.useMemo(() => {
    if (form.type !== "EXPENSE" || !form.categoryId) return [];
    return budgets.filter(
      (budget) =>
        budget.isActive &&
        (budget.categoryId === form.categoryId || budget.categoryId === null) &&
        budgetDateInRange(budget, form.date)
    );
  }, [budgets, form.type, form.categoryId, form.date]);

  const selectedBudget = React.useMemo(
    () => applicableBudgets.find((budget) => budget.id === form.budgetId) ?? null,
    [applicableBudgets, form.budgetId]
  );

  React.useEffect(() => {
    if (form.type !== "EXPENSE" || !form.categoryId) return;
    setForm((prev) => {
      if (prev.budgetId && applicableBudgets.some((budget) => budget.id === prev.budgetId)) {
        return prev;
      }
      const preferred =
        applicableBudgets.find((budget) => budget.categoryId === form.categoryId) ??
        applicableBudgets[0];
      if (!preferred) return prev.budgetId === "" ? prev : { ...prev, budgetId: "" };
      return { ...prev, budgetId: preferred.id };
    });
  }, [applicableBudgets, form.categoryId, form.type]);

  const handleBudgetModeChange = (mode: string) => {
    if (mode === "total") {
      setField("budgetAmount", "");
      return;
    }
    if (form.budgetAmount === "") {
      const amount = parseAmount(form.amount);
      setField("budgetAmount", amount !== null ? String(amount) : "");
    }
  };

  const totalAmount = parseAmount(form.amount);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const amount = parseAmount(form.amount);

    if (amount === null || amount <= 0) {
      next.amount = "Ingresa un monto mayor a 0";
    }
    if (!form.description.trim()) {
      next.description = "La descripción es obligatoria";
    } else if (form.description.length > 500) {
      next.description = "Máximo 500 caracteres";
    }
    if (!form.date) {
      next.date = "Selecciona una fecha";
    }
    if (!form.categoryId) {
      next.categoryId = "Selecciona una categoría";
    }
    if (form.type === "EXPENSE" && !form.paymentMethodId) {
      next.paymentMethodId = "Selecciona el método de pago";
    }
    if (form.type === "EXPENSE" && form.isRecurring && form.recurringFrequency !== "WEEKLY") {
      const payDay = Number.parseInt(form.recurringPayDay, 10);
      if (Number.isNaN(payDay) || payDay < 1 || payDay > 31) {
        next.recurringPayDay = "Elige un día entre 1 y 31";
      }
    }
    if (form.type === "TRANSFER") {
      if (!form.sourcePaymentMethodId) next.sourcePaymentMethodId = "Selecciona el origen";
      if (!form.destinationPaymentMethodId) next.destinationPaymentMethodId = "Selecciona el destino";
      if (
        form.sourcePaymentMethodId &&
        form.destinationPaymentMethodId &&
        form.sourcePaymentMethodId === form.destinationPaymentMethodId
      ) {
        next.destinationPaymentMethodId = "El destino debe ser distinto del origen";
      }
    }
    if (form.budgetId !== "" && form.budgetAmount !== "") {
      const budget = parseAmount(form.budgetAmount);
      if (budget === null || budget < 0) {
        next.budgetAmount = "Debe ser un número mayor o igual a 0";
      } else if (amount !== null && budget > amount) {
        next.budgetAmount = "No puede superar el valor de la transacción";
      }
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
      const hasApplicableBudgets = applicableBudgets.length > 0;
      let budgetAmount: number | null = null;
      if (form.budgetId !== "" && form.budgetAmount !== "") {
        budgetAmount = parseAmount(form.budgetAmount);
      } else if (form.budgetId !== "" && form.budgetAmount === "") {
        budgetAmount = null;
      } else if (hasApplicableBudgets) {
        budgetAmount = 0;
      }

      const base = {
        amount,
        description: form.description.trim(),
        date: toApiDate(form.date),
        type: form.type,
        categoryId: form.categoryId,
        budgetAmount,
        ...(form.type === "EXPENSE" && form.isRecurring
          ? {
              isRecurring: true,
              recurringFrequency: form.recurringFrequency,
              ...(form.recurringFrequency !== "WEEKLY"
                ? { recurringPayDay: Number.parseInt(form.recurringPayDay, 10) }
                : {}),
            }
          : {}),
      };

      let saved: Transaction;

      if (isEdit && transaction) {
        const payload: UpdateTransactionPayload = { ...base };
        if (form.type === "EXPENSE") payload.paymentMethodId = form.paymentMethodId;
        if (form.type === "INCOME" && form.paymentMethodId)
          payload.paymentMethodId = form.paymentMethodId;
        if (form.type === "TRANSFER") {
          payload.sourcePaymentMethodId = form.sourcePaymentMethodId;
          payload.destinationPaymentMethodId = form.destinationPaymentMethodId;
        }
        saved = await updateTransaction(transaction.id, payload);
      } else {
        const payload: CreateTransactionPayload = { ...base };
        if (form.type === "EXPENSE") payload.paymentMethodId = form.paymentMethodId;
        if (form.type === "INCOME" && form.paymentMethodId)
          payload.paymentMethodId = form.paymentMethodId;
        if (form.type === "TRANSFER") {
          payload.sourcePaymentMethodId = form.sourcePaymentMethodId;
          payload.destinationPaymentMethodId = form.destinationPaymentMethodId;
        }
        saved = await createTransaction(payload);
      }

      onSuccess?.(saved);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "No se pudo guardar la transacción"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-sm">Cargando opciones...</p>
      </div>
    );
  }

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

      {!isEdit && (
        <div className="rounded-lg border border-glass-border px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-ink">Asistente IA</span>
          </div>
          <p className="mb-3 text-xs text-ink-muted">
            Describe la transacción en una frase y se completarán los campos automáticamente.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Ej. Pago supermercado Éxito 120.000 con la tarjeta ayer"
              value={amiText}
              onChange={(e) => {
                setAmiText(e.target.value);
                if (amiError) setAmiError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAmiParse();
                }
              }}
              disabled={parsing || saving}
              maxLength={500}
              className={cn(
                "w-full min-w-0 flex-1 rounded-lg border bg-ground/60 px-4 py-3 text-sm text-ink",
                "placeholder:text-ink-muted",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
                "hover:border-glass-border hover:bg-ground-raised/60",
                "disabled:cursor-not-allowed disabled:opacity-60",
                amiError ? "border-danger focus:border-danger focus:shadow-danger-glow" : "border-glass-border"
              )}
            />
            <Button
              type="button"
              variant="primary"
              isLoading={parsing}
              disabled={parsing || saving}
              onClick={handleAmiParse}
              className="shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              {parsing ? "Reconociendo..." : "Reconocer"}
            </Button>
          </div>
          {amiError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {amiError}
            </p>
          )}
          {amiRecognized && (
            <p className="mt-2 text-xs text-ink-muted">
              {amiRecognized.length > 0
                ? `Detectado: ${amiRecognized.join(", ")}. Revisa los campos antes de guardar.`
                : "No se detectaron campos. Completa el formulario manualmente."}
            </p>
          )}
        </div>
      )}

      <SegmentedControl
        label="Tipo"
        options={TYPE_OPTIONS}
        value={form.type}
        onChange={handleTypeChange}
        disabled={saving}
      />

      {form.type === "EXPENSE" && (
        <div className="rounded-lg border border-glass-border px-4 py-3">
          <Switch
            label="Gasto recurrente"
            description="Este gasto se repite de manera periódica."
            checked={form.isRecurring}
            onChange={(checked) => setField("isRecurring", checked)}
            disabled={saving}
          />
          {form.isRecurring && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <SelectField
                label="Frecuencia"
                value={form.recurringFrequency}
                onChange={(e) => setField("recurringFrequency", e.target.value as RecurringFrequency)}
                options={FREQUENCY_OPTIONS}
                disabled={saving}
              />
              {form.recurringFrequency !== "WEEKLY" && (
                <Input
                  label="Día de pago"
                  type="number"
                  min={1}
                  max={31}
                  placeholder="1-31"
                  value={form.recurringPayDay}
                  onChange={handlePayDayChange}
                  error={errors.recurringPayDay}
                  disabled={saving}
                />
              )}
            </div>
          )}
        </div>
      )}

      <Input
        label="Descripción"
        type="text"
        placeholder="Ej. Supermercado, salario, transferencia a ahorros"
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        error={errors.description}
        disabled={saving}
        maxLength={500}
      />

      <div className="grid grid-cols-2 gap-4">
        <MoneyInput
          label="Valor"
          placeholder="0,00"
          value={form.amount}
          onValueChange={(raw) => setField("amount", raw)}
          error={errors.amount}
          disabled={saving}
        />
        <DatePicker
          label="Fecha"
          value={form.date}
          onChange={(value) => setField("date", value)}
          error={errors.date}
          disabled={saving}
        />
      </div>

      <SelectField
        label="Categoría"
        value={form.categoryId || "default"}
        onChange={(e) => setField("categoryId", e.target.value)}
        options={categoryOptions}
        placeholder="Selecciona una categoría"
        error={errors.categoryId}
        disabled={saving}
      >
        {categoryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      {categoryOptions.length === 0 && (
        <p className="-mt-2 text-xs text-ink-muted">
          Aún no hay categorías de este tipo.{" "}
          <span className="text-accent">Crea categorías primero.</span>
        </p>
      )}

      {form.type === "EXPENSE" && (
        <SelectField
          label="Método de pago"
          value={form.paymentMethodId || "default"}
          onChange={(e) => setField("paymentMethodId", e.target.value)}
          options={paymentOptions}
          placeholder="Selecciona un método"
          error={errors.paymentMethodId}
          disabled={saving}
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      )}

      {form.type === "INCOME" && (
        <SelectField
          label="Método de pago (opcional)"
          value={form.paymentMethodId || "default"}
          onChange={(e) => setField("paymentMethodId", e.target.value)}
          options={paymentOptions}
          placeholder="Sin método específico"
          disabled={saving}
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      )}

      {form.type === "TRANSFER" && (
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Desde"
            value={form.sourcePaymentMethodId || "default"}
            onChange={(e) => setField("sourcePaymentMethodId", e.target.value)}
            options={sourceOptions}
            placeholder="Origen"
            error={errors.sourcePaymentMethodId}
            disabled={saving}
          >
            {sourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Hacia"
            value={form.destinationPaymentMethodId || "default"}
            onChange={(e) => setField("destinationPaymentMethodId", e.target.value)}
            options={destinationOptions}
            placeholder="Destino"
            error={errors.destinationPaymentMethodId}
            disabled={saving}
          >
            {destinationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      {form.type === "EXPENSE" && applicableBudgets.length > 0 && (
        <div className="rounded-lg border border-glass-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-ink">Presupuesto</span>
          </div>
          <div className="flex flex-col gap-4">
            <SelectField
              label="Aplicar a"
              value={form.budgetId || "none"}
              onChange={(e) =>
                setField("budgetId", e.target.value === "none" ? "" : e.target.value)
              }
              disabled={saving}
            >
              <option value="none">Sin presupuesto</option>
              {applicableBudgets.map((budget) => {
                const isGeneral = budget.categoryId === null;
                return (
                  <option key={budget.id} value={budget.id}>
                    {budget.name} · {PERIOD_LABELS[budget.period]}
                    {isGeneral ? " · General" : ""}
                  </option>
                );
              })}
            </SelectField>

            {form.budgetId !== "" && (
              <div className="flex flex-col gap-3">
                <SegmentedControl
                  label="Monto al presupuesto"
                  options={BUDGET_AMOUNT_OPTIONS}
                  value={form.budgetAmount === "" ? "total" : "custom"}
                  onChange={handleBudgetModeChange}
                  disabled={saving}
                />
                {form.budgetAmount !== "" ? (
                  <MoneyInput
                    label="Monto personalizado"
                    placeholder="0,00"
                    value={form.budgetAmount}
                    onValueChange={(raw) => setField("budgetAmount", raw)}
                    error={errors.budgetAmount}
                    disabled={saving}
                  />
                ) : totalAmount !== null ? (
                  <p className="text-xs text-ink-subtle">
                    Se imputará el valor total de la compra ({formatCurrency(totalAmount)}).
                  </p>
                ) : null}
                {selectedBudget && <BudgetProgressBar budget={selectedBudget} />}
              </div>
            )}

            <p className="text-xs text-ink-subtle">
              {form.budgetId === ""
                ? "Este gasto no se contará en ningún presupuesto."
                : "Este gasto se registrará contra el presupuesto seleccionado."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={saving} disabled={saving}>
          {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear transacción")}
        </Button>
      </div>
    </form>
  );
}