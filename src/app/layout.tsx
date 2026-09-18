import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { WorkspaceSettingsProvider } from "@/context/WorkspaceSettingsContext";
import { ShiftProvider } from "@/context/ShiftContext";
import { BusinessModeProvider } from "@/context/BusinessModeContext";
import { CartProvider } from "@/context/CartContext";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "nstok-app-POS | OmniPOS Multi-Bisnis Modular",
  description: "Aplikasi kasir multi-bisnis modern, multi-tenant workspace isolation & dual persistence sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
        <AuthProvider>
          <WorkspaceSettingsProvider>
            <ShiftProvider>
              <BusinessModeProvider>
                <CartProvider>
                  <SidebarNav />
                  <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto pb-16 lg:pb-0">
                    {children}
                  </main>
                  <MobileBottomNav />
                </CartProvider>
              </BusinessModeProvider>
            </ShiftProvider>
          </WorkspaceSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
