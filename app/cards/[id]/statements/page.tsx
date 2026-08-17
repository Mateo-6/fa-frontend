"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BillingPeriodRow } from "@/components/cards/billing-period-row";
import { Button } from "@/components/ui/button";
import { getCreditCardStatements, getCreditCardDetail, BillingPeriod, CreditCardSummary } from "@/lib/api";
import { AlertCircle, ArrowLeft, CalendarClock } from "lucide-react";

export default function CardStatementsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [card, setCard] = React.useState<CreditCardSummary | null>(null);
  const [periods, setPeriods] = React.useState<BillingPeriod[]>([]);
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
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getCreditCardDetail(id), getCreditCardStatements(id)])
      .then(([cardData, periodData]) => {
        if (!active) return;
        setCard(cardData);
        setPeriods(periodData);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudieron cargar los estados de cuenta");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, refreshKey, router]);

  if (loading) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-ink-muted">Cargando estados de cuenta...</p>
        </main>
      </DashboardShell>
    );
  }

  if (error || !card) {
    return (
      <DashboardShell>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="glass-panel mx-auto max-w-md rounded-2xl px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 text-sm text-ink-muted">{error || "No se encontró la tarjeta."}</p>
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
                Estados de cuenta de {card.name}
              </h1>
              <p className="text-sm text-ink-muted">•••• {card.lastFourDigits}</p>
            </div>
          </div>

          <section className="glass-panel rounded-2xl p-5">
            <div className="mb-1 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-accent" />
              <h2 className="text-base font-semibold text-ink">Últimos 12 periodos</h2>
            </div>
            <div className="mt-3">
              {periods.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-muted">
                  No hay estados de cuenta todavía.
                </p>
              ) : (
                periods.map((period) => (
                  <BillingPeriodRow
                    key={period.startDate}
                    period={period}
                    cardId={card.id}
                    currency={card.currency}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </DashboardShell>
  );
}