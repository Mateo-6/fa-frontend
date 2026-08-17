"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { SegmentedControl, SegmentOption } from "@/components/ui/segmented-control";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { useToast } from "@/components/ui/toast";
import {
  getBudgets,
  getBudgetHistory,
  deactivateBudget,
  getCategories,
  Budget,
  Category,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Plus,
  AlertCircle,
  PiggyBank,
  Wallet,
  TrendingDown,
  Scale,
} from "lucide-react";

const VIEW_OPTIONS: SegmentOption[] = [
  { value: "active", label: "Activos" },
  { value: "history", label: "Historial" },
];

export default function BudgetsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [view, setView] = React.useState<"active" | "history">("active");
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Budget | null>(null);
  const [deactivating, setDeactivating] = React.useState<Budget | null>(null);
  const [deactivatingLoading, setDeactivatingLoading] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }

    let active = true;
    getCategories()
      .then((cats) => {
        if (!active) return;
        setCategories(cats);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if ((err as Error & { statusCode?: number }).statusCode === 401) {
          router.push("/");
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const request = view === "history" ? getBudgetHistory() : getBudgets();

    request
      .then((items) => {
        if (!active) return;
        setBudgets(items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudieron cargar los presupuestos");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
  }, [view, refreshKey, router]);

  const categoryById = React.useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) map.set(category.id, category);
    return map;
  }, [categories]);

  const summary = React.useMemo(() => {
    let budgeted = 0;
    let spent = 0;
    let remaining = 0;
    for (const budget of budgets) {
      budgeted += budget.amount;
      spent += budget.spent;
      remaining += budget.remaining;
    }
    return { budgeted, spent, remaining };
  }, [budgets]);

  const handleCreateSuccess = () => {
    setCreating(false);
    toast({ kind: "success", title: "Presupuesto creado" });
    setRefreshKey((key) => key + 1);
  };

  const handleEditSuccess = () => {
    setEditing(null);
    toast({ kind: "success", title: "Presupuesto actualizado" });
    setRefreshKey((key) => key + 1);
  };

  const handleDeactivate = async () => {
    if (!deactivating) return;
    setDeactivatingLoading(true);
    try {
      await deactivateBudget(deactivating.id);
      toast({ kind: "success", title: "Presupuesto desactivado" });
      setDeactivating(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo desactivar el presupuesto",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeactivatingLoading(false);
    }
  };

  const showSkeleton = loading && budgets.length === 0;

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Presupuestos</h1>
              <p className="text-sm text-ink-muted">Define límites por categoría y controla tu gasto.</p>
            </div>
            <div className="flex items-center gap-3">
              <SegmentedControl
                options={VIEW_OPTIONS}
                value={view}
                onChange={(value) => setView(value as "active" | "history")}
              />
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                <span>Nuevo presupuesto</span>
              </Button>
            </div>
          </div>

          {/* Summary */}
          {!showSkeleton && !error && budgets.length > 0 && (
            <section className="glass-panel grid grid-cols-1 gap-x-4 gap-y-4 rounded-2xl px-5 py-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-credit/10 text-credit">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Presupuestado</p>
                  <p className="text-lg font-semibold text-ink">{formatCurrency(summary.budgeted)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-expense/10 text-expense">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Gastado</p>
                  <p className="text-lg font-semibold text-expense">{formatCurrency(summary.spent)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-income/10 text-income">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Disponible</p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      summary.remaining >= 0 ? "text-income" : "text-danger"
                    )}
                  >
                    {formatCurrency(summary.remaining)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* List */}
          <section className="glass-panel rounded-2xl p-5">
            {showSkeleton ? (
              <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex flex-col gap-4 rounded-2xl border border-glass-border p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-xl bg-glass" />
                      <div className="h-4 w-32 animate-pulse rounded-md bg-glass" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-glass" />
                    <div className="h-4 w-24 animate-pulse rounded-md bg-glass" />
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
            ) : budgets.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                  <PiggyBank className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-ink">
                  {view === "history"
                    ? "Aún no hay presupuestos finalizados"
                    : "Aún no tienes presupuestos"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {view === "history"
                    ? "Los presupuestos que desactives o cuyo período termine aparecerán aquí."
                    : "Crea tu primer presupuesto para controlar tu gasto por categoría."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget.id}
                    budget={budget}
                    categoryName={budget.categoryId ? categoryById.get(budget.categoryId)?.name : null}
                    showActions={view === "active"}
                    onOpen={(item) => router.push(`/budgets/${item.id}`)}
                    onEdit={setEditing}
                    onDeactivate={setDeactivating}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Create / edit dialog */}
      <FormModal
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={creating ? "Nuevo presupuesto" : "Editar presupuesto"}
        description={
          creating
            ? "Define un límite de gasto para una categoría o para todas."
            : "Puedes ajustar el nombre, el monto y las alertas."
        }
      >
        {creating && (
          <BudgetForm
            categories={categories}
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreating(false)}
          />
        )}
        {editing && (
          <BudgetForm
            budget={editing}
            categories={categories}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </FormModal>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={Boolean(deactivating)}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
        title="Desactivar presupuesto"
        description={
          deactivating
            ? `¿Seguro que quieres desactivar "${deactivating.name}" de ${formatCurrency(
                deactivating.amount,
                deactivating.currency
              )}? Podrás verlo en el historial, pero dejará de controlar tu gasto.`
            : undefined
        }
        confirmLabel="Desactivar"
        isLoading={deactivatingLoading}
      />
    </DashboardShell>
  );
}
