"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role, UserAccount } from "@/context/AuthContext";
import { HeaderKasir } from "@/components/HeaderKasir";
import { 
  UsersRound, 
  Mail, 
  Plus, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Trash2, 
  ShieldCheck, 
  Crown, 
  Key, 
  Users, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ArrowLeft,
  Loader2,
  Info,
  Search
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";

export default function TeamPage() {
  const router = useRouter();
  const { 
    user, 
    isLoading: authLoading, 
    getWorkspaceTeamMembers, 
    createStaffMember, 
    toggleStaffStatus, 
    deleteStaffMember 
  } = useAuth();

  const [members, setMembers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("KASIR");
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshMembers = () => {
    setMembers(getWorkspaceTeamMembers());
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      refreshMembers();
    }
  }, [user, authLoading, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setFormError("Nama, email, dan kata sandi wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setFormError("Kata sandi minimal 6 karakter.");
      return;
    }

    setFormError(null);
    const res = await createStaffMember({
      name,
      email,
      password,
      role,
      phone,
    });

    if (res.success) {
      refreshMembers();
      setIsAddModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("KASIR");
      showToast(`Staf "${name}" berhasil ditambahkan sebagai ${role}.`);
    } else {
      setFormError(res.error || "Gagal menambahkan staf.");
    }
  };

  const handleToggle = (member: UserAccount) => {
    toggleStaffStatus(member.id, !member.isActive);
    refreshMembers();
    showToast(`Status akun "${member.name}" diperbarui.`);
  };

  const handleDelete = (member: UserAccount) => {
    if (member.id === user?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (confirm(`Hapus akun staf "${member.name}" dari workspace toko ini?`)) {
      deleteStaffMember(member.id);
      refreshMembers();
      showToast(`Akun staf "${member.name}" berhasil dihapus.`);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      </div>
    );
  }

  const isOwnerOrManager = user.role === "OWNER" || user.role === "MANAGER";
  const isSupervisor = user.role === "SUPERVISOR";

  // If user is KASIR or STAFF, show Access Restricted
  if (!isOwnerOrManager && !isSupervisor) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        <HeaderKasir />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Akses Terbatas</h2>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Halaman <span className="text-foreground font-semibold">Pengaturan Tim</span> hanya dapat diakses oleh akun dengan peran <span className="text-amber-500 font-bold">Owner</span> atau <span className="text-purple-500 font-bold">Manager</span>.
            </p>
            <Button
              onClick={() => router.push("/pos")}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Kembali ke Kasir POS</span>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === "ALL" || m.role === selectedRole;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case "OWNER":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold"><Crown className="w-3 h-3 mr-1" /> Owner</Badge>;
      case "MANAGER":
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-bold"><Key className="w-3 h-3 mr-1" /> Manager</Badge>;
      case "SUPERVISOR":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold"><ShieldCheck className="w-3 h-3 mr-1" /> Supervisor</Badge>;
      case "KASIR":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold"><Users className="w-3 h-3 mr-1" /> Kasir</Badge>;
      default:
        return <Badge variant="secondary">{r}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <HeaderKasir />

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                Toko: {user.organizationName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Pengaturan Tim & Akun Kasir
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daftarkan staf kasir, supervisor, atau teknisi yang terhubung langsung dengan toko ini.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSupervisor && (
              <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>Mode Lihat Saja</span>
              </span>
            )}
            {isOwnerOrManager && (
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>Tambah Staf Baru</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama staf atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {["ALL", "OWNER", "MANAGER", "SUPERVISOR", "KASIR"].map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedRole === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {r === "ALL" ? "Semua Peran" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Team Table */}
        <Card className="overflow-hidden border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Tidak ada anggota tim ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {m.name}
                          {m.id === user.id && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                              Akun Anda
                            </span>
                          )}
                        </div>
                        {m.phone && m.phone !== "-" && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{m.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(m.role)}</td>
                      <td className="py-3 px-4 font-mono text-foreground font-medium">{m.email}</td>
                      <td className="py-3 px-4">
                        {m.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOwnerOrManager && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggle(m)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                              title={m.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                            >
                              {m.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            </button>
                            {m.id !== user.id && (
                              <button
                                onClick={() => handleDelete(m)}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                                title="Hapus Staf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Tambah Staf Baru */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Staf Toko Baru</DialogTitle>
              <DialogDescription>
                Staf yang dibuat akan otomatis terdaftar pada workspace {user.organizationName}.
              </DialogDescription>
            </DialogHeader>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Nama Lengkap Staf</label>
                <Input
                  placeholder="Contoh: Rina Kasir"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Alamat Email Login</label>
                <Input
                  type="email"
                  placeholder="kasir@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Kata Sandi Awal (Min. 6 Karakter)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Peran Pengguna</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-md border border-input bg-background"
                >
                  <option value="KASIR">Kasir (Transaksi POS, Shift Kasir, Cetak Struk)</option>
                  <option value="SUPERVISOR">Supervisor (Otorisasi Void, Approval Diskon)</option>
                  <option value="MANAGER">Manager (Kelola Produk, Laporan, & Staf)</option>
                  <option value="STAFF_DAPUR">Staff Dapur (Kitchen Display KDS)</option>
                  <option value="TEKNISI">Teknisi (Work Order Bengkel)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">No. Telepon / WhatsApp (Opsional)</label>
                <Input
                  placeholder="0812-xxxx-xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Simpan Staf
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
