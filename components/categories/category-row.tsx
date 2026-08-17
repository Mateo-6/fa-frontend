"use client";

import { cn } from "@/lib/utils";
import { Category } from "@/lib/api";
import { resolveCategoryIcon } from "@/components/categories/category-options";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const Icon = resolveCategoryIcon(category.icon);
  const color = category.color;
  const hasColor = Boolean(color);

  return (
    <div className="group flex items-center gap-3 border-b border-glass-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          !hasColor && "bg-glass text-ink-muted"
        )}
        style={hasColor ? { backgroundColor: `${color}1a`, color: color ?? undefined } : undefined}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{category.name}</p>
        {category.description && (
          <p className="mt-0.5 truncate text-xs text-ink-muted">{category.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 self-center md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(category)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-ink"
          aria-label={`Editar ${category.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-glass-hover hover:text-danger"
          aria-label={`Eliminar ${category.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}