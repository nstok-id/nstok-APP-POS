import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

const connectionString = process.env.DATABASE_URL;

export const client = connectionString 
  ? postgres(connectionString, { prepare: false, max: 10 }) 
  : null;

export const db = client ? drizzle(client, { schema }) : null;

let tablesInitialized = false;

export async function ensureTablesExist() {
  if (tablesInitialized || !client) return;
  try {
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        business_type TEXT NOT NULL DEFAULT 'RETAIL',
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'KASIR',
        is_active BOOLEAN NOT NULL DEFAULT true,
        deactivated_at TIMESTAMP WITH TIME ZONE,
        deactivated_reason TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'KASIR',
        token TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        invited_by_user_id TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workspace_settings (
        id TEXT PRIMARY KEY,
        organization_id TEXT UNIQUE NOT NULL,
        business_name TEXT NOT NULL,
        business_address TEXT,
        phone TEXT,
        email TEXT,
        npwp TEXT,
        currency TEXT NOT NULL DEFAULT 'IDR',
        tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT '0.00',
        tax_enabled BOOLEAN NOT NULL DEFAULT false,
        rounding_rule TEXT NOT NULL DEFAULT 'NONE',
        receipt_paper_size TEXT NOT NULL DEFAULT '58mm',
        receipt_header TEXT,
        receipt_footer TEXT,
        receipt_show_logo BOOLEAN NOT NULL DEFAULT true,
        low_stock_threshold_default INTEGER NOT NULL DEFAULT 5,
        approval_discount_threshold_percent INTEGER NOT NULL DEFAULT 20,
        approval_require_void BOOLEAN NOT NULL DEFAULT true,
        session_timeout_minutes INTEGER NOT NULL DEFAULT 60,
        active_modules TEXT NOT NULL DEFAULT '[]',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS outlets (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        opening_hours TEXT,
        is_main BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        outlet_id TEXT,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        barcode TEXT,
        category TEXT NOT NULL DEFAULT 'Umum',
        cost_price NUMERIC(12, 2) NOT NULL DEFAULT '0',
        selling_price NUMERIC(12, 2) NOT NULL,
        wholesale_price NUMERIC(12, 2),
        min_wholesale_qty INTEGER DEFAULT 10,
        stock INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT 'pcs',
        min_stock_alert INTEGER NOT NULL DEFAULT 5,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        total_spent NUMERIC(14, 2) NOT NULL DEFAULT '0',
        tier TEXT NOT NULL DEFAULT 'BRONZE',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        payment_terms TEXT DEFAULT 'Cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cashier_shifts (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        cashier_name TEXT NOT NULL,
        starting_cash NUMERIC(12, 2) NOT NULL DEFAULT '0',
        expected_cash NUMERIC(12, 2) NOT NULL DEFAULT '0',
        actual_cash NUMERIC(12, 2),
        discrepancy NUMERIC(12, 2),
        total_sales NUMERIC(14, 2) NOT NULL DEFAULT '0',
        status TEXT NOT NULL DEFAULT 'OPEN',
        opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        closed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        shift_id TEXT,
        invoice_number TEXT UNIQUE NOT NULL,
        cashier_id TEXT NOT NULL,
        cashier_name TEXT NOT NULL,
        customer_id TEXT,
        customer_name TEXT,
        subtotal NUMERIC(14, 2) NOT NULL,
        discount NUMERIC(14, 2) NOT NULL DEFAULT '0',
        tax NUMERIC(14, 2) NOT NULL DEFAULT '0',
        grand_total NUMERIC(14, 2) NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'CASH',
        paid_amount NUMERIC(14, 2) NOT NULL,
        change_amount NUMERIC(14, 2) NOT NULL DEFAULT '0',
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        items_json TEXT NOT NULL,
        table_number TEXT,
        order_notes TEXT,
        void_reason TEXT,
        void_approved_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    tablesInitialized = true;
    console.log("Supabase DDL migration applied successfully.");
  } catch (err) {
    console.error("ensureTablesExist error:", err);
  }
}

export * from './initial-data';

