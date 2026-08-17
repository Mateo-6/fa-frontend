---
target: dashboard
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
p2_count: 2
p3_count: 1
timestamp: 2026-08-16T00-29-56Z
slug: app-dashboard-page-tsx
---
# /dashboard Critique

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading + error states exist; no inline action feedback (read-only surface). |
| 2 | Match Between System and Real World | 4 | Plain Spanish labels, conventional icons, natural top-down priority. |
| 3 | User Control and Freedom | 2 | Only logout is possible; no navigation, undo, or drill-down by design scope. |
| 4 | Consistency and Standards | 3 | Visual system is cohesive; minor deviations in icon weight and semantic color usage. |
| 5 | Error Prevention | 3 | Read-only surface limits errors; retry on load failure is present. |
| 6 | Recognition Rather Than Recall | 4 | All summary info visible; no hidden menus or commands to memorize. |
| 7 | Flexibility and Efficiency of Use | 1 | No keyboard shortcuts, bulk actions, customization, or quick-add paths. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and restrained; icon containers in summary cards add visual noise. |
| 9 | Help Users Recognize, Diagnose, and Recover from Errors | 3 | Clear error message + retry; 401 redirects handled. |
| 10 | Help and Documentation | 1 | No help, tooltips, or onboarding for first-time users. |
| **Total** | | **27/40** | **Acceptable / Good foundation** |

## Design Specificity Verdict

**Category-typical execution, not product-distinctive.**

The dashboard is a competent Glass Ledger interpretation of a generic personal-finance summary screen. It inherits the dark frosted vocabulary from `/login` faithfully, and the Spanish copy gives it regional identity. But strip the language away and this could be a budgeting, banking, or crypto portfolio dashboard with almost no changes. The layout (four KPI cards → recent list → sidebar cards) is the default SaaS dashboard trope.

Missed opportunities for product character:
- No ownable empty state or "first money moment" that teaches the product's value.
- No visual metaphor for *cash flow* — income, expenses, and available cash sit as four equal blocks rather than a connected story.
- No hint at the product principle "Claridad financiera primero" beyond literal labels.

**Deterministic scan:** The CLI detector returned zero findings. The browser detector flagged `overused-font` (Inter), `gradient-text` (body), `ai-color-palette` (cyan accent icons), and `nested-cards` (credit-card minis). All are false positives against the documented design system: Inter and the sky accent `#38bdf8` are intentional per `DESIGN.md`; no gradient text exists in the dashboard source; and the Credit Card Mini nesting is explicitly documented. The one credible detector-adjacent observation is that the credit-card mini is the only nested panel inside a glass card, which is worth monitoring if the system evolves.

## Overall Impression

The dashboard is calm, coherent, and immediately readable. It answers "where do I stand?" but stops there. The biggest opportunity is turning this from a read-only report into a launchpad for action.

## What's Working

1. **Cohesive visual system.** Glass cards, sky accent, Inter typography, and semantic colors are implemented consistently with `DESIGN.md`.
2. **Natural information architecture.** Summary → transactions → upcoming payments → credit cards follows the user's mental model.
3. **Readable transaction rows.** Rounded-square icon badges, clear description/category/date line, and right-aligned amounts make each row scannable.

## Priority Issues

### [P1] Dead-end dashboard — no paths to act or navigate
- **What:** The dashboard shows data but offers no way to add a transaction, view all transactions, pay a card, edit a recurring payment, or navigate to any other section.
- **Why it matters:** Violates "Registro sin fricción." After scanning their finances, the experience stops.
- **Fix:** Add a primary navigation rail or top-bar links (Transacciones, Tarjetas, Presupuestos, Categorías) and contextual CTAs ("Ver todas", "Registrar gasto", "Pagar tarjeta").
- **Suggested command:** `/impeccable layout` or `/impeccable onboard`

### [P1] Missing global navigation
- **What:** The header only contains the product mark, user name, and logout. No menu reaches other app surfaces.
- **Why it matters:** Users who land here cannot discover the rest of the product.
- **Fix:** Implement a sticky navigation pattern consistent with the Glass Ledger system, with text labels on desktop and a bottom bar or hamburger on mobile.
- **Suggested command:** `/impeccable layout`

### [P2] Chromatic noise in summary cards
- **What:** "Balance total" is always green, "Ingresos" green, "Gastos" red, "Disponible" white. If balance were negative, it would still render green. The four cards compete for attention via color rather than importance.
- **Why it matters:** Color is being asked to carry meaning it cannot support consistently.
- **Fix:** Render neutral metrics (balance, available) in `ink`; reserve green/red for actual income/expense indicators or trend badges. Use size/weight to make balance total dominant.
- **Suggested command:** `/impeccable colorize`

### [P2] Icon containers in summary cards compete with values
- **What:** Every summary card has a 40×40 px ringed icon container at the same visual weight as the monetary value.
- **Why it matters:** The icons draw the eye away from the numbers, which are the real content.
- **Fix:** Reduce icon opacity, remove the ring, or shrink the container. Make the numeric value the unmistakable focal point.
- **Suggested command:** `/impeccable layout`

### [P3] Non-standard masked card format
- **What:** Credit cards show `·4821` with a leading middle dot.
- **Why it matters:** Users expect `•••• 4821` or `*4821`. The middle dot reads like a bullet.
- **Fix:** Use `•••• 4821` and ensure screen readers announce "terminada en 4821" if needed.
- **Suggested command:** `/impeccable clarify`

## Persona Red Flags

### Alex (Power User)
- No keyboard shortcuts or focusable quick actions.
- No way to search, filter, sort, or bulk-edit transactions.
- No drill-down into a transaction or card from the dashboard.
- No "add transaction" shortcut; the fastest path is currently to leave the page.
- **Risk:** Alex will conclude the product is not built for serious use and churn quickly.

### Jordan (First-Timer)
- No onboarding, tooltips, or contextual help explaining the difference between "Balance total" and "Disponible."
- No obvious next step after landing: "What do I click first?"
- Header has only logout, so the rest of the app appears inaccessible.
- "Vence en 4 días" for upcoming payments creates anxiety without explaining what to do about it.
- **Risk:** Jordan feels lost and abandons after the first visit.

### Sam (Accessibility-Dependent)
- Summary-card values rely partly on color to convey meaning (green/red); only the transaction rows also use directional arrow icons.
- Header logout button is icon-only on mobile viewports (`hidden sm:inline` for the label).
- Heading hierarchy and ARIA landmarks should be audited (single `<h1>`, then `<h2>` per card).
- The credit-card mask `·4821` may not be read naturally by screen readers.
- **Risk:** Critical financial information may be miscommunicated or hard to navigate.

## Minor Observations

- `bg-ground-900/80` in the header does not map to a defined token in `DESIGN.md` (tokens are `ground-deep`, `ground`, `ground-raised`).
- Expense amounts in transaction rows are rendered in `text-ink` (white), while the "Gastos" summary value is red. Pick one semantic treatment.
- Credit cards section silently hides when empty; there is no "No tienes tarjetas" empty state.
- Upcoming payments show both relative ("en 16 días") and absolute ("31 ago 2026") dates; the full year feels unnecessarily distant.
- Loading state hardcodes header height (`73px`), which is fragile if header padding changes.
- No visible currency indicator despite the API supporting multiple currencies.

## Questions to Consider

1. What if the dashboard weren't a dead end? What single action — placed where the eye lands first — would make this screen feel alive the moment a user logs in?
2. Does showing four equally weighted summary cards obscure the one number that matters most?
3. What story does this screen tell someone with no data? If transactions, payments, and cards are all empty, does the user feel invited or abandoned?
