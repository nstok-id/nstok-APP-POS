---
title: nstok-app-POS Architecture
type: architecture_document
version: 3.0.0
tags: [architecture, dual_persistence, context_api, drizzle_orm, postgresql]
---

# 🏗️ Arsitektur nstok-app-POS

## 1. Dual Persistence Model
Sistem mengadopsi prinsip *Dual Persistence*:
- **Local Storage (Browser)**: Sebagai cache offline-first berkecepatan tinggi ($< 50\text{ ms}$) untuk transaksi kasir dan preferensi toko.
- **PostgreSQL Database (Supabase / Drizzle ORM)**: Sebagai persistent cloud storage multi-tenant.

## 2. Reaktivitas State
`WorkspaceSettingsContext` mendistribusikan konfigurasi pajak PPN, pembulatan harga, format struk, dan threshold approval ke seluruh halaman (`/pos`, `/dashboard`, `/inventory`) tanpa perlu hardcoding.
