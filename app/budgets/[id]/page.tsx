"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetDetailCard } from "@/components/budgets/budget-detail-card";
import { BudgetSpendingRow } from "@/components/budgets/budget-spending-row";
import { useToast } from "@/components/ui/toast";
import {
  getBudget,
  getCategories,
  getTransactionHistory,
  recalculateBudget,
  deactivateBudget,
  Category,
  Budget,
  Transaction,
  TransactionHistoryParams,
} from "@/lib/api";
import { ArrowLeft, AlertCircle, Loader2, Receipt } from "lucide-react";

const PAGE_SIZE = 50;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalISODate(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildSpendingParams(budget: Budget, offset: number): TransactionHistoryParams {
  const params: TransactionHistoryParams = {
    startDate: toLocalISODate(budget.startDate),
    endDate: toLocalISODate(budget.endDate),
    type: "EXPENSE",
    excludeCardPayments: true,
    limit: PAGE_SIZE,
    offset,
  };
  if (budget.categoryId) params.categoryId = budget.categoryId;
  return params;
}

export default function BudgetDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [budget, setBudget] = React.useState<Budget | null>(null);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [transactionsLoading, setTransactionsLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [editing, setEditing] = React.useState(false);
  const [recalculating, setRecalculating] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const [finalizingLoading, setFinalizingLoading] = React.useState(false);

  const transactionsRef = React.useRef<Transaction[]>([]);
  React.useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }

    getCategories()
      .then((cats) => setCategories(cats))
      .catch((err: unknown) => {
        if ((err as Error & { statusCode?: number }).statusCode === 401) router.push("/");
      });
  }, [router]);

  React.useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    setError(null);

    getBudget(id)
      .then((item) => {
        if (!active) return;
        setBudget(item);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        if (apiError.statusCode === 404) {
          router.push("/budgets");
          return;
        }
        setError(apiError.message || "No se pudo cargar el presupuesto");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, refreshKey, router]);

  React.useEffect(() => {
    if (!budget) return;
    let active = true;
    setTransactionsLoading(true);
    setError(null);

    getTransactionHistory(buildSpendingParams(budget, 0))
      .then((result) => {
        if (!active) return;
        setTransactions(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudieron cargar los movimientos");
      })
      .finally(() => {
        if (active) setTransactionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [budget, router]);

  const handleLoadMore = async () => {
    if (!budget) return;
    setLoadingMore(true);
    try {
      const result = await getTransactionHistory(
        buildSpendingParams(budget, transactionsRef.current.length)
      );
      setTransactions((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setTotal(result.total);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudieron cargar más movimientos",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const refreshBudget = async () => {
    if (!id) return;
    try {
      const item = await getBudget(id);
      setBudget(item);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo actualizar el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleEditSuccess = () => {
    setEditing(false);
    toast({ kind: "success", title: "Presupuesto actualizado" });
    refreshBudget();
  };

  const handleRecalculate = async () => {
    if (!budget) return;
    setRecalculating(true);
    try {
      const updated = await recalculateBudget(budget.id);
      setBudget(updated);
      toast({ kind: "success", title: "Gasto recalculado" });
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo recalcular el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleFinalize = async () => {
    if (!budget) return;
    setFinalizingLoading(true);
    try {
      await deactivateBudget(budget.id);
      toast({ kind: "success", title: "Presupuesto finalizado" });
      setFinalizing(false);
      router.push("/budgets");
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo finalizar el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setFinalizingLoading(false);
    }
  };

  const categoryById = React.useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => router.push("/budgets")} aria-label="Volver a presupuestos">
              <ArrowLeft className="h-4 w-4" />
              <span>Presupuestos</span>
            </Button>
            {budget && (
              <p className="text-sm text-ink-subtle">
                {transactions.length} de {total} movimientos en este período
              </p>
            )}
          </div>

          {/* Hero */}
          {loading && !budget && !error ? (
            <section className="glass-panel rounded-2xl p-5 sm:p-6" aria-hidden="true">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-xl bg-glass" />
                <div className="space-y-2">
                  <div className="h-5 w-48 animate-pulse rounded-md bg-glass" />
                  <div className="h-3 w-32 animate-pulse rounded-md bg-glass" />
                </div>
              </div>
              <div className="mt-6 h-2.5 animate-pulse rounded-full bg-glass" />
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-10 animate-pulse rounded-lg bg-glass" />
                ))}
              </div>
            </section>
          ) : error && !budget ? (
            <section className="glass-panel rounded-2xl px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 text-sm text-ink-muted">{error}</p>
              <Button className="mt-5" onClick={() => setRefreshKey((key) => key + 1)}>
                Reintentar
              </Button>
            </section>
          ) : (
            budget && (
              <BudgetDetailCard
                budget={budget}
                categoryName={budget.categoryId ? categoryById.get(budget.categoryId)?.name : null}
                onEdit={budget.isActive ? () => setEditing(true) : undefined}
                onRecalculate={budget.isActive ? handleRecalculate : undefined}
                onFinalize={budget.isActive ? () => setFinalizing(true) : undefined}
                recalculating={recalculating}
              />
            )
          )}

          {/* Spending list */}
          {budget && (
            <section className="glass-panel rounded-2xl p-5">
              <h2 className="text-base font-semibold text-ink">
                Movimientos que cuentan en este presupuesto
              </h2>
              <p className="mt-0.5 border-b border-glass-border pb-3 text-xs text-ink-muted">
                Gastos {budget.categoryId ? "en la categoría seleccionada" : "de todas las categorías"}{" "}
                dentro del período, sin pagos de tarjeta.
              </p>

              <div className="mt-4">
                {transactionsLoading ? (
                  <div className="space-y-2" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 border-b border-glass-border py-3 last:border-0"
                      >
                        <div className="h-9 w-9 animate-pulse rounded-xl bg-glass" />
                        <div className="h-4 w-40 animate-pulse rounded-md bg-glass" />
                        <div className="ml-auto h-4 w-20 animate-pulse rounded-md bg-glass" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="rounded-xl border border-danger/20 bg-danger/5 px-6 py-10 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-danger" />
                    <p className="mt-3 text-sm text-ink-muted">{error}</p>
                    <Button className="mt-5" onClick={() => setRefreshKey((key) => key + 1)}>
                      Reintentar
                    </Button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-ink">Sin movimientos</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      Ningún gasto cuenta para este presupuesto en el período indicado.
                    </p>
                  </div>
                ) : (
                  <>
                    {transactions.map((transaction) => (
                      <BudgetSpendingRow
                        key={transaction.id}
                        transaction={transaction}
                        currency={budget.currency}
                      />
                    ))}
                    {transactions.length < total && (
                      <div className="mt-4 flex justify-center">
                        <Button variant="ghost" onClick={handleLoadMore} isLoading={loadingMore}>
                          {loadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            "Cargar más"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Edit dialog */}
      <FormModal
        open={editing && Boolean(budget)}
        onClose={() => setEditing(false)}
        title="Editar presupuesto"
        description="Puedes ajustar todos los campos del presupuesto."
      >
        {budget && (
          <BudgetForm
            budget={budget}
            categories={categories}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditing(false)}
            submitLabel="Guardar cambios"
          />
        )}
      </FormModal>

      {/* Finalize confirmation */}
      <ConfirmDialog
        open={finalizing && Boolean(budget)}
        onClose={() => setFinalizing(false)}
        onConfirm={handleFinalize}
        title="Finalizar presupuesto"
        description={
          budget
            ? `¿Seguro que quieres finalizar "${budget.name}"? Dejará de controlar tu gasto y se moverá al historial.`
            : undefined
        }
        confirmLabel="Finalizar"
        isLoading={finalizingLoading}
      />
    </DashboardShell>
  );
}