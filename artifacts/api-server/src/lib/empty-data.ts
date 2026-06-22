/**
 * Empty storage defaults — used for wipe and fresh business registration.
 * Never contains demo users, items, or catalog data.
 */

export const EMPTY_STORE = {
  id: "store1",
  name: "",
  address: "",
  phone: "",
  email: "",
  taxId: "",
  receiptFooter: "",
};

/** All sync keys with empty business data (no users). */
export const EMPTY_SEED_PAYLOAD: Record<string, unknown> = {
  users: [],
  categories: [],
  tax_rates: [],
  items: [],
  discount_rules: [],
  store: EMPTY_STORE,
  transactions: [],
  shifts: [],
  theme_option: "dark",
  currency_symbol: "$",
};
