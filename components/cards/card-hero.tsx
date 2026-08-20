import { CreditCardSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { CreditCard, CalendarClock, CalendarDays } from "lucide-react";

interface CardHeroProps {
  card: CreditCardSummary;
}

export function CardHero({ card }: CardHeroProps) {
  const utilization = Math.min(Math.max(card.utilizationPercentage, 0), 100);

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-credit/10 text-credit ring-1 ring-credit/20">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink">{card.name}</p>
          <p className="text-xs text-ink-muted">•••• {card.lastFourDigits}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-6">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-snug tracking-wide text-ink-muted">Saldo actual</p>
          <p className="mt-1 text-base font-semibold leading-snug tabular-nums tracking-tight text-ink sm:text-xl">
            {formatCurrency(card.currentBalance, card.currency)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-snug tracking-wide text-ink-muted">Límite de crédito</p>
          <p className="mt-1 text-base font-semibold leading-snug tabular-nums tracking-tight text-ink sm:text-xl">
            {formatCurrency(card.creditLimit, card.currency)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-snug tracking-wide text-ink-muted">Disponible</p>
          <p className="mt-1 text-base font-semibold leading-snug tabular-nums tracking-tight text-ink sm:text-xl">
            {formatCurrency(card.availableCredit, card.currency)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium leading-snug tracking-wide text-ink-muted">Uso de crédito</p>
          <p className="mt-1 text-base font-semibold leading-snug tabular-nums tracking-tight text-ink sm:text-xl">
            {utilization.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-ground"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(utilization)}
          aria-label={`Uso de crédito de ${card.name}: ${utilization.toFixed(0)} por ciento`}
        >
          <div className="h-full rounded-full bg-credit" style={{ width: `${utilization}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-muted">
          <span>{utilization.toFixed(1)}% usado</span>
          <span className="tabular-nums">
            {formatCurrency(card.availableCredit, card.currency)} disponibles
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 border-t border-glass-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ink-subtle" />
          <div>
            <p className="text-xs text-ink-muted">Corte día {card.cutOffDay}</p>
            <p className="text-sm font-medium text-ink">
              {card.daysUntilCutOff > 0 ? `en ${card.daysUntilCutOff} días` : card.daysUntilCutOff === 0 ? "hoy" : `hace ${-card.daysUntilCutOff} días`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-ink-subtle" />
          <div>
            <p className="text-xs text-ink-muted">Pago día {card.paymentDay}</p>
            <p className="text-sm font-medium text-ink">
              {card.daysUntilPayment > 0 ? `en ${card.daysUntilPayment} días` : card.daysUntilPayment === 0 ? "hoy" : `hace ${-card.daysUntilPayment} días`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}