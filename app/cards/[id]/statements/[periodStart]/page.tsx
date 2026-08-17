"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { StatusBadge } from "@/components/cards/status-badge";
import { Button } from "@/components/ui/button";
import { getCreditCardStatementDetail, getCreditCardDetail, BillingPeriodDetail, CreditCardSummary } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, ArrowLeft, PieChart, Receipt } from "lucide-react";

function formatRange(startDate: string, endDate: string): string {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(d)
    );
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function CardStatementDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string; periodStart: string }>();
  const { id, periodStart } = params;

  const [card, setCard] = React.useState<CreditCardSummary | null>(null);
  const [detail, setDetail] = React.useState<BillingPeriodDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }
  }, [router]);

  React.useEffect(() => {
    if (!id || !periodStart) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getCreditCardDetail(id), getCreditCardStatementDetail(id, periodStart)])
      .then(([cardData, periodData]) => {
        if (!active) return;
        setCard(cardData);
        setDetail(periodData);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudo cargar el estado de cuenta");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, periodStart, refreshKey, router]);

  if (loading) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-ink-muted">Cargando estado de cuenta...</p>
        </main>
      </DashboardShell>
    );
  }

  if (error || !card || !detail) {
    return (
      <DashboardShell>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="glass-panel mx-auto max-w-md rounded-2xl px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 text-sm text-ink-muted">
                {error || "No se encontró este estado de cuenta."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => router.push(`/cards/${id}`)}>
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
                <Button onClick={() => setRefreshKey((key) => key + 1)}>Reintentar</Button>
              </div>
            </div>
          </div>
        </main>
      </DashboardShell>
    );
  }

  const currency = card.currency;
  const maxCategory = detail.categoryBreakdown.length > 0
    ? Math.max(...detail.categoryBreakdown.map((entry) => entry.total), 1)
    : 1;

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/cards/${card.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
              aria-label="Volver al detalle de la tarjeta"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">
                Estado de cuenta · {card.name}
              </h1>
              <p className="text-sm text-ink-muted">{formatRange(detail.startDate, detail.endDate)}</p>
            </div>
            <StatusBadge status={detail.status} className="ml-auto" />
          </div>

          {/* Resumen */}
          <section className="glass-panel grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink-muted">Consumido</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {formatCurrency(detail.totalSpent, currency)}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {detail.transactionCount} consumo{detail.transactionCount === 1 ? "" : "s"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Abonado</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-ink">
                {detail.paymentAmount != null
                  ? formatCurrency(detail.paymentAmount, currency)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Estado</p>
              <p className="mt-1 text-base font-semibold text-ink">
                {detail.isPaid ? "Pagado en su totalidad" : "Pendiente de pago"}
              </p>
            </div>
          </section>

          {/* Desglose por categoría */}
          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-glass-border pb-3">
              <PieChart className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-ink">Consumo por categoría</h2>
            </div>
            {detail.categoryBreakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                Sin consumos en categorías durante este periodo.
              </p>
            ) : (
              <div className="mt-3 space-y-4">
                {detail.categoryBreakdown.map((entry) => {
                  const weight = (entry.total / detail.totalSpent) * 100;
                  const width = detail.totalSpent > 0 ? (entry.total / maxCategory) * 100 : 0;
                  return (
                    <div key={entry.categoryId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-ink">{entry.categoryName}</p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                          {formatCurrency(entry.total, currency)}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {entry.transactionCount} consumo{entry.transactionCount === 1 ? "" : "s"} ·{" "}
                        {weight.toFixed(1)}%
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ground">
                        <div
                          className="h-full rounded-full bg-credit"
                          style={{ width: `${Math.min(width, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Transacciones */}
          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-glass-border pb-3">
              <Receipt className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-ink">Transacciones del periodo</h2>
            </div>
            {detail.transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-muted">
                No hay transacciones en este periodo.
              </p>
            ) : (
              <div className="mt-3">
                {detail.transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    currency={currency}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </DashboardShell>
  );
}