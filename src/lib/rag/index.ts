export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "PRD" | "OKF" | "ARCHITECTURE" | "GUIDE" | "FEATURE";
  content: string;
}

export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: "kb-1",
    title: "PRD Master v3.0.0",
    category: "PRD",
    content: "nstok-app-POS adalah aplikasi kasir multi-bisnis dengan modular engine, auto-provisioning workspace, sistem undangan tim bebas duplikasi, offboarding pegawai dengan instant session kickout, dan 9-Tab Workspace Settings engine.",
  },
  {
    id: "kb-2",
    title: "Modul Pengaturan Workspace (/settings)",
    category: "FEATURE",
    content: "Halaman /settings memiliki 9 tab: Profil Bisnis, Outlet & Cabang, Pajak & Mata Uang, Struk & Cetak, Staff & Role, Approval & Keamanan, Notifikasi, Modul Bisnis Aktif, Data & Sinkronisasi.",
  },
  {
    id: "kb-3",
    title: "Dual Persistence Architecture",
    category: "ARCHITECTURE",
    content: "Dual persistence menggabungkan cache instan localStorage browser untuk offline-first kasir dan PostgreSQL Supabase via Drizzle ORM.",
  },
  {
    id: "kb-4",
    title: "RBAC & Otorisasi Kasir",
    category: "GUIDE",
    content: "Kasir hanya memiliki akses ke /pos dan pemilihan pelanggan. Halaman /settings, /team, /dashboard, dan /suppliers diblokir dengan 403 Forbidden.",
  },
  {
    id: "kb-5",
    title: "Offboarding & Hapus Staf",
    category: "FEATURE",
    content: "Owner dapat menghapus pegawai dari workspace. Sesi aktif langsung dicabut seketika tanpa merusak riwayat transaksi masa lalu. Shift yang terbuka otomatis ditutup administratif.",
  },
];

export function searchKnowledge(query: string): KnowledgeDocument[] {
  const q = query.toLowerCase();
  return KNOWLEDGE_BASE.filter(
    (doc) => doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q)
  );
}
