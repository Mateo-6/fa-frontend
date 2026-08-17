"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { UpcomingPaymentRow } from "@/components/dashboard/upcoming-payment-row";
import { CreditCardMini } from "@/components/dashboard/credit-card-mini";
import { getSummary, SummaryData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  CalendarClock,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function SummaryPage() {
  const router = useRouter();
  const [data, setData] = React.useState<SummaryData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }

    getSummary()
      .then(setData)
      .catch((err) => {
        const message = err instanceof Error ? err.message : "No se pudo cargar el resumen";
        setError(message);
        if ((err as Error & { statusCode?: number }).statusCode === 401) {
          router.push("/");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-ink-muted">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm">Cargando tu resumen financiero...</p>
          </div>
        </main>
      </DashboardShell>
    );
  }

  if (error || !data) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-danger" />
            <h2 className="mt-4 text-lg font-semibold text-ink">No pudimos cargar tu resumen</h2>
            <p className="mt-2 text-sm text-ink-muted">{error || "Intenta de nuevo más tarde."}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </main>
      </DashboardShell>
    );
  }

  const { summary, recentTransactions, upcomingPayments, creditCards } = data;

  return (
    <DashboardShell>
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Resumen financiero</h1>
            <p className="text-sm text-ink-muted">Aquí está el estado actual de tus finanzas.</p>
          </div>

          {/* Summary cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Balance total"
              amount={summary.totalBalance}
              currency="USD"
              icon={Wallet}
              trend="neutral"
              highlight
            />
            <SummaryCard
              title="Ingresos"
              amount={summary.totalIncome}
              currency="USD"
              icon={TrendingUp}
              trend="positive"
            />
            <SummaryCard
              title="Gastos"
              amount={summary.totalExpenses}
              currency="USD"
              icon={TrendingDown}
              trend="negative"
            />
            <SummaryCard
              title="Disponible"
              amount={summary.availableBalance}
              currency="USD"
              icon={PiggyBank}
              trend="neutral"
            />
          </section>

          {/* Main grid */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Recent transactions */}
            <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-accent" />
                  <h2 className="text-base font-semibold text-ink">Transacciones recientes</h2>
                </div>
                <Link
                  href="/transactions"
                  className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80"
                >
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-ink-muted">Aún no tienes transacciones este mes.</p>
                  <Button asChild className="mt-4">
                    <Link href="/transactions">
                      <Plus className="h-4 w-4" />
                      <span>Registrar gasto</span>
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-glass-border">
                  {recentTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming payments */}
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-accent" />
                  <h2 className="text-base font-semibold text-ink">Próximos pagos</h2>
                </div>
                {upcomingPayments.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-ink-muted">No tienes pagos pendientes.</p>
                    <p className="mt-1 text-xs text-ink-muted">Los gastos recurrentes aparecerán aquí.</p>
                  </div>
                ) : (
                  <div>
                    {upcomingPayments.map((payment) => (
                      <UpcomingPaymentRow key={payment.id} payment={payment} />
                    ))}
                  </div>
                )}
              </div>

              {/* Credit cards */}
              <div className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-accent" />
                    <h2 className="text-base font-semibold text-ink">Tarjetas de crédito</h2>
                  </div>
                  <Link
                    href="/payment-methods"
                    className="flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80"
                  >
                    Gestionar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                {creditCards.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-sm text-ink-muted">No tienes tarjetas registradas.</p>
                    <Button asChild variant="ghost" className="mt-2">
                      <Link href="/payment-methods">Agregar método</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {creditCards.map((card) => (
                      <CreditCardMini key={card.id} card={card} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </DashboardShell>
  );
}
