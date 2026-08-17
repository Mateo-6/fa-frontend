import { cn } from "@/lib/utils";
import { RecurringExpense } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { CalendarClock } from "lucide-react";

interface UpcomingPaymentRowProps {
  payment: RecurringExpense;
}

export function UpcomingPaymentRow({ payment }: UpcomingPaymentRowProps) {
  const daysUntil = Math.ceil(
    (new Date(payment.nextPaymentDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const urgency = daysUntil <= 3 ? "soon" : daysUntil <= 7 ? "week" : "later";

  return (
    <div className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            urgency === "soon"
              ? "bg-expense/10 text-expense"
              : urgency === "week"
                ? "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400"
                : "bg-accent/10 text-accent"
          )}
        >
          <CalendarClock className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{payment.name}</p>
          <p className="text-xs text-ink-muted">
            {daysUntil <= 0 ? "Vence hoy" : `Vence en ${daysUntil} día${daysUntil === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{formatCurrency(payment.amount, payment.currency)}</p>
        <p className="text-xs text-ink-muted">{formatShortDate(payment.nextPaymentDate)}</p>
      </div>
    </div>
  );
}
