"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { CardHero } from "@/components/cards/card-hero";
import { BillingPeriodRow } from "@/components/cards/billing-period-row";
import { StatusBadge } from "@/components/cards/status-badge";
import { CardPaymentForm } from "@/components/cards/card-payment-form";
import { FormModal } from "@/components/ui/form-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getCreditCardDetail, CreditCardDetail } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import {
  AlertCircle,
  ArrowLeft,
  ArrowDownUp,
  CalendarClock,
  ChevronRight,
  Receipt,
  Send,
} from "lucide-react";

function SkeletonList() {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-glass-border py-3 last:border-0"
        >
          <div className="h-9 w-9 animate-pulse rounded-xl bg-glass" />
          <div className="h-4 w-40 animate-pulse rounded-md bg-glass" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded-md bg-glass" />
        </div>
      ))}
    </div>
  );
}

export default function CardDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = React.useState<CreditCardDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [payOpen, setPayOpen] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }
  }, [router]);

  React.useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    getCreditCardDetail(id)
      .then((data) => {
        if (!active) return;
        setDetail(data);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudo cargar el detalle de la tarjeta");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, refreshKey, router]);

  const handlePaymentSuccess = () => {
    setPayOpen(false);
    if (detail) {
      toast({
        kind: "success",
        title: "Pago registrado",
        description: `El pago de ${detail.name} fue procesado correctamente.`,
      });
    }
    setRefreshKey((key) => key + 1);
  };

  if (loading && !detail) {
    return (
      <DashboardShell>
        <main className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="h-5 w-40 animate-pulse rounded-md bg-glass" />
            <div className="glass-panel space-y-4 rounded-2xl p-6">
              <div className="h-5 w-48 animate-pulse rounded-md bg-glass" />
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 w-full animate-pulse rounded-md bg-glass" />
                ))}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5">
              <div className="mb-4 h-5 w-40 animate-pulse rounded-md bg-glass" />
              <SkeletonList />
            </div>
          </div>
        </main>
      </DashboardShell>
    );
  }

  if (error || !detail) {
    return (
      <DashboardShell>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="glass-panel mx-auto max-w-md rounded-2xl px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 text-sm text-ink-muted">{error || "No se encontró la tarjeta."}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => router.push("/payment-methods")}>
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

  const { currentPeriodSummary, recentPayments, billingPeriods } = detail;

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/payment-methods"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
                aria-label="Volver a métodos de pago"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-ink">{detail.name}</h1>
                <p className="text-sm text-ink-muted">Tarjeta de crédito · •••• {detail.lastFourDigits}</p>
              </div>
            </div>
            <Button onClick={() => setPayOpen(true)}>
              <Send className="h-4 w-4" />
              Realizar pago
            </Button>
          </div>

          {/* Hero */}
          <CardHero card={detail} />

          {/* Content grid */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Periodo actual */}
            <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-accent" />
                  <h2 className="text-base font-semibold text-ink">Periodo actual</h2>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={currentPeriodSummary.status} />
                  <p className="text-sm text-ink-muted">
                    {currentPeriodSummary.transactionCount} consumo
                    {currentPeriodSummary.transactionCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {currentPeriodSummary.totalSpent > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-4 rounded-xl border border-glass-border bg-glass p-4">
                  <div>
                    <p className="text-xs text-ink-muted">Consumido</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                      {formatCurrency(currentPeriodSummary.totalSpent, detail.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Abonado</p>
                    <p className="mt-0.5 text-base font-semibold tabular-nums text-ink">
                      {currentPeriodSummary.paymentAmount != null
                        ? formatCurrency(currentPeriodSummary.paymentAmount, detail.currency)
                        : "—"}
                    </p>
                  </div>
                </div>
              )}

              {currentPeriodSummary.transactions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-ink-muted">
                    Sin consumos registrados en este periodo.
                  </p>
                </div>
              ) : (
                <div>
                  {currentPeriodSummary.transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      currency={detail.currency}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagos recientes */}
            <div className="glass-panel self-start rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-accent" />
                <h2 className="text-base font-semibold text-ink">Pagos recientes</h2>
              </div>
              {recentPayments.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-ink-muted">Aún no has realizado pagos.</p>
                  <Button variant="ghost" className="mt-3" onClick={() => setPayOpen(true)}>
                    Pagar
                  </Button>
                </div>
              ) : (
                <div>
                  {recentPayments.map((payment) => (
                    <TransactionRow
                      key={payment.id}
                      transaction={payment}
                      currency={detail.currency}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Estados de cuenta */}
          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-accent" />
                <h2 className="text-base font-semibold text-ink">Estados de cuenta</h2>
              </div>
              <Link
                href={`/cards/${detail.id}/statements`}
                className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80"
              >
                Ver todos
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-3">
              {billingPeriods.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  No hay estados de cuenta todavía.
                </p>
              ) : (
                billingPeriods.map((period) => (
                  <BillingPeriodRow
                    key={period.startDate}
                    period={period}
                    cardId={detail.id}
                    currency={detail.currency}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Realizar pago */}
      <FormModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Realizar pago"
        description={`Pagar saldo de ${detail.name} (•••• ${detail.lastFourDigits})`}
      >
        <CardPaymentForm
          card={detail}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPayOpen(false)}
        />
      </FormModal>
    </DashboardShell>
  );
}