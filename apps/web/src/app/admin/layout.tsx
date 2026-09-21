import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";

// O painel tem o próprio app instalável ("MIF Admin"), separado do app da loja
export const metadata: Metadata = {
  title: "Painel | MIF BRECHO",
  manifest: "/painel-manifest",
  applicationName: "MIF Admin",
  appleWebApp: {
    capable: true,
    title: "MIF Admin",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/pwa-icon/192?variant=admin", type: "image/png" }],
    apple: [{ url: "/pwa-icon/180?variant=admin" }],
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
