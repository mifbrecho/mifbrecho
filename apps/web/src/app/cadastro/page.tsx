"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Lock, Mail, User } from "lucide-react";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // full_name é o que o banco usa para criar o perfil
          full_name: name.trim(),
          name: name.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Cadastro realizado! Enviamos um e-mail para confirmar sua conta. Se não encontrar na caixa de entrada, olhe também o spam."
    );

    setLoading(false);
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

      <section className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-3xl border border-[#eadfd8] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8e2] text-[#6b5145]">
              <User size={28} />
            </div>

            <h1 className="text-3xl font-bold text-[#3d302b]">
              Criar minha conta
            </h1>

            <p className="mt-2 text-[#806f67]">
              Faça seu cadastro na MIF BRECHO.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3d302b]">
                Nome
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-[#eadfd8] px-4 py-3">
                <User size={19} className="text-[#8b6757]" />

                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Seu nome"
                  required
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3d302b]">
                E-mail
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-[#eadfd8] px-4 py-3">
                <Mail size={19} className="text-[#8b6757]" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#3d302b]">
                Senha
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-[#eadfd8] px-4 py-3">
                <Lock size={19} className="text-[#8b6757]" />

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Crie uma senha (mínimo 8 caracteres)"
                  required
                  minLength={8}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d302b] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Criando conta..." : "Criar minha conta"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#806f67]">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#6b5145] hover:underline"
            >
              Entrar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
