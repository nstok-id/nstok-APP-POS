"use client";

import React, { useState, useEffect } from "react";
import { 
  UsersRound, 
  Mail, 
  Plus, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Trash2, 
  Copy, 
  Check, 
  Share2, 
  Shield, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { HeaderKasir } from "@/components/HeaderKasir";
import { useAuth, Role } from "@/context/AuthContext";
import { useWorkspaceSettings } from "@/context/WorkspaceSettingsContext";
import { loadFromLocalStorage, saveToLocalStorage } from "@/lib/dual-persistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, Badge } from "@/components/ui/atoms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  joinedAt: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: Role;
  token: string;
  inviteLink: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  expiresAt: string;
}

const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: "mem-1",
    name: "Bambang Pamungkas",
    email: "owner@omnipos.id",
    role: "OWNER",
    isActive: true,
    joinedAt: "12 Jan 2026",
  },
  {
    id: "mem-2",
    name: "Siti Rahmawati",
    email: "manager@omnipos.id",
    role: "MANAGER",
    isActive: true,
    joinedAt: "15 Jan 2026",
  },
  {
    id: "mem-3",
    name: "Dimas Anggara",
    email: "spv@omnipos.id",
    role: "SUPERVISOR",
    isActive: true,
    joinedAt: "01 Feb 2026",
  },
  {
    id: "mem-4",
    name: "Rian Kasir Pagi",
    email: "rian@omnipos.id",
    role: "KASIR",
    isActive: true,
    joinedAt: "10 Feb 2026",
  },
];

const INITIAL_INVITES: InviteItem[] = [
  {
    id: "inv-1",
    email: "kasir2@toko.com",
    role: "KASIR",
    token: "INV-98218-ABC",
    inviteLink: "http://localhost:3000/accept-invite?token=INV-98218-ABC",
    status: "PENDING",
    expiresAt: "25 Sep 2026",
  },
];

export default function TeamPage() {
  const { user, canAccess } = useAuth();
  const { settings } = useWorkspaceSettings();

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [offboardModalOpen, setOffboardModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState<MemberItem | null>(null);
  const [offboardReason, setOffboardReason] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("KASIR");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");

  useEffect(() => {
    setMembers(loadFromLocalStorage("nstok_team_members_v3", INITIAL_MEMBERS));
    setInvites(loadFromLocalStorage("nstok_team_invites_v3", INITIAL_INVITES));
  }, []);

  // RBAC Route Guard
  if (!canAccess(["OWNER", "MANAGER"])) {
    return (
      <div className="flex-1 flex flex-col h-screen">
        <HeaderKasir />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">403 - Akses Terbatas</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Halaman Manajemen Tim hanya dapat diakses oleh Owner dan Manager. Sesi Anda tidak memiliki izin untuk mengelola staf toko.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const token = `INV-${Date.now().toString().slice(-6)}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/accept-invite?token=${token}`;

    const newInvite: InviteItem = {
      id: `inv-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      token,
      inviteLink: link,
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID"),
    };

    const updated = [newInvite, ...invites];
    setInvites(updated);
    saveToLocalStorage("nstok_team_invites_v3", updated);
    setGeneratedInviteLink(link);
  };

  const handleToggleActive = (id: string) => {
    const updated = members.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    setMembers(updated);
    saveToLocalStorage("nstok_team_members_v3", updated);
  };

  const handleOpenOffboardModal = (m: MemberItem) => {
    setTargetMember(m);
    setOffboardReason("Pemutusan hubungan kerja / rotasi staf");
    setOffboardModalOpen(true);
  };

  const handleConfirmOffboard = () => {
    if (!targetMember) return;

    // Remove from team
    const updated = members.filter((m) => m.id !== targetMember.id);
    setMembers(updated);
    saveToLocalStorage("nstok_team_members_v3", updated);

    setOffboardModalOpen(false);
    setTargetMember(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <HeaderKasir />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Manajemen Tim & Hak Akses (RBAC)</h1>
            <p className="text-xs text-muted-foreground">Undang staf baru, atur peran, nonaktifkan akun, atau lakukan pemberhentian pegawai (offboarding).</p>
          </div>
          <Button
            onClick={() => {
              setGeneratedInviteLink("");
              setInviteEmail("");
              setInviteModalOpen(true);
            }}
            className="text-xs font-bold shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Undang Anggota Tim</span>
          </Button>
        </div>

        {/* Team Members List */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
              <UsersRound className="w-4 h-4 text-primary" />
              <span>Daftar Staf Aktif ({members.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">Workspace: {settings.businessName}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nama Staf & Email</th>
                  <th className="py-3 px-4 font-semibold">Peran (Role)</th>
                  <th className="py-3 px-4 font-semibold">Status Akun</th>
                  <th className="py-3 px-4 font-semibold">Bergabung Sejak</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => {
                  const isSelf = user?.email === m.email;
                  const isOwner = m.role === "OWNER";

                  return (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground flex items-center gap-1.5">
                          {m.name}
                          {isSelf && <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">(Anda)</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{m.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={isOwner ? "default" : m.role === "MANAGER" ? "secondary" : "outline"}>
                          {m.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.isActive ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}>
                          {m.isActive ? "Aktif" : "Dinonaktifkan"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{m.joinedAt}</td>
                      <td className="py-3 px-4 text-right">
                        {!isOwner && (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(m.id)}
                              className="h-7 text-[11px]"
                            >
                              {m.isActive ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenOffboardModal(m)}
                              className="h-7 text-[11px]"
                              title="Pemberhentian & Hapus dari Workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              <span>Offboarding</span>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <Card className="p-4 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>Undangan Tertunda ({invites.length})</span>
            </h3>
            <div className="space-y-2">
              {invites.map((inv) => (
                <div key={inv.id} className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-foreground">{inv.email} • Peran: {inv.role}</p>
                    <p className="text-[11px] text-muted-foreground">Berlaku s.d {inv.expiresAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(inv.inviteLink);
                        alert("Link undangan berhasil disalin!");
                      }}
                      className="h-8 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Salin Link
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Undang Staf ke Workspace</DialogTitle>
            <DialogDescription>
              Generate link undangan resmi. Staf dapat bergabung tanpa membuat workspace baru.
            </DialogDescription>
          </DialogHeader>

          {generatedInviteLink ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 text-xs">
                <p className="font-bold text-green-800 dark:text-green-300">Tautan Undangan Siap Dibagikan!</p>
                <p className="text-green-700 dark:text-green-400 mt-1">Bagikan link ini via WhatsApp ke staf:</p>
                <div className="flex gap-2 mt-2">
                  <Input readOnly value={generatedInviteLink} className="text-xs h-8" />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="h-8 text-xs shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteModalOpen(false)}>Tutup</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateInvite} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Email Calon Staf</label>
                <Input
                  type="email"
                  placeholder="staf@gmail.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Peran yang Diberikan (Role)</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="KASIR">💳 Kasir Operasional</option>
                  <option value="SUPERVISOR">🛡️ Supervisor</option>
                  <option value="MANAGER">👔 Outlet Manager</option>
                </select>
              </div>

              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setInviteModalOpen(false)}>Batal</Button>
                <Button type="submit" className="font-bold">Buat Link Undangan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Offboard / Remove Member Modal */}
      <Dialog open={offboardModalOpen} onOpenChange={setOffboardModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 flex items-center justify-center mb-2 mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-center">Konfirmasi Pemberhentian Pegawai</DialogTitle>
            <DialogDescription className="text-center">
              Apakah Anda yakin ingin memberhentikan <span className="font-bold text-foreground">{targetMember?.name}</span> dari workspace?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1">
              <p className="font-bold text-amber-800 dark:text-amber-300">Dampak Aksi Ini:</p>
              <ul className="list-disc list-inside text-amber-700 dark:text-amber-400 space-y-0.5 text-[11px]">
                <li>Sesi aktif staf langsung dicabut seketika (Instant Session Kickout).</li>
                <li>Shift kasir yang masih terbuka akan otomatis ditutup secara administratif.</li>
                <li>Riwayat transaksi kasir masa lalu tetap aman dan terpelihara utuh.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold">Alasan Pemberhentian</label>
              <Input
                value={offboardReason}
                onChange={(e) => setOffboardReason(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => setOffboardModalOpen(false)} className="flex-1">Batal</Button>
            <Button variant="destructive" onClick={handleConfirmOffboard} className="flex-1 font-bold">
              Keluarkan dari Tim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
