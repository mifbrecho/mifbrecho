import type { Metadata, Viewport } from "next";
import { Poppins, Nunito } from "next/font/google";
import "./globals.css";
import SiteExtras from "@/components/SiteExtras";
import PwaRegister from "@/components/PwaRegister";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const DESCRIPTION =
  "Brechó online de Campo Grande - MS. Peças únicas e selecionadas, pagamento por Pix e entrega com carinho.";

// Cor da barra do navegador no celular
export const viewport: Viewport = {
  themeColor: "#e91e63",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mifbrecho.com.br"),
  applicationName: "MIF BRECHO",
  appleWebApp: {
    capable: true,
    title: "MIF BRECHO",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/pwa-icon/192?v=2", type: "image/png" }],
  },
  title: "MIF BRECHO | Peças com carinho",
  description: DESCRIPTION,
  openGraph: {
    title: "MIF BRECHO | Peças com carinho",
    description: DESCRIPTION,
    url: "/",
    siteName: "MIF BRECHO",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MIF BRECHO | Peças com carinho",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} ${nunito.variable} antialiased`}>
        {children}
        <SiteExtras />
        <PwaRegister />
      </body>
    </html>
  );
}
