"use client";

import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/api";
import { formatCurrency, formatCompactDate } from "@/lib/format";
import { ArrowUpRight } from "lucide-react";

interface BudgetSpendingRowProps {
  transaction: Transaction;
  currency?: string;
}

/** Amount this transaction counts toward the budget (matches the backend's spent aggregation). */
function countedAmount(transaction: Transaction): number {
  return transaction.budgetAmount ?? transaction.amount;
}

export function BudgetSpendingRow({ transaction, currency = "USD" }: BudgetSpendingRowProps) {
  const counted = countedAmount(transaction);
  const isPartial = transaction.budgetAmount != null && transaction.budgetAmount < transaction.amount;

  return (
    <div className="flex items-center gap-3 border-b border-glass-border py-3 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-expense/10 text-expense">
        <ArrowUpRight className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
        <p className="text-xs text-ink-muted">
          {transaction.category.name}
          <span className="text-ink-subtle"> · </span>
          {formatCompactDate(transaction.date)}
          {isPartial && (
            <>
              <span className="text-ink-subtle"> · </span>
              <span className="text-ink-muted">
                Imputa {formatCurrency(transaction.budgetAmount!, currency)} al presupuesto
              </span>
            </>
          )}
        </p>
      </div>
      <p className={cn("shrink-0 text-sm font-semibold", "text-expense")}>
        -{formatCurrency(counted, currency)}
      </p>
    </div>
  );
}