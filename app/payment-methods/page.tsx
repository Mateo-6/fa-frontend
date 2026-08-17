"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaymentMethodForm } from "@/components/payment-methods/payment-method-form";
import { PaymentMethodRow } from "@/components/payment-methods/payment-method-row";
import { useToast } from "@/components/ui/toast";
import {
  getPaymentMethods,
  deletePaymentMethod,
  togglePaymentMethodGmfExempt,
  PaymentMethod,
  PaymentMethodType,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Banknote,
  CreditCard,
  Landmark,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";

interface CurrencySegment {
  currency: string;
  total: number;
}

interface GroupConfig {
  type: PaymentMethodType;
  label: string;
  description: string;
  icon: typeof CreditCard;
  badge: string;
  empty: string;
}

const GROUP_CONFIGS: GroupConfig[] = [
  {
    type: "CREDIT_CARD",
    label: "Tarjetas de crédito",
    description: "Consumo, corte y días de pago",
    icon: CreditCard,
    badge: "bg-credit/10 text-credit",
    empty: "Registra una tarjeta para asociarla a tus gastos.",
  },
  {
    type: "BANK_ACCOUNT",
    label: "Cuentas bancarias",
    description: "Saldo disponible y exención de GMF",
    icon: Landmark,
    badge: "bg-accent/10 text-accent",
    empty: "Vincula una cuenta para centralizar tu saldo.",
  },
  {
    type: "CASH",
    label: "Efectivo",
    description: "Dinero en mano",
    icon: Banknote,
    badge: "bg-income/10 text-income",
    empty: "Lleva el registro del dinero en efectivo.",
  },
];

function sumAcross(items: { currency: string; value: number }[]): {
  segments: CurrencySegment[];
} {
  const byCurrency = new Map<string, number>();
  for (const item of items) {
    const key = item.currency || "USD";
    byCurrency.set(key, (byCurrency.get(key) ?? 0) + item.value);
  }
  const segments = [...byCurrency.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
  return { segments };
}

function MetricValue({ segments, prefix }: { segments: CurrencySegment[]; prefix?: string }) {
  if (segments.length === 0) {
    return (
      <p className="mt-1 text-lg font-semibold text-ink">
        {prefix ?? ""}
        <span className="tabular-nums">—</span>
      </p>
    );
  }
  const dominant = segments[0];
  const hasOthers = segments.length > 1;
  return (
    <div>
      <p className="mt-1 text-lg font-semibold text-ink">
        {prefix ?? ""}
        <span className="tabular-nums">{formatCurrency(dominant.total, dominant.currency)}</span>
      </p>
      {hasOthers && (
        <p className="text-[11px] text-ink-muted">
          +{segments.length - 1} moneda{segments.length - 1 > 1 ? "s" : ""} en otras divisas
        </p>
      )}
    </div>
  );
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = React.useState<PaymentMethod | null>(null);
  const [deletingLoading, setDeletingLoading] = React.useState(false);
  const [gmfTogglingId, setGmfTogglingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }
  }, [router]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPaymentMethods()
      .then((items) => {
        if (!active) return;
        setMethods(items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudieron cargar los métodos de pago");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, router]);

  const patchMethodGmf = (id: string, value: boolean) => {
    setMethods((prev) =>
      prev.map((method) =>
        method.id === id ? { ...method, details: { ...method.details, is_gmf_exempt: value } } : method
      )
    );
  };

  const handleToggleGmf = async (method: PaymentMethod, checked: boolean) => {
    setGmfTogglingId(method.id);
    patchMethodGmf(method.id, checked);
    try {
      await togglePaymentMethodGmfExempt(method.id, checked);
    } catch (err) {
      patchMethodGmf(method.id, !checked);
      toast({
        kind: "error",
        title: "No se pudo actualizar la exención de GMF",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setGmfTogglingId(null);
    }
  };

  const handleSaveSuccess = (saved: PaymentMethod) => {
    const isCreate = creating;
    setCreating(false);
    setEditing(null);
    toast({
      kind: "success",
      title: isCreate ? "Método de pago creado" : "Método de pago actualizado",
      description: saved.name,
    });
    setRefreshKey((key) => key + 1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await deletePaymentMethod(deleting.id);
      toast({ kind: "success", title: "Método de pago eliminado", description: deleting.name });
      setDeleting(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo eliminar el método de pago",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingLoading(false);
    }
  };

  const summary = React.useMemo(() => {
    const available: { currency: string; value: number }[] = [];
    const credit: { currency: string; value: number }[] = [];
    let gmfExemptCount = 0;

    for (const method of methods) {
      const details = method.details ?? {};
      if (method.type === "CREDIT_CARD") {
        credit.push({ currency: method.currency, value: details.current_balance ?? 0 });
      } else if (method.type === "BANK_ACCOUNT") {
        available.push({ currency: method.currency, value: details.current_balance ?? 0 });
        if (details.is_gmf_exempt === true) gmfExemptCount += 1;
      } else {
        available.push({ currency: method.currency, value: details.amount ?? 0 });
      }
    }

    return {
      available: sumAcross(available).segments,
      credit: sumAcross(credit).segments,
      gmfExemptCount,
      total: methods.length,
    };
  }, [methods]);

  const grouped = React.useMemo(
    () =>
      GROUP_CONFIGS.map((config) => ({
        ...config,
        items: methods
          .filter((method) => method.type === config.type)
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((group) => group.items.length > 0),
    [methods]
  );

  const showSkeleton = loading && methods.length === 0;
  const dialogOpen = creating || Boolean(editing);

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Métodos de pago</h1>
              <p className="text-sm text-ink-muted">
                Tarjetas, cuentas y efectivo para registrar tus movimientos.
              </p>
            </div>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              <span>Nuevo método</span>
            </Button>
          </div>

          {/* Summary */}
          {!showSkeleton && !error && methods.length > 0 && (
            <section className="glass-panel grid grid-cols-1 gap-x-4 gap-y-5 rounded-2xl px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-income/10 text-income">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-muted">Disponible</p>
                  <MetricValue segments={summary.available} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-credit/10 text-credit">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-muted">Deuda en tarjetas</p>
                  <MetricValue segments={summary.credit} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Wallet className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-muted">Métodos registrados</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{summary.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-subtle/10 text-ink-muted">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink-muted">Exentas de GMF</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
                    {summary.gmfExemptCount}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Content */}
          {showSkeleton ? (
            <section className="glass-panel rounded-2xl p-5">
              <div className="space-y-2" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
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
            </section>
          ) : error ? (
            <section className="glass-panel rounded-2xl px-6 py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-danger" />
              <p className="mt-3 text-sm text-ink-muted">{error}</p>
              <Button className="mt-5" onClick={() => setRefreshKey((key) => key + 1)}>
                Reintentar
              </Button>
            </section>
          ) : methods.length === 0 ? (
            <section className="glass-panel rounded-2xl px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                <Wallet className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-ink">
                Aún no tienes métodos de pago
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                Crea tu primera tarjeta de crédito, cuenta bancaria o registro de efectivo para
                detallar tus movimientos.
              </p>
            </section>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <section key={group.type} className="glass-panel rounded-2xl p-5">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          group.badge
                        )}
                      >
                        <group.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-ink">{group.label}</h2>
                        <p className="text-xs text-ink-muted">{group.description}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-glass px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="mt-3">
                    {group.items.map((method) => (
                      <PaymentMethodRow
                        key={method.id}
                        method={method}
                        gmfToggling={gmfTogglingId === method.id}
                        onEdit={setEditing}
                        onDelete={setDeleting}
                        onToggleGmf={handleToggleGmf}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create / edit dialog */}
      <FormModal
        open={dialogOpen}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={creating ? "Nuevo método de pago" : "Editar método de pago"}
        description={
          creating
            ? "Elige el tipo y completa los datos con los que la API lo identificará."
            : editing?.name
        }
      >
        {creating && (
          <PaymentMethodForm
            onSuccess={handleSaveSuccess}
            onCancel={() => setCreating(false)}
          />
        )}
        {editing && (
          <PaymentMethodForm
            method={editing}
            onSuccess={handleSaveSuccess}
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
        title="Eliminar método de pago"
        description={
          deleting
            ? `¿Seguro que quieres eliminar "${deleting.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        isLoading={deletingLoading}
      />
    </DashboardShell>
  );
}