---
name: Financial App
description: Seguimiento diario de tus gastos personales.
colors:
  ground-deep: "#0b1021"
  ground: "#111827"
  ground-raised: "#1a2235"
  glass: "rgba(255, 255, 255, 0.06)"
  glass-hover: "rgba(255, 255, 255, 0.10)"
  glass-border: "rgba(255, 255, 255, 0.10)"
  ink: "#f8fafc"
  ink-muted: "#94a3b8"
  ink-subtle: "#64748b"
  accent: "#38bdf8"
  accent-glow: "rgba(56, 189, 248, 0.35)"
  danger: "#f87171"
  danger-glow: "rgba(248, 113, 113, 0.30)"
  success: "#34d399"
  expense: "#f87171"
  credit: "#818cf8"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  card: "16px"
  control: "8px"
  icon: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ground-deep}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "#7dd3fc"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  input:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  card-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Financial App

## Overview

**Creative North Star: "The Glass Ledger"**

A quiet, deep workspace where personal finance feels precise and protected. The interface reads like a single sheet of frosted glass held above a dark desk: every control is legible, every state is immediate, and nothing competes for attention. Trust is built through restraint, alignment, and measured motion rather than through decorative security cues.

The system is intentionally dark because the product is visited in short, focused sessions — often in the evening or between tasks — and a deep ground keeps the numbers and forms forward. Cool accents behave like instrument readouts: one color, used sparingly, marks the active path.

**Key Characteristics:**
- One cool accent against a near-black ground.
- Frosted glass containers with visible but quiet borders.
- Geometric sans type at a single family with weight and size creating hierarchy.
- Motion that enters softly and settles; no bouncing, no scatter.
- States signaled by structure (border, glow, elevation) before color.

## Colors

The palette is restrained: a deep slate family carries the interface, a sky accent marks action and focus, and a single danger tone handles errors.

### Primary
- **Sky Accent** (`#38bdf8`): primary action buttons, active field borders, focus rings, and links. Used as light emitted from controls, not as大面积 fill.
- **Sky Glow** (`rgba(56, 189, 248, 0.35)`): ambient glow behind accent elements and focused inputs.

### Neutral
- **Ground Deep** (`#0b1021`): page background. The darkest value; everything rests on it.
- **Ground** (`#111827`): input backgrounds and elevated surfaces at rest.
- **Ground Raised** (`#1a2235`): hover backgrounds for controls inside glass cards.
- **Glass** (`rgba(255, 255, 255, 0.06)`): primary container background. Combined with `backdrop-blur` it produces the frosted sheet.
- **Glass Hover** (`rgba(255, 255, 255, 0.10)`): hover state for ghost buttons and selectable rows.
- **Glass Border** (`rgba(255, 255, 255, 0.10)`): one-pixel borders that separate glass surfaces from the deep ground.
- **Ink** (`#f8fafc`): primary text and headings.
- **Ink Muted** (`#94a3b8`): secondary text, labels, and placeholders.
- **Ink Subtle** (`#64748b`): tertiary or disabled hints.

### Status / Semantic
- **Success** (`#34d399`): income figures, positive balances, and favorable trends.
- **Expense** (`#f87171`): expense figures and negative money-out indicators.
- **Credit** (`#818cf8`): credit card summaries and card-related highlights.
- **Danger** (`#f87171`): inline errors and destructive actions.
- **Danger Glow** (`rgba(248, 113, 113, 0.30)`): focus ring for invalid fields.

### Named Rules
**The One Accent Rule.** The sky accent is the only saturated hue on authentication and dense financial surfaces. Use it for ≤10% of the visible area; its scarcity is what makes it feel like a signal.

**The No Cream Rule.** Warm paper or parchment tones are out of bounds. The world is cool, dark, and instrumental.

## Theme

The interface ships with **light and dark modes**. Color values are stored as CSS custom properties in `app/globals.css` and consumed through Tailwind classes. The dark palette above remains the canonical "Glass Ledger" expression; the light palette inverts the ground family to a cool slate/white while keeping the same glass-panel structure.

- Default theme follows the system preference.
- The user can toggle manually; the choice persists in `localStorage` via `next-themes`.
- Semantic tokens (`income`, `expense`, `credit`) swap shades so they remain legible on both grounds.
- No hard-coded hex values should be introduced in components; always use the design tokens.

## Typography

**Display / Body / Label Font:** Inter, system-ui, sans-serif

The typeface is neutral, geometric, and highly legible at small sizes. Hierarchy is achieved through weight and size, never through decorative styling.

### Hierarchy
- **Display** (600, 1.5rem / 24px, line-height 1.2, -0.02em tracking): product wordmark and major page titles.
- **Headline** (600, 1.125rem / 18px, line-height 1.3, -0.01em tracking): card titles and section headers.
- **Body** (400, 0.875rem / 14px, line-height 1.5): form labels, descriptions, supporting copy.
- **Label** (500, 0.75rem / 12px, line-height 1.4, 0.05em tracking): field labels and microcopy.

### Named Rules
**The Single Voice Rule.** Inter is the only type family. Display moments may tighten tracking; body copy never does.

**The Measure Rule.** Body paragraphs max out at 65–75ch. Form cards stay narrow (max-width ~380px) so lines never sprawl.

## Layout

The layout model is centered and contained. Authentication surfaces use a narrow column centered in the viewport. Dense surfaces (dashboard) expand to a wider max-width container but keep the same spacing rhythm.

- **Page padding:** `24px` on mobile, `32px` on desktop.
- **Container max-width:** `380px` for auth; `1152px` (`max-w-6xl`) for dashboard and future dense surfaces.
- **Spacing rhythm:** base unit is `8px`. Gaps between related controls are `16px` or `20px`; separators between sections are `24px` or `32px`.
- **Responsive behavior:**
  - Auth cards stay centered and stack internal rows on narrow viewports.
  - Dashboard summary cards form a 2-column grid on mobile/tablet and 4 columns on desktop.
  - Dashboard main content is a single column on mobile; two columns (2:1 ratio) on desktop.

## Elevation & Depth

Depth is conveyed through layered translucency and soft shadows, not through bold lifts. The ground is opaque; cards float above it on a combination of backdrop blur, translucent fill, and diffuse shadow.

### Shadow Vocabulary
- **Glass Shadow** (`0 8px 32px rgba(0, 0, 0, 0.35)`): default elevation for cards and panels.
- **Glass Shadow Large** (`0 24px 64px rgba(0, 0, 0, 0.45)`): modals, elevated sheets, or focused containers.
- **Accent Glow** (`0 0 0 3px rgba(56, 189, 248, 0.25), 0 0 24px rgba(56, 189, 248, 0.20)`): focus ring and active-state halo around inputs and primary actions.
- **Danger Glow** (`0 0 0 3px rgba(248, 113, 113, 0.20), 0 0 20px rgba(248, 113, 113, 0.15)`): focus ring for invalid fields.

### Named Rules
**The Blur Must Be Functional Rule.** Backdrop blur appears only on glass containers that sit above the deep ground. Do not apply blur to flat surfaces or as a decorative texture.

## Shapes

The form language is rounded and uniform. Cards use `16px` radius; buttons and inputs use `8px`. The product icon lives inside a rounded square with the same radius family. Borders are consistently `1px` and translucent.

- **Card radius:** `16px`
- **Control radius:** `8px`
- **Border weight:** `1px`
- **Icon container:** rounded square, `16px` radius, with a thin ring in the accent color at low opacity.

## Components

### Buttons
- **Shape:** `8px` radius, generous padding (`12px 20px`), full width when inside narrow cards.
- **Primary:** sky background (`#38bdf8`) with deep-ground text. Hover lightens to `#7dd3fc` and adds an accent glow. Active scales to `0.98`.
- **Ghost:** transparent background, muted text. Hover raises background to `rgba(255,255,255,0.10)` and text to ink.
- **Loading state:** a restrained shimmer sweeps across the primary button while preserving its label.

### Inputs / Fields
- **Style:** `8px` radius, `1px` translucent border, dark ground background (`#111827` at ~60% opacity).
- **Focus:** border shifts to accent at 60% opacity and the field gains the accent-glow shadow.
- **Error:** border and glow shift to danger; an inline message appears below the field.
- **Placeholder:** muted ink color to maintain contrast.

### Cards / Containers
- **Glass Card:** translucent white fill (`rgba(255,255,255,0.06)`), `backdrop-blur-xl`, `1px` translucent border, `16px` radius, `24px` internal padding.
- **Use:** authentication panels, summary widgets, and any surface that needs to read as a lifted sheet.

### Summary Cards
- **Glass Card base:** same translucent panel with `16px` radius.
- **Content:** small uppercase label, large numeric value, optional trend color, and a muted icon in a rounded-square container.
- **Trend colors:** success for positive/balance, expense for negative/gastos, neutral for unclassified values.

### List Rows (Transactions / Upcoming Payments)
- **Shape:** full-width row with `1px` translucent bottom border.
- **Leading icon:** a rounded-square badge in the semantic color of the item (emerald for income, rose for expense, sky for upcoming payment).
- **Content:** primary label in ink, secondary metadata (category, date) in muted ink.
- **Trailing:** right-aligned amount and optional secondary date.

### Credit Card Mini
- **Shape:** rounded panel with a subtle ground background (`#111827` at lower opacity) and translucent border.
- **Content:** card name, last-four digits, current balance / limit, and a utilization progress bar.
- **Progress bar:** `h-1.5` rounded track in ground-700, fill in credit purple (`#818cf8`).

### Navigation
Sticky header with blurred ground background, product mark on the left, user info and ghost logout button on the right.

## Do's and Don'ts

### Do:
- **Do** keep the sky accent scarce; use it for primary actions, focus states, and links.
- **Do** maintain a single type family (Inter) across all surfaces.
- **Do** use the glass card pattern for lifted panels on the deep ground.
- **Do** signal state with border, glow, and elevation before relying on color alone.

### Don't:
- **Don't** introduce warm paper, cream, or parchment tones.
- **Don't** use glass blur as a decorative background texture.
- **Don't** apply hard offset shadows; depth is diffuse, not stamped.
- **Don't** use emoji or Unicode glyphs as icons; draw icons in a consistent stroke.
- **Don't** add kickers or eyebrow labels above headings.
