"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl, SegmentOption } from "@/components/ui/segmented-control";
import {
  createCategory,
  updateCategory,
  Category,
  CategoryType,
  CreateCategoryPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_OPTIONS,
  resolveCategoryIcon,
} from "@/components/categories/category-options";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Ban,
  Check,
  Plus,
  Save,
} from "lucide-react";

const TYPE_OPTIONS: SegmentOption[] = [
  { value: "income", label: "Ingreso", icon: ArrowDownLeft, semantic: "income" },
  { value: "expense", label: "Gasto", icon: ArrowUpRight, semantic: "expense" },
  { value: "transfer", label: "Transferencia", icon: ArrowLeftRight, semantic: "credit" },
];

interface FormState {
  name: string;
  description: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
}

interface CategoryFormProps {
  category?: Category | null;
  initialType?: CategoryType;
  onSuccess?: (category: Category) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

function initState(category?: Category | null, initialType?: CategoryType): FormState {
  if (!category) {
    return {
      name: "",
      description: "",
      type: initialType ?? "expense",
      color: CATEGORY_COLORS[0],
      icon: null,
    };
  }
  return {
    name: category.name,
    description: category.description ?? "",
    type: category.type,
    color: category.color ?? null,
    icon: category.icon ?? null,
  };
}

const PLACEHOLDER_BY_TYPE: Record<CategoryType, string> = {
  expense: "Ej. Alimentación, Transporte, Vivienda",
  income: "Ej. Salario, Freelance, Inversiones",
  transfer: "Ej. Entre cuentas propias",
};

export function CategoryForm({ category, initialType, onSuccess, onCancel, submitLabel }: CategoryFormProps) {
  const isEdit = Boolean(category);
  const [form, setForm] = React.useState<FormState>(() => initState(category, initialType));
  const [errors, setErrors] = React.useState<Record<string, string | undefined>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (serverError) setServerError(null);
  };

  const colorSwatches = React.useMemo(() => {
    if (category?.color && !CATEGORY_COLORS.includes(category.color)) {
      return [...CATEGORY_COLORS, category.color];
    }
    return CATEGORY_COLORS;
  }, [category]);

  const iconOptions = React.useMemo(() => {
    if (category?.icon && !CATEGORY_ICON_OPTIONS.some((option) => option.value === category.icon)) {
      const Icon = resolveCategoryIcon(category.icon);
      return [...CATEGORY_ICON_OPTIONS, { value: category.icon, label: "Personalizado", component: Icon }];
    }
    return CATEGORY_ICON_OPTIONS;
  }, [category]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "El nombre es obligatorio";
    else if (form.name.trim().length > 100) next.name = "Máximo 100 caracteres";
    if (form.description.trim().length > 255) next.description = "Máximo 255 caracteres";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    const trimmedDescription = form.description.trim();
    const payload: CreateCategoryPayload = {
      name: form.name.trim(),
      type: form.type,
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      color: form.color ?? null,
      icon: form.icon ?? null,
    };

    setSaving(true);
    try {
      const saved = isEdit && category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);
      onSuccess?.(saved);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "No se pudo guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </div>
      )}

      <SegmentedControl
        label="Tipo"
        options={TYPE_OPTIONS}
        value={form.type}
        onChange={(value) => setField("type", value as CategoryType)}
        disabled={saving || isEdit}
      />

      <Input
        label="Nombre"
        type="text"
        placeholder={PLACEHOLDER_BY_TYPE[form.type]}
        value={form.name}
        onChange={(e) => setField("name", e.target.value)}
        error={errors.name}
        disabled={saving}
        maxLength={100}
      />

      <div className="group flex min-w-0 flex-col gap-1.5">
        <label
          htmlFor="category-description"
          className="text-xs font-medium tracking-wide text-ink-muted transition-colors group-focus-within:text-accent"
        >
          Descripción
        </label>
        <textarea
          id="category-description"
          rows={2}
          maxLength={255}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          disabled={saving}
          placeholder="Para qué usas esta categoría (opcional)"
          aria-invalid={errors.description ? "true" : "false"}
          className={cn(
            "w-full resize-none rounded-lg border bg-ground/60 px-4 py-3 text-sm text-ink",
            "placeholder:text-ink-muted",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-accent/60 focus:shadow-accent-glow",
            "hover:border-glass-border hover:bg-ground-raised/60",
            "disabled:cursor-not-allowed disabled:opacity-60",
            errors.description
              ? "border-danger focus:border-danger focus:shadow-danger-glow"
              : "border-glass-border"
          )}
        />
        {errors.description && (
          <span className="text-xs text-danger" role="alert">
            {errors.description}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wide text-ink-muted">Color</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setField("color", null)}
            disabled={saving}
            aria-label="Sin color"
            aria-pressed={form.color === null}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-glass-border bg-ground/60 text-ink-subtle",
              "transition-all duration-200 ease-out",
              "hover:border-ink-muted hover:text-ink",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              "disabled:cursor-not-allowed disabled:opacity-60",
              form.color === null && "border-accent text-accent shadow-accent-glow"
            )}
          >
            <Ban className="h-4 w-4" />
          </button>
          {colorSwatches.map((swatch) => {
            const selected = form.color === swatch;
            return (
              <button
                key={swatch}
                type="button"
                onClick={() => setField("color", swatch)}
                disabled={saving}
                aria-label={`Color ${swatch}`}
                aria-pressed={selected}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full",
                  "transition-all duration-200 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  selected && "scale-105 outline-2 outline-offset-2 outline-accent"
                )}
                style={{ backgroundColor: swatch }}
              >
                {selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wide text-ink-muted">Icono</span>
        <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Icono de la categoría">
          <button
            type="button"
            onClick={() => setField("icon", null)}
            disabled={saving}
            role="radio"
            aria-checked={form.icon === null}
            aria-label="Sin icono"
            className={cn(
              "flex h-10 items-center justify-center rounded-lg border text-ink-subtle",
              "transition-all duration-200 ease-out",
              "hover:border-glass-border hover:bg-glass-hover hover:text-ink",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              "disabled:cursor-not-allowed disabled:opacity-60",
              form.icon === null
                ? "border-accent bg-glass text-accent shadow-accent-glow"
                : "border-glass-border bg-ground/60"
            )}
          >
            <Ban className="h-4 w-4" />
          </button>
          {iconOptions.map((option) => {
            const selected = form.icon === option.value;
            const Icon = option.component;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setField("icon", option.value)}
                disabled={saving}
                role="radio"
                aria-checked={selected}
                aria-label={option.label}
                title={option.label}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg border",
                  "transition-all duration-200 ease-out",
                  "hover:border-glass-border hover:bg-glass-hover hover:text-ink",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  selected
                    ? "border-accent bg-glass text-ink shadow-accent-glow"
                    : "border-glass-border bg-ground/60 text-ink-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" isLoading={saving} disabled={saving}>
          {isEdit ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear categoría")}
        </Button>
      </div>
    </form>
  );
}