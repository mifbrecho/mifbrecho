"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  Heart,
  ArrowLeft,
  LogIn,
  UserPlus,
  LogOut,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ContaPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setSigningOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    window.location.href = "/";
  }

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

            {loading ? (
              <div className="mt-3 flex justify-center">
                <Loader2
                  size={20}
                  className="animate-spin text-[#8b6757]"
                />
              </div>
            ) : user ? (
              <div className="mt-3">
                <p className="font-semibold text-[#3d302b]">
                  {user.user_metadata?.name || "Cliente"}
                </p>

                <p className="text-sm text-[#806f67]">
                  {user.email}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[#806f67]">
                Entre na sua conta ou crie seu cadastro para acompanhar seus
                pedidos e compras na MIF BRECHO.
              </p>
            )}
          </div>

          {!loading && !user && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/login"
                className="flex items-center gap-4 rounded-2xl border border-[#eadfd8] p-5 transition hover:bg-[#fff7f2]"
              >
                <LogIn className="text-[#8b6757]" />

                <div>
                  <h2 className="font-semibold text-[#3d302b]">
                    Entrar na minha conta
                  </h2>

                  <p className="text-sm text-[#806f67]">
                    Já tenho cadastro
                  </p>
                </div>
              </Link>

              <Link
                href="/cadastro"
                className="flex items-center gap-4 rounded-2xl border border-[#eadfd8] p-5 transition hover:bg-[#fff7f2]"
              >
                <UserPlus className="text-[#8b6757]" />

                <div>
                  <h2 className="font-semibold text-[#3d302b]">
                    Criar minha conta
                  </h2>

                  <p className="text-sm text-[#806f67]">
                    Ainda não tenho cadastro
                  </p>
                </div>
              </Link>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
              href="/favoritos"
              className="flex items-center gap-4 rounded-2xl border border-[#eadfd8] p-5 transition hover:bg-[#fff7f2]"
            >
              <Heart className="text-[#8b6757]" />

              <div>
                <h2 className="font-semibold text-[#3d302b]">
                  Meus favoritos
                </h2>

                <p className="text-sm text-[#806f67]">
                  Ver minhas peças favoritas
                </p>
              </div>
            </Link>
          </div>

          {!loading && user && (
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}

              {signingOut ? "Saindo..." : "Sair da conta"}
            </button>
          )}

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
