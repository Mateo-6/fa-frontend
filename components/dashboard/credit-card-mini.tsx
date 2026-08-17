import { CreditCardSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { CreditCard, ChevronRight } from "lucide-react";

interface CreditCardMiniProps {
  card: CreditCardSummary;
}

export function CreditCardMini({ card }: CreditCardMiniProps) {
  const utilization = Math.min(Math.max(card.utilizationPercentage, 0), 100);

  return (
    <Link href={`/cards/${card.id}`} className="group block rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
      <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-credit/10 text-credit">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink group-hover:text-accent">{card.name}</p>
            <p className="text-xs text-ink-muted">•••• {card.lastFourDigits}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink">{formatCurrency(card.currentBalance, card.currency)}</p>
          <p className="text-xs text-ink-muted">de {formatCurrency(card.creditLimit, card.currency)}</p>
        </div>
      </div>

      <div className="mt-3">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-ground"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(utilization)}
          aria-label={`Uso de crédito de ${card.name}: ${utilization.toFixed(0)} por ciento`}
        >
          <div
            className="h-full rounded-full bg-credit"
            style={{ width: `${utilization}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-ink-muted">
          <span>{utilization.toFixed(0)}% usado</span>
          <span className="flex items-center gap-0.5">Pago en {card.daysUntilPayment} días <ChevronRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
      </div>
    </Link>
  );
}
