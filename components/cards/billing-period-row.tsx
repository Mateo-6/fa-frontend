import Link from "next/link";
import { BillingPeriod } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { StatusBadge } from "@/components/cards/status-badge";
import { ChevronRight } from "lucide-react";

interface BillingPeriodRowProps {
  period: BillingPeriod;
  cardId: string;
  currency: string;
}

function formatRange(period: BillingPeriod): string {
  const start = new Date(period.startDate);
  const end = new Date(period.endDate);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(d);
  return `${fmt(start)} – ${fmt(end)}`;
}

export function BillingPeriodRow({ period, cardId, currency }: BillingPeriodRowProps) {
  return (
    <Link
      href={`/cards/${cardId}/statements/${period.startDate}`}
      className="group flex items-center gap-3 border-b border-glass-border py-4 first:pt-0 last:border-0 last:pb-0"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{formatRange(period)}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {period.transactionCount} consumo{period.transactionCount === 1 ? "" : "s"}
          {period.paymentAmount != null &&
            ` · abonado ${formatCurrency(period.paymentAmount, currency)}`}
        </p>
      </div>
      <div className="text-right">
        <StatusBadge status={period.status} />
        <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
          {formatCurrency(period.totalSpent, currency)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-subtle transition-colors group-hover:text-accent" />
    </Link>
  );
}