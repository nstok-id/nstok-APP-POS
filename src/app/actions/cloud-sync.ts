"use server";

import { db, ensureTablesExist, organizations, users, teamMembers, workspaceSettings, products, customers, transactions, cashierShifts } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import type { Product, Customer, Transaction, WorkspaceSettings, User, TeamMember } from "@/db";

// Helper to check if Cloud DB is configured
export async function isCloudDbConnected(): Promise<boolean> {
  return !!db;
}

// ----------------------------------------------------
// 1. AUTH & WORKSPACE ONBOARDING
// ----------------------------------------------------

export async function cloudRegister(
  name: string,
  email: string,
  passwordHash: string,
  role: string = "OWNER"
) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    if (existing.length > 0) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const orgId = `org-${Date.now()}`;
    const newOrgName = `Toko ${name}`;

    // Create organization
    await db.insert(organizations).values({
      id: orgId,
      name: newOrgName,
      businessType: "RETAIL",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create user
    const [newUser] = await db.insert(users).values({
      id: `usr-${Date.now()}`,
      name,
      email: email.toLowerCase().trim(),
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create team member role
    await db.insert(teamMembers).values({
      id: `tm-${Date.now()}`,
      organizationId: orgId,
      userId: newUser.id,
      role: (role as any) || "OWNER",
      isActive: true,
      joinedAt: new Date(),
    });

    // Create default workspace settings
    await db.insert(workspaceSettings).values({
      id: `set-${Date.now()}`,
      organizationId: orgId,
      businessName: newOrgName,
      currency: "IDR",
      taxEnabled: false,
      taxPercentage: "0.00",
      updatedAt: new Date(),
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role,
        organizationId: orgId,
        organizationName: newOrgName,
        businessType: "RETAIL",
        hasCompletedOnboarding: false,
      },
    };
  } catch (error: any) {
    console.error("cloudRegister error:", error);
    return { success: false, error: error.message || "Gagal registrasi ke cloud DB" };
  }
}

export async function cloudLogin(email: string, passwordHash: string) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const userRecords = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase().trim()), eq(users.password, passwordHash)))
      .limit(1);

    if (userRecords.length === 0) {
      return { success: false, error: "Email atau kata sandi tidak cocok." };
    }

    const matchedUser = userRecords[0];

    // Find user's organization & role
    const members = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, matchedUser.id), eq(teamMembers.isActive, true)))
      .limit(1);

    let orgId = "org-demo-1";
    let orgName = "Toko Saya";
    let role = "OWNER";
    let businessType = "RETAIL";

    if (members.length > 0) {
      role = members[0].role;
      orgId = members[0].organizationId;

      const orgs = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
      if (orgs.length > 0) {
        orgName = orgs[0].name;
        businessType = orgs[0].businessType;
      }
    }

    return {
      success: true,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role,
        organizationId: orgId,
        organizationName: orgName,
        businessType,
        hasCompletedOnboarding: true,
      },
    };
  } catch (error: any) {
    console.error("cloudLogin error:", error);
    return { success: false, error: error.message };
  }
}

export async function cloudUpdateWorkspace(
  userId: string,
  organizationId: string,
  orgName: string,
  businessType: string
) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db
      .update(organizations)
      .set({ name: orgName, businessType: businessType as any, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId));

    await db
      .update(workspaceSettings)
      .set({ businessName: orgName, updatedAt: new Date() })
      .where(eq(workspaceSettings.organizationId, organizationId));

    return { success: true };
  } catch (error: any) {
    console.error("cloudUpdateWorkspace error:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 2. PRODUCTS SYNC
// ----------------------------------------------------

export async function cloudGetProducts(organizationId: string): Promise<Product[] | null> {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const list = await db
      .select()
      .from(products)
      .where(eq(products.organizationId, organizationId))
      .orderBy(desc(products.createdAt));

    return list;
  } catch (error) {
    console.error("cloudGetProducts error:", error);
    return null;
  }
}

export async function cloudSaveProduct(prod: Product) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const existing = await db.select().from(products).where(eq(products.id, prod.id)).limit(1);
    if (existing.length > 0) {
      await db
        .update(products)
        .set({
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          category: prod.category,
          costPrice: prod.costPrice,
          sellingPrice: prod.sellingPrice,
          wholesalePrice: prod.wholesalePrice,
          minWholesaleQty: prod.minWholesaleQty,
          stock: prod.stock,
          unit: prod.unit,
          minStockAlert: prod.minStockAlert,
          imageUrl: prod.imageUrl,
          updatedAt: new Date(),
        })
        .where(eq(products.id, prod.id));
    } else {
      await db.insert(products).values(prod);
    }
    return { success: true };
  } catch (error: any) {
    console.error("cloudSaveProduct error:", error);
    return { success: false, error: error.message };
  }
}

export async function cloudDeleteProduct(productId: string) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db.delete(products).where(eq(products.id, productId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 3. TRANSACTIONS SYNC
// ----------------------------------------------------

export async function cloudGetTransactions(organizationId: string): Promise<Transaction[] | null> {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const list = await db
      .select()
      .from(transactions)
      .where(eq(transactions.organizationId, organizationId))
      .orderBy(desc(transactions.createdAt));

    return list;
  } catch (error) {
    console.error("cloudGetTransactions error:", error);
    return null;
  }
}

export async function cloudCreateTransaction(trx: Transaction) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db.insert(transactions).values(trx);

    // Deduct stock in DB
    const soldItems = JSON.parse(trx.itemsJson || "[]");
    for (const item of soldItems) {
      if (item.product?.id) {
        const prodRecords = await db.select().from(products).where(eq(products.id, item.product.id)).limit(1);
        if (prodRecords.length > 0) {
          const currentStock = prodRecords[0].stock;
          await db
            .update(products)
            .set({ stock: Math.max(0, currentStock - item.quantity), updatedAt: new Date() })
            .where(eq(products.id, item.product.id));
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("cloudCreateTransaction error:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 4. CUSTOMERS SYNC
// ----------------------------------------------------

export async function cloudGetCustomers(organizationId: string): Promise<Customer[] | null> {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const list = await db
      .select()
      .from(customers)
      .where(eq(customers.organizationId, organizationId))
      .orderBy(desc(customers.createdAt));

    return list;
  } catch (error) {
    console.error("cloudGetCustomers error:", error);
    return null;
  }
}

export async function cloudSaveCustomer(cust: Customer) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const existing = await db.select().from(customers).where(eq(customers.id, cust.id)).limit(1);
    if (existing.length > 0) {
      await db
        .update(customers)
        .set({
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          address: cust.address,
          loyaltyPoints: cust.loyaltyPoints,
          totalSpent: cust.totalSpent,
          tier: cust.tier,
          notes: cust.notes,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, cust.id));
    } else {
      await db.insert(customers).values(cust);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cloudDeleteCustomer(customerId: string) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db.delete(customers).where(eq(customers.id, customerId));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 5. TEAM & STAFF SYNC
// ----------------------------------------------------

export async function cloudGetTeamMembers(organizationId: string) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: teamMembers.role,
        isActive: teamMembers.isActive,
        joinedAt: teamMembers.joinedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.organizationId, organizationId));

    return members;
  } catch (error) {
    console.error("cloudGetTeamMembers error:", error);
    return null;
  }
}

export async function cloudCreateStaff(
  organizationId: string,
  name: string,
  email: string,
  passwordHash: string,
  role: string,
  phone?: string
) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    // Check if email already exists
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
    let userId = "";

    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const [newUser] = await db.insert(users).values({
        id: `usr-${Date.now()}`,
        name,
        email: email.toLowerCase().trim(),
        password: passwordHash,
        phone: phone || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      userId = newUser.id;
    }

    await db.insert(teamMembers).values({
      id: `tm-${Date.now()}`,
      organizationId,
      userId,
      role: role as any,
      isActive: true,
      joinedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cloudDeleteTeamMember(userId: string, organizationId: string) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db.delete(teamMembers).where(and(eq(teamMembers.userId, userId), eq(teamMembers.organizationId, organizationId)));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cloudToggleTeamMember(userId: string, organizationId: string, isActive: boolean) {
  if (!db) return null;
  try {
    await ensureTablesExist();
    await db.update(teamMembers).set({ isActive }).where(and(eq(teamMembers.userId, userId), eq(teamMembers.organizationId, organizationId)));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
