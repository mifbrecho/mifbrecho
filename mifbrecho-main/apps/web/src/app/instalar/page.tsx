"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "ios" | "android" | "other";

const GUIDES: { id: Platform; title: string; steps: string[] }[] = [
  {
    id: "android",
    title: "Android (Chrome)",
    steps: [
      "Toque nos três pontinhos no canto superior direito.",
      "Toque em \"Instalar app\" ou em \"Adicionar à tela inicial\".",
      "Confirme. O ícone da MIF BRECHO aparece na sua tela inicial.",
    ],
  },
  {
    id: "ios",
    title: "iPhone e iPad (Safari)",
    steps: [
      "Abra este site no Safari. Em outros navegadores a opção não aparece.",
      "Toque no botão de compartilhar (o quadrado com uma seta para cima).",
      "Toque em \"Adicionar à Tela de Início\" e depois em \"Adicionar\".",
    ],
  },
  {
    id: "other",
    title: "Computador (Chrome ou Edge)",
    steps: [
      "Procure o ícone de instalar no final da barra de endereço.",
      "Clique nele e depois em \"Instalar\".",
    ],
  },
];

export default function InstalarPage() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const agent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(agent)) setPlatform("ios");
    else if (/android/.test(agent)) setPlatform("android");

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) return;

    await promptEvent.prompt();
    await promptEvent.userChoice;

    setPromptEvent(null);
  }

  const guides = [...GUIDES].sort((a, b) =>
    a.id === platform ? -1 : b.id === platform ? 1 : 0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-3xl font-bold text-text">Instale o app da MIF BRECHO</h1>
        <p className="mt-2 text-text-muted">
          Tenha a loja na tela do seu celular, com um toque, sem precisar baixar
          nada em loja de aplicativos.
        </p>

        {installed ? (
          <div className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            Você já está usando o app. 💕
          </div>
        ) : (
          promptEvent && (
            <button
              type="button"
              onClick={install}
              className="mt-6 w-full rounded-full bg-primary py-4 font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
            >
              Instalar agora
            </button>
          )
        )}

        <div className="mt-8 space-y-4">
          {guides.map((guide) => (
            <section
              key={guide.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                guide.id === platform ? "border-primary" : "border-primary-light/60"
              }`}
            >
              <h2 className="mb-3 font-semibold text-text">
                {guide.title}
                {guide.id === platform && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    seu aparelho
                  </span>
                )}
              </h2>

              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-text-muted">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
