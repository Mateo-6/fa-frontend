import { cn } from "@/lib/utils";
import { BillingPeriodStatus } from "@/lib/api";

const STATUS_META: Record<BillingPeriodStatus, { label: string; badge: string }> = {
  OPEN: { label: "Periodo abierto", badge: "bg-accent/10 text-accent" },
  CLOSED: { label: "Sin pagar", badge: "bg-ink-subtle/10 text-ink-muted" },
  PAID: { label: "Pagado", badge: "bg-income/10 text-income" },
  PARTIALLY_PAID: { label: "Pago parcial", badge: "bg-expense/10 text-expense" },
};

export function StatusBadge({ status, className }: { status: BillingPeriodStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.badge,
        className
      )}
    >
      {meta.label}
    </span>
  );
}