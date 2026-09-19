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
    // 1. Create tables if they do not exist
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        slug TEXT UNIQUE,
        business_type TEXT NOT NULL DEFAULT 'RETAIL',
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL DEFAULT '',
        phone TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'KASIR',
        is_active BOOLEAN NOT NULL DEFAULT true,
        deactivated_at TIMESTAMP WITH TIME ZONE,
        deactivated_reason TEXT,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'KASIR',
        token TEXT UNIQUE NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        invited_by_user_id TEXT NOT NULL DEFAULT '',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS workspace_settings (
        id TEXT PRIMARY KEY,
        organization_id TEXT UNIQUE NOT NULL,
        business_name TEXT NOT NULL DEFAULT '',
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
        organization_id TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        address TEXT,
        phone TEXT,
        opening_hours TEXT,
        is_main BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT '',
        outlet_id TEXT,
        name TEXT NOT NULL DEFAULT '',
        sku TEXT NOT NULL DEFAULT '',
        barcode TEXT,
        category TEXT NOT NULL DEFAULT 'Umum',
        cost_price NUMERIC(12, 2) NOT NULL DEFAULT '0',
        selling_price NUMERIC(12, 2) NOT NULL DEFAULT '0',
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
        organization_id TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
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
        organization_id TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL DEFAULT '',
        contact_person TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        payment_terms TEXT DEFAULT 'Cash',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cashier_shifts (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL DEFAULT '',
        cashier_name TEXT NOT NULL DEFAULT '',
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
        organization_id TEXT NOT NULL DEFAULT '',
        shift_id TEXT,
        invoice_number TEXT UNIQUE NOT NULL,
        cashier_id TEXT NOT NULL DEFAULT '',
        cashier_name TEXT NOT NULL DEFAULT '',
        customer_id TEXT,
        customer_name TEXT,
        subtotal NUMERIC(14, 2) NOT NULL DEFAULT '0',
        discount NUMERIC(14, 2) NOT NULL DEFAULT '0',
        tax NUMERIC(14, 2) NOT NULL DEFAULT '0',
        grand_total NUMERIC(14, 2) NOT NULL DEFAULT '0',
        payment_method TEXT NOT NULL DEFAULT 'CASH',
        paid_amount NUMERIC(14, 2) NOT NULL DEFAULT '0',
        change_amount NUMERIC(14, 2) NOT NULL DEFAULT '0',
        status TEXT NOT NULL DEFAULT 'COMPLETED',
        items_json TEXT NOT NULL DEFAULT '[]',
        table_number TEXT,
        order_notes TEXT,
        void_reason TEXT,
        void_approved_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Patch missing columns on existing tables
    await client.unsafe(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'RETAIL';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_id TEXT;
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'KASIR';
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
      ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT '';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS business_address TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS npwp TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'IDR';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT '0.00';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS rounding_rule TEXT NOT NULL DEFAULT 'NONE';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS receipt_paper_size TEXT NOT NULL DEFAULT '58mm';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS receipt_header TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS receipt_show_logo BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS low_stock_threshold_default INTEGER NOT NULL DEFAULT 5;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS approval_discount_threshold_percent INTEGER NOT NULL DEFAULT 20;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS approval_require_void BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER NOT NULL DEFAULT 60;
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS active_modules TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS outlet_id TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Umum';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12, 2) NOT NULL DEFAULT '0';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price NUMERIC(12, 2) NOT NULL DEFAULT '0';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12, 2);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS min_wholesale_qty INTEGER DEFAULT 10;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'pcs';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_alert INTEGER NOT NULL DEFAULT 5;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'BRONZE';
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Cash';
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS user_id TEXT;
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS cashier_name TEXT NOT NULL DEFAULT '';
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS starting_cash NUMERIC(12, 2) NOT NULL DEFAULT '0';
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS expected_cash NUMERIC(12, 2) NOT NULL DEFAULT '0';
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS actual_cash NUMERIC(12, 2);
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS discrepancy NUMERIC(12, 2);
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS total_sales NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'OPEN';
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE cashier_shifts ADD COLUMN IF NOT EXISTS notes TEXT;

      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS shift_id TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_number TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cashier_id TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cashier_name TEXT NOT NULL DEFAULT '';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_id TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS customer_name TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS grand_total NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'CASH';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS change_amount NUMERIC(14, 2) NOT NULL DEFAULT '0';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'COMPLETED';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS items_json TEXT NOT NULL DEFAULT '[]';
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS table_number TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS order_notes TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_reason TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS void_approved_by TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);

    // 3. Relax NOT NULL on all legacy columns (both lowercase and camelCase)
    await client.unsafe(`
      DO $$ 
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
              SELECT table_name, column_name 
              FROM information_schema.columns 
              WHERE table_schema = 'public' 
                AND is_nullable = 'NO'
                AND LOWER(column_name) IN (
                  'userid', 'organizationid', 'orgid', 'businesstype', 
                  'createdat', 'updatedat', 'avatarurl', 'logourl', 
                  'isactive', 'joinedat', 'deactivatedat', 'deactivatedreason',
                  'outletid', 'businessname', 'businessaddress', 'taxpercentage',
                  'taxenabled', 'roundingrule', 'receiptpapersize', 'receiptheader',
                  'receiptfooter', 'receiptshowlogo', 'lowstockthresholddefault',
                  'approvaldiscountthresholdpercent', 'approvalrequirevoid',
                  'sessiontimeoutminutes', 'activemodules', 'costprice', 'sellingprice',
                  'wholesaleprice', 'minwholesaleqty', 'minstockalert', 'imageurl',
                  'loyaltypoints', 'totalspent', 'shiftid', 'invoicenumber',
                  'cashierid', 'cashiername', 'customerid', 'customername',
                  'paymentmethod', 'paidamount', 'changeamount', 'itemsjson',
                  'tablenumber', 'ordernotes', 'voidreason', 'voidapprovedby',
                  'contactperson', 'paymentterms', 'startingcash', 'expectedcash',
                  'actualcash', 'discrepancy', 'totalsales', 'openedat', 'closedat'
                )
          ) LOOP
              EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' ALTER COLUMN ' || quote_ident(r.column_name) || ' DROP NOT NULL';
          END LOOP;
      END $$;
    `);

    // 4. Synchronize data between legacy columns and snake_case columns if present
    await client.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'userid') THEN
          EXECUTE 'UPDATE team_members SET user_id = userid WHERE user_id IS NULL AND userid IS NOT NULL';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'organizationid') THEN
          EXECUTE 'UPDATE team_members SET organization_id = organizationid WHERE organization_id IS NULL AND organizationid IS NOT NULL';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    tablesInitialized = true;
    console.log("Supabase DDL, migrations, and self-healing column constraints applied successfully.");
  } catch (err) {
    console.error("ensureTablesExist error:", err);
  }
}

export * from './initial-data';

