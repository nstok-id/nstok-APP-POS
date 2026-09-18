import { pgTable, text, timestamp, boolean, integer, numeric } from 'drizzle-orm/pg-core';

// 1. Organisasi / Workspace (Multi-Tenant Core)
export const organizations = pgTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  businessType: text('business_type', { 
    enum: ['RETAIL', 'FNB', 'SERVICES', 'SALON', 'WHOLESALE', 'HYBRID'] 
  }).default('RETAIL').notNull(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Pengguna Sistem
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Relasi Anggota Tim (RBAC & Offboarding)
export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['OWNER', 'MANAGER', 'SUPERVISOR', 'KASIR', 'STAFF_DAPUR', 'TEKNISI'] }).default('KASIR').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  deactivatedAt: timestamp('deactivated_at'),
  deactivatedReason: text('deactivated_reason'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// 4. Token Undangan Tim
export const teamInvitations = pgTable('team_invitations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  role: text('role', { enum: ['MANAGER', 'SUPERVISOR', 'KASIR', 'STAFF_DAPUR', 'TEKNISI'] }).default('KASIR').notNull(),
  token: text('token').unique().notNull(),
  status: text('status', { enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] }).default('PENDING').notNull(),
  invitedByUserId: text('invited_by_user_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Pengaturan Workspace Terpadu (/settings)
export const workspaceSettings = pgTable('workspace_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).unique().notNull(),
  businessName: text('business_name').notNull(),
  businessAddress: text('business_address'),
  phone: text('phone'),
  email: text('email'),
  npwp: text('npwp'),
  currency: text('currency').default('IDR').notNull(),
  taxPercentage: numeric('tax_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
  taxEnabled: boolean('tax_enabled').default(false).notNull(),
  roundingRule: text('rounding_rule', { enum: ['NONE', 'UP_100', 'NEAREST_100'] }).default('NONE').notNull(),
  receiptPaperSize: text('receipt_paper_size', { enum: ['58mm', '80mm'] }).default('58mm').notNull(),
  receiptHeader: text('receipt_header'),
  receiptFooter: text('receipt_footer'),
  receiptShowLogo: boolean('receipt_show_logo').default(true).notNull(),
  lowStockThresholdDefault: integer('low_stock_threshold_default').default(5).notNull(),
  approvalDiscountThresholdPercent: integer('approval_discount_threshold_percent').default(20).notNull(),
  approvalRequireVoid: boolean('approval_require_void').default(true).notNull(),
  sessionTimeoutMinutes: integer('session_timeout_minutes').default(60).notNull(),
  activeModules: text('active_modules').default('[]').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Outlet & Cabang
export const outlets = pgTable('outlets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  openingHours: text('opening_hours'),
  isMain: boolean('is_main').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Master Produk & Inventori
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  outletId: text('outletId'),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  barcode: text('barcode'),
  category: text('category').default('Umum').notNull(),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default('0').notNull(),
  sellingPrice: numeric('selling_price', { precision: 12, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 12, scale: 2 }),
  minWholesaleQty: integer('min_wholesale_qty').default(10),
  stock: integer('stock').default(0).notNull(),
  unit: text('unit').default('pcs').notNull(),
  minStockAlert: integer('min_stock_alert').default(5).notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Pelanggan & CRM
export const customers = pgTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  loyaltyPoints: integer('loyalty_points').default(0).notNull(),
  totalSpent: numeric('total_spent', { precision: 14, scale: 2 }).default('0').notNull(),
  tier: text('tier', { enum: ['BRONZE', 'SILVER', 'GOLD'] }).default('BRONZE').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 9. Pemasok / Supplier
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  paymentTerms: text('payment_terms').default('Cash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Shift Kasir (Modal Awal & Z-Report)
export const cashierShifts = pgTable('cashier_shifts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  cashierName: text('cashier_name').notNull(),
  startingCash: numeric('starting_cash', { precision: 12, scale: 2 }).default('0').notNull(),
  expectedCash: numeric('expected_cash', { precision: 12, scale: 2 }).default('0').notNull(),
  actualCash: numeric('actual_cash', { precision: 12, scale: 2 }),
  discrepancy: numeric('discrepancy', { precision: 12, scale: 2 }),
  totalSales: numeric('total_sales', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status', { enum: ['OPEN', 'CLOSED'] }).default('OPEN').notNull(),
  openedAt: timestamp('opened_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
  notes: text('notes'),
});

// 11. Transaksi Penjualan
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  shiftId: text('shift_id').references(() => cashierShifts.id),
  invoiceNumber: text('invoice_number').unique().notNull(),
  cashierId: text('cashier_id').references(() => users.id).notNull(),
  cashierName: text('cashier_name').notNull(),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name'),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 14, scale: 2 }).default('0').notNull(),
  tax: numeric('tax', { precision: 14, scale: 2 }).default('0').notNull(),
  grandTotal: numeric('grand_total', { precision: 14, scale: 2 }).notNull(),
  paymentMethod: text('payment_method', { 
    enum: ['CASH', 'QRIS', 'CARD', 'TRANSFER', 'SPLIT'] 
  }).default('CASH').notNull(),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull(),
  changeAmount: numeric('change_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status', { enum: ['COMPLETED', 'VOIDED', 'HOLD'] }).default('COMPLETED').notNull(),
  itemsJson: text('items_json').notNull(), // List of cart items snapshot
  tableNumber: text('table_number'),
  orderNotes: text('order_notes'),
  voidReason: text('void_reason'),
  voidApprovedBy: text('void_approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type CashierShift = typeof cashierShifts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
