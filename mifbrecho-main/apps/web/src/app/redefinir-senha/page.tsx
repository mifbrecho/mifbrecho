"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Lock } from "lucide-react";

type Status = "checking" | "ready" | "invalid";

const MIN_PASSWORD = 8;

export default function RedefinirSenhaPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function check() {
      const params = new URLSearchParams(window.location.search);

      // Link novo do e-mail: o código é conferido só quando a pessoa salva a senha
      if (params.get("token_hash")) {
        setStatus("ready");
        return;
      }

      // Link padrão do Supabase (?code=...): ele abre a sessão sozinho
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setStatus(session ? "ready" : "invalid");
    }

    check();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password.length < MIN_PASSWORD) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }

    if (password !== confirm) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const tokenHash = new URLSearchParams(window.location.search).get(
      "token_hash"
    );

    if (tokenHash) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });

      if (verifyError) {
        console.error("Link de recuperação inválido:", verifyError);
        setStatus("invalid");
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("Erro ao trocar a senha:", updateError);

      if (/different from the old password/i.test(updateError.message)) {
        setError("A nova senha precisa ser diferente da anterior.");
      } else if (/at least/i.test(updateError.message)) {
        setError("A senha é curta demais. Use uma senha maior.");
      } else {
        setError("Não foi possível trocar a senha. Peça um novo link.");
      }

      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/conta";
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-[#fffaf7]">
      <header className="border-b border-[#eadfd8] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link
            href="/login"
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
              <Lock size={28} />
            </div>

            <h1 className="text-3xl font-bold text-[#3d302b]">
              Criar nova senha
            </h1>

            <p className="mt-2 text-[#806f67]">
              Escolha uma senha nova para a sua conta.
            </p>
          </div>

          {status === "checking" && (
            <p className="text-center text-sm text-[#806f67]">
              Conferindo o link...
            </p>
          )}

          {status === "invalid" && (
            <div className="space-y-5">
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                Este link é inválido, expirou ou já foi usado. Peça um novo
                link para criar sua senha.
              </div>

              <Link
                href="/recuperar-senha"
                className="block w-full rounded-xl bg-[#3d302b] px-5 py-3 text-center font-semibold text-white transition hover:opacity-90"
              >
                Pedir novo link
              </Link>
            </div>
          )}

          {status === "ready" && done && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              Senha alterada com sucesso! Levando você para a sua conta...
            </div>
          )}

          {status === "ready" && !done && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3d302b]">
                  Nova senha
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#eadfd8] px-4 py-3">
                  <Lock size={19} className="text-[#8b6757]" />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    required
                    minLength={MIN_PASSWORD}
                    autoComplete="new-password"
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#3d302b]">
                  Repita a nova senha
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-[#eadfd8] px-4 py-3">
                  <Lock size={19} className="text-[#8b6757]" />

                  <input
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="Digite de novo"
                    required
                    minLength={MIN_PASSWORD}
                    autoComplete="new-password"
                    className="w-full bg-transparent outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d302b] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
