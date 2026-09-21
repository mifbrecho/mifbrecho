"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Resumo", exact: true },
  { href: "/admin/produtos", label: "Produtos", exact: false },
  { href: "/admin/pedidos", label: "Pedidos", exact: false },
];

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  // No Android/computador o navegador avisa quando dá para instalar o app do painel
  useEffect(() => {
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    }

    function onInstalled() {
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;

    setInstallEvent(null);
  }

  async function signOut() {
    setLeaving(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="text-lg font-bold">
            MIF BRECHO{" "}
            <span className="text-sm font-normal text-white/80">Admin</span>
          </Link>

          <div className="flex items-center gap-2 text-sm">
            {installEvent && (
              <button
                type="button"
                onClick={installApp}
                className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
              >
                Instalar app
              </button>
            )}

            <Link
              href="/"
              className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
            >
              Ver loja
            </Link>

            <button
              type="button"
              onClick={signOut}
              disabled={leaving}
              className="rounded-lg bg-white px-3 py-2 font-semibold text-primary hover:opacity-90 disabled:opacity-60"
            >
              {leaving ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2">
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white text-primary"
                    : "text-white/85 hover:bg-white/15"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
