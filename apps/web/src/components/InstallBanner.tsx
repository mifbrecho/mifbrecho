"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mif-install-dismissed";
const DISMISS_DAYS = 14;

// Páginas onde o aviso atrapalharia
const HIDDEN_ON = ["/admin", "/instalar", "/checkout", "/login", "/cadastro", "/carrinho"];

function wasDismissedRecently(): boolean {
  try {
    const saved = window.localStorage.getItem(DISMISS_KEY);
    if (!saved) return false;

    const days = (Date.now() - Number(saved)) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

/**
 * Aviso discreto para instalar o app da loja.
 * - Android e computador (Chrome/Edge): botão "Instalar".
 * - iPhone (Safari): mostra o caminho para "Adicionar à Tela de Início".
 * Depois de dispensado, não aparece de novo por 14 dias.
 */
export default function InstallBanner() {
  const pathname = usePathname();

  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const agent = navigator.userAgent.toLowerCase();

    setIsIos(/iphone|ipad|ipod/.test(agent));
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
    setDismissed(wasDismissedRecently());

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    }

    function onInstalled() {
      setInstallEvent(null);
      setStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // só mostra depois de alguns segundos, para não atrapalhar a chegada
    const timer = setTimeout(() => setReady(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setDismissed(true);

    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // sem problema se o navegador não deixar guardar
    }
  }

  async function install() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    setInstallEvent(null);

    if (choice.outcome === "dismissed") dismiss();
  }

  if (!ready || standalone || dismissed) return null;
  if (HIDDEN_ON.some((path) => pathname.startsWith(path))) return null;

  // Só aparece quando existe um caminho para instalar
  if (!installEvent && !isIos) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar o app da loja"
      className="fixed bottom-4 left-4 right-24 z-40 max-w-sm rounded-2xl border border-primary-light bg-white p-4 shadow-xl"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-2 top-2 rounded-full p-1 text-text-muted hover:bg-secondary"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="pr-6 text-sm font-semibold text-text">
        Tenha a MIF BRECHO na tela do celular
      </p>

      {installEvent ? (
        <>
          <p className="mt-1 text-xs text-text-muted">
            Instale o app da loja, sem loja de aplicativos. É grátis e rápido.
          </p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-3 py-2 text-sm text-text-muted hover:bg-secondary"
            >
              Agora não
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-text-muted">
            No Safari, toque em compartilhar e depois em &quot;Adicionar à Tela
            de Início&quot;.
          </p>

          <Link
            href="/instalar"
            className="mt-2 inline-block text-xs font-semibold text-primary underline"
          >
            Ver o passo a passo
          </Link>
        </>
      )}
    </div>
  );
}
