---
title: nstok-app-POS Routes and RBAC
type: routes_matrix
version: 3.0.0
tags: [routes, rbac, security, access_control]
---

# 🛣️ Matriks Rute & Hak Akses

| Rute Halaman | Deskripsi | Akses Diizinkan |
| :--- | :--- | :--- |
| `/login` | Autentikasi staf & Auto-Provisioning pendaftaran Owner baru | Publik |
| `/accept-invite` | Penerimaan tautan undangan staf baru | Publik / Terundang |
| `/business-select` | Pemilihan arketipe vertikal bisnis | Owner |
| `/pos` | Mesin kasir touchscreen, katalog, cart, checkout | Semua Role |
| `/dashboard` | Dashboard metrik omzet live & analitik | Owner, Manager |
| `/inventory` | Katalog master produk, HPP, sisa stok | Owner, Manager, Supervisor |
| `/customers` | Database pelanggan CRM & poin loyalitas | Owner, Manager, Supervisor, Kasir |
| `/suppliers` | Manajemen data pemasok & riwayat pasokan | Owner, Manager |
| `/team` | Manajemen tim, undangan, role, dan offboarding | Owner, Manager |
| `/settings` | Pusat kendali pengaturan workspace 9-Tab | Owner, Manager (terbatas) |
