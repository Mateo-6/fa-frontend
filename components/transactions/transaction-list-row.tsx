"use client";

import { cn } from "@/lib/utils";
import { Transaction, PaymentMethod, TransactionType } from "@/lib/api";
import { formatCurrency, formatCompactDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil, Trash2 } from "lucide-react";

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_96px_120px_150px_110px_84px]";

interface TransactionListRowProps {
  transaction: Transaction;
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

function methodName(paymentMethods: PaymentMethod[], id?: string): string {
  if (!id) return "";
  return paymentMethods.find((method) => method.id === id)?.name ?? "";
}

const TYPE_STYLES: Record<TransactionType, { badge: string; amount: string; icon: typeof ArrowDownLeft }> = {
  INCOME: { badge: "bg-income/10 text-income", amount: "text-income", icon: ArrowDownLeft },
  EXPENSE: { badge: "bg-expense/10 text-expense", amount: "text-expense", icon: ArrowUpRight },
  TRANSFER: { badge: "bg-credit/10 text-credit", amount: "text-credit", icon: ArrowLeftRight },
};

export function TransactionListRow({ transaction, paymentMethods, onEdit, onDelete }: TransactionListRowProps) {
  const style = TYPE_STYLES[transaction.type] ?? TYPE_STYLES.EXPENSE;
  const Icon = style.icon;
  const isTransfer = transaction.type === "TRANSFER";

  let method: string;
  if (isTransfer) {
    const source = methodName(paymentMethods, transaction.sourcePaymentMethodId);
    const destination = methodName(paymentMethods, transaction.destinationPaymentMethodId);
    method = source && destination ? `${source} → ${destination}` : source || destination || "";
  } else {
    method = methodName(paymentMethods, transaction.paymentMethodId);
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 border-b border-glass-border py-3 md:grid md:gap-3",
        COLUMNS
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            style.badge
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
          <p className="text-xs text-ink-muted md:hidden">
            {transaction.category.name}
            {transaction.category.name && isTransfer ? " · " : ""}
            {isTransfer && method ? method : ""}
          </p>
          <p className="text-xs text-ink-subtle md:hidden">{formatCompactDate(transaction.date)}</p>
        </div>
      </div>

      <span className="hidden truncate text-sm text-ink-muted md:block">
        {formatCompactDate(transaction.date)}
      </span>
      <span className="hidden truncate text-sm text-ink md:block">
        {transaction.category.name}
      </span>
      <span className="hidden truncate text-sm text-ink-muted md:block">{method || "—"}</span>

      <p className={cn("text-sm font-semibold md:text-right", style.amount)}>
        {isTransfer ? "" : transaction.type === "INCOME" ? "+" : "-"}
        {formatCurrency(transaction.amount)}
      </p>

      <div className="flex items-center gap-1 md:justify-end md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(transaction)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
          aria-label={`Editar ${transaction.description}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-danger"
          aria-label={`Eliminar ${transaction.description}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}