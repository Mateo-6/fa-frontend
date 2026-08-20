"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { MultiSelectField } from "@/components/ui/multi-select-field";
import { DateRangePicker } from "@/components/ui/date-picker";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MobileFab } from "@/components/ui/mobile-fab";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionListRow } from "@/components/transactions/transaction-list-row";
import { useToast } from "@/components/ui/toast";
import {
  getTransactionHistory,
  deleteTransaction,
  getCategories,
  getPaymentMethods,
  Category,
  PaymentMethod,
  Transaction,
  TransactionHistoryParams,
  TransactionType,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Plus,
  AlertCircle,
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Scale,
} from "lucide-react";

const PAGE_SIZE = 50;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function todayISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthStartISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`;
}

interface FiltersState {
  startDate: string;
  endDate: string;
  type: TransactionType[];
  categoryId: string[];
  paymentMethodId: string[];
}

const DEFAULT_FILTERS: FiltersState = {
  startDate: monthStartISO(),
  endDate: todayISO(),
  type: [],
  categoryId: [],
  paymentMethodId: [],
};

function buildParams(filters: FiltersState, offset: number): TransactionHistoryParams {
  const params: TransactionHistoryParams = { limit: PAGE_SIZE, offset };
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.type.length > 0) params.type = filters.type;
  if (filters.categoryId.length > 0) params.categoryId = filters.categoryId;
  if (filters.paymentMethodId.length > 0) params.paymentMethodId = filters.paymentMethodId;
  return params;
}

const TYPE_FILTER_OPTIONS = [
  { value: "INCOME", label: "Ingresos" },
  { value: "EXPENSE", label: "Gastos" },
  { value: "TRANSFER", label: "Transferencias" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<FiltersState>(DEFAULT_FILTERS);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [editing, setEditing] = React.useState<Transaction | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Transaction | null>(null);
  const [deletingLoading, setDeletingLoading] = React.useState(false);

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

    let active = true;
    Promise.all([getCategories(), getPaymentMethods()])
      .then(([cats, methods]) => {
        if (!active) return;
        setCategories(cats);
        setPaymentMethods(methods);
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

    getTransactionHistory(buildParams(filters, 0))
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
        setError(apiError.message || "No se pudieron cargar las transacciones");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
  }, [filters, refreshKey, router]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await getTransactionHistory(
        buildParams(filters, transactionsRef.current.length)
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

  const handleFilterChange = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = React.useMemo(
    () =>
      filters.startDate !== DEFAULT_FILTERS.startDate ||
      filters.endDate !== DEFAULT_FILTERS.endDate ||
      filters.type.length > 0 ||
      filters.categoryId.length > 0 ||
      filters.paymentMethodId.length > 0,
    [filters]
  );

  const summary = React.useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;
    for (const transaction of transactions) {
      if (transaction.type === "INCOME") income += transaction.amount;
      else if (transaction.type === "EXPENSE") expense += transaction.amount;
      else transfer += transaction.amount;
    }
    return { income, expense, transfer, net: income - expense };
  }, [transactions]);

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label:
      category.type === "income"
        ? `${category.name} (ingreso)`
        : category.type === "transfer"
          ? `${category.name} (transf.)`
          : category.name,
  }));

  const methodOptions = paymentMethods.map((method) => ({
    value: method.id,
    label: method.name,
  }));

  const handleCreateSuccess = () => {
    setCreating(false);
    toast({ kind: "success", title: "Transacción creada" });
    setRefreshKey((key) => key + 1);
  };

  const handleEditSuccess = () => {
    setEditing(null);
    toast({ kind: "success", title: "Transacción actualizada" });
    setRefreshKey((key) => key + 1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await deleteTransaction(deleting.id);
      toast({ kind: "success", title: "Transacción eliminada" });
      setDeleting(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo eliminar la transacción",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingLoading(false);
    }
  };

  const showSkeleton = loading && transactions.length === 0;

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Transacciones</h1>
              <p className="text-sm text-ink-muted">Registra y gestiona tus movimientos.</p>
            </div>
            <Button onClick={() => setCreating(true)} className="hidden lg:inline-flex">
              <Plus className="h-4 w-4" />
              <span>Nueva transacción</span>
            </Button>
          </div>

          {/* Filters */}
          <section className="glass-panel relative z-20 rounded-2xl p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
                Filtros
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-accent transition-colors hover:text-accent/80"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-2 md:col-span-1">
                <DateRangePicker
                  label="Período"
                  start={filters.startDate}
                  end={filters.endDate}
                  onChange={(range) => {
                    handleFilterChange("startDate", range.start);
                    handleFilterChange("endDate", range.end);
                  }}
                />
              </div>
              <MultiSelectField
                label="Tipo"
                value={filters.type}
                onChange={(values) =>
                  handleFilterChange("type", (values as string[]) as TransactionType[])
                }
                options={TYPE_FILTER_OPTIONS}
                placeholder="Todos los tipos"
              />
              <MultiSelectField
                label="Categoría"
                value={filters.categoryId}
                onChange={(values) => handleFilterChange("categoryId", values as string[])}
                options={categoryOptions}
                placeholder="Todas"
              />
              <MultiSelectField
                label="Método de pago"
                value={filters.paymentMethodId}
                onChange={(values) => handleFilterChange("paymentMethodId", values as string[])}
                options={methodOptions}
                placeholder="Todos"
              />
            </div>
          </section>

          {/* Summary */}
          {!showSkeleton && !error && transactions.length > 0 && (
            <section className="glass-panel grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl px-5 py-4 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-income/10 text-income">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Ingresos</p>
                  <p className="text-lg font-semibold text-income">
                    {formatCurrency(summary.income)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-expense/10 text-expense">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Gastos</p>
                  <p className="text-lg font-semibold text-expense">
                    {formatCurrency(summary.expense)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-credit/10 text-credit">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Transferencias</p>
                  <p className="text-lg font-semibold text-credit">
                    {formatCurrency(summary.transfer)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">Neto</p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      summary.net >= 0 ? "text-income" : "text-expense"
                    )}
                  >
                    {formatCurrency(summary.net)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* List */}
          <section className="glass-panel rounded-2xl p-5">
            {showSkeleton ? (
              <div className="space-y-2" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 border-b border-glass-border py-3 last:border-0"
                  >
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-glass" />
                    <div className="h-4 w-32 animate-pulse rounded-md bg-glass" />
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
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                  <Receipt className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-ink">
                  {hasActiveFilters
                    ? "No hay movimientos que coincidan"
                    : "Aún no tienes transacciones"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {hasActiveFilters
                    ? "Ajusta los filtros para ver más movimientos."
                    : "Registra tu primer ingreso o gasto con el botón superior."}
                </p>
                {hasActiveFilters && (
                  <div className="mt-5 flex justify-center gap-3">
                    <Button variant="ghost" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="mb-2 px-1 text-xs text-ink-subtle">
                  {transactions.length} de {total} movimientos
                </p>
                <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_96px_120px_150px_110px_84px] md:gap-3 md:px-1 md:border-b md:border-glass-border md:pb-2 md:text-xs md:font-medium md:tracking-wide md:text-ink-subtle">
                  <span>Transacción</span>
                  <span>Fecha</span>
                  <span>Categoría</span>
                  <span>Método de pago</span>
                  <span className="text-right">Valor</span>
                  <span className="text-right">Acciones</span>
                </div>
                <div>
                  {transactions.map((transaction) => (
                    <TransactionListRow
                      key={transaction.id}
                      transaction={transaction}
                      paymentMethods={paymentMethods}
                      onEdit={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
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
        title={creating ? "Nueva transacción" : "Editar transacción"}
        description={
          creating
            ? "Registra un ingreso, gasto o transferencia."
            : editing?.description
        }
      >
        {creating && (
          <TransactionForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreating(false)}
          />
        )}
        {editing && (
          <TransactionForm
            transaction={editing}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditing(null)}
            submitLabel="Guardar cambios"
          />
        )}
      </FormModal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Eliminar transacción"
        description={
          deleting
            ? `¿Seguro que quieres eliminar "${deleting.description}" por ${formatCurrency(
                deleting.amount
              )}? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        isLoading={deletingLoading}
      />

      {/* Mobile FAB */}
      <MobileFab label="Nueva transacción" onClick={() => setCreating(true)}>
        <Plus className="h-6 w-6" />
      </MobileFab>
    </DashboardShell>
  );
}