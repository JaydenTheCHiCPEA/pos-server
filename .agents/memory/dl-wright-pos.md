---
name: DL Wright POS
description: Architecture and gotchas for the dl-wright-pos Expo artifact
---

## Stack
- Expo Router v6, React Native, AsyncStorage (offline-first)
- Artifact path: `artifacts/dl-wright-pos/`
- Workflow name: `artifacts/dl-wright-pos: expo`

## Key files
- `context/ThemeContext.tsx` — exposes `theme`, `themeOption`, `setThemeOption`, `currencySymbol`, `setCurrencySymbol`. No `toggleTheme` helper — call `setThemeOption(v ? "dark" : "light")`.
- `context/AuthContext.tsx` — exports `getDefaultPermissions(role)` as a named function
- `context/ShiftContext.tsx` — `getExpectedCash()` = openingCash + cashIn movements - cashOut movements + salesTotal (all cash sales)
- `context/StoreContext.tsx` — 12 default items, 5 categories, GCT 15% tax, 3 discount rules
- `constants/colors.ts` — all color tokens including posBackground, cartBackground, itemCard, sidebar, header, gold, purple, tabInactive

## Permissions type (types/index.ts)
Keys: acceptPayments, applyDiscounts, applyRestrictedDiscounts, changeTaxes, manageOpenTickets, voidSavedItems, openCashDrawer, viewCosts, viewReceipts, performRefunds, accessBackOffice, manageItems, manageEmployees, viewReports, manageSettings

## TaxRate type
Does NOT have an `active` field — only: id, name, rate, isDefault.

## Routing
- `/` — login
- `/clock-in` — clock-in (opening cash)
- `/(pos)` — full POS terminal
- `/(backoffice)` — back office tabs (Dashboard, Items, Team, Reports, Settings)

## Gotchas
- `addTransaction` takes `Omit<Transaction, "id">` — never pass `id` property; destructure it out first when creating refunds from existing transactions.
- `ThemeContext` does NOT expose `toggleTheme`; use `setThemeOption`.
- StyleSheet objects cannot have duplicate property keys (e.g. `gap` twice) — TS1117.
- Back office access is guarded by `hasPermission("accessBackOffice")`.

**Why:**
These were discovered during initial build and type-checking.
