"use client";

import Link from "next/link";
import { User, ShoppingBag, Heart, ArrowLeft } from "lucide-react";

export default function ContaPage() {
  return (
    <main className="min-h-screen bg-[#fffaf7]">
      <header className="border-b border-[#eadfd8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-[#3d302b]"
          >
            <ArrowLeft size={20} />
            Voltar
          </Link>

          <Link
            href="/"
            className="text-xl font-bold tracking-wide text-[#3d302b]"
          >
            MIF BRECHO
          </Link>

          <div className="w-16" />
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-3xl border border-[#eadfd8] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8e2] text-[#6b5145]">
              <User size={30} />
            </div>

            <h1 className="text-3xl font-bold text-[#3d302b]">
              Minha conta
            </h1>

            <p className="mt-2 text-[#806f67]">
              Acompanhe seus pedidos e suas compras na MIF BRECHO.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/checkout"
              className="flex items-center gap-4 rounded-2xl border border-[#eadfd8] p-5 transition hover:bg-[#fff7f2]"
            >
              <ShoppingBag className="text-[#8b6757]" />
              <div>
                <h2 className="font-semibold text-[#3d302b]">
                  Minhas compras
                </h2>
                <p className="text-sm text-[#806f67]">
                  Acompanhe seus pedidos
                </p>
              </div>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-4 rounded-2xl border border-[#eadfd8] p-5 transition hover:bg-[#fff7f2]"
            >
              <Heart className="text-[#8b6757]" />
              <div>
                <h2 className="font-semibold text-[#3d302b]">
                  Continuar comprando
                </h2>
                <p className="text-sm text-[#806f67]">
                  Ver peças disponíveis
                </p>
              </div>
            </Link>
          </div>

          <Link
            href="/"
            className="mt-8 block rounded-xl bg-[#3d302b] px-5 py-3 text-center font-semibold text-white transition hover:opacity-90"
          >
            Voltar para a loja
          </Link>
        </div>
      </section>
    </main>
  );
}
