"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { SelectField } from "@/components/ui/select-field";
import { SegmentedControl, SegmentOption } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import {
  createPaymentMethod,
  updatePaymentMethod,
  togglePaymentMethodGmfExempt,
  PaymentMethod,
  PaymentMethodType,
  CreatePaymentMethodPayload,
} from "@/lib/api";
import { CreditCard, Landmark, Banknote, Plus, Save } from "lucide-react";

const TYPE_OPTIONS: SegmentOption[] = [
  { value: "CREDIT_CARD", label: "Tarjeta", icon: CreditCard, semantic: "credit" },
  { value: "BANK_ACCOUNT", label: "Cuenta", icon: Landmark },
  { value: "CASH", label: "Efectivo", icon: Banknote },
];

const CURRENCY_OPTIONS = [
  { value: "COP", label: "Peso colombiano (COP)" },
  { value: "USD", label: "Dólar estadounidense (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: "SAVINGS", label: "Ahorros" },
  { value: "CHECKING", label: "Corriente" },
];

const DAY_PATTERN = /^(0?[1-9]|[12][0-9]|3[01])$/;
const FOUR_DIGITS = /^\d{4}$/;

interface FormState {
  name: string;
  type: PaymentMethodType;
  currency: string;
  card_number: string;
  cut_off_day: string;
  payment_day: string;
  credit_limit: string;
  current_balance: string;
  bank_name: string;
  account_number: string;
  account_type: "SAVINGS" | "CHECKING" | "";
  amount: string;
  is_gmf_exempt: boolean;
  original_gmf: boolean;
}

interface PaymentMethodFormProps {
  method?: PaymentMethod | null;
  onSuccess?: (method: PaymentMethod) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

function parseMoney(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function initState(method?: PaymentMethod | null): FormState {
  if (!method) {
    return {
      name: "",
      type: "CREDIT_CARD",
      currency: "COP",
      card_number: "",
      cut_off_day: "",
      payment_day: "",
      credit_limit: "",
      current_balance: "",
      bank_name: "",
      account_number: "",
      account_type: "",
      amount: "",
      is_gmf_exempt: false,
      original_gmf: false,
    };
  }

  const details = method.details ?? {};
  const gmf = details.is_gmf_exempt === true;

  return {
    name: method.name,
    type: method.type,
    currency: method.currency,
    card_number: String(details.card_number ?? ""),
    cut_off_day: details.cut_off_day != null ? String(details.cut_off_day) : "",
    payment_day: details.payment_day != null ? String(details.payment_day) : "",
    credit_limit: details.credit_limit != null ? String(details.credit_limit) : "",
    current_balance: details.current_balance != null ? String(details.current_balance) : "",
    bank_name: details.bank_name ?? "",
    account_number: String(details.account_number ?? ""),
    account_type: (details.account_type as FormState["account_type"]) || "",
    amount: details.amount != null ? String(details.amount) : "",
    is_gmf_exempt: gmf,
    original_gmf: gmf,
  };
}

export function PaymentMethodForm({ method, onSuccess, onCancel, submitLabel }: PaymentMethodFormProps) {
  const isEdit = Boolean(method);
  const [form, setForm] = React.useState<FormState>(() => initState(method));
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (serverError) setServerError(null);
  };

  const handleTypeChange = (type: string) => {
    if (type === form.type) return;
    const nextType = type as PaymentMethodType;
    setForm((prev) => ({ ...prev, type: nextType, name: "" }));
    setErrors((prev) => ({
      ...prev,
      ...(nextType === "BANK_ACCOUNT"
        ? { bank_name: undefined, account_number: undefined, account_type: undefined }
        : {}),
      ...(nextType === "CREDIT_CARD"
        ? { card_number: undefined, cut_off_day: undefined, payment_day: undefined }
        : {}),
    }));
    setServerError(null);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const money = (key: keyof FormState, label: string, min = 0) => {
      const value = parseMoney(form[key] as string);
      if (value === null) next[key] = `${label} es obligatorio`;
      else if (value < min) next[key] = `${label} debe ser mayor o igual a ${min}`;
    };

    if (!form.name.trim()) next.name = "El nombre es obligatorio";

    if (form.type === "CREDIT_CARD") {
      if (!FOUR_DIGITS.test(form.card_number)) {
        next.card_number = "Ingresa los últimos 4 dígitos";
      }
      if (!DAY_PATTERN.test(form.cut_off_day)) next.cut_off_day = "Día entre 1 y 31";
      if (!DAY_PATTERN.test(form.payment_day)) next.payment_day = "Día entre 1 y 31";
      money("credit_limit", "El límite de crédito");
      money("current_balance", "El saldo actual");
    } else if (form.type === "BANK_ACCOUNT") {
      if (!form.bank_name.trim()) next.bank_name = "El nombre del banco es obligatorio";
      if (!FOUR_DIGITS.test(form.account_number)) {
        next.account_number = "Ingresa los últimos 4 dígitos";
      }
      if (!form.account_type) next.account_type = "Selecciona el tipo de cuenta";
      money("current_balance", "El saldo actual");
    } else if (form.type === "CASH") {
      money("amount", "El monto");
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildDetails = (): CreatePaymentMethodPayload["details"] => {
    if (form.type === "CREDIT_CARD") {
      return {
        card_number: form.card_number,
        cut_off_day: Number(form.cut_off_day),
        payment_day: Number(form.payment_day),
        credit_limit: parseMoney(form.credit_limit)!,
        current_balance: parseMoney(form.current_balance)!,
      };
    }
    if (form.type === "BANK_ACCOUNT") {
      return {
        bank_name: form.bank_name.trim(),
        account_number: form.account_number,
        account_type: form.account_type,
        current_balance: parseMoney(form.current_balance) ?? 0,
      };
    }
    return { amount: parseMoney(form.amount)! };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const base: CreatePaymentMethodPayload = {
        name: form.name.trim(),
        type: form.type,
        currency: form.currency,
        details: buildDetails(),
      };

      let saved: PaymentMethod;

      if (isEdit && method) {
        saved = await updatePaymentMethod(method.id, base);
        if (
          form.type === "BANK_ACCOUNT" &&
          form.is_gmf_exempt !== form.original_gmf
        ) {
          saved = await togglePaymentMethodGmfExempt(saved.id, form.is_gmf_exempt);
        }
      } else {
        saved = await createPaymentMethod(base);
        if (form.type === "BANK_ACCOUNT" && form.is_gmf_exempt) {
          saved = await togglePaymentMethodGmfExempt(saved.id, true);
        }
      }

      onSuccess?.(saved);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar el método de pago");
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

      <SegmentedControl
        label="Tipo"
        options={TYPE_OPTIONS}
        value={form.type}
        onChange={handleTypeChange}
        disabled={saving || isEdit}
      />

      <Input
        label="Nombre"
        type="text"
        placeholder={
          form.type === "CREDIT_CARD"
            ? "Ej. Visa, Mastercard, Amex"
            : form.type === "BANK_ACCOUNT"
              ? "Ej. Cuenta principal, Nómina"
              : "Ej. Efectivo de casa"
        }
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        error={errors.name}
        disabled={saving}
        maxLength={100}
      />

      <SelectField
        label="Moneda"
        value={form.currency}
        onChange={(e) => setField("currency", e.target.value)}
        options={CURRENCY_OPTIONS}
        disabled={saving}
      />

      {form.type === "CREDIT_CARD" && (
        <>
          <Input
            label="Últimos 4 dígitos de la tarjeta"
            type="text"
            inputMode="numeric"
            placeholder="Ej. 4242"
            value={form.card_number}
            onChange={(e) => setField("card_number", e.target.value.replace(/\D/g, "").slice(0, 4))}
            error={errors.card_number}
            disabled={saving}
            maxLength={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Día de corte"
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              placeholder="Ej. 15"
              value={form.cut_off_day}
              onChange={(e) => setField("cut_off_day", e.target.value)}
              error={errors.cut_off_day}
              disabled={saving}
            />
            <Input
              label="Día de pago"
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              placeholder="Ej. 28"
              value={form.payment_day}
              onChange={(e) => setField("payment_day", e.target.value)}
              error={errors.payment_day}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput
              label="Límite de crédito"
              placeholder="0,00"
              value={form.credit_limit}
              onValueChange={(raw) => setField("credit_limit", raw)}
              error={errors.credit_limit}
              disabled={saving}
            />
            <MoneyInput
              label="Saldo actual"
              placeholder="0,00"
              value={form.current_balance}
              onValueChange={(raw) => setField("current_balance", raw)}
              error={errors.current_balance}
              disabled={saving}
            />
          </div>
        </>
      )}

      {form.type === "BANK_ACCOUNT" && (
        <>
          <Input
            label="Banco"
            type="text"
            placeholder="Ej. Banco Nacional, Bancolombia"
            value={form.bank_name}
            onChange={(e) => setField("bank_name", e.target.value)}
            error={errors.bank_name}
            disabled={saving}
            maxLength={100}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Últimos 4 dígitos de la cuenta"
              type="text"
              inputMode="numeric"
              placeholder="Ej. 1234"
              value={form.account_number}
              onChange={(e) => setField("account_number", e.target.value.replace(/\D/g, "").slice(0, 4))}
              error={errors.account_number}
              disabled={saving}
              maxLength={4}
            />
            <SelectField
              label="Tipo de cuenta"
              value={form.account_type || "default"}
              onChange={(e) => {
                const value = e.target.value === "default" ? "" : (e.target.value as FormState["account_type"]);
                setField("account_type", value);
                if (value !== "SAVINGS") setField("is_gmf_exempt", false);
              }}
              options={ACCOUNT_TYPE_OPTIONS}
              placeholder="Selecciona"
              error={errors.account_type}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MoneyInput
              label="Saldo actual"
              placeholder="0,00"
              value={form.current_balance}
              onValueChange={(raw) => setField("current_balance", raw)}
              error={errors.current_balance}
              disabled={saving}
            />
            <div className="flex items-end">
              {form.account_type === "SAVINGS" ? (
                <Switch
                  checked={form.is_gmf_exempt}
                  onChange={(checked) => setField("is_gmf_exempt", checked)}
                  disabled={saving}
                  label="Exenta de GMF"
                  description="El 4x1000 no aplica"
                  id="gmf-exempt-field"
                />
              ) : form.account_type === "CHECKING" ? (
                <p className="pb-1 text-xs text-ink-subtle">
                  Las cuentas corrientes no admiten la exención del 4x1000.
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}

      {form.type === "CASH" && (
        <MoneyInput
          label="Monto en efectivo"
          placeholder="0,00"
          value={form.amount}
          onValueChange={(raw) => setField("amount", raw)}
          error={errors.amount}
          disabled={saving}
        />
      )}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={saving} disabled={saving}>
          {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear método")}
        </Button>
      </div>
    </form>
  );
}