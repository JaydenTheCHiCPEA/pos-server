import type { Category, DiscountRule, Item, Store, TaxRate, Transaction, User } from "@/types";
import type { Shift } from "@/types";
import { generateId } from "@/utils/format";

export const EMPTY_USERS: User[] = [];
export const EMPTY_ITEMS: Item[] = [];
export const EMPTY_CATEGORIES: Category[] = [];
export const EMPTY_TAX_RATES: TaxRate[] = [];
export const EMPTY_DISCOUNT_RULES: DiscountRule[] = [];
export const EMPTY_TRANSACTIONS: Transaction[] = [];
export const EMPTY_SHIFTS: Shift[] = [];

export const EMPTY_STORE: Store = {
  id: "store1",
  name: "",
  address: "",
  phone: "",
  email: "",
  taxId: "",
  receiptFooter: "",
};

// Create a fresh store with unique ID for each new registration
export function createFreshStore(): Store {
  return {
    id: generateId(),
    name: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
    receiptFooter: "",
  };
}

export const DEFAULT_THEME_OPTION = "dark";
export const DEFAULT_CURRENCY_SYMBOL = "$";

/** Persist blank business data to AsyncStorage (excluding users — set separately). */
export async function saveEmptyBusinessData(
  save: (key: string, value: unknown) => Promise<void>,
  storeId?: string,
): Promise<void> {
  const store = storeId ? { ...EMPTY_STORE, id: storeId } : createFreshStore();
  await Promise.all([
    save("items", EMPTY_ITEMS),
    save("categories", EMPTY_CATEGORIES),
    save("tax_rates", EMPTY_TAX_RATES),
    save("discount_rules", EMPTY_DISCOUNT_RULES),
    save("transactions", EMPTY_TRANSACTIONS),
    save("shifts", EMPTY_SHIFTS),
    save("store", store),
    save("theme_option", DEFAULT_THEME_OPTION),
    save("currency_symbol", DEFAULT_CURRENCY_SYMBOL),
  ]);
}
