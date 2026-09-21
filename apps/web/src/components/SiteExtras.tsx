"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { STORE, whatsappLink } from "@/lib/store-info";

const infoLinks = [
  { href: "/sobre", label: "Sobre a loja" },
  { href: "/entrega", label: "Entrega" },
  { href: "/trocas", label: "Trocas e devoluções" },
  { href: "/privacidade", label: "Política de privacidade" },
  { href: "/termos", label: "Termos de uso" },
  { href: "/contato", label: "Contato" },
];

function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-bold">{STORE.name}</p>
            <p className="mt-1 text-sm text-primary-light">
              Peças selecionadas com amor 💕
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-primary-light">
              <MapPin className="h-4 w-4" />
              {STORE.city}
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">
              A loja
            </p>
            <ul className="space-y-2 text-sm text-primary-light">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide">
              Fale com a gente
            </p>
            <ul className="space-y-2 text-sm text-primary-light">
              <li>
                <a
                  href={whatsappLink("Olá! Vim pelo site da MIF BRECHO.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp {STORE.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={STORE.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  {STORE.instagramHandle}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${STORE.email}`}
                  className="flex items-center gap-2 hover:text-white hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {STORE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-white/20 pt-4 text-center text-xs text-primary-light/80">
          © {new Date().getFullYear()} {STORE.name}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const pathname = usePathname();

  // Na página de uma peça, a mensagem já leva o link dela
  const message = pathname.startsWith("/produtos/")
    ? `Olá! Tenho interesse nesta peça da MIF BRECHO: ${STORE.siteUrl}${pathname}`
    : "Olá! Vim pelo site da MIF BRECHO e gostaria de tirar uma dúvida.";

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a loja no WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

/** Rodapé e botão de WhatsApp em todo o site, menos no painel /admin. */
export default function SiteExtras() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
