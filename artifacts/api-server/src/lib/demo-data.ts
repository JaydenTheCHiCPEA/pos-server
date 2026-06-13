/**
 * Demo / seed data — mirrors the client defaults in AuthContext + StoreContext.
 * Seeded into Neon on first server start when the database is empty.
 */

export const DEMO_USERS = [
  {
    id: "u1",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    role: "admin",
    salary: 0,
    hourlyRate: 0,
    permissions: {
      acceptPayments: true,
      applyDiscounts: true,
      applyRestrictedDiscounts: true,
      changeTaxes: true,
      manageOpenTickets: true,
      voidSavedItems: true,
      openCashDrawer: true,
      viewCosts: true,
      viewReceipts: true,
      performRefunds: true,
      accessBackOffice: true,
      manageItems: true,
      manageEmployees: true,
      viewReports: true,
      manageSettings: true,
    },
    active: true,
  },
  {
    id: "u2",
    username: "manager",
    password: "manager123",
    name: "Sarah Johnson",
    role: "manager",
    salary: 4500,
    hourlyRate: 25,
    permissions: {
      acceptPayments: true,
      applyDiscounts: true,
      applyRestrictedDiscounts: true,
      changeTaxes: true,
      manageOpenTickets: true,
      voidSavedItems: true,
      openCashDrawer: true,
      viewCosts: true,
      viewReceipts: true,
      performRefunds: true,
      accessBackOffice: true,
      manageItems: true,
      manageEmployees: false,
      viewReports: true,
      manageSettings: false,
    },
    active: true,
  },
  {
    id: "u3",
    username: "cashier1",
    password: "cashier123",
    name: "John Smith",
    role: "cashier",
    salary: 2500,
    hourlyRate: 12,
    permissions: {
      acceptPayments: true,
      applyDiscounts: true,
      applyRestrictedDiscounts: false,
      changeTaxes: false,
      manageOpenTickets: false,
      voidSavedItems: false,
      openCashDrawer: true,
      viewCosts: false,
      viewReceipts: true,
      performRefunds: false,
      accessBackOffice: false,
      manageItems: false,
      manageEmployees: false,
      viewReports: false,
      manageSettings: false,
    },
    active: true,
  },
  {
    id: "u4",
    username: "cashier2",
    password: "cash456",
    name: "Lisa Davis",
    role: "cashier",
    salary: 2500,
    hourlyRate: 12,
    permissions: {
      acceptPayments: true,
      applyDiscounts: true,
      applyRestrictedDiscounts: false,
      changeTaxes: false,
      manageOpenTickets: false,
      voidSavedItems: false,
      openCashDrawer: true,
      viewCosts: false,
      viewReceipts: true,
      performRefunds: false,
      accessBackOffice: false,
      manageItems: false,
      manageEmployees: false,
      viewReports: false,
      manageSettings: false,
    },
    active: true,
  },
];

export const DEMO_CATEGORIES = [
  { id: "cat1", name: "Food", color: "#FF6B6B" },
  { id: "cat2", name: "Beverages", color: "#4ECDC4" },
  { id: "cat3", name: "Electronics", color: "#45B7D1" },
  { id: "cat4", name: "Clothing", color: "#96CEB4" },
  { id: "cat5", name: "General", color: "#FFEAA7" },
];

export const DEMO_TAX_RATES = [
  { id: "tax1", name: "GCT", rate: 15, isDefault: true },
  { id: "tax2", name: "None", rate: 0, isDefault: false },
];

export const DEMO_ITEMS = [
  { id: "i1", name: "Burger", price: 8.99, cost: 3.5, categoryId: "cat1", stock: 50, minStock: 10, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i2", name: "Coffee", price: 4.5, cost: 0.8, categoryId: "cat2", stock: 100, minStock: 20, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i3", name: "Sandwich", price: 6.99, cost: 2.5, categoryId: "cat1", stock: 30, minStock: 5, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i4", name: "Soda", price: 2.5, cost: 0.5, categoryId: "cat2", stock: 200, minStock: 30, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i5", name: "T-Shirt", price: 19.99, cost: 8.0, categoryId: "cat4", stock: 25, minStock: 5, taxRateId: "tax2", imageUri: null, barcode: null, active: true },
  { id: "i6", name: "Water", price: 1.5, cost: 0.3, categoryId: "cat2", stock: 150, minStock: 20, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i7", name: "Headphones", price: 49.99, cost: 20.0, categoryId: "cat3", stock: 10, minStock: 3, taxRateId: "tax2", imageUri: null, barcode: null, active: true },
  { id: "i8", name: "Notebook", price: 3.99, cost: 1.0, categoryId: "cat5", stock: 4, minStock: 5, taxRateId: "tax2", imageUri: null, barcode: null, active: true },
  { id: "i9", name: "Pizza Slice", price: 5.99, cost: 2.0, categoryId: "cat1", stock: 20, minStock: 5, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i10", name: "Juice", price: 3.5, cost: 0.9, categoryId: "cat2", stock: 80, minStock: 15, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i11", name: "Chips", price: 2.99, cost: 0.8, categoryId: "cat5", stock: 60, minStock: 10, taxRateId: "tax1", imageUri: null, barcode: null, active: true },
  { id: "i12", name: "USB Cable", price: 9.99, cost: 3.0, categoryId: "cat3", stock: 15, minStock: 5, taxRateId: "tax2", imageUri: null, barcode: null, active: true },
];

export const DEMO_DISCOUNT_RULES = [
  { id: "d1", name: "Staff Discount", type: "percent", value: 15, requiresApproval: false, active: true },
  { id: "d2", name: "Manager Special", type: "percent", value: 25, requiresApproval: true, active: true },
  { id: "d3", name: "$5 Off", type: "amount", value: 5, requiresApproval: false, active: true },
];

export const DEMO_STORE = {
  id: "store1",
  name: "D.L. Wright Store",
  address: "123 Main Street, Kingston",
  phone: "(876) 555-0100",
  email: "info@dlwright.com",
  taxId: "TRN-001",
  receiptFooter: "Thank you for your business!",
};

/** All keys written during a fresh seed. */
export const DEMO_SEED_PAYLOAD: Record<string, unknown> = {
  users: DEMO_USERS,
  categories: DEMO_CATEGORIES,
  tax_rates: DEMO_TAX_RATES,
  items: DEMO_ITEMS,
  discount_rules: DEMO_DISCOUNT_RULES,
  store: DEMO_STORE,
  transactions: [],
  shifts: [],
  theme_option: "dark",
  currency_symbol: "$",
};
