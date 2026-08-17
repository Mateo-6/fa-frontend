import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  highlight?: boolean;
  className?: string;
}

export function SummaryCard({
  title,
  amount,
  currency = "USD",
  icon: Icon,
  trend = "neutral",
  highlight = false,
  className,
}: SummaryCardProps) {
  const trendClass = {
    positive: "text-income",
    negative: "text-expense",
    neutral: "text-ink",
  }[trend];

  return (
    <div className={cn("glass-panel rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{title}</p>
          <p
            className={cn(
              "mt-2 font-semibold tracking-tight",
              highlight ? "text-3xl" : "text-2xl",
              trendClass
            )}
          >
            {formatCurrency(amount, currency)}
          </p>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-glass text-ink-subtle">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
