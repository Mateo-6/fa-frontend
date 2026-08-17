"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MobileFab } from "@/components/ui/mobile-fab";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryRow } from "@/components/categories/category-row";
import { useToast } from "@/components/ui/toast";
import { getCategories, deleteCategory, Category, CategoryType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AlertCircle, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronDown, Plus, Tag } from "lucide-react";

interface GroupConfig {
  type: CategoryType;
  label: string;
  description: string;
  icon: typeof Tag;
  badge: string;
  empty: string;
  emptyAction: string;
}

const GROUP_CONFIGS: GroupConfig[] = [
  {
    type: "expense",
    label: "Gastos",
    description: "A dónde sale tu dinero",
    icon: ArrowUpRight,
    badge: "bg-expense/10 text-expense",
    empty: "Todavía no tienes categorías de gastos.",
    emptyAction: "Añadir categoría de gastos",
  },
  {
    type: "income",
    label: "Ingresos",
    description: "De dónde llega tu dinero",
    icon: ArrowDownLeft,
    badge: "bg-income/10 text-income",
    empty: "Todavía no tienes categorías de ingresos.",
    emptyAction: "Añadir categoría de ingresos",
  },
];

const TRANSFER_GROUP: GroupConfig = {
  type: "transfer",
  label: "Transferencias",
  description: "Movimientos entre cuentas propias",
  icon: ArrowLeftRight,
  badge: "bg-credit/10 text-credit",
  empty: "",
  emptyAction: "",
};

const sortByName = (a: Category, b: Category) => a.name.localeCompare(b.name);

export default function CategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const [creating, setCreating] = React.useState(false);
  const [creatingType, setCreatingType] = React.useState<CategoryType>("expense");
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const [deletingLoading, setDeletingLoading] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

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

    getCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as Error & { statusCode?: number };
        if (apiError.statusCode === 401) {
          router.push("/");
          return;
        }
        setError(apiError.message || "No se pudieron cargar las categorías");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, router]);

  const openCreate = (type: CategoryType = "expense") => {
    setCreatingType(type);
    setCreating(true);
  };

  const closeDialogs = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSaveSuccess = (saved: Category) => {
    const isCreate = creating;
    closeDialogs();
    toast({
      kind: "success",
      title: isCreate ? "Categoría creada" : "Categoría actualizada",
      description: saved.name,
    });
    setRefreshKey((key) => key + 1);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await deleteCategory(deleting.id);
      toast({ kind: "success", title: "Categoría eliminada", description: deleting.name });
      setDeleting(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      toast({
        kind: "error",
        title: "No se pudo eliminar la categoría",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeletingLoading(false);
    }
  };

  const groups = React.useMemo(() => {
    const byType = (type: CategoryType) =>
      categories.filter((category) => category.type === type).sort(sortByName);

    const primary = GROUP_CONFIGS.map((config) => ({ ...config, items: byType(config.type) }));
    const transferItems = byType("transfer");
    const transfer = transferItems.length > 0
      ? [{ ...TRANSFER_GROUP, items: transferItems }]
      : [];

    return [...primary, ...transfer];
  }, [categories]);

  const showSkeleton = loading && categories.length === 0;
  const dialogOpen = creating || Boolean(editing);

  return (
    <DashboardShell>
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Page header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-ink">Categorías</h1>
              <p className="text-sm text-ink-muted">
                Organiza tus gastos e ingresos a tu manera.
              </p>
            </div>
            <Button onClick={() => openCreate()} className="hidden lg:inline-flex">
              <Plus className="h-4 w-4" />
              <span>Nueva categoría</span>
            </Button>
          </div>

          {/* Content */}
          {showSkeleton ? (
            <section className="glass-panel rounded-2xl p-5">
              <div className="space-y-2" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
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
          ) : categories.length === 0 ? (
            <section className="glass-panel rounded-2xl px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
                <Tag className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-ink">
                Aún no tienes categorías
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
                Crea tus primeras categorías de gastos e ingresos para que cada movimiento
                quede bien identificado.
              </p>
              <Button className="mt-6" onClick={() => openCreate()}>
                <Plus className="h-4 w-4" />
                <span>Crear primera categoría</span>
              </Button>
            </section>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.type} className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-glass-border pb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((prev) => ({ ...prev, [group.type]: !prev[group.type] }))
                      }
                      className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                      aria-expanded={!collapsed[group.type]}
                      aria-controls={`categories-${group.type}`}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          group.badge
                        )}
                      >
                        <group.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold text-ink">{group.label}</h2>
                        <p className="text-xs text-ink-muted">{group.description}</p>
                      </div>
                      <span className="rounded-full bg-glass px-2.5 py-0.5 text-xs font-medium text-ink-muted">
                        {group.items.length}
                      </span>
                      <ChevronDown
                        className={cn(
                          "ml-auto h-4 w-4 shrink-0 text-ink-muted transition-transform",
                          collapsed[group.type] && "-rotate-90"
                        )}
                      />
                    </button>
                  </div>

                  {!collapsed[group.type] && (
                    <div id={`categories-${group.type}`}>
                      {group.items.length === 0 ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-ground/40 px-4 py-3">
                        <p className="text-sm text-ink-muted">{group.empty}</p>
                        <Button variant="ghost" onClick={() => openCreate(group.type)}>
                          <Plus className="h-4 w-4" />
                          <span>{group.emptyAction}</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {group.items.map((category) => (
                          <CategoryRow
                            key={category.id}
                            category={category}
                            onEdit={setEditing}
                            onDelete={setDeleting}
                          />
                        ))}
                      </div>
                    )}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create / edit dialog */}
      <FormModal
        open={dialogOpen}
        onClose={closeDialogs}
        title={creating ? "Nueva categoría" : "Editar categoría"}
        description={
          creating
            ? "Dale nombre, color e icono para reconocerla de un vistazo."
            : editing?.name
        }
      >
        {creating && !editing && (
          <CategoryForm
            key={`create-${creatingType}`}
            initialType={creatingType}
            onSuccess={handleSaveSuccess}
            onCancel={() => setCreating(false)}
          />
        )}
        {editing && (
          <CategoryForm
            category={editing}
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
        title="Eliminar categoría"
        description={
          deleting
            ? `¿Seguro que quieres eliminar "${deleting.name}"? Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        isLoading={deletingLoading}
      />

      {/* Mobile FAB */}
      <MobileFab label="Nueva categoría" onClick={() => openCreate()}>
        <Plus className="h-6 w-6" />
      </MobileFab>
    </DashboardShell>
  );
}