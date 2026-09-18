---
title: nstok-APP-pos Specification
type: repository
category: application_host
status: active
version: 3.0.0
tags: [pos, cashier, nextjs, host_app, touchscreen, qris, modular_business, email_auth, workspace_isolation, team_offboarding, workspace_settings]
---

# 📱 nstok-APP-pos

## Ikhtisar Komponen
`nstok-APP-pos` adalah aplikasi kasir utama (*Point of Sale*) generasi ketiga untuk ekosistem nStok, dirancang khusus dengan antarmuka layar sentuh (*touchscreen*) berkecepatan tinggi, sistem isolasi multi-tenant workspace otomatis, modul pengaturan workspace terpadu (`/settings` 9-Tabs), manajemen undangan & pemberhentian staf (*instant revocation*), integrasi multi-metode pembayaran (Tunai, QRIS Dinamis, Kartu Debit, Split Pay), manajemen shift kasir (modal awal & Z-Report), serta mesin adaptasi multi-bisnis (Retail, F&B, Salon, Jasa, Grosir).

Aplikasi ini bertindak sebagai **Host Container (Shell Application)** yang mengonsumsi submodul fitur nStok dan skema database `nstok-db`.

## Komponen Kunci (Struktur)
- `src/app/pos/page.tsx`: Halaman utama kasir interaktif yang menggabungkan etalase produk dan keranjang belanja.
- `src/app/login/page.tsx`: Halaman autentikasi kasir & staf berbasis Email & Password dengan auto-provisioning workspace pemilik toko.
- `src/app/accept-invite/page.tsx`: Halaman penerimaan undangan staf tanpa membuat workspace ganda.
- `src/app/settings/page.tsx`: Pusat kendali pengaturan workspace 9-Tab (Profil Bisnis, Outlet, Pajak, Struk, Staff, Approval, Notifikasi, Modul Bisnis, Sync).
- `src/app/team/page.tsx`: Manajemen tim, undangan, role, dan aksi pemberhentian/penghapusan staf dengan proteksi shift.
- `src/app/dashboard/page.tsx`: Dashboard analitik real-time omzet, nota selesai, dan live feed transaksi.
- `src/app/customers/page.tsx`: Database CRM member pelanggan dan program loyalitas poin.
- `src/app/inventory/page.tsx`: Manajemen master produk, HPP, harga jual, dan stok minimum.
- `src/app/suppliers/page.tsx`: Manajemen pemasok barang dan riwayat pasokan.
- `src/context/WorkspaceSettingsContext.tsx`: Pengelola preferensi toko (pajak, pembulatan, struk, batas diskon approval) yang di-consume modul lain.
- `src/context/AuthContext.tsx`: Pengelola sesi kerja staf, peran RBAC, dan validasi supervisor.
- `src/context/ShiftContext.tsx`: Pengelola shift operasional, modal awal kasir (*starting float*), petty cash, dan Z-Report.
- `src/context/BusinessModeContext.tsx`: Mesin adaptasi mode bisnis modular (Retail, F&B, Salon, Jasa, Grosir, Hybrid).
- `src/context/CartContext.tsx`: Pengelola keranjang belanja, diskon bertingkat (*wholesale tiered price*), pajak PPN, dan nota gantung.
- `src/components/HeaderKasir.tsx`: Panel navigasi atas untuk switcher mode bisnis, status shift, dan tombol modul khusus.
- `src/components/ProductGrid.tsx`: Grid katalog produk dengan pencarian cepat, filter kategori, scan barcode, dan modal modifier.
- `src/components/CartSidebar.tsx`: Panel kalkulasi tagihan, manajemen kuantitas item, dan diskon member loyalitas.
- `src/components/PaymentModal.tsx`: Dialog multi-pembayaran (Tunai dengan tombol pecahan cepat, QRIS Dinamis, EDC Kartu, Split Payment).
- `src/components/ReceiptModal.tsx`: Pratinjau nota digital dan integrasi cetak struk kasir thermal ESC/POS 58mm/80mm & WhatsApp.
- `src/components/TransactionHistoryModal.tsx`: Dialog riwayat seluruh transaksi dengan pencarian, cetak ulang struk, dan void.
- `src/db/schema.ts` & `src/db/index.ts`: Integrasi layer database Drizzle ORM PostgreSQL (`@nstok/db`).

## Dependencies Utama (Cross-links)
- `@nstok/ui`: Pustaka atomik UI dan design tokens nStok.
- `nstok-feature-team-management`: Submodul dialog ACL dan manajemen hak akses staf.
- `nstok-feature-sales`: Kontrak logika transaksi kasir dan mutasi checkout.
- `nstok-feature-inventory`: Katalog stok dan validasi ketersediaan batch produk.
- `nstok-feature-customers`: Data profil member dan program diskon pelanggan.
- `nstok-feature-auth`: Autentikasi sesi kasir dan audit log staf.
- `nstok-db`: Skema database Drizzle ORM multi-tenant.
