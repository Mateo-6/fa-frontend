"use client";

import { cn } from "@/lib/utils";
import { PaymentMethod } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { CreditCard, Landmark, Banknote, Pencil, Trash2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface PaymentMethodRowProps {
  method: PaymentMethod;
  gmfToggling?: boolean;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
  onToggleGmf: (method: PaymentMethod, checked: boolean) => void;
}

const TYPE_META: Record<
  PaymentMethod["type"],
  { icon: typeof CreditCard; badge: string }
> = {
  CREDIT_CARD: { icon: CreditCard, badge: "bg-credit/10 text-credit" },
  BANK_ACCOUNT: { icon: Landmark, badge: "bg-accent/10 text-accent" },
  CASH: { icon: Banknote, badge: "bg-income/10 text-income" },
};

export function PaymentMethodRow({
  method,
  gmfToggling,
  onEdit,
  onDelete,
  onToggleGmf,
}: PaymentMethodRowProps) {
  const details = method.details ?? {};
  const style = TYPE_META[method.type];
  const Icon = style.icon;

  const isCard = method.type === "CREDIT_CARD";
  const isBank = method.type === "BANK_ACCOUNT";

  const balance =
    method.type === "CASH"
      ? (details.amount ?? 0)
      : (details.current_balance ?? 0);

  const limit = details.credit_limit ?? 0;
  const utilization = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0;

  const meta = isCard
    ? `•••• ${details.card_number ?? ""}`
    : isBank
      ? `${details.bank_name ?? ""} · ${
          details.account_type === "SAVINGS" ? "Ahorros" : details.account_type === "CHECKING" ? "Corriente" : ""
        } · •••• ${details.account_number ?? ""}`
      : "Efectivo";

  const amountLabel = isCard
    ? `${formatCurrency(balance, method.currency)} de ${formatCurrency(limit, method.currency)}`
    : formatCurrency(balance, method.currency);

  const gmfExempt = details.is_gmf_exempt === true;
  const isSavings = details.account_type === "SAVINGS";

  return (
    <div className="group border-b border-glass-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            style.badge
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{method.name}</p>
              <p className="truncate text-xs text-ink-muted">{meta}</p>
            </div>
            {isCard ? (
              <p className="shrink-0 text-right text-sm font-semibold text-ink">
                {formatCurrency(balance, method.currency)}
                <span className="block text-xs font-normal text-ink-muted">
                  de {formatCurrency(limit, method.currency)}
                </span>
              </p>
            ) : (
              <p className="shrink-0 text-sm font-semibold text-ink">{amountLabel}</p>
            )}
          </div>

          {isCard && (
            <div className="mt-3">
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-ground"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(utilization)}
                aria-label={`Uso de crédito de ${method.name}: ${utilization.toFixed(0)} por ciento`}
              >
                <div
                  className="h-full rounded-full bg-credit"
                  style={{ width: `${utilization}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-ink-muted">
                <span>{utilization.toFixed(0)}% usado</span>
                <span>
                  Corte día {details.cut_off_day ?? "—"} · Pago día {details.payment_day ?? "—"}
                </span>
              </div>
            </div>
          )}

          {isBank && isSavings && (
            <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                Exenta del 4x1000 (GMF)
              </span>
              <Switch
                checked={gmfExempt}
                onChange={(checked) => onToggleGmf(method, checked)}
                disabled={gmfToggling}
                ariaLabel={`Alternar exención de GMF de ${method.name}`}
              />
            </div>
          )}

          {isBank && !isSavings && (
            <div className="mt-3 flex items-center justify-between border-t border-glass-border pt-3">
              <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
                <ShieldCheck className="h-3.5 w-3.5" />
                Cuenta corriente · la exención 4x1000 aplica solo a ahorros
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 self-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          {isCard && (
            <Link
              href={`/cards/${method.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-accent"
              aria-label={`Ver detalle de ${method.name}`}
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => onEdit(method)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
            aria-label={`Editar ${method.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(method)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-danger"
            aria-label={`Eliminar ${method.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}