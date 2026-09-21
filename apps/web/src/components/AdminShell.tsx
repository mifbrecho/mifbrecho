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

type PushState = "checking" | "unsupported" | "off" | "on" | "denied" | "busy";

/** Converte a chave pública (texto) no formato que o navegador pede */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

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
  const [pushState, setPushState] = useState<PushState>("checking");
  const [pushError, setPushError] = useState("");

  // Descobre se este aparelho já recebe os avisos de pedido
  useEffect(() => {
    async function checkPush() {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setPushState("unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        setPushState("denied");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        setPushState(subscription ? "on" : "off");
      } catch {
        setPushState("off");
      }
    }

    checkPush();
  }, []);

  async function enablePush() {
    setPushError("");
    setPushState("busy");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setPushState(permission === "denied" ? "denied" : "off");
        return;
      }

      const response = await fetch("/api/push", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Os avisos ainda não estão ativados no servidor.");
      }

      const { publicKey } = await response.json();
      const registration = await navigator.serviceWorker.ready;

      // começa do zero para usar sempre a chave atual
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      const data = subscription.toJSON();
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !data.endpoint || !data.keys?.p256dh || !data.keys?.auth) {
        throw new Error("Não foi possível registrar este aparelho.");
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: data.endpoint,
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
        },
        { onConflict: "endpoint" }
      );

      if (error) throw new Error(error.message);

      setPushState("on");
    } catch (err) {
      console.error("Erro ao ativar avisos:", err);
      setPushError(
        err instanceof Error ? err.message : "Não foi possível ativar os avisos."
      );
      setPushState("off");
    }
  }

  async function disablePush() {
    setPushError("");
    setPushState("busy");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const supabase = createClient();
        await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      }

      setPushState("off");
    } catch (err) {
      console.error("Erro ao desligar avisos:", err);
      setPushState("on");
    }
  }

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

          <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
            {pushState === "off" && (
              <button
                type="button"
                onClick={enablePush}
                className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
              >
                Ativar avisos
              </button>
            )}

            {pushState === "busy" && (
              <span className="rounded-lg bg-white/10 px-3 py-2 opacity-70">
                Aguarde...
              </span>
            )}

            {pushState === "on" && (
              <button
                type="button"
                onClick={disablePush}
                title="Toque para desligar os avisos"
                className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20"
              >
                🔔 Avisos ligados
              </button>
            )}

            {pushState === "denied" && (
              <span className="rounded-lg bg-white/10 px-3 py-2 opacity-80">
                Avisos bloqueados no navegador
              </span>
            )}

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

      {pushError && (
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {pushError}
          </p>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
