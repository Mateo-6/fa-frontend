import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpen,
  Briefcase,
  BusFront,
  Car,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PawPrint,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Wifi,
  Zap,
} from "lucide-react";

/**
 * Paleta curada de colores para categorías. Se almacena como `color` (#hex)
 * vía la API y se usa como dato (contenido), no como token de diseño.
 */
export const CATEGORY_COLORS: string[] = [
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#f472b6",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#4ade80",
  "#f87171",
  "#94a3b8",
];

export interface CategoryIconOption {
  value: string;
  label: string;
  component: LucideIcon;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { value: "utensils-crossed", label: "Restaurante", component: UtensilsCrossed },
  { value: "shopping-cart", label: "Mercado", component: ShoppingCart },
  { value: "coffee", label: "Café", component: Coffee },
  { value: "pizza", label: "Comida", component: Pizza },
  { value: "shopping-bag", label: "Compras", component: ShoppingBag },
  { value: "shirt", label: "Ropa", component: Shirt },
  { value: "car", label: "Auto", component: Car },
  { value: "fuel", label: "Combustible", component: Fuel },
  { value: "bus-front", label: "Transporte", component: BusFront },
  { value: "plane", label: "Viajes", component: Plane },
  { value: "home", label: "Vivienda", component: Home },
  { value: "zap", label: "Energía", component: Zap },
  { value: "wifi", label: "Internet", component: Wifi },
  { value: "smartphone", label: "Celular", component: Smartphone },
  { value: "tv", label: "Entretenimiento", component: Tv },
  { value: "film", label: "Cine", component: Film },
  { value: "gamepad-2", label: "Gaming", component: Gamepad2 },
  { value: "music", label: "Música", component: Music },
  { value: "heart-pulse", label: "Salud", component: HeartPulse },
  { value: "pill", label: "Farmacia", component: Pill },
  { value: "dumbbell", label: "Gimnasio", component: Dumbbell },
  { value: "graduation-cap", label: "Educación", component: GraduationCap },
  { value: "book-open", label: "Lectura", component: BookOpen },
  { value: "receipt", label: "Facturas", component: Receipt },
  { value: "briefcase", label: "Trabajo", component: Briefcase },
  { value: "banknote", label: "Sueldo", component: Banknote },
  { value: "piggy-bank", label: "Ahorro", component: PiggyBank },
  { value: "trending-up", label: "Ingresos", component: TrendingUp },
  { value: "gift", label: "Regalos", component: Gift },
  { value: "paw-print", label: "Mascotas", component: PawPrint },
  { value: "sparkles", label: "Otros", component: Sparkles },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.value, option.component])
);

export const FALLBACK_CATEGORY_ICON: LucideIcon = Tag;

export function resolveCategoryIcon(icon?: string | null): LucideIcon {
  return (icon && ICON_MAP[icon]) || FALLBACK_CATEGORY_ICON;
}