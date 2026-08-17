"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
import { DateField } from "@/components/ui/date-field";
import { SelectField } from "@/components/ui/select-field";
import { getPaymentMethods, payCreditCard, CreditCardDetail, PaymentMethod } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Wallet, Send } from "lucide-react";

interface CardPaymentFormProps {
  card: CreditCardDetail;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parseMoney(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function CardPaymentForm({ card, onSuccess, onCancel }: CardPaymentFormProps) {
  const [accounts, setAccounts] = React.useState<PaymentMethod[]>([]);
  const [loadingAccounts, setLoadingAccounts] = React.useState(true);

  const [sourceAccountId, setSourceAccountId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(todayISO);
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    getPaymentMethods()
      .then((methods) => {
        if (!active) return;
        const bankAccounts = methods.filter((method) => method.type === "BANK_ACCOUNT");
        setAccounts(bankAccounts);
        if (bankAccounts.length === 1) {
          setSourceAccountId(bankAccounts[0].id);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setServerError(
          err instanceof Error ? err.message : "No se pudieron cargar las cuentas bancarias"
        );
      })
      .finally(() => {
        if (active) setLoadingAccounts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const validate = (): boolean => {
    const next: Record<string, string | undefined> = {};
    if (!sourceAccountId) {
      next.sourceAccountId = "Selecciona una cuenta de origen";
    }
    const parsed = parseMoney(amount);
    if (parsed === null || parsed <= 0) {
      next.amount = "El monto debe ser mayor a cero";
    } else if (parsed > card.currentBalance) {
      next.amount = "El monto no puede superar el saldo actual";
    }
    if (!date) next.date = "Selecciona la fecha del pago";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    const parsedAmount = parseMoney(amount)!;
    setSaving(true);
    try {
      await payCreditCard(card.id, {
        sourceAccountId,
        amount: parsedAmount,
        date: `${date}T12:00:00Z`,
        billingPeriodStart: card.currentPeriodSummary.startDate,
        billingPeriodEnd: card.currentPeriodSummary.endDate,
      });
      onSuccess?.();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo registrar el pago");
    } finally {
      setSaving(false);
    }
  };

  const accountOptions = accounts.map((account) => {
    const details = account.details ?? {};
    const label = [
      account.name,
      details.bank_name,
      details.account_number ? `•••• ${details.account_number}` : undefined,
    ]
      .filter(Boolean)
      .join(" · ");
    return { value: account.id, label };
  });

  const noAccounts = !loadingAccounts && accounts.length === 0;

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

      {loadingAccounts ? (
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-glass" />
          <div className="h-11 animate-pulse rounded-lg bg-glass" />
        </div>
      ) : noAccounts ? (
        <div className="rounded-lg border border-glass-border bg-glass px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Necesitas una cuenta bancaria</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Los pagos se registran descontando el saldo de una cuenta de ahorros o corriente.
                Crea una en Métodos de pago y vuelve a intentarlo.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <SelectField
            label="Cuenta de origen"
            value={sourceAccountId}
            onChange={(e) => {
              setSourceAccountId(e.target.value);
              if (errors.sourceAccountId) {
                setErrors((prev) => ({ ...prev, sourceAccountId: undefined }));
              }
            }}
            options={accountOptions}
            placeholder="Selecciona la cuenta"
            error={errors.sourceAccountId}
            disabled={saving}
          />

          <MoneyInput
            label="Monto a pagar"
            placeholder="0,00"
            value={amount}
            onValueChange={(raw) => {
              setAmount(raw);
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
            }}
            error={errors.amount}
            disabled={saving}
          />

          <DateField
            label="Fecha del pago"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            error={errors.date}
            disabled={saving}
          />

          <div className="rounded-lg border border-glass-border bg-glass px-4 py-3">
            <p className="text-xs text-ink-muted">Saldo actual de la tarjeta</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
              {formatCurrency(card.currentBalance, card.currency)}
            </p>
          </div>
        </>
      )}

      {!noAccounts && (
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
          )}
          <Button type="submit" isLoading={saving} disabled={saving || loadingAccounts}>
            <Send className="h-4 w-4" />
            Realizar pago
          </Button>
        </div>
      )}
    </form>
  );
}