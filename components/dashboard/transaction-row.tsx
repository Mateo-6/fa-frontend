import { cn } from "@/lib/utils";
import { Transaction } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  currency?: string;
}

export function TransactionRow({ transaction, currency }: TransactionRowProps) {
  const isIncome = transaction.type === "INCOME";
  const money = formatCurrency(transaction.amount, currency);

  return (
    <div className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
          )}
        >
          {isIncome ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{transaction.description}</p>
          <p className="text-xs text-ink-muted">
            {transaction.category.name} · {formatShortDate(transaction.date)}
          </p>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", isIncome ? "text-income" : "text-expense")}>
        {isIncome ? "+" : "-"}
        {money}
      </p>
    </div>
  );
}
